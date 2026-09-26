import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
test('hidden cards show only restore; other cards show one withdraw; successful actions reload', async () => {
  const cards=[]; const calls=[];
  const box={innerHTML:'',appendChild(card){cards.push(card);}};
  const context=vm.createContext({
    bpmSafeRecord:x=>x, currentUser:{id:3,username:'Test'}, console, location:{}, window:{bpmIcon:name=>`<svg data-icon="${name}"></svg>`}, showToast(){}, confirm:()=>true,
    document:{getElementById:id=>id==='mySubmissions'?box:null,addEventListener(){},createElement:()=>({})},
    fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>options?{success:true}:[]};}
  });
  vm.runInContext(readFileSync(new URL('../public/my.js',import.meta.url),'utf8'),context);
  await new Promise(resolve=>setImmediate(resolve));
  vm.runInContext(`renderSubmissions([{id:11,status:'hidden'},{id:12,status:'pending'},{id:13,status:'approved'}])`,context);
  assert.match(cards[0].innerHTML,/恢复展品/);
  assert.doesNotMatch(cards[0].innerHTML,/withdrawFlight/);
  assert.match(cards[0].innerHTML,/已下架/);
  for(const card of cards.slice(1)) {
    assert.equal((card.innerHTML.match(/withdrawFlight/g)||[]).length,1);
    assert.doesNotMatch(card.innerHTML,/restoreFlight/);
  }
  await vm.runInContext('restoreFlight(11)',context);
  assert.equal(calls.at(-2).url,'https://api.bpmuseum.org.cn/api/my/restore');
  assert.deepEqual(JSON.parse(calls.at(-2).options.body),{flight_id:11,user_id:3});
  assert.match(calls.at(-1).url,/my-flights/);
  await vm.runInContext('withdrawFlight(13)',context);
  assert.match(calls.at(-2).url,/my\/withdraw$/);
});
