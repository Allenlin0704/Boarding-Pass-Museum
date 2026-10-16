import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('SA schedule controls eligibility; scheduled SA and admins can receive submissions', async()=>{
  const {call,db}=fixture();
  let response=await call('/api/sa/reviewer-schedule',{reviewer_allocations:[{user_id:4,percent:100}]},1);
  assert.equal(response.status,400,'invalid role superadmin must not be schedulable');
  response=await call('/api/sa/reviewer-schedule',{reviewer_allocations:[{user_id:2,percent:70},{user_id:1,percent:30}]},1);
  assert.equal(response.status,200);
  const schedule=db.prepare('SELECT user_id,allocation_percent FROM reviewer_schedule WHERE active=1 ORDER BY sort_order').all().map(row=>({...row}));
  assert.deepEqual(schedule,[{user_id:2,allocation_percent:70},{user_id:1,allocation_percent:30}]);
  response=await call('/api/sa/reviewer-schedule',{reviewer_allocations:[{user_id:2,percent:65},{user_id:1,percent:30}]},1);
  assert.equal(response.status,400,'allocation percentages must add up to exactly 100');
  const before=new Map(db.prepare('SELECT reviewer_id,COUNT(*) AS count FROM flights WHERE reviewer_id IN (1,2) GROUP BY reviewer_id').all().map(row=>[row.reviewer_id,row.count]));
  response=await call('/api/submit',{submission_type:'rail_ticket',ticket_format:'digital',departure_country:'CN',arrival_country:'DE',airline:'China Railway CR',airline_iata:'CR',flight:'G101',airport:'北京南站',airport_iata:'BJP',route:'上海虹桥站',date:'2026-09-27',image:'https://images.bpmuseum.org.cn/tickets/test.webp',special_tags:[],rules_consent:true,social_share_consent:true},3);
  assert.equal(response.status,200);
  const saved=db.prepare('SELECT * FROM flights WHERE user_id=3 ORDER BY id DESC LIMIT 1').get();
  assert.equal(saved.submission_type,'rail_ticket');
  assert.equal(saved.ticket_format,'digital');
  assert.equal(saved.social_share_consent,1);
  assert.equal(saved.airline_iata,'CR');
  assert.equal(saved.airport_iata,'BJP');
  assert.ok([1,2].includes(saved.reviewer_id));
  for(let index=0;index<19;index++){
    response=await call('/api/submit',{submission_type:'boarding_pass',ticket_format:'paper',cabin_class:'economy',route_scope:'domestic',departure_country:'CN',arrival_country:'CN',airline:'Example Air',flight:`EA${index}`,airport:'PEK',date:'2026-09-27',image:'https://images.bpmuseum.org.cn/tickets/test.webp',special_tags:[],rules_consent:true,social_share_consent:true},3);
    assert.equal(response.status,200);
  }
  assert.equal(db.prepare('SELECT social_share_consent FROM flights WHERE flight=?').get('EA0').social_share_consent,1);
  const after=db.prepare('SELECT reviewer_id,COUNT(*) AS count FROM flights WHERE reviewer_id IN (1,2) GROUP BY reviewer_id').all();
  const delta=new Map(after.map(row=>[row.reviewer_id,row.count-(before.get(row.reviewer_id)||0)]));
  assert.ok(delta.get(2)>=12&&delta.get(2)<=15,`70% reviewer got ${delta.get(2)} of 20 assignments`);
  assert.ok(delta.get(1)>=5&&delta.get(1)<=8,`30% reviewer got ${delta.get(1)} of 20 assignments`);
});

test('submission requires both rules acceptance and social-share authorization',async()=>{
  const {call,db}=fixture();
  const payload={submission_type:'boarding_pass',ticket_format:'paper',cabin_class:'economy',route_scope:'domestic',airline:'Example Air',flight:'EA42',airport:'PEK',date:'2026-09-27',image:'https://images.bpmuseum.org.cn/tickets/test.webp',departure_country:'CN',arrival_country:'CN',special_tags:[],rules_consent:true,social_share_consent:true};
  let response=await call('/api/submit',{...payload,rules_consent:false},3);
  assert.equal(response.status,400);
  response=await call('/api/submit',{...payload,social_share_consent:false},3);
  assert.equal(response.status,400);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM flights WHERE flight=?').get('EA42').n,0);
  response=await call('/api/submit',payload,3);
  assert.equal(response.status,200);
  const saved=db.prepare('SELECT rules_consent,social_share_consent FROM flights WHERE flight=?').get('EA42');
  assert.deepEqual({...saved},{rules_consent:1,social_share_consent:1});
});

test('valid uploaded JPEG fallback can be submitted as an exhibit',async()=>{
  const {call,db}=fixture();
  const payload={submission_type:'boarding_pass',ticket_format:'paper',cabin_class:'economy',route_scope:'domestic',airline:'Example Air',flight:'EA44',airport:'PEK',date:'2026-09-27',image:'https://images.bpmuseum.org.cn/tickets/converted.jpg',departure_country:'CN',arrival_country:'CN',special_tags:[],rules_consent:true,social_share_consent:true};
  const response=await call('/api/submit',payload,3);
  assert.equal(response.status,200);
  assert.equal(db.prepare('SELECT image FROM flights WHERE flight=?').get('EA44').image,payload.image);
});

test('new exhibit submissions cannot reference image URLs that were never uploaded',async()=>{
  const {call,db,env}=fixture();env.IMAGES.head=async()=>null;
  const payload={submission_type:'boarding_pass',ticket_format:'paper',cabin_class:'economy',route_scope:'domestic',airline:'Example Air',flight:'EA43',airport:'PEK',date:'2026-09-27',image:'https://images.bpmuseum.org.cn/tickets/original.jpg',departure_country:'CN',arrival_country:'CN',special_tags:[],rules_consent:true,social_share_consent:true};
  const response=await call('/api/submit',payload,3);
  assert.equal(response.status,413);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM flights WHERE flight=?').get('EA43').n,0);
});

test('domestic boarding passes and metro tickets do not require arrival country; metro images stay within 1 MB WebP',async()=>{
  const {call,db,env}=fixture();
  env.IMAGES={head:async()=>({size:1024*1024,httpMetadata:{contentType:'image/webp'}})};
  const common={ticket_format:'paper',departure_country:'CN',airline:'Metro Transit',airline_iata:'MT',flight:'Line 2',airport:'人民广场站',route:'虹桥火车站',date:'2026-10-11',image:'https://images.bpmuseum.org.cn/tickets/metro.webp',special_tags:[],rules_consent:true,social_share_consent:true};
  let response=await call('/api/submit',{...common,submission_type:'metro_ticket'},3);
  assert.equal(response.status,200);
  let saved=db.prepare('SELECT submission_type,departure_country,arrival_country FROM flights WHERE submission_type=? ORDER BY id DESC LIMIT 1').get('metro_ticket');
  assert.deepEqual({...saved},{submission_type:'metro_ticket',departure_country:'CN',arrival_country:''});
  env.IMAGES.head=async()=>({size:1024*1024+1,httpMetadata:{contentType:'image/webp'}});
  response=await call('/api/submit',{...common,submission_type:'metro_ticket',image:'https://images.bpmuseum.org.cn/tickets/too-large.webp'},3);
  assert.equal(response.status,413);
  response=await call('/api/admin/edit',{admin_id:1,flight_id:13,submission_type:'metro_ticket',image:common.image},1);
  assert.equal(response.status,413,'SA edits cannot bypass the global image limit');
  env.IMAGES.head=async()=>({size:1024,httpMetadata:{contentType:'image/webp'}});
  response=await call('/api/submit',{...common,submission_type:'boarding_pass',route_scope:'domestic',cabin_class:'economy',flight:'EA10',airport:'PEK',airline:'Example Air',airline_iata:'EA',arrival_country:''},3);
  assert.equal(response.status,200);
  saved=db.prepare('SELECT route_scope,arrival_country FROM flights WHERE flight=?').get('EA10');
  assert.deepEqual({...saved},{route_scope:'domestic',arrival_country:''});
});

test('profile writes bind to the authenticated user, and owner corrections reach SA', async()=>{
  const {call,db}=fixture();
  let response=await call('/api/account/profile',{user_id:1,avatar:'https://images.bpmuseum.org.cn/tickets/avatar.webp',avatar_shape:'square',bio:'My profile'},3);
  assert.equal(response.status,403,'a profile write cannot target another account');
  response=await call('/api/account/profile',{user_id:3,avatar:'https://images.bpmuseum.org.cn/tickets/avatar.webp',avatar_shape:'square',bio:'My profile'},3);
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
