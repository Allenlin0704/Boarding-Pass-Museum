import {generateRegistrationOptions,generateAuthenticationOptions,verifyRegistrationResponse,verifyAuthenticationResponse} from '@simplewebauthn/server';
import {passwordMatches,randomHex,reply,sessionTokenHash} from './security.mjs';
const origin='https://bpmuseum.org.cn',rpID='bpmuseum.org.cn';
const bytesToB64=value=>btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64ToBytes=value=>Uint8Array.from(atob(String(value).replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-String(value).length%4)%4)),c=>c.charCodeAt(0));
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const cookie=(request,name)=>request.headers.get('Cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([a-f0-9]{64})(?:;|$)`))?.[1];
const saveChallenge=(env,flow,kind,value)=>env.DB.prepare("INSERT INTO user_webauthn_challenges(flow_hash,kind,challenge,expires_at) VALUES(?,?,?,datetime('now','+5 minutes')) ON CONFLICT(flow_hash,kind) DO UPDATE SET challenge=excluded.challenge,expires_at=excluded.expires_at").bind(flow,kind,value).run();
const consume=(env,flow,kind)=>env.DB.prepare("DELETE FROM user_webauthn_challenges WHERE flow_hash=? AND kind=? AND expires_at>datetime('now') RETURNING challenge").bind(flow,kind).first();
export async function userPasskeyRoute(request,env,url,user){
  if(!url.pathname.startsWith('/api/passkey/'))return null;
  const path=url.pathname,body=request.method==='POST'?await request.json():{};
  if(path==='/api/passkey/register/options'){
    if(!user)return reply({error:'请重新登录'},401);if(!await passwordMatches(body.password,user.password))return reply({error:'当前密码错误'},403);
    const flow=await sessionTokenHash(request),keys=(await env.DB.prepare('SELECT * FROM user_passkeys WHERE user_id=?').bind(user.id).all()).results;
    const options=await generateRegistrationOptions({rpName:'BoardingPassMuseum',rpID,userName:user.email,userID:new TextEncoder().encode(String(user.id)),userDisplayName:user.username,attestationType:'none',excludeCredentials:keys.map(k=>({id:k.credential_id,transports:JSON.parse(k.transports)})),authenticatorSelection:{residentKey:'required',userVerification:'required'}});
    await saveChallenge(env,flow,'register',options.challenge);return reply(options);
  }
  if(path==='/api/passkey/register/verify'){
    if(!user)return reply({error:'请重新登录'},401);const saved=await consume(env,await sessionTokenHash(request),'register');if(!saved)return reply({error:'登记请求已过期，请重新开始'},400);
    try{const verified=await verifyRegistrationResponse({response:body.credential,expectedChallenge:saved.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true});if(!verified.verified||!verified.registrationInfo)return reply({error:'Passkey 登记未通过'},400);const c=verified.registrationInfo.credential;await env.DB.prepare('INSERT INTO user_passkeys(credential_id,user_id,public_key,counter,transports) VALUES(?,?,?,?,?)').bind(c.id,user.id,bytesToB64(c.publicKey),Number(c.counter),JSON.stringify(c.transports||[])).run();return reply({success:true});}catch{return reply({error:'Passkey 登记未通过'},400);}
  }
  if(path==='/api/passkey/login/options'){
    const token=randomHex(32),flow=await hash(token),options=await generateAuthenticationOptions({rpID,userVerification:'required'});await saveChallenge(env,flow,'login',options.challenge);const res=reply(options);res.headers.set('Set-Cookie',`bpm_passkey_flow=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=300`);return res;
  }
  if(path==='/api/passkey/login/verify'){
    const token=cookie(request,'bpm_passkey_flow');if(!token)return reply({error:'Passkey 登录请求已过期'},400);const saved=await consume(env,await hash(token),'login'),key=body.credential?.id&&await env.DB.prepare('SELECT * FROM user_passkeys WHERE credential_id=?').bind(body.credential.id).first();if(!saved||!key)return reply({error:'Passkey 登录请求已过期，请重试'},400);
    try{const verified=await verifyAuthenticationResponse({response:body.credential,expectedChallenge:saved.challenge,expectedOrigin:origin,expectedRPID:rpID,credential:{id:key.credential_id,publicKey:b64ToBytes(key.public_key),counter:Number(key.counter),transports:JSON.parse(key.transports)},requireUserVerification:true});if(!verified.verified)return reply({error:'Passkey 验证未通过'},403);const account=await env.DB.prepare('SELECT * FROM users WHERE id=? AND deleted_at IS NULL').bind(key.user_id).first();if(!account)return reply({error:'账户不可用'},403);const session=randomHex(32);await env.DB.batch([env.DB.prepare('UPDATE user_passkeys SET counter=?,last_used_at=CURRENT_TIMESTAMP WHERE credential_id=?').bind(Number(verified.authenticationInfo.newCounter),key.credential_id),env.DB.prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+7 days'))").bind(await hash(session),account.id)]);const res=reply({id:account.id,username:account.username,email:account.email,role:account.id===1&&account.role==='superadministrator'?'superadministrator':account.role});res.headers.set('Set-Cookie',`bpm_session=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);return res;}catch{return reply({error:'Passkey 验证未通过'},403);}
  }
  return reply({error:'请求不存在'},404);
}
