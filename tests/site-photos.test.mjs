import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';
import {beijingWeekday} from '../worker/site-photos.mjs';

test('weekday selection switches at midnight in Beijing time',()=>{
  assert.equal(beijingWeekday(new Date('2026-10-01T15:59:00.000Z')),4);
  assert.equal(beijingWeekday(new Date('2026-10-01T16:00:00.000Z')),5);
});

test('public daily-photo API returns the scheduled weekday photo for a valid placement',async()=>{
  const {worker,env}=fixture();
  const response=await worker.fetch(new Request('https://test.invalid/api/site-photos?placement=login'),env);
  assert.equal(response.status,200);
  const photos=await response.json();
  const today=beijingWeekday();
  assert.equal(photos.length,1);
  assert.equal(photos[0].image_url,`/assets/auth-covers/${String(today).padStart(2,'0')}.jpg`);
  assert.equal(photos[0].weekday,today);
  assert.equal((await worker.fetch(new Request('https://test.invalid/api/site-photos?placement=secret'),env)).status,400);
  env.DB.prepare('UPDATE site_cover_photos SET active=0 WHERE sort_order=?').bind(today).run();
  assert.equal((await (await worker.fetch(new Request('https://test.invalid/api/site-photos?placement=home'),env)).json()).length,0);
});

test('photo invitations, rights-confirmed upload, SA approval, and placement updates work end to end',async()=>{
  const {call,worker,env,db}=fixture();
  const stored=[];
  env.IMAGES={async put(key,bytes,options){stored.push({key,bytes,options});}};

  assert.equal((await call('/api/sa/site-photos',undefined,2)).status,403);
  assert.equal((await call('/api/admin/site-photo-invitations',undefined,3)).status,403);
  assert.equal((await call('/api/sa/site-photo-invitations',{admin_ids:[2,99]},1)).status,400);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM site_photo_requests').get().count,0);

  const invited=await call('/api/sa/site-photo-invitations',{admin_ids:[2]},1);
  assert.equal(invited.status,200);
  assert.equal((await invited.json()).invited,1);
  assert.match(db.prepare('SELECT content FROM notifications WHERE user_id=2 ORDER BY id DESC').get().content,/照片征集/);

  const invitation=(await (await call('/api/admin/site-photo-invitations',undefined,2)).json())[0];
  assert.equal(invitation.status,'invited');
  assert.equal((await call(`/api/admin/site-photo-invitations/${invitation.id}/respond`,{response:'accepted'},3)).status,403);
  assert.equal((await call(`/api/admin/site-photo-invitations/${invitation.id}/respond`,{response:'accepted'},2)).status,200);

  const form=new FormData();
  form.set('image',new Blob([new Uint8Array([0xff,0xd8,0xff,0xd9])],{type:'image/jpeg'}),'camera.jpg');
  form.set('credit','测试摄影者');
  form.set('show_home','1');
  form.set('show_login','0');
  form.set('show_register','1');
  form.set('license_confirmed','1');
  const upload=await worker.fetch(new Request(`https://test.invalid/api/admin/site-photo-requests/${invitation.id}/submit`,{
    method:'POST',headers:{Cookie:`bpm_session=${'2'.repeat(64)}`},body:form
  }),env);
  assert.equal(upload.status,200,await upload.clone().text());
  assert.equal(stored.length,1);
  assert.match(stored[0].key,/^tickets\/[a-f0-9-]+\.jpg$/);
  assert.equal(db.prepare('SELECT status FROM site_photo_requests WHERE id=?').get(invitation.id).status,'pending_review');

  const deniedReview=await call(`/api/sa/site-photo-requests/${invitation.id}/decision`,{decision:'approved',show_home:true,weekday:1},2);
  assert.equal(deniedReview.status,403);
  const collision=await call(`/api/sa/site-photo-requests/${invitation.id}/decision`,{decision:'approved',show_home:true,show_login:false,show_register:true,weekday:1},1);
  assert.equal(collision.status,409);
  const mondayPhoto=db.prepare('SELECT id FROM site_cover_photos WHERE sort_order=1').get();
  const disabled=await call(`/api/sa/site-photos/${mondayPhoto.id}`,{credit:'旧照片',weekday:1,show_home:false,show_login:false,show_register:false,active:false},1);
  assert.equal(disabled.status,200);
  const approved=await call(`/api/sa/site-photo-requests/${invitation.id}/decision`,{decision:'approved',show_home:true,show_login:false,show_register:true,weekday:1},1);
  assert.equal(approved.status,200);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM site_cover_photos WHERE credit=?').get('测试摄影者').count,1);
  let managed=(await (await call('/api/sa/site-photos',undefined,1)).json()).photos;
  let submitted=managed.find(photo=>photo.credit==='测试摄影者');
  assert.equal(submitted.weekday,1);
  assert.equal(submitted.show_home,true);
  assert.equal(submitted.show_login,false);

  const saved=await call(`/api/sa/site-photos/${submitted.id}`,{credit:'更新署名',show_home:true,show_login:true,show_register:false,weekday:1,active:true},1);
  assert.equal(saved.status,200);
  managed=(await (await call('/api/sa/site-photos',undefined,1)).json()).photos;
  submitted=managed.find(photo=>photo.credit==='更新署名');
  assert.equal(submitted.weekday,1);
  assert.equal(submitted.show_login,true);
  assert.equal(db.prepare('SELECT status FROM site_photo_requests WHERE id=?').get(invitation.id).status,'approved');
});

test('photo submission requires explicit rights consent and an accepted invitation',async()=>{
  const {worker,env,db}=fixture();
  db.prepare("INSERT INTO site_photo_requests(admin_id,invited_by,status) VALUES(2,1,'invited')").run();
  env.IMAGES={async put(){assert.fail('image must not upload without accepted invitation');}};
  const form=new FormData();
  form.set('image',new Blob([new Uint8Array([0xff,0xd8,0xff,0xd9])],{type:'image/jpeg'}),'camera.jpg');
  form.set('credit','Test photographer');
  form.set('show_home','1');
  form.set('license_confirmed','0');
  const response=await worker.fetch(new Request('https://test.invalid/api/admin/site-photo-requests/1/submit',{
    method:'POST',headers:{Cookie:`bpm_session=${'2'.repeat(64)}`},body:form
  }),env);
  assert.equal(response.status,400);
  assert.equal(db.prepare('SELECT status FROM site_photo_requests WHERE id=1').get().status,'invited');
  form.set('license_confirmed','1');
  const notAccepted=await worker.fetch(new Request('https://test.invalid/api/admin/site-photo-requests/1/submit',{
    method:'POST',headers:{Cookie:`bpm_session=${'2'.repeat(64)}`},body:form
  }),env);
  assert.equal(notAccepted.status,409);
  assert.equal(db.prepare('SELECT status FROM site_photo_requests WHERE id=1').get().status,'invited');
});
