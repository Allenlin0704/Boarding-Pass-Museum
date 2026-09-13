import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('OAuth providers stay hidden until secrets are configured',async()=>{
  const {call}=fixture(),response=await call('/api/oauth/providers');
  assert.deepEqual(await response.json(),{apple:false,microsoft:false,github:false,linked:[]});
});

test('GitHub OAuth start uses PKCE and identity-only scopes',async()=>{
  const {worker,env,db}=fixture();env.GITHUB_CLIENT_ID='github-client';env.GITHUB_CLIENT_SECRET='github-secret';
  const response=await worker.fetch(new Request('https://test.invalid/api/oauth/github/start',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),env),data=await response.json(),authorize=new URL(data.url);
  assert.equal(response.status,200);assert.equal(authorize.origin,'https://github.com');assert.equal(authorize.searchParams.get('scope'),'read:user user:email');assert.equal(authorize.searchParams.get('code_challenge_method'),'S256');
  assert.equal(db.prepare('SELECT provider FROM oauth_authorizations').get().provider,'github');
});

test('Microsoft OAuth start stores one-time state with PKCE',async()=>{
  const {call,env,db}=fixture();env.MICROSOFT_CLIENT_ID='client';env.MICROSOFT_CLIENT_SECRET='secret';
  const response=await call('/api/oauth/microsoft/start',{mode:'link'},3),data=await response.json(),authorize=new URL(data.url);
  assert.equal(response.status,200);assert.equal(authorize.hostname,'login.microsoftonline.com');assert.equal(authorize.searchParams.get('code_challenge_method'),'S256');assert.equal(authorize.searchParams.get('nonce')?.length,48);
  const saved=db.prepare('SELECT provider,user_id,code_verifier,nonce FROM oauth_authorizations').get();
  assert.equal(saved.provider,'microsoft');assert.equal(saved.user_id,3);assert.equal(saved.code_verifier.length,96);
});

test('OAuth callback rejects unknown state before contacting provider',async()=>{
  const {worker,env}=fixture();env.MICROSOFT_CLIENT_ID='client';env.MICROSOFT_CLIENT_SECRET='secret';
  const response=await worker.fetch(new Request('https://test.invalid/api/oauth/microsoft/callback?state=bad&code=bad'),env);
  assert.equal(response.status,302);assert.match(response.headers.get('location'),/error=/);
});

test('Microsoft OAuth creates an account and session without trusting matching email',async()=>{
  const {env,worker,db}=fixture();env.MICROSOFT_CLIENT_ID='client';env.MICROSOFT_CLIENT_SECRET='secret';
  const start=await worker.fetch(new Request('https://test.invalid/api/oauth/microsoft/start',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),env),authorize=new URL((await start.json()).url),state=authorize.searchParams.get('state');
  const original=globalThis.fetch;globalThis.fetch=async url=>String(url).includes('/token')?Response.json({access_token:'access'}):Response.json({sub:'subject-1',email:'new@example.test',name:'New Flyer'});
  try{
    const response=await worker.fetch(new Request(`https://test.invalid/api/oauth/microsoft/callback?state=${state}&code=ok`),env);
    assert.equal(response.status,302);assert.match(response.headers.get('set-cookie'),/^bpm_session=/);
    assert.equal(db.prepare("SELECT username FROM users WHERE email='new@example.test'").get().username,'New Flyer');
    assert.equal(db.prepare("SELECT user_id FROM oauth_identities WHERE subject='subject-1'").get().user_id,6);
  }finally{globalThis.fetch=original;}
});
