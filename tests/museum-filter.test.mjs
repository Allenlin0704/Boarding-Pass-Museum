import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('gallery filters distinguish rail tickets, ticket format and special markers',async()=>{
  const ids=['museumSearch','museumSort','museumAirline','museumType','museumBaggageTag','museumFormat','museumAirport','museumYear','museumResultCount','museum'];
  const elements=Object.fromEntries(ids.map(id=>[id,{value:id==='museumSort'?'latest':'',textContent:'',replaceChildren(){}}]));
  const context=vm.createContext({
    document:{getElementById:id=>elements[id]||null,addEventListener(){},createElement(){return {}; }},
    window:{BPM_LANGUAGE:'zh'},localStorage:{getItem(){return null;}},
    fetch:async()=>({ok:true,json:async()=>[]}),Option:function(label,value){this.text=label;this.value=value;},
    console,Date,URL,alert(){},location:{}
  });
  vm.runInContext(readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),context);
  vm.runInContext('renderMuseum=()=>{}',context);
  await new Promise(resolve=>setImmediate(resolve));
  vm.runInContext(`flights=[
    {id:1,submission_type:'boarding_pass',ticket_format:'paper',special_tags:'[]'},
    {id:2,submission_type:'rail_ticket',ticket_format:'paper',special_tags:'[]'},
    {id:3,submission_type:'boarding_pass',ticket_format:'digital',special_tags:'["transfer"]'},
    {id:4,submission_type:'boarding_pass',ticket_format:'paper',special_tags:'["two_cabin"]'}
  ]`,context);
  const filter=(field,value)=>{
    elements.museumType.value='';elements.museumBaggageTag.value='';elements.museumFormat.value='';elements[field].value=value;
    vm.runInContext('applyMuseumFilter()',context);
    return Array.from(vm.runInContext('displayFlights.map(item=>item.id)',context));
  };
  assert.deepEqual(filter('museumType','rail_ticket'),[2]);
  assert.deepEqual(filter('museumType','transfer'),[]);
  assert.deepEqual(filter('museumBaggageTag','transfer'),[3]);
  assert.deepEqual(filter('museumBaggageTag','two_cabin'),[4]);
  assert.deepEqual(filter('museumFormat','paper'),[1,4]);
  assert.deepEqual(filter('museumFormat','digital'),[3]);
});
