import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('users can submit bounded feedback and only SA can review it',async()=>{
  const {call,db}=fixture();
  const submitted=await call('/api/error-reports',{category:'按钮没有反应',message:'点保存后没有变化',code:'500',page:'/account.html?email=private'},3);
  assert.equal(submitted.status,200);
  const row=db.prepare('SELECT * FROM error_reports').get();
  assert.equal(row.user_id,3);
  assert.equal(row.page,'/account.html');
  assert.equal((await call('/api/sa/error-reports',undefined,2)).status,403);
  const rows=await call('/api/sa/error-reports',undefined,1);
  assert.equal((await rows.json()).length,1);
  assert.equal((await call(`/api/sa/error-reports/${row.id}/status`,{status:'resolved'},2)).status,403);
  assert.equal((await call(`/api/sa/error-reports/${row.id}/status`,{status:'resolved'},1)).status,200);
  assert.equal(db.prepare('SELECT status FROM error_reports WHERE id=?').get(row.id).status,'resolved');
});

test('feedback rejects unsupported categories and unauthenticated submissions',async()=>{
  const {call,worker,env}=fixture();
  assert.equal((await call('/api/error-reports',{category:'Nope'},3)).status,400);
  const response=await worker.fetch(new Request('https://test.invalid/api/error-reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:'其他'})}),env);
  assert.equal(response.status,401);
});
