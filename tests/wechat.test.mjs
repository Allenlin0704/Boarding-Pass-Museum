import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fixture} from './helpers.mjs';
const signed=(token,timestamp='1700000000',nonce='nonce')=>new URLSearchParams({timestamp,nonce,signature:createHash('sha1').update([token,timestamp,nonce].sort().join('')).digest('hex')});
test('WeChat callback verifies signatures and returns public exhibit results only',async()=>{
  const {worker,env,db}=fixture(),token='test-wechat-token';env.WECHAT_TOKEN=token;
  db.prepare("UPDATE flights SET airline='中国东方航空',flight='MU5309',route='PVG-PEK',status='approved' WHERE id=13").run();
  const query=signed(token);query.set('echostr','verified');
  const verify=await worker.fetch(new Request('https://test.invalid/wechat?'+query),env);assert.equal(await verify.text(),'verified');
  const xml='<xml><ToUserName><![CDATA[gh_test]]></ToUserName><FromUserName><![CDATA[user_test]]></FromUserName><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[航班 MU5309]]></Content></xml>';
  const reply=await worker.fetch(new Request('https://test.invalid/wechat?'+signed(token),{method:'POST',headers:{'Content-Type':'application/xml'},body:xml}),env);
  const body=await reply.text();assert.equal(reply.status,200);assert.match(body,/MU5309/);assert.match(body,/detail\.html\?id=13/);
  assert.equal((await worker.fetch(new Request('https://test.invalid/wechat?'+signed('wrong'),{method:'POST',headers:{'Content-Type':'application/xml'},body:xml}),env)).status,403);
});
