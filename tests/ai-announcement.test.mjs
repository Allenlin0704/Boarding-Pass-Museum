import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

function recognizeRequest(image,identity=3,consent=true,country='CN'){
  const form=new FormData();
  if(consent)form.append('consent','1');
  form.append('image',new Blob([image],{type:'image/jpeg'}),'edited-ticket.jpg');
  const request=new Request('https://test.invalid/api/flight-assist/recognize',{method:'POST',headers:{Cookie:`bpm_session=${String(identity).repeat(64)}`},body:form});
  request.cf={country};
  return request;
}

test('mainland recognition uses Doubao and returns sanitized fields from edited JPEG only',async()=>{
  const {worker,env,db}=fixture();env.DOUBAO_API_KEY='test-only';env.DOUBAO_MODEL='doubao-vision-test';
  const originalFetch=globalThis.fetch;
  let sent;
  globalThis.fetch=async(url,init)=>{
    assert.equal(url,'https://ark.cn-beijing.volces.com/api/v3/chat/completions');
    sent=JSON.parse(init.body);
    return Response.json({choices:[{message:{content:JSON.stringify({airline_name:'Air China',airline_iata:'ca',flight_number:'CA 123',flight_date:'2026-08-17',departure_airport_name:'Beijing Capital International Airport',departure_airport_iata:'PEK',issue_airport_iata:'PEK',route_scope:'international',passenger_name:'should not return'})}}]});
  };
  try{
    const response=await worker.fetch(recognizeRequest(Uint8Array.from([255,216,255,1,2,3])),env),data=await response.json();
    assert.equal(response.status,200);
    assert.deepEqual(data.fields,{airline_name:'Air China',airline_iata:'CA',airline_icao:'',flight_number:'CA 123',flight_date:'2026-08-17',departure_airport_name:'Beijing Capital International Airport',departure_airport_iata:'PEK',departure_airport_icao:'',issue_airport_name:'',issue_airport_iata:'PEK',issue_airport_icao:'',route_scope:'international'});
    assert.equal(JSON.stringify(data).includes('should not return'),false);
    assert.equal(sent.model,'doubao-vision-test');
    assert.deepEqual(sent.thinking,{type:'disabled'});
    assert.equal(sent.messages[0].content[1].image_url.url.startsWith('data:image/jpeg;base64,'),true);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM auth_limits').get().count,2);
  }finally{globalThis.fetch=originalFetch;}
});

test('boarding-pass route scope, cabin class and markers are stored; invalid cabin classes are rejected',async()=>{
  const {call,db}=fixture();
  const payload={submission_type:'boarding_pass',ticket_format:'digital',cabin_class:'first_class',route_scope:'regional',departure_country:'CN',arrival_country:'HK',airline:'China Southern Airlines (CZ)',airline_iata:'CZ',airport:'Guangzhou Baiyun (CAN)',airport_iata:'CAN',flight:'CZ123',date:'2026-10-01',image:'https://images.bpmuseum.org.cn/tickets/example.jpg',special_tags:['business','premium_economy','silver','special_assistance','transfer','other']};
  const response=await call('/api/submit',{...payload,rules_consent:true,social_share_consent:true},3),data=await response.json();
  assert.equal(response.status,200);assert.equal(data.success,true);
  const saved=db.prepare('SELECT route_scope,cabin_class,special_tags,status FROM flights WHERE id=?').get(data.flight_id);
  assert.equal(saved.route_scope,'regional');
  assert.equal(saved.cabin_class,'first_class');
  assert.deepEqual(JSON.parse(saved.special_tags),payload.special_tags);
  assert.equal(saved.status,'screening');
  const invalid=await call('/api/submit',{...payload,cabin_class:'fake_class',rules_consent:true,social_share_consent:true},3);
  assert.equal(invalid.status,400);
  const invalidCountry=await call('/api/submit',{...payload,departure_country:'ZZ',rules_consent:true,social_share_consent:true},3);
  assert.equal(invalidCountry.status,400);
});

test('all regions use Doubao, missing Doubao configuration fails closed, and non-JPEG uploads are rejected',async()=>{
  const {worker,env}=fixture();
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async(url,init)=>{
    assert.equal(url,'https://ark.cn-beijing.volces.com/api/v3/chat/completions');
    assert.equal(JSON.parse(init.body).model,'doubao-vision-test');
    return Response.json({choices:[{message:{content:'{}'}}]});
  };
  try {
    env.DOUBAO_API_KEY='test-only';env.DOUBAO_MODEL='doubao-vision-test';
    const accepted=await worker.fetch(recognizeRequest(Uint8Array.from([255,216,255]),3,true,'US'),env);
    assert.equal(accepted.status,200);
    const providerRequest=new Request('https://test.invalid/api/ai/provider');providerRequest.cf={country:'HK'};
    const domesticProvider=await worker.fetch(providerRequest,env);
    assert.equal((await domesticProvider.json()).provider,'doubao');
    const overseasRequest=new Request('https://test.invalid/api/ai/provider');overseasRequest.cf={country:'SG'};
    const overseasProvider=await worker.fetch(overseasRequest,env);
    assert.equal((await overseasProvider.json()).provider,'doubao');
  } finally { globalThis.fetch=originalFetch; }
  const noConsent=await worker.fetch(recognizeRequest(Uint8Array.from([255,216,255]),3,false,'US'),env);
  assert.equal(noConsent.status,400);
  env.DOUBAO_API_KEY=undefined;env.DOUBAO_MODEL=undefined;
  const unavailable=await worker.fetch(recognizeRequest(Uint8Array.from([255,216,255]),3,true,'US'),env);
  assert.equal(unavailable.status,503);
  env.DOUBAO_API_KEY='test-only';env.DOUBAO_MODEL='doubao-vision-test';
  const response=await worker.fetch(recognizeRequest(Uint8Array.from([137,80,78,71]),3,true,'CN'),env);
  assert.equal(response.status,415);
});

test('public story translation uses Doubao in every region',async()=>{
  const {worker,env}=fixture();env.DOUBAO_API_KEY='test-only';env.DOUBAO_MODEL='doubao-text-test';
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async(url,init)=>{
    assert.equal(url,'https://ark.cn-beijing.volces.com/api/v3/chat/completions');
    assert.equal(JSON.parse(init.body).model,'doubao-text-test');
    assert.deepEqual(JSON.parse(init.body).thinking,{type:'disabled'});
    return Response.json({choices:[{message:{content:'Translated story'}}]});
  };
  try{
    const request=new Request('https://test.invalid/api/translate/story',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Public travel story',target:'en'})});
    request.cf={country:'SG'};
    const response=await worker.fetch(request,env),data=await response.json();
    assert.equal(response.status,200);assert.equal(data.translated,'Translated story');assert.equal(data.provider,'doubao');
  }finally{globalThis.fetch=originalFetch;}
});

test('announcement publishing is idempotent across retries and remains in history',async()=>{
  const {call,db}=fixture();
  const payload={sa_id:1,version:'馆藏更新',content:'今天的新公告',idempotency_key:'0123456789abcdef0123456789abcdef'};
  const first=await call('/api/sa/announcement',payload,1),firstData=await first.json();
  const retry=await call('/api/sa/announcement',payload,1),retryData=await retry.json();
  assert.equal(first.status,200);assert.equal(firstData.success,true);assert.equal(firstData.duplicate,false);
  assert.equal(retry.status,200);assert.equal(retryData.success,true);assert.equal(retryData.duplicate,true);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM announcements').get().count,1);
  db.prepare("INSERT INTO announcements(title,version,content) VALUES('旧公告','旧公告','历史记录')").run();
  const history=await (await call('/api/announcements')).json();
  assert.ok(history.some(item=>item.title==='馆藏更新'));
  assert.ok(history.some(item=>item.title==='旧公告'));
});

test('SA can edit, hide, restore and soft-delete earlier announcements',async()=>{
  const {call,db}=fixture();
  db.prepare("INSERT INTO announcements(id,title,version,content) VALUES(1,'旧标题','旧标题','旧内容')").run();
  assert.equal((await call('/api/sa/announcements/manage',{sa_id:1,source:'announcement',id:1,action:'edit',title:'新标题',content:'更新后的内容'},1)).status,200);
  assert.equal((await call('/api/sa/announcements/manage',{sa_id:1,source:'announcement',id:1,action:'hide'},1)).status,200);
  const publicHistory=await (await call('/api/announcements')).json();assert.equal(publicHistory.some(item=>item.id===1),false);
  const saHistory=await (await call('/api/sa/announcements?sa_id=1',undefined,1)).json();
  assert.equal(saHistory.find(item=>item.id===1).title,'新标题');assert.equal(Number(saHistory.find(item=>item.id===1).hidden),1);
  assert.equal((await call('/api/sa/announcements/manage',{sa_id:1,source:'announcement',id:1,action:'delete'},1)).status,200);
  assert.equal((await call('/api/sa/announcements/manage',{sa_id:1,source:'announcement',id:1,action:'restore'},1)).status,200);
  const restored=await (await call('/api/announcements')).json();assert.equal(restored.some(item=>item.title==='新标题'),true);
  assert.equal(db.prepare('SELECT deleted_at FROM announcements WHERE id=1').get().deleted_at,null);
  db.prepare("INSERT INTO updates(id,title,content) VALUES(7,'旧置顶','旧动态')").run();
  const history=await (await call('/api/sa/announcements?sa_id=1',undefined,1)).json();
  assert.equal(history.find(item=>item.id===7&&item.source==='update').version,'');
  assert.equal((await call('/api/sa/announcements/manage',{sa_id:1,source:'update',id:7,action:'edit',title:'旧事项改成公告',content:'已修改'},1)).status,200);
  assert.deepEqual({...db.prepare('SELECT title,content FROM updates WHERE id=7').get()},{title:'旧事项改成公告',content:'已修改'});
});
