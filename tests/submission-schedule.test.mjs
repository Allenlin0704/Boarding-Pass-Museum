import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('SA schedule controls eligibility; scheduled SA and admins can receive submissions', async()=>{
  const {call,db}=fixture();
  let response=await call('/api/sa/reviewer-schedule',{reviewer_ids:[4]},1);
  assert.equal(response.status,400,'invalid role superadmin must not be schedulable');
  response=await call('/api/sa/reviewer-schedule',{reviewer_ids:[2,1]},1);
  assert.equal(response.status,200);
  const schedule=db.prepare('SELECT user_id FROM reviewer_schedule WHERE active=1 ORDER BY sort_order').all().map(row=>row.user_id);
  assert.deepEqual(schedule,[2,1]);
  response=await call('/api/submit',{submission_type:'rail_ticket',ticket_format:'digital',departure_country:'CN',arrival_country:'DE',airline:'China Railway CR',flight:'G101',airport:'北京南站',route:'上海虹桥站',date:'2026-09-27',image:'https://images.bpmuseum.org.cn/tickets/test.jpg',special_tags:[]},3);
  assert.equal(response.status,200);
  const saved=db.prepare('SELECT * FROM flights WHERE user_id=3 ORDER BY id DESC LIMIT 1').get();
  assert.equal(saved.submission_type,'rail_ticket');
  assert.equal(saved.ticket_format,'digital');
  assert.ok([1,2].includes(saved.reviewer_id));
});

test('profile writes bind to the authenticated user, and owner corrections reach SA', async()=>{
  const {call,db}=fixture();
  let response=await call('/api/account/profile',{user_id:1,avatar:'https://images.bpmuseum.org.cn/tickets/avatar.jpg',avatar_shape:'square',bio:'My profile'},3);
  assert.equal(response.status,403,'a profile write cannot target another account');
  response=await call('/api/account/profile',{user_id:3,avatar:'https://images.bpmuseum.org.cn/tickets/avatar.jpg',avatar_shape:'square',bio:'My profile'},3);
  assert.equal(response.status,200);
  assert.equal(db.prepare('SELECT avatar FROM users WHERE id=1').get().avatar,null);
  assert.equal(db.prepare('SELECT avatar_shape FROM users WHERE id=3').get().avatar_shape,'square');
  response=await call('/api/flight/correction',{flight_id:13,message:'航班日期需要核对'},3);
  assert.equal(response.status,200);
  response=await call('/api/sa/flight-corrections',null,1);
  const queue=await response.json();assert.equal(queue.length,1);assert.equal(queue[0].flight_id,13);
  response=await call('/api/sa/flight-corrections/resolve',{correction_id:queue[0].id,status:'accepted',decision:'已核对并采纳'},1);
  assert.equal(response.status,200);
  assert.equal(db.prepare('SELECT status FROM flight_corrections WHERE id=?').get(queue[0].id).status,'accepted');
});
