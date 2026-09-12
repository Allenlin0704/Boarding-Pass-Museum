import {generateRegistrationOptions,generateAuthenticationOptions,verifyRegistrationResponse,verifyAuthenticationResponse} from '@simplewebauthn/server';
import {isSA,passwordHash,passwordMatches,reply,sessionTokenHash} from './security.mjs';
const origin='https://bpmuseum.org.cn',rpID='bpmuseum.org.cn';
const bytesToB64=value=>btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64ToBytes=value=>Uint8Array.from(atob(String(value).replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-String(value).length%4)%4)),c=>c.charCodeAt(0));
const stepup=async(env,user,hash,method)=>{await env.DB.prepare("INSERT INTO sa_stepups(session_hash,user_id,verified_until,method) VALUES(?,?,datetime('now','+15 minutes'),?) ON CONFLICT(session_hash) DO UPDATE SET user_id=excluded.user_id,verified_until=excluded.verified_until,method=excluded.method").bind(hash,user.id,method).run();};
const challenge=async(env,hash,kind,value)=>env.DB.prepare("INSERT INTO sa_webauthn_challenges(session_hash,kind,challenge,expires_at) VALUES(?,?,?,datetime('now','+5 minutes')) ON CONFLICT(session_hash,kind) DO UPDATE SET challenge=excluded.challenge,expires_at=excluded.expires_at").bind(hash,kind,value).run();
const consume=async(env,hash,kind)=>env.DB.prepare("DELETE FROM sa_webauthn_challenges WHERE session_hash=? AND kind=? AND expires_at>datetime('now') RETURNING challenge").bind(hash,kind).first();
const credentials=async(env,user)=> (await env.DB.prepare('SELECT * FROM sa_passkeys WHERE user_id=?').bind(user.id).all()).results;
export async function requireSAStepup(request,env,user,url){
  if(env.SA_SECURITY_TEST_BYPASS===true||!isSA(user)||!['POST','PUT','PATCH','DELETE'].includes(request.method)||url.pathname.startsWith('/api/sa-security/'))return null;
  if(!url.pathname.startsWith('/api/sa/')&&!url.pathname.startsWith('/api/admin/'))return null;
  const hash=await sessionTokenHash(request);if(!hash)return reply({error:'请重新登录'},401);
  const active=await env.DB.prepare("SELECT 1 FROM sa_stepups WHERE session_hash=? AND user_id=? AND verified_until>datetime('now')").bind(hash,user.id).first();
  return active?null:reply({error:'SA 敏感操作需要 Passkey 或备用 PIN 验证',code:'sa_stepup_required'},428);
}
export async function saSecurityRoute(request,env,url,user){
  if(!url.pathname.startsWith('/api/sa-security/'))return null;
  if(!isSA(user))return reply({error:'No permission'},403);
  const hash=await sessionTokenHash(request);if(!hash)return reply({error:'请重新登录'},401);
  if(url.pathname==='/api/sa-security/status'&&request.method==='GET'){
    const [pin,keys,active]=await Promise.all([env.DB.prepare('SELECT 1 FROM sa_pins WHERE user_id=?').bind(user.id).first(),credentials(env,user),env.DB.prepare("SELECT verified_until,method FROM sa_stepups WHERE session_hash=? AND verified_until>datetime('now')").bind(hash).first()]);
    return reply({pin_configured:!!pin,passkeys:keys.map(k=>({id:k.credential_id,created_at:k.created_at,last_used_at:k.last_used_at})),elevated_until:active?.verified_until||null,method:active?.method||null});
  }
  if(request.method!=='POST')return reply({error:'请求方法不支持'},405);
  const body=await request.json();
  if(url.pathname==='/api/sa-security/pin/setup'){
    if(!/^\d{6}$/.test(String(body.pin||'')))return reply({error:'PIN 必须为 6 位数字'},400);
    if(!await passwordMatches(body.password,user.password))return reply({error:'账户密码错误'},403);
    await env.DB.prepare("INSERT INTO sa_pins(user_id,pin_hash,failed_attempts,locked_until,updated_at) VALUES(?,?,0,NULL,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET pin_hash=excluded.pin_hash,failed_attempts=0,locked_until=NULL,updated_at=CURRENT_TIMESTAMP").bind(user.id,await passwordHash(body.pin)).run();
    return reply({success:true});
  }
  if(url.pathname==='/api/sa-security/pin/verify'){
    const pin=await env.DB.prepare('SELECT * FROM sa_pins WHERE user_id=?').bind(user.id).first();
    if(!pin)return reply({error:'请先设置备用 PIN'},400);
    if(pin.locked_until&&new Date(pin.locked_until+'Z')>new Date())return reply({error:'PIN 已暂时锁定，请稍后重试'},429);
    if(!/^\d{6}$/.test(String(body.pin||''))||!await passwordMatches(body.pin,pin.pin_hash)){
      const attempts=Number(pin.failed_attempts)+1,locked=attempts>=5?"datetime('now','+15 minutes')":'NULL';
      await env.DB.prepare(`UPDATE sa_pins SET failed_attempts=?,locked_until=${locked} WHERE user_id=?`).bind(attempts>=5?0:attempts,user.id).run();
      return reply({error:'PIN 错误'},403);
    }
    await env.DB.prepare('UPDATE sa_pins SET failed_attempts=0,locked_until=NULL WHERE user_id=?').bind(user.id).run();await stepup(env,user,hash,'pin');return reply({success:true});
  }
  if(url.pathname==='/api/sa-security/passkey/register/options'){
    if(!await passwordMatches(body.password,user.password))return reply({error:'账户密码错误'},403);
    const keys=await credentials(env,user);const options=await generateRegistrationOptions({rpName:'BoardingPassMuseum SA',rpID,userName:user.email,userID:new TextEncoder().encode(String(user.id)),userDisplayName:user.username,attestationType:'none',excludeCredentials:keys.map(k=>({id:k.credential_id,transports:JSON.parse(k.transports)})),authenticatorSelection:{residentKey:'preferred',userVerification:'required'}});
    await challenge(env,hash,'register',options.challenge);return reply(options);
  }
  if(url.pathname==='/api/sa-security/passkey/register/verify'){
    const saved=await consume(env,hash,'register');if(!saved)return reply({error:'登记请求已过期，请重新开始'},400);
    try{const verified=await verifyRegistrationResponse({response:body.credential,expectedChallenge:saved.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true});if(!verified.verified||!verified.registrationInfo)return reply({error:'Passkey 登记未通过'},400);const c=verified.registrationInfo.credential;await env.DB.prepare("INSERT INTO sa_passkeys(credential_id,user_id,public_key,counter,transports) VALUES(?,?,?,?,?)").bind(c.id,user.id,bytesToB64(c.publicKey),Number(c.counter),JSON.stringify(c.transports||[])).run();await stepup(env,user,hash,'passkey');return reply({success:true});}catch{return reply({error:'Passkey 登记未通过'},400);}
  }
  if(url.pathname==='/api/sa-security/passkey/auth/options'){
    const keys=await credentials(env,user);if(!keys.length)return reply({error:'尚未登记 Passkey'},400);const options=await generateAuthenticationOptions({rpID,allowCredentials:keys.map(k=>({id:k.credential_id,transports:JSON.parse(k.transports)})),userVerification:'required'});await challenge(env,hash,'auth',options.challenge);return reply(options);
  }
  if(url.pathname==='/api/sa-security/passkey/auth/verify'){
    const saved=await consume(env,hash,'auth'),key=body.credential?.id&&await env.DB.prepare('SELECT * FROM sa_passkeys WHERE credential_id=? AND user_id=?').bind(body.credential.id,user.id).first();if(!saved||!key)return reply({error:'Passkey 验证已过期，请重试'},400);
    try{const verified=await verifyAuthenticationResponse({response:body.credential,expectedChallenge:saved.challenge,expectedOrigin:origin,expectedRPID:rpID,credential:{id:key.credential_id,publicKey:b64ToBytes(key.public_key),counter:Number(key.counter),transports:JSON.parse(key.transports)},requireUserVerification:true});if(!verified.verified)return reply({error:'Passkey 验证未通过'},403);await env.DB.prepare('UPDATE sa_passkeys SET counter=?,last_used_at=CURRENT_TIMESTAMP WHERE credential_id=?').bind(Number(verified.authenticationInfo.newCounter),key.credential_id).run();await stepup(env,user,hash,'passkey');return reply({success:true});}catch{return reply({error:'Passkey 验证未通过'},403);}
  }
  return reply({error:'请求不存在'},404);
}
