import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';
test('restore: owner and hidden status required; requeue and clear rejection', async () => {
  const {db,call}=fixture();
  assert.equal((await call('/api/my/restore',{user_id:2,flight_id:11})).status,409);
  assert.equal((await call('/api/my/restore',{user_id:3,flight_id:13})).status,409);
  assert.equal((await call('/api/my/restore',{user_id:3,flight_id:0})).status,400);
  assert.deepEqual(await (await call('/api/my/restore',{user_id:3,flight_id:11})).json(),{success:true});
  const flight=db.prepare('SELECT * FROM flights WHERE id=11').get();
  assert.equal(flight.status,'screening'); assert.equal(flight.reject_reason,null); assert.equal(flight.reviewer_id,2);
  assert.equal((await call('/api/my/restore',{user_id:3,flight_id:11})).status,409);
});
test('SA can see all pending and approve/reject own submission and override results', async () => {
  const {db,call}=fixture();
  assert.equal((await (await call('/api/admin/pending?admin_id=1')).json()).length,2);
  for (const [action,expected] of [['approve','approved'],['reject','rejected'],['approve','approved']]) {
    assert.equal((await call(`/api/admin/${action}`,{admin_id:1,flight_id:10,reason:'【隐私守护规范】测试理由'})).status,200);
    assert.equal(db.prepare('SELECT status FROM flights WHERE id=10').get().status,expected);
  }
  assert.equal((await call('/api/admin/reject',{admin_id:1,flight_id:13,reason:'【隐私守护规范】覆盖理由'})).status,200);
});
test('ordinary admins restricted to assigned pending; invalid SA denied', async () => {
  const {call}=fixture();
  assert.deepEqual((await (await call('/api/admin/pending?admin_id=2')).json()).map(f=>f.id),[10]);
  for(const action of ['approve','reject']) {
    for(const flight_id of [12,13]) assert.equal((await call(`/api/admin/${action}`,{admin_id:2,flight_id,reason:'【隐私守护规范】测试理由'})).status,403);
    assert.equal((await call(`/api/admin/${action}`,{admin_id:4,flight_id:10,reason:'【隐私守护规范】测试理由'})).status,403);
  }
  assert.equal((await call('/api/admin/pending?admin_id=4')).status,403);
  assert.equal((await call('/api/admin/approve',{admin_id:2,flight_id:10})).status,200);
});
test('admin applications: submission, SA listing, approval and rejection', async () => {
  const {db,call}=fixture();
  assert.equal((await call('/api/account/admin-request',{user_id:3,reason:'Aviation',social:'test account'})).status,200);
  const requests=await (await call('/api/sa/admin-requests?sa_id=1')).json();
  assert.equal(requests.length,1); assert.equal(requests[0].social,'test account');
  assert.equal((await call('/api/sa/admin-request/approve',{sa_id:1,request_id:1,user_id:3})).status,200);
  assert.equal(db.prepare('SELECT role FROM users WHERE id=3').get().role,'administrator');
  db.prepare("UPDATE users SET role='user' WHERE id=3").run();
  await call('/api/account/admin-request',{user_id:3,reason:'【隐私守护规范】测试理由',social:'test'});
  assert.equal((await call('/api/sa/admin-request/reject',{sa_id:1,request_id:2})).status,200);
  assert.equal(db.prepare('SELECT status FROM admin_requests WHERE id=2').get().status,'rejected');
});
test('repeated SA decisions count a distinct submission once and nonpublic details stay private',async()=>{
 const {call,db}=fixture();
 for(const action of ['approve','reject','approve']) await call('/api/admin/'+action,{admin_id:1,flight_id:10,reason:'【隐私守护规范】测试理由'});
 const progress=await (await call('/api/account/progress?id=1')).json();
 assert.equal(progress.review_count,1);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM flight_approvals WHERE flight_id=10').get().n,1);
 assert.equal((await call('/api/flight/11',undefined,2)).status,404);
 assert.equal((await call('/api/flight/11',undefined,3)).status,200);
 assert.equal((await call('/api/admin/screening?admin_id=1')).status,200);
});
