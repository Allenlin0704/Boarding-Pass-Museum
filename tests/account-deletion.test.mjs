import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';
import {passwordHash} from '../worker/security.mjs';

test('account deletion requests need the current password, have a 48-hour cancellation window, and keep user content',async()=>{
  const {call,db}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=3').run(await passwordHash('current-password'));
  assert.equal((await call('/api/account/deletion-request',{user_id:3,password:'wrong',reason:'Please remove my account'},3)).status,403);
  assert.equal((await call('/api/account/deletion-request',{user_id:3,password:'current-password',reason:'Please remove my account'},3)).status,200);
  const current=await (await call('/api/account/deletion-request',null,3)).json();
  assert.equal(current.request.status,'pending');
  assert.ok(current.request.execute_at);
  assert.equal((await call('/api/account/deletion-request/cancel',{user_id:3},3)).status,200);
  assert.equal(db.prepare('SELECT status FROM account_deletion_requests WHERE user_id=3').get().status,'cancelled');
  assert.ok(db.prepare('SELECT * FROM users WHERE id=3').get());
  assert.ok(db.prepare('SELECT * FROM flights WHERE user_id=3').get());
});

test('scheduled deletion anonymizes account data but preserves exhibits',async()=>{
  const {worker,env,db}=fixture();
  db.prepare("INSERT INTO account_deletion_requests(user_id,reason,status,execute_at) VALUES(3,'request','pending',datetime('now','-1 minute'))").run();
  await worker.scheduled({},env);
  const deleted=db.prepare('SELECT * FROM users WHERE id=3').get();
  assert.equal(deleted.username,'账号已注销');assert.ok(deleted.deleted_at);assert.equal(deleted.bio,null);
  assert.ok(db.prepare('SELECT * FROM flights WHERE user_id=3').get());
  assert.ok(db.prepare('SELECT finalized_at FROM account_deletion_requests WHERE user_id=3').get().finalized_at);
});
