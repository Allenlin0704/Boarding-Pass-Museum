import {passwordHash,randomHex,reply} from './security.mjs';

const SITE='https://bpmuseum.org.cn';
const API='https://api.bpmuseum.org.cn';
const enc=new TextEncoder();
const b64url=value=>{
  const bytes=value instanceof Uint8Array?value:new Uint8Array(value);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const decode=value=>Uint8Array.from(atob(String(value).replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-String(value).length%4)%4)),c=>c.charCodeAt(0));
const digest=async value=>new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)));
const hash=async value=>Array.from(await digest(value),b=>b.toString(16).padStart(2,'0')).join('');
const configured=(env,provider)=>provider==='microsoft'
  ?Boolean(env.MICROSOFT_CLIENT_ID&&env.MICROSOFT_CLIENT_SECRET)
  :provider==='github'?Boolean(env.GITHUB_CLIENT_ID&&env.GITHUB_CLIENT_SECRET)
  :Boolean(env.APPLE_CLIENT_ID&&env.APPLE_TEAM_ID&&env.APPLE_KEY_ID&&env.APPLE_PRIVATE_KEY);
const callback=provider=>`${API}/api/oauth/${provider}/callback`;
const formPost=(url,body)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},body:new URLSearchParams(body),signal:AbortSignal.timeout(12000)});
const safeName=(name,email,provider)=>String(name||email?.split('@')[0]||`${provider==='apple'?'Apple':provider==='github'?'GitHub':'Microsoft'} 用户`).trim().slice(0,40)||'新用户';
const resultRedirect=(error='')=>new Response(null,{status:302,headers:{Location:`${SITE}/oauth-complete.html${error?`?error=${encodeURIComponent(error)}`:''}`}});
const sessionResponse=async(env,user)=>{
  const token=randomHex(32);
  await env.DB.prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+7 days'))").bind(await hash(token),user.id).run();
  const response=resultRedirect();
  response.headers.set('Set-Cookie',`bpm_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
  return response;
};

async function appleClientSecret(env){
  const now=Math.floor(Date.now()/1000);
  const header=b64url(enc.encode(JSON.stringify({alg:'ES256',kid:env.APPLE_KEY_ID})));
  const payload=b64url(enc.encode(JSON.stringify({iss:env.APPLE_TEAM_ID,iat:now,exp:now+300,aud:'https://appleid.apple.com',sub:env.APPLE_CLIENT_ID})));
  const pem=String(env.APPLE_PRIVATE_KEY).replace(/\\n/g,'\n').replace(/-----[^-]+-----/g,'').replace(/\s/g,'');
  const key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,enc.encode(`${header}.${payload}`));
  return `${header}.${payload}.${b64url(signature)}`;
}

async function verifyAppleToken(token,env,expectedNonce){
  const parts=String(token||'').split('.');
  if(parts.length!==3)throw Error('Apple 身份凭据格式错误');
  const header=JSON.parse(new TextDecoder().decode(decode(parts[0]))),claims=JSON.parse(new TextDecoder().decode(decode(parts[1])));
  const keysResponse=await fetch('https://appleid.apple.com/auth/keys',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  if(!keysResponse.ok)throw Error('无法验证 Apple 身份');
  const jwk=(await keysResponse.json()).keys?.find(key=>key.kid===header.kid&&key.alg==='RS256');
  if(!jwk)throw Error('Apple 签名密钥无效');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),enc.encode(`${parts[0]}.${parts[1]}`));
  const now=Math.floor(Date.now()/1000),aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  if(!valid||claims.iss!=='https://appleid.apple.com'||!aud.includes(env.APPLE_CLIENT_ID)||Number(claims.exp)<=now||Number(claims.iat)>now+60||claims.nonce!==expectedNonce||!claims.sub)throw Error('Apple 身份验证未通过');
  return claims;
}

async function providerIdentity(provider,code,saved,env){
  if(provider==='github'){
    const response=await formPost('https://github.com/login/oauth/access_token',{client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code,redirect_uri:callback(provider),code_verifier:saved.code_verifier});
    const tokens=await response.json();
    if(!response.ok||!tokens.access_token)throw Error('GitHub 登录授权失败');
    const headers={Authorization:`Bearer ${tokens.access_token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'BoardingPassMuseum'};
    const [profileResponse,emailResponse]=await Promise.all([fetch('https://api.github.com/user',{headers,signal:AbortSignal.timeout(12000)}),fetch('https://api.github.com/user/emails',{headers,signal:AbortSignal.timeout(12000)})]);
    const profile=await profileResponse.json(),emails=await emailResponse.json();
    if(!profileResponse.ok||!emailResponse.ok||!profile.id||!Array.isArray(emails))throw Error('无法读取 GitHub 账户资料');
    const email=emails.find(item=>item.primary&&item.verified)?.email||emails.find(item=>item.verified)?.email||'';
    return {subject:String(profile.id),email:String(email).trim().toLowerCase(),name:profile.name||profile.login};
  }
  if(provider==='microsoft'){
    const response=await formPost('https://login.microsoftonline.com/common/oauth2/v2.0/token',{client_id:env.MICROSOFT_CLIENT_ID,client_secret:env.MICROSOFT_CLIENT_SECRET,code,redirect_uri:callback(provider),grant_type:'authorization_code',code_verifier:saved.code_verifier});
    const tokens=await response.json();
    if(!response.ok||!tokens.access_token)throw Error('Microsoft 登录授权失败');
    const infoResponse=await fetch('https://graph.microsoft.com/oidc/userinfo',{headers:{Authorization:`Bearer ${tokens.access_token}`,Accept:'application/json'},signal:AbortSignal.timeout(12000)});
    const info=await infoResponse.json();
    if(!infoResponse.ok||!info.sub)throw Error('无法读取 Microsoft 账户资料');
    return {subject:String(info.sub),email:String(info.email||info.preferred_username||'').trim().toLowerCase(),name:info.name};
  }
  const response=await formPost('https://appleid.apple.com/auth/token',{client_id:env.APPLE_CLIENT_ID,client_secret:await appleClientSecret(env),code,redirect_uri:callback(provider),grant_type:'authorization_code'});
  const tokens=await response.json();
  if(!response.ok||!tokens.id_token)throw Error('Apple 登录授权失败');
  const claims=await verifyAppleToken(tokens.id_token,env,saved.nonce);
  const verified=claims.email_verified===true||claims.email_verified==='true';
  return {subject:String(claims.sub),email:verified?String(claims.email||'').trim().toLowerCase():'',name:''};
}

async function finish(provider,body,env){
  const state=String(body.state||''),code=String(body.code||'');
  if(!state||!code)return resultRedirect(body.error?'登录授权已取消':'登录请求不完整');
  const saved=await env.DB.prepare("DELETE FROM oauth_authorizations WHERE state_hash=? AND provider=? AND expires_at>datetime('now') RETURNING code_verifier,nonce,user_id").bind(await hash(state),provider).first();
  if(!saved)return resultRedirect('登录请求已过期，请重新开始');
  try{
    const identity=await providerIdentity(provider,code,saved,env);
    let linked=await env.DB.prepare('SELECT u.* FROM oauth_identities o JOIN users u ON u.id=o.user_id WHERE o.provider=? AND o.subject=? AND u.deleted_at IS NULL').bind(provider,identity.subject).first();
    if(saved.user_id){
      const account=await env.DB.prepare('SELECT * FROM users WHERE id=? AND deleted_at IS NULL').bind(saved.user_id).first();
      if(!account)return resultRedirect('账户已失效，请重新登录');
      if(linked&&Number(linked.id)!==Number(account.id))return resultRedirect('这个第三方账户已绑定其他用户');
      const own=await env.DB.prepare('SELECT subject FROM oauth_identities WHERE user_id=? AND provider=?').bind(account.id,provider).first();
      if(own&&own.subject!==identity.subject)return resultRedirect(`请先解绑原有的 ${provider==='apple'?'Apple':provider==='github'?'GitHub':'Microsoft'} 账户`);
      await env.DB.prepare("INSERT INTO oauth_identities(user_id,provider,subject,email_at_link,last_used_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(provider,subject) DO UPDATE SET last_used_at=CURRENT_TIMESTAMP,email_at_link=excluded.email_at_link").bind(account.id,provider,identity.subject,identity.email||null).run();
      return sessionResponse(env,account);
    }
    if(linked){
      await env.DB.prepare('UPDATE oauth_identities SET last_used_at=CURRENT_TIMESTAMP WHERE provider=? AND subject=?').bind(provider,identity.subject).run();
      return sessionResponse(env,linked);
    }
    if(!identity.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email))return resultRedirect('第三方账户没有提供可验证邮箱，请改用邮箱登录');
    const existing=await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? AND deleted_at IS NULL').bind(identity.email).first();
    if(existing)return resultRedirect('该邮箱已有账户，请先用原方式登录，再到账户设置中绑定');
    const created=await env.DB.prepare("INSERT INTO users(username,email,password,role) VALUES(?,?,?,'user') RETURNING *").bind(safeName(identity.name,identity.email,provider),identity.email,await passwordHash(randomHex(32))).first();
    try{await env.DB.prepare("INSERT INTO oauth_identities(user_id,provider,subject,email_at_link,last_used_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)").bind(created.id,provider,identity.subject,identity.email).run();}
    catch(error){await env.DB.prepare('DELETE FROM users WHERE id=?').bind(created.id).run();throw error;}
    return sessionResponse(env,created);
  }catch(error){return resultRedirect(error?.message||'第三方登录暂不可用');}
}

export async function oauthRoute(request,env,url,user){
  if(!url.pathname.startsWith('/api/oauth/'))return null;
  if(url.pathname==='/api/oauth/providers'&&request.method==='GET'){
    const providers={apple:configured(env,'apple'),microsoft:configured(env,'microsoft'),github:configured(env,'github')};
    if(user){const rows=await env.DB.prepare('SELECT provider FROM oauth_identities WHERE user_id=?').bind(user.id).all();providers.linked=rows.results.map(row=>row.provider);}
    return reply(providers);
  }
  const match=url.pathname.match(/^\/api\/oauth\/(apple|microsoft|github)\/(start|callback)$/);
  if(!match)return reply({error:'请求不存在'},404);
  const [,provider,action]=match;
  if(action==='callback'){
    const body=provider==='apple'?Object.fromEntries(await request.formData()):Object.fromEntries(url.searchParams);
    return finish(provider,body,env);
  }
  if(request.method!=='POST')return reply({error:'请求方式不支持'},405);
  if(!configured(env,provider))return reply({error:'该登录方式尚未配置'},503);
  const startBody=await request.json();
  const linking=startBody.mode==='link';
  if(linking&&!user)return reply({error:'请重新登录后绑定'},401);
  const state=randomHex(32),verifier=randomHex(48),nonce=randomHex(24);
  await env.DB.prepare("DELETE FROM oauth_authorizations WHERE expires_at<=datetime('now')").run();
  await env.DB.prepare("INSERT INTO oauth_authorizations(state_hash,provider,code_verifier,nonce,user_id,expires_at) VALUES(?,?,?,?,?,datetime('now','+5 minutes'))").bind(await hash(state),provider,verifier,nonce,linking?user.id:null).run();
  let authorize;
  if(provider==='github'){
    authorize=new URL('https://github.com/login/oauth/authorize');
    Object.entries({client_id:env.GITHUB_CLIENT_ID,redirect_uri:callback(provider),scope:'read:user user:email',state,code_challenge:b64url(await digest(verifier)),code_challenge_method:'S256',prompt:'select_account'}).forEach(([key,value])=>authorize.searchParams.set(key,value));
  }else if(provider==='microsoft'){
    authorize=new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    Object.entries({client_id:env.MICROSOFT_CLIENT_ID,response_type:'code',redirect_uri:callback(provider),response_mode:'query',scope:'openid profile email',state,nonce,code_challenge:b64url(await digest(verifier)),code_challenge_method:'S256',prompt:'select_account'}).forEach(([key,value])=>authorize.searchParams.set(key,value));
  }else{
    authorize=new URL('https://appleid.apple.com/auth/authorize');
    Object.entries({client_id:env.APPLE_CLIENT_ID,response_type:'code',redirect_uri:callback(provider),response_mode:'form_post',scope:'name email',state,nonce}).forEach(([key,value])=>authorize.searchParams.set(key,value));
  }
  return reply({url:authorize.href});
}
