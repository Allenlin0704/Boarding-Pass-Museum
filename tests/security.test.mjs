import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';
import {passwordHash} from '../worker/security.mjs';
test('authentication: unauthenticated and forged identities are refused',async()=>{
  const {call,worker,env,db}=fixture();
  for(const path of ['/api/admin/pending?admin_id=1','/api/sa/users?sa_id=1','/api/my-flights?user_id=3']) assert.equal((await worker.fetch(new Request('https://test.invalid'+path),env)).status,401);
  assert.equal((await call('/api/admin/approve',{admin_id:1,flight_id:10},3)).status,403);
  assert.equal((await call('/api/my/restore',{user_id:3,flight_id:11},2)).status,403);
  db.prepare("UPDATE auth_sessions SET expires_at=datetime('now','-1 day') WHERE user_id=3").run();
  assert.equal((await call('/api/my/restore',{user_id:3,flight_id:11},3)).status,401);
});
test('personal data export requires a session and excludes credentials',async()=>{
  const {call,worker,env,db}=fixture();
  db.prepare("UPDATE users SET password='secret-hash',bio='Aviation fan' WHERE id=3").run();
  db.prepare("INSERT INTO flights(id,user_id,status,story) VALUES(99,3,'approved','My flight')").run();
  assert.equal((await worker.fetch(new Request('https://test.invalid/api/account/export'),env)).status,401);
  const res=await call('/api/account/export',null,3);
  assert.equal(res.status,200);
  const exported=await res.json();
  assert.equal(exported.profile.bio,'Aviation fan');
  assert.ok(exported.submissions.some(flight=>flight.id===99));
  assert.equal(JSON.stringify(exported).includes('secret-hash'),false);
});
test('login issues HttpOnly cookie; logout revokes it',async()=>{
  const {worker,env,db}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=3').run(await passwordHash('testing-password'));
  const login=await worker.fetch(new Request('https://test.invalid/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'u@example.test',password:'testing-password'})}),env);
  assert.equal(login.status,200);const cookie=login.headers.get('Set-Cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);
  const profile=await worker.fetch(new Request('https://test.invalid/api/session',{headers:{Cookie:cookie}}),env);assert.equal(profile.status,200);
  await worker.fetch(new Request('https://test.invalid/api/logout',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'}),env);
  assert.equal((await worker.fetch(new Request('https://test.invalid/api/session',{headers:{Cookie:cookie}}),env)).status,401);
});
test('administrator sessions can only be created and used through the dedicated host',async()=>{
  const {worker,env,db}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=2').run(await passwordHash('admin-test-password'));
  const mainLogin=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://bpmuseum.org.cn'},body:JSON.stringify({email:'a@example.test',password:'admin-test-password'})}),env);
  assert.equal(mainLogin.status,403);
  const staffLogin=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://admin.bpmuseum.org.cn'},body:JSON.stringify({email:'a@example.test',password:'admin-test-password'})}),env);
  assert.equal(staffLogin.status,200);assert.equal((await staffLogin.json()).admin_context,true);
  const publicSessionCookie=`bpm_session=${'3'.repeat(64)}`;
  const publicSession=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/session',{headers:{Cookie:publicSessionCookie}}),env);
  assert.equal((await publicSession.json()).admin_context,false);
  const staffRead=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/admin/pending',{headers:{Cookie:`bpm_session=${'2'.repeat(64)}`}}),env);
  assert.equal(staffRead.status,200);
  db.prepare("UPDATE auth_sessions SET auth_context='public' WHERE user_id=2").run();
  const oldSessionRead=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/admin/pending',{headers:{Cookie:`bpm_session=${'2'.repeat(64)}`}}),env);
  assert.equal(oldSessionRead.status,403);
  db.prepare("UPDATE auth_sessions SET auth_context='public' WHERE user_id=1").run();
  const oldStaffChat=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/staff-chat',{headers:{Cookie:`bpm_session=${'1'.repeat(64)}`}}),env);
  assert.equal(oldStaffChat.status,403);
  const oldSaSecurity=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/sa-security/status',{headers:{Cookie:`bpm_session=${'1'.repeat(64)}`}}),env);
  assert.equal(oldSaSecurity.status,403);
  const preflight=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/admin/pending',{method:'OPTIONS',headers:{Origin:'https://admin.bpmuseum.org.cn','Access-Control-Request-Method':'GET'}}),env);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://admin.bpmuseum.org.cn');
});
test('staff can set a personal PIN with their password and log in only from the admin host',async()=>{
  const {worker,env,db}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=2').run(await passwordHash('admin-test-password'));
  const setup=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/account/admin-pin/setup',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://admin.bpmuseum.org.cn'},body:JSON.stringify({email:'a@example.test',password:'admin-test-password',pin:'246810',admin_role:'administrator'})}),env);
  assert.equal(setup.status,200);
  const login=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/account/admin-pin/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://admin.bpmuseum.org.cn'},body:JSON.stringify({email:'a@example.test',pin:'246810',admin_role:'administrator'})}),env);
  assert.equal(login.status,200);assert.equal((await login.json()).admin_context,true);
  assert.match(login.headers.get('Set-Cookie'),/HttpOnly/);
  const publicLogin=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/account/admin-pin/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://bpmuseum.org.cn'},body:JSON.stringify({email:'a@example.test',pin:'246810'})}),env);
  assert.equal(publicLogin.status,403);
  const mismatch=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/account/admin-pin/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://admin.bpmuseum.org.cn'},body:JSON.stringify({email:'a@example.test',pin:'246810',admin_role:'superadministrator'})}),env);
  assert.equal(mismatch.status,403);
});
test('cross-site write and form content type are blocked',async()=>{
  const {worker,env}=fixture();
  for(const headers of [{'Content-Type':'application/json',Origin:'https://evil.example'},{'Content-Type':'text/plain'}]) {
    const res=await worker.fetch(new Request('https://test.invalid/api/my/restore',{method:'POST',headers,body:'{}'}),env);assert.ok([403,415].includes(res.status));
  }
  const preflight=await worker.fetch(new Request('https://test.invalid/api/community/posts/10',{method:'OPTIONS',headers:{Origin:'https://bpmuseum.org.cn'}}),env);
  assert.equal(preflight.headers.get('Access-Control-Allow-Credentials'),'true');assert.match(preflight.headers.get('Access-Control-Allow-Methods'),/DELETE/);
});
test('exposed-hash accounts must reset; codes expire and cannot be reused',async()=>{
  const {call,db}=fixture();const {createHash}=await import('node:crypto');
  db.prepare('UPDATE users SET password=?,must_reset_password=1 WHERE id=3').run(await passwordHash('old-test-password'));
  assert.equal((await call('/api/login',{email:'u@example.test',password:'old-test-password'},0)).status,403);
  const codeHash=createHash('sha256').update('test-code').digest('hex');
  db.prepare("INSERT INTO auth_codes VALUES('u@example.test','reset',?,NULL,datetime('now','-1 minute'))").run(codeHash);
  const reset={email:'u@example.test',code:'test-code',password:'new-test-password'};
  assert.equal((await call('/api/account/reset-password',reset,0)).status,400);
  db.exec("UPDATE auth_codes SET expires_at=datetime('now','+10 minutes')");
  assert.equal((await call('/api/account/reset-password',reset,0)).status,200);
  assert.equal(db.prepare('SELECT must_reset_password FROM users WHERE id=3').get().must_reset_password,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM auth_sessions WHERE user_id=3').get().n,0);
  assert.equal((await call('/api/account/reset-password',reset,0)).status,400);
});
