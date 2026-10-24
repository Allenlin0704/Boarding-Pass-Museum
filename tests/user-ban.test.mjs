import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';
import {passwordHash} from '../worker/security.mjs';

test('SA can ban users; ban revokes sessions, blocks login and cancels account deletion',async()=>{
  const {db,call,worker,env}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=3').run(await passwordHash('test-password'));
  db.prepare("INSERT INTO account_deletion_requests(user_id,reason,status,execute_at) VALUES(3,'old request','pending',datetime('now','-1 minute'))").run();
  assert.equal((await call('/api/sa/user-management?q=User',undefined,1)).status,200);
  assert.equal((await call('/api/sa/user-management/ban',{user_id:1,reason:'bad actor',days:7},1)).status,400);
  assert.equal((await call('/api/sa/user-management/ban',{user_id:2,reason:'bad actor',days:7},1)).status,409,'staff accounts stay in staff management');
  const banned=await call('/api/sa/user-management/ban',{user_id:3,reason:'confirmed abuse',days:14},1);
  assert.equal(banned.status,200);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM auth_sessions WHERE user_id=3').get().n,0);
  assert.equal(db.prepare('SELECT status FROM account_deletion_requests WHERE user_id=3').get().status,'cancelled');
  assert.equal(db.prepare('SELECT action,reason,banned_until FROM user_ban_events WHERE target_user_id=3').get().action,'ban');
  const login=await worker.fetch(new Request('https://test.invalid/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'u@example.test',password:'test-password'})}),env);
  assert.equal(login.status,403);assert.match((await login.json()).error,/已被封禁/);
  const oldSession=await worker.fetch(new Request('https://test.invalid/api/account/deletion-request',{headers:{Cookie:`bpm_session=${'3'.repeat(64)}`}}),env);
  assert.equal(oldSession.status,401);
  await worker.scheduled({},env);
  assert.equal(db.prepare('SELECT deleted_at FROM users WHERE id=3').get().deleted_at,null);
});

test('ordinary users cannot view or change SA user bans; SA can lift a ban',async()=>{
  const {db,call}=fixture();
  assert.equal((await call('/api/sa/user-management',undefined,3)).status,403);
  assert.equal((await call('/api/sa/user-management/ban',{user_id:3,reason:'confirmed abuse',days:7},3)).status,403);
  await call('/api/sa/user-management/ban',{user_id:3,reason:'confirmed abuse',permanent:true},1);
  assert.equal(db.prepare('SELECT account_permanent_ban FROM users WHERE id=3').get().account_permanent_ban,1);
  assert.equal((await call('/api/sa/user-management/unban',{user_id:3},1)).status,200);
  assert.equal(db.prepare('SELECT account_permanent_ban,account_banned_until FROM users WHERE id=3').get().account_permanent_ban,0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM user_ban_events WHERE target_user_id=3').get().n,2);
});

test('scheduled account deletion leaves an actively banned account intact',async()=>{
  const {db,worker,env}=fixture();
  db.prepare("INSERT INTO account_deletion_requests(user_id,reason,status,execute_at) VALUES(3,'old request','pending',datetime('now','-1 minute'))").run();
  db.prepare("UPDATE users SET account_permanent_ban=1 WHERE id=3").run();
  await worker.scheduled({},env);
  assert.equal(db.prepare('SELECT deleted_at FROM users WHERE id=3').get().deleted_at,null);
  assert.equal(db.prepare('SELECT finalized_at FROM account_deletion_requests WHERE user_id=3').get().finalized_at,null);
});
