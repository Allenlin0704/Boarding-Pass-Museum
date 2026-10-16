import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture, webpBytes } from './helpers.mjs';

test('image upload stores WebP images no larger than 1280px and 1 MB', async () => {
  const { worker, env } = fixture();
  const writes=[];
  env.IMAGES = { async put(key,bytes,options) { writes.push({key,bytes,options}); } };

  const form=new FormData();form.set('image',new Blob([webpBytes({width:1280,height:960})],{type:'image/webp'}),'ticket.webp');
  const response=await worker.fetch(new Request('https://test.invalid/api/upload-image',{method:'POST',headers:{Cookie:`bpm_session=${'3'.repeat(64)}`},body:form}),env);
  const result=await response.json();
  assert.equal(response.status,200);assert.match(result.url,/\.webp$/);
  assert.equal(writes.length,1);assert.match(writes[0].key,/\.webp$/);assert.equal(writes[0].options.httpMetadata.contentType,'image/webp');
});

test('image upload accepts browser JPEG fallback with the same limits',async()=>{
  const {worker,env}=fixture(),writes=[];env.IMAGES={async put(key,bytes,options){writes.push({key,options});}};
  const jpeg=new Uint8Array([0xff,0xd8,0xff,0xc0,0x00,0x0b,0x08,0x03,0xc0,0x05,0x00,0x03,0x01,0x11,0x00]);
  const form=new FormData();form.set('image',new Blob([jpeg],{type:'image/jpeg'}),'ticket.jpg');
  const response=await worker.fetch(new Request('https://test.invalid/api/upload-image',{method:'POST',headers:{Cookie:`bpm_session=${'3'.repeat(64)}`},body:form}),env);
  const result=await response.json();assert.equal(response.status,200);assert.match(result.url,/\.jpg$/);
  assert.equal(writes.length,1);assert.match(writes[0].key,/\.jpg$/);assert.equal(writes[0].options.httpMetadata.contentType,'image/jpeg');
});

test('image upload rejects files over 1 MB before writing to R2', async () => {
  const { worker, env } = fixture();
  let writes=0;env.IMAGES={async put(){writes++;}};
  const form=new FormData();form.set('image',new Blob([webpBytes({size:1024*1024+1})],{type:'image/webp'}),'large-ticket.webp');
  const response=await worker.fetch(new Request('https://test.invalid/api/upload-image',{method:'POST',headers:{Cookie:`bpm_session=${'3'.repeat(64)}`},body:form}),env);
  assert.equal(response.status,400);assert.match((await response.json()).error,/1 MB/);assert.equal(writes,0);
});

test('image upload rejects images whose longest edge exceeds 1280px', async () => {
  const { worker, env } = fixture();
  let writes=0;env.IMAGES={async put(){writes++;}};
  const form=new FormData();form.set('image',new Blob([webpBytes({width:1281,height:720})],{type:'image/webp'}),'wide.webp');
  const response=await worker.fetch(new Request('https://test.invalid/api/upload-image',{method:'POST',headers:{Cookie:`bpm_session=${'3'.repeat(64)}`},body:form}),env);
  assert.equal(response.status,400);assert.match((await response.json()).error,/1280/);assert.equal(writes,0);
});

test('image upload rejects unprocessed, unsupported, and malformed files', async () => {
  const { worker, env } = fixture();
  let writes=0;env.IMAGES={async put(){writes++;}};
  for(const [name,type,bytes] of [['ticket.jpg','image/jpeg',[0xff,0xd8,0xff]],['ticket.png','image/png',[137,80,78,71]],['fake.webp','image/webp',[82,73,70,70,0,0,0,0,87,69,66,80]]]) {
    const form=new FormData();form.set('image',new Blob([new Uint8Array(bytes)],{type}),name);
    const response=await worker.fetch(new Request('https://test.invalid/api/upload-image',{method:'POST',headers:{Cookie:`bpm_session=${'3'.repeat(64)}`},body:form}),env);
    assert.equal(response.status,415,`${name} must not bypass client conversion`);
  }
  assert.equal(writes,0);
});

test('SA homepage photo upload applies the same WebP size and longest-edge limits', async () => {
  const { worker, env } = fixture();let writes=0;env.IMAGES={async put(){writes++;}};
  const form=new FormData();form.set('image',new Blob([webpBytes({size:1024*1024+1})],{type:'image/webp'}),'large-homepage.webp');
  form.set('credit','Test photographer');form.set('weekday','2');form.set('show_home','1');form.set('license_confirmed','1');
  const response=await worker.fetch(new Request('https://test.invalid/api/sa/site-photos/upload',{method:'POST',headers:{Cookie:`bpm_session=${'1'.repeat(64)}`},body:form}),env);
  assert.equal(response.status,400);assert.match((await response.json()).error,/1 MB/);assert.equal(writes,0);
});
