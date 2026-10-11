import {test} from 'node:test';import assert from 'node:assert/strict';import {fixture} from './helpers.mjs';import {passwordHash} from '../worker/security.mjs';
test('user passkey registration needs a session and current password',async()=>{const {call,worker,env,db}=fixture();db.prepare('UPDATE users SET password=? WHERE id=3').run(await passwordHash('current-password'));assert.equal((await worker.fetch(new Request('https://test.invalid/api/passkey/register/options',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),env)).status,401);assert.equal((await call('/api/passkey/register/options',{user_id:3,password:'wrong'},3)).status,403);const res=await call('/api/passkey/register/options',{user_id:3,password:'current-password'},3);assert.equal(res.status,200);assert.ok((await res.json()).challenge);});

test('admin login passkeys can be managed only from the admin origin',async()=>{
  const {worker,env,db}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=2').run(await passwordHash('admin-password'));
  const request=(id,origin)=>worker.fetch(new Request('https://api.bpmuseum.org.cn/api/passkey/register/options',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,Cookie:`bpm_session=${String(id).repeat(64)}`},body:JSON.stringify({password:'admin-password'})}),env);
  assert.equal((await request(2,'https://admin.bpmuseum.org.cn')).status,200);
  assert.equal((await request(2,'https://bpmuseum.org.cn')).status,403);
  assert.equal((await request(3,'https://admin.bpmuseum.org.cn')).status,403);
});
