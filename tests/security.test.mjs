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
