import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('submission, restore and withdrawal each notify the authenticated submitter',async()=>{
  const {call,env,db}=fixture();
  env.RESEND_API_KEY='test-resend-key';
  const originalFetch=globalThis.fetch,messages=[];
  globalThis.fetch=async (url,options)=>{
    assert.equal(String(url),'https://api.resend.com/emails');
    messages.push(JSON.parse(options.body));
    return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
  };
  try{
    const submitted=await call('/api/submit',{user_id:3,airline:'示例航空',flight:'MU5309',route:'PEK',date:'2026-09-27',airport:'PVG',image:'https://images.bpmuseum.org.cn/tickets/test.jpg'},3);
    assert.equal(submitted.status,200);
    const {flight_id:id}=await submitted.json();
    assert.equal(messages.length,1);
    assert.deepEqual(messages[0].to,['u@example.test']);
    assert.match(messages[0].subject,/进入审核队列/);

    assert.equal((await call('/api/my/restore',{user_id:3,flight_id:11},3)).status,200);
    assert.equal((await call('/api/my/withdraw',{user_id:3,flight_id:11},3)).status,200);
    assert.equal(messages.length,3);
    assert.match(messages[1].subject,/恢复/);
    assert.match(messages[2].subject,/下架/);
    assert.equal(db.prepare('SELECT status FROM flights WHERE id=?').get(id).status,'screening');
  }finally{
    globalThis.fetch=originalFetch;
  }
});

test('successful status changes email the submitter; repeated decisions do not resend',async()=>{
  const {call,env}=fixture();
  env.RESEND_API_KEY='test-resend-key';
  const originalFetch=globalThis.fetch,messages=[];
  globalThis.fetch=async (url,options)=>{
    assert.equal(String(url),'https://api.resend.com/emails');
    messages.push(JSON.parse(options.body));
    return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
  };
  try{
    const rejected=await call('/api/admin/reject',{flight_id:13,reason:'【隐私守护规范】请重新遮挡票号'},1);
    assert.equal(rejected.status,200);
    assert.equal(messages.length,1);
    assert.deepEqual(messages[0].to,['u@example.test']);
    assert.match(messages[0].subject,/未通过审核/);
    assert.match(messages[0].html,/请重新遮挡票号/);

    const duplicate=await call('/api/admin/reject',{flight_id:13,reason:'【隐私守护规范】重复操作'},1);
    assert.equal(duplicate.status,409);
    assert.equal(messages.length,1);

    const approved=await call('/api/admin/approve',{flight_id:13},1);
    assert.equal(approved.status,200);
    assert.equal(messages.length,2);
    assert.match(messages[1].subject,/已通过审核/);
    assert.match(messages[1].html,/detail\.html\?id=13/);
  }finally{
    globalThis.fetch=originalFetch;
  }
});
