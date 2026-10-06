import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('public staff directory reveals only admins who chose a valid social URL',async()=>{
  const {worker,env,db}=fixture();
  db.prepare('UPDATE users SET social_media=? WHERE id=?').run('https://example.com/admin',2);
  db.prepare('UPDATE users SET social_media=? WHERE id=?').run('javascript:alert(1)',5);
  const response=await worker.fetch(new Request('https://test.invalid/api/public/staff'),env);
  assert.equal(response.status,200);
  const rows=await response.json();
  assert.deepEqual(rows.map(row=>row.id),[1,2,5]);
  assert.equal(rows.find(row=>row.id===2).social_url,'https://example.com/admin');
  assert.equal(rows.find(row=>row.id===5).social_url,null);
  assert.equal(rows.some(row=>row.id===3),false);
  assert.equal(rows.some(row=>'email' in row),false);
});

test('SA staff management lists administrators and the SA, without exposing ordinary users or email',async()=>{
  const {call}=fixture();
  const response=await call('/api/sa/users',null,1);
  assert.equal(response.status,200);
  const rows=await response.json();
  assert.deepEqual(rows.map(row=>row.id),[1,2,5]);
  assert.equal(rows.some(row=>row.id===3||row.id===4),false);
  assert.equal(rows.some(row=>'email' in row),false);
});

test('staff social links and the shared admin-SA chat enforce role and URL rules',async()=>{
  const {call,db}=fixture();
  assert.equal((await call('/api/sa/admin-social',{user_id:2,url:'javascript:alert(1)'},1)).status,400);
  assert.equal((await call('/api/sa/admin-social',{user_id:3,url:'https://example.com/user'},1)).status,404);
  assert.equal((await call('/api/sa/admin-social',{user_id:2,url:'https://example.com/admin'},1)).status,200);
  assert.equal(db.prepare('SELECT social_media FROM users WHERE id=2').get().social_media,'https://example.com/admin');
  assert.equal((await call('/api/staff-chat',{message:'管理员测试消息'},3)).status,403);
  assert.equal((await call('/api/staff-chat',{message:'   '},2)).status,400);
  assert.equal((await call('/api/staff-chat',{message:'管理员测试消息'},2)).status,200);
  const messages=await (await call('/api/staff-chat',null,1)).json();
  assert.equal(messages.length,1);assert.equal(messages[0].username,'Admin');assert.equal(messages[0].message,'管理员测试消息');
  assert.equal((await call('/api/staff-chat',{message:'<script>bad</script>'},1)).status,200);
});
