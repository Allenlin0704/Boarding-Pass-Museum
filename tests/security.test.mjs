import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers.mjs';
import {passwordHash,turnstileAction} from '../worker/security.mjs';
test('Turnstile protects abuse and review endpoints while routine authenticated actions stay immediate',()=>{
  for(const path of ['/api/login','/api/register','/api/submit','/api/upload-image','/api/flight-assist/recognize','/api/admin/approve','/api/sa/community/moderate','/api/account/admin-request'])assert.ok(turnstileAction(path),`${path} should require Turnstile`);
  for(const path of ['/api/my/withdraw','/api/my/restore','/api/sa/admin-recruitment','/api/sa/admin-social','/api/account/profile','/api/community/like'])assert.equal(turnstileAction(path),null,`${path} should not show a Turnstile challenge`);
});
test('admin recruitment advertises eligibility only to ordinary user accounts',async()=>{
  const {call}=fixture();
  assert.deepEqual(await (await call('/api/admin-recruitment',null,3)).json(),{open:true,eligible:true});
  assert.deepEqual(await (await call('/api/admin-recruitment',null,2)).json(),{open:true,eligible:false});
});
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
test('login is rate limited by source IP across account names',async()=>{
  const {worker,env}=fixture();
  const attempt=(index)=>worker.fetch(new Request('https://api.bpmuseum.org.cn/api/login',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'198.51.100.27'},body:JSON.stringify({email:`missing-${index}@example.test`,password:'bad-password'})}),env);
  for(let i=0;i<30;i++) assert.equal((await attempt(i)).status,401);
  assert.equal((await attempt(30)).status,429);
});
test('API responses carry transport and anti-embedding headers',async()=>{
  const {worker,env}=fixture();
  const response=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/session'),env);
  assert.equal(response.headers.get('Strict-Transport-Security'),'max-age=31536000');
  assert.equal(response.headers.get('X-Frame-Options'),'DENY');
  assert.equal(response.headers.get('Content-Security-Policy'),"frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
  assert.match(response.headers.get('X-BPM-Request-Id'),/^[0-9a-f-]{36}$/i);
  assert.equal(response.headers.get('Access-Control-Expose-Headers'),'X-BPM-Request-Id');
});
test('Workers observability persists custom errors without request invocation logs or traces',()=>{
  const config=readFileSync(new URL('../wrangler.toml',import.meta.url),'utf8');
  assert.match(config,/\[observability\]\s+enabled\s*=\s*true/);
  assert.match(config,/\[observability\.logs\][\s\S]*?enabled\s*=\s*true[\s\S]*?invocation_logs\s*=\s*false[\s\S]*?persist\s*=\s*true/);
  assert.match(config,/\[observability\.traces\]\s+enabled\s*=\s*false/);
});
test('administrators can use the public site as ordinary users while management endpoints remain isolated',async()=>{
  const {worker,env,db}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=2').run(await passwordHash('admin-test-password'));
  const mainLogin=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://bpmuseum.org.cn'},body:JSON.stringify({email:'a@example.test',password:'admin-test-password'})}),env);
  assert.equal(mainLogin.status,200);
  const publicLogin=await mainLogin.json();
  assert.equal(publicLogin.role,'user');assert.equal(publicLogin.admin_context,false);
  const publicToken=mainLogin.headers.get('Set-Cookie').match(/bpm_session=([a-f0-9]{64})/)[1];
  const publicSession=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/session',{headers:{Cookie:`bpm_session=${publicToken}`}}),env);
  assert.deepEqual(await publicSession.json(),{id:2,username:'Admin',email:'a@example.test',role:'user',admin_context:false});
  const staffLogin=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://admin.bpmuseum.org.cn'},body:JSON.stringify({email:'a@example.test',password:'admin-test-password'})}),env);
  assert.equal(staffLogin.status,200);assert.equal((await staffLogin.json()).admin_context,true);
  const publicSessionCookie=`bpm_session=${'3'.repeat(64)}`;
  const ordinarySession=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/session',{headers:{Cookie:publicSessionCookie}}),env);
  assert.equal((await ordinarySession.json()).admin_context,false);
  const staffRead=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/admin/pending',{headers:{Cookie:`bpm_session=${'2'.repeat(64)}`}}),env);
  assert.equal(staffRead.status,200);
  db.prepare("UPDATE auth_sessions SET auth_context='public' WHERE user_id=2").run();
  const oldSessionRead=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/admin/pending',{headers:{Cookie:`bpm_session=${'2'.repeat(64)}`}}),env);
  assert.equal(oldSessionRead.status,403);
  const isolatedRead=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/admin/pending',{headers:{Cookie:`bpm_session=${publicToken}`}}),env);
  assert.equal(isolatedRead.status,403);
  db.prepare("UPDATE auth_sessions SET auth_context='public' WHERE user_id=1").run();
  const oldStaffChat=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/staff-chat',{headers:{Cookie:`bpm_session=${'1'.repeat(64)}`}}),env);
  assert.equal(oldStaffChat.status,403);
  const oldSaSecurity=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/sa-security/status',{headers:{Cookie:`bpm_session=${'1'.repeat(64)}`}}),env);
  assert.equal(oldSaSecurity.status,403);
  const preflight=await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/admin/pending',{method:'OPTIONS',headers:{Origin:'https://admin.bpmuseum.org.cn','Access-Control-Request-Method':'GET'}}),env);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://admin.bpmuseum.org.cn');
});
test('dedicated login identity list reveals only active staff nicknames and roles',async()=>{
  const {worker,env,db}=fixture();
  db.prepare("UPDATE users SET deleted_at=datetime('now') WHERE id=5").run();
  const request=(origin)=>worker.fetch(new Request('https://api.bpmuseum.org.cn/api/admin/identities',{headers:{Origin:origin}}),env);
  assert.equal((await request('https://bpmuseum.org.cn')).status,403);
  const response=await request('https://admin.bpmuseum.org.cn');
  assert.equal(response.status,200);
  const body=await response.json();
  assert.deepEqual(body.identities,[{id:1,username:'SA',role:'superadministrator'},{id:2,username:'Admin',role:'administrator'}]);
  assert.equal(JSON.stringify(body).includes('@'),false);
  db.prepare("UPDATE users SET role='user' WHERE id=2").run();
  const refreshed=await request('https://admin.bpmuseum.org.cn');
  assert.deepEqual((await refreshed.json()).identities,[{id:1,username:'SA',role:'superadministrator'}]);
});
test('admin dropdown account IDs are resolved and authorized by the server',async()=>{
  const {worker,env,db}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=1').run(await passwordHash('sa-test-password'));
  db.prepare('UPDATE users SET password=? WHERE id=2').run(await passwordHash('admin-test-password'));
  db.prepare('UPDATE users SET password=? WHERE id=3').run(await passwordHash('user-test-password'));
  const login=async(account_id,password)=>worker.fetch(new Request('https://api.bpmuseum.org.cn/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://admin.bpmuseum.org.cn'},body:JSON.stringify({account_id,password})}),env);
  const sa=await login(1,'sa-test-password');
  assert.equal(sa.status,200);assert.equal((await sa.json()).role,'superadministrator');
  const admin=await login(2,'admin-test-password');
  assert.equal(admin.status,200);assert.equal((await admin.json()).role,'administrator');
  assert.equal((await login(3,'user-test-password')).status,403);
  assert.equal((await login(999,'not-a-password')).status,401);
  assert.equal((await worker.fetch(new Request('https://api.bpmuseum.org.cn/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://bpmuseum.org.cn'},body:JSON.stringify({account_id:2,password:'admin-test-password'})}),env)).status,403);
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
test('admin PIN setup and login accept the selected internal account ID',async()=>{
  const {worker,env,db}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=2').run(await passwordHash('admin-test-password'));
  const request=(path,body)=>worker.fetch(new Request('https://api.bpmuseum.org.cn'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://admin.bpmuseum.org.cn'},body:JSON.stringify(body)}),env);
  assert.equal((await request('/api/account/admin-pin/setup',{account_id:2,password:'admin-test-password',pin:'135790'})).status,200);
  const login=await request('/api/account/admin-pin/login',{account_id:2,pin:'135790'});
  assert.equal(login.status,200);assert.equal((await login.json()).role,'administrator');
  assert.equal((await request('/api/account/admin-pin/login',{account_id:3,pin:'135790'})).status,401);
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
