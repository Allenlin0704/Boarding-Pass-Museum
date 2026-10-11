import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers.mjs';
import {aiFailureStatus} from '../worker/ai-provider.mjs';

function recognizeRequest(image,identity=3,consent=true,country='CN'){
  const form=new FormData();
  if(consent)form.append('consent','1');
  form.append('image',new Blob([image],{type:'image/jpeg'}),'edited-ticket.jpg');
  const request=new Request('https://test.invalid/api/flight-assist/recognize',{method:'POST',headers:{Cookie:`bpm_session=${String(identity).repeat(64)}`},body:form});
  request.cf={country};
  return request;
}

test('Cloudflare vision recognizes only the edited JPEG and returns sanitized fields',async()=>{
  const {worker,env,db}=fixture();
  let sent,usedModel,runOptions;
  env.AI={run:async(model,input,options)=>{usedModel=model;sent=input;runOptions=options;return {response:JSON.stringify({airline_name:'Air China',airline_iata:'ca',flight_number:'CA 123',flight_date:'2026-08-17',departure_airport_name:'Beijing Capital International Airport',departure_airport_iata:'PEK',issue_airport_iata:'PEK',route_scope:'international',passenger_name:'should not return'})};}};
  const response=await worker.fetch(recognizeRequest(Uint8Array.from([255,216,255,1,2,3])),env),data=await response.json();
  assert.equal(response.status,200);
  assert.deepEqual(data.fields,{airline_name:'Air China',airline_iata:'CA',airline_icao:'',flight_number:'CA 123',flight_date:'2026-08-17',departure_airport_name:'Beijing Capital International Airport',departure_airport_iata:'PEK',departure_airport_icao:'',issue_airport_name:'',issue_airport_iata:'PEK',issue_airport_icao:'',route_scope:'international'});
  assert.equal(JSON.stringify(data).includes('should not return'),false);
  assert.equal(usedModel,'@cf/google/gemma-4-26b-a4b-it');
  assert.deepEqual(runOptions,{rejectIfBusy:true});
  assert.deepEqual(sent.chat_template_kwargs,{enable_thinking:false});
  assert.equal(sent.messages[0].content[1].image_url.url.startsWith('data:image/jpeg;base64,'),true);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM auth_limits').get().count,2);
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

test('all regions use Cloudflare AI, missing binding fails closed, and non-JPEG uploads are rejected',async()=>{
  const {worker,env}=fixture();
  env.AI={run:async()=>({response:'{}'})};
  const accepted=await worker.fetch(recognizeRequest(Uint8Array.from([255,216,255]),3,true,'US'),env);
  assert.equal(accepted.status,200);
  const providerRequest=new Request('https://test.invalid/api/ai/provider');providerRequest.cf={country:'HK'};
  const domesticProvider=await worker.fetch(providerRequest,env);
  assert.equal((await domesticProvider.json()).provider,'cloudflare');
  const overseasRequest=new Request('https://test.invalid/api/ai/provider');overseasRequest.cf={country:'SG'};
  const overseasProvider=await worker.fetch(overseasRequest,env);
  assert.equal((await overseasProvider.json()).provider,'cloudflare');
  const noConsent=await worker.fetch(recognizeRequest(Uint8Array.from([255,216,255]),3,false,'US'),env);
  assert.equal(noConsent.status,400);
  env.AI=undefined;
  const unavailable=await worker.fetch(recognizeRequest(Uint8Array.from([255,216,255]),3,true,'US'),env);
  assert.equal(unavailable.status,503);
  env.AI={run:async()=>({response:'{}'})};
  const response=await worker.fetch(recognizeRequest(Uint8Array.from([137,80,78,71]),3,true,'CN'),env);
  assert.equal(response.status,415);
});

test('public story translation uses Cloudflare Workers AI',async()=>{
  const {worker,env}=fixture();let usedModel,input,options;
  env.AI={run:async(model,request,runOptions)=>{usedModel=model;input=request;options=runOptions;return {response:'Translated story'};}};
  const request=new Request('https://test.invalid/api/translate/story',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Public travel story',target:'en'})});
  request.cf={country:'SG'};
  const response=await worker.fetch(request,env),data=await response.json();
  assert.equal(response.status,200);assert.equal(data.translated,'Translated story');assert.equal(data.provider,'cloudflare');
  assert.equal(usedModel,'@cf/google/gemma-4-26b-a4b-it');assert.equal(input.messages[1].content,'Public travel story');assert.deepEqual(options,{rejectIfBusy:true});
});

test('approved exhibit translations are cached per source revision and target language',async()=>{
  const {worker,env,db}=fixture();
  db.prepare("UPDATE flights SET story='A public travel story',status='approved' WHERE id=13").run();
  let calls=0;env.AI={run:async()=>{calls++;return {response:'Translated once'};}};
  const request=()=>new Request('https://test.invalid/api/translate/story',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({flight_id:13,text:'A public travel story',target:'en'})});
  const first=await (await worker.fetch(request(),env)).json();
  const second=await (await worker.fetch(request(),env)).json();
  assert.equal(first.translated,'Translated once');assert.equal(first.cached,false);
  assert.equal(second.translated,'Translated once');assert.equal(second.cached,true);
  assert.equal(calls,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM auth_limits').get().count,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM flight_story_translations').get().count,1);
  const stale=await worker.fetch(new Request('https://test.invalid/api/translate/story',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({flight_id:13,text:'Edited source',target:'en'})}),env);
  assert.equal(stale.status,400);
  db.prepare("UPDATE flights SET story='Pending story' WHERE id=10").run();
  const privateStory=await worker.fetch(new Request('https://test.invalid/api/translate/story',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({flight_id:10,text:'Pending story',target:'en'})}),env);
  assert.equal(privateStory.status,400);
});

test('Workers AI free-allocation and temporary-capacity errors are surfaced as retryable limits',()=>{
  assert.equal(aiFailureStatus({code:3036,message:'daily free allocation exhausted'}),429);
  assert.equal(aiFailureStatus({code:3040,message:'Capacity temporarily exceeded'}),429);
  assert.equal(aiFailureStatus(new Error('binding unavailable')),503);
});

test('gallery and detail translation controls send their exhibit IDs for persistent caching',()=>{
  const theme=readFileSync(new URL('../public/theme.js',import.meta.url),'utf8');
  const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const detail=readFileSync(new URL('../public/detail.js',import.meta.url),'utf8');
  assert.match(theme,/flight_id:Number\(panel\.dataset\.bpmFlightId\)/);
  assert.match(app,/data-bpm-flight-id="\$\{Number\(flight\.id\)\|\|0\}"/);
  assert.match(detail,/data-bpm-flight-id="\$\{Number\(data\.id\)\|\|0\}"/);
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
