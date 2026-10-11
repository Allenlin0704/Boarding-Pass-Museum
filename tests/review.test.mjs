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
  assert.equal(flight.status,'screening'); assert.equal(flight.reject_reason,null); assert.equal(flight.reviewer_id,1);
  assert.equal((await call('/api/my/restore',{user_id:3,flight_id:11})).status,409);
});
test('staff submissions always enter SA review, including SA self-review',async()=>{
  const {call,db}=fixture();
  db.prepare('DELETE FROM reviewer_schedule').run();
  db.prepare("INSERT INTO reviewer_schedule(user_id,active,sort_order,allocation_percent) VALUES(2,1,0,50),(5,1,1,50)").run();
  const payload={submission_type:'boarding_pass',ticket_format:'paper',cabin_class:'economy',route_scope:'domestic',departure_country:'CN',arrival_country:'JP',airline:'Example Air',flight:'EA123',airport:'PEK',date:'2026-10-11',image:'https://images.bpmuseum.org.cn/tickets/example.jpg',rules_consent:true,social_share_consent:true};
  const admin=await call('/api/submit',payload,2),adminData=await admin.json();
  const sa=await call('/api/submit',payload,1),saData=await sa.json();
  assert.equal(admin.status,200);assert.equal(sa.status,200);
  assert.equal(db.prepare('SELECT reviewer_id FROM flights WHERE id=?').get(adminData.flight_id).reviewer_id,1);
  assert.equal(db.prepare('SELECT reviewer_id FROM flights WHERE id=?').get(saData.flight_id).reviewer_id,1);
  const queue=await (await call('/api/admin/pending?admin_id=1',undefined,1)).json();
  assert.ok(queue.some(flight=>flight.id===adminData.flight_id));
  assert.ok(queue.some(flight=>flight.id===saData.flight_id));
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
test('only SA can edit hidden exhibits; ordinary admins can edit only assigned screening exhibits',async()=>{
  const {call,db}=fixture();
  const edit={flight_id:11,airline:'Updated Air',flight:'MU123',airport:'PEK',date:'2026-10-11',story:'Corrected details',image:'https://images.bpmuseum.org.cn/tickets/example.jpg'};
  assert.equal((await call('/api/admin/edit',{...edit,admin_id:2},2)).status,403);
  assert.equal((await call('/api/admin/edit',{...edit,flight_id:10,user_id:3},3)).status,403);
  assert.equal((await call('/api/admin/edit',{...edit,admin_id:1},1)).status,200);
  assert.equal(db.prepare('SELECT airline,flight,status FROM flights WHERE id=11').get().airline,'Updated Air');
  assert.equal(db.prepare('SELECT status FROM flights WHERE id=11').get().status,'hidden');
  assert.equal((await call('/api/admin/edit',{...edit,flight_id:10,admin_id:5},5)).status,403);
  const assigned={...edit,flight_id:10,admin_id:2};
  assert.equal((await call('/api/admin/edit',assigned,2)).status,200);
});
test('SA can repair missing fields and canonical airline/airport codes without changing review status',async()=>{
  const {call,db}=fixture();
  const response=await call('/api/admin/edit',{admin_id:1,flight_id:13,submission_type:'boarding_pass',airline:'Example Air',airline_iata:'EA',airline_icao:'EXA',flight:'EA202',airport:'Beijing Capital International Airport (PEK)',airport_iata:'pek',airport_icao:'ZBAA',date:'2026-10-11',route:'',route_scope:'international',departure_country:'',arrival_country:'',image:'https://images.bpmuseum.org.cn/tickets/ea202.jpg',story:'Corrected by SA'});
  assert.equal(response.status,200);
  const saved=db.prepare('SELECT airline,airline_iata,airline_icao,flight,airport,airport_iata,airport_icao,route,route_scope,departure_country,arrival_country,status FROM flights WHERE id=13').get();
  assert.deepEqual({...saved},{airline:'Example Air',airline_iata:'EA',airline_icao:'EXA',flight:'EA202',airport:'Beijing Capital International Airport (PEK)',airport_iata:'PEK',airport_icao:'ZBAA',route:'',route_scope:'international',departure_country:'',arrival_country:'',status:'approved'});
  assert.equal((await call('/api/admin/edit',{admin_id:2,flight_id:13,route_scope:'domestic'},2)).status,403);
});
test('accepting a correction can update exhibit fields and keeps its status',async()=>{
  const {call,db}=fixture();
  db.prepare("INSERT INTO flight_corrections(id,flight_id,user_id,message) VALUES(1,13,3,'航线应为北京到东京')").run();
  const response=await call('/api/sa/flight-corrections/resolve',{sa_id:1,correction_id:1,status:'accepted',decision:'已核对并修正航线',flight_updates:{route:'HND',route_scope:'international',departure_country:'CN',arrival_country:'JP',airline:'中国东方航空 (MU)',airline_iata:'MU',airport:'上海虹桥国际机场 (SHA)',airport_iata:'SHA'}});
  assert.equal(response.status,200);
  const flight=db.prepare('SELECT route,route_scope,departure_country,arrival_country,airline_iata,airport_iata,status FROM flights WHERE id=13').get();
  assert.deepEqual({...flight},{route:'HND',route_scope:'international',departure_country:'CN',arrival_country:'JP',airline_iata:'MU',airport_iata:'SHA',status:'approved'});
  assert.equal(db.prepare('SELECT status FROM flight_corrections WHERE id=1').get().status,'accepted');
});
test('admin applications: submission, SA listing, approval and rejection', async () => {
  const {db,call}=fixture();
  assert.equal((await call('/api/account/admin-request',{user_id:3,reason:'Aviation',social:'test account'})).status,200);
  const requests=await (await call('/api/sa/admin-requests?sa_id=1')).json();
  assert.equal(requests.length,1); assert.equal(requests[0].social,'test account');
  assert.equal((await call('/api/sa/admin-request/approve',{sa_id:1,request_id:1,user_id:3})).status,200);
  assert.equal(db.prepare('SELECT role FROM users WHERE id=3').get().role,'administrator');
  const notice=db.prepare('SELECT content FROM notifications WHERE user_id=3 ORDER BY id DESC LIMIT 1').get();
  assert.match(notice.content,/admin\.bpmuseum\.org\.cn/);assert.match(notice.content,/首次登录/);
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
