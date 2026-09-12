const PUBLIC_WRITES = new Set(['/api/login','/api/register','/api/send-code','/api/account/reset/send-code','/api/account/reset-password','/wechat']);
const sha = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const randomHex = bytes => Array.from(crypto.getRandomValues(new Uint8Array(bytes)),b=>b.toString(16).padStart(2,'0')).join('');
export const isSA = user => Number(user?.id)===1 && user.role==='superadministrator';
export const isAdmin = user => user?.role==='administrator' || isSA(user);
export const reply = (body,status=200) => Response.json(body,{status});
const turnstileAction=(path)=>{
  if(path==='/api/login')return 'login';
  if(path==='/api/send-code')return 'signup_code';
  if(path==='/api/register')return 'signup';
  if(path==='/api/account/reset/send-code')return 'reset_code';
  if(path==='/api/account/reset-password')return 'reset';
  if(path==='/api/submit'||path==='/api/upload-image'||path==='/api/community/posts')return 'submission';
  if(path.startsWith('/api/my/'))return 'exhibit_status';
  if(path.startsWith('/api/sa'))return 'sa_console';
  if(path.startsWith('/api/admin/'))return 'admin_review';
  return 'profile_edit';
};
export async function verifyTurnstile(request,env,url) {
  if(url.pathname==='/wechat')return null;
  if(['GET','HEAD','OPTIONS'].includes(request.method)||url.pathname==='/api/logout')return null;
  // This binding only exists in the isolated in-memory test fixture.
  if(env.TURNSTILE_TEST_BYPASS===true)return null;
  const action=turnstileAction(url.pathname);
  const type=request.headers.get('Content-Type')||'';
  let token;
  try {
    if(type.includes('application/json')) token=(await request.clone().json()).turnstile_token;
    else if(type.includes('multipart/form-data')) token=(await request.clone().formData()).get('turnstile_token');
  } catch { return reply({error:'验证请求格式错误'},400); }
  if(typeof token!=='string'||token.length<20||token.length>2048||!env.TURNSTILE_SECRET) return reply({error:'请完成人机验证后重试'},403);
  const allowed=new Set(String(env.TURNSTILE_HOSTNAMES||'').split(',').map(v=>v.trim()).filter(Boolean));
  if(!allowed.size)return reply({error:'验证服务配置错误'},503);
  let checked;
  try {
    const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},signal:AbortSignal.timeout(10000),
      body:new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token,remoteip:request.headers.get('CF-Connecting-IP')||''})
    });
    if(!res.ok)throw Error('siteverify');
    checked=await res.json();
  } catch { return reply({error:'人机验证暂不可用，请稍后重试'},403); }
  if(!checked?.success||checked.action!==action||!allowed.has(checked.hostname)) return reply({error:'人机验证未通过，请重试'},403);
  return null;
}
export async function passwordHash(password,salt=randomHex(16)) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},key,256);
  return `pbkdf2$${salt}$${Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('')}`;
}
export async function passwordMatches(password,stored) {
  if(typeof password!=='string' || typeof stored!=='string') return false;
  const actual=stored.startsWith('pbkdf2$')?await passwordHash(password,stored.split('$')[1]):await sha(password);
  if(actual.length!==stored.length) return false;
  let diff=0;for(let i=0;i<actual.length;i++) diff|=actual.charCodeAt(i)^stored.charCodeAt(i);
  return diff===0;
}
export async function sessionUser(request,env) {
  const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)bpm_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if(!token) return null;
  return env.DB.prepare(`SELECT users.* FROM auth_sessions JOIN users ON users.id=auth_sessions.user_id
    WHERE token_hash=? AND expires_at>datetime('now')`).bind(await sha(token)).first();
}
export async function sessionTokenHash(request) {
  const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)bpm_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  return token?sha(token):null;
}
async function limited(env,key,max,seconds) {
  const bucket=Math.floor(Date.now()/1000/seconds)*seconds;
  const row=await env.DB.prepare(`INSERT INTO auth_limits(key,bucket,count) VALUES(?,?,1)
    ON CONFLICT(key,bucket) DO UPDATE SET count=count+1 RETURNING count`).bind(await sha(key),bucket).first();
  return row.count>max;
}
export async function authenticate(request,env,url) {
  const user=await sessionUser(request,env);
  const protectedRead=url.pathname.startsWith('/api/sa/') || url.pathname.startsWith('/api/admin/') || ['/api/my-flights','/api/favorites','/api/account/export'].includes(url.pathname);
  const write=!['GET','HEAD','OPTIONS'].includes(request.method);
  if((protectedRead || (write&&!PUBLIC_WRITES.has(url.pathname)))&&!user) return {response:reply({error:'请重新登录',success:false},401)};
  if(url.pathname.startsWith('/api/sa/')&&!isSA(user)) return {response:reply({error:'No permission'},403)};
  if(url.pathname.startsWith('/api/admin/')&&!isAdmin(user)) return {response:reply({error:'No permission'},403)};
  if((user?.permanent_ban || (user?.banned_until && new Date(user.banned_until+'Z').getTime()>Date.now())) && (write||protectedRead) && !['/api/logout','/api/community/moderation-appeal',...PUBLIC_WRITES].includes(url.pathname)) return {response:reply({error:'账号已被封禁'},403)};
  if(write && user && !PUBLIC_WRITES.has(url.pathname) && await limited(env,`write:${user.id}:${url.pathname}`,url.pathname==='/api/upload-image'?10:60,60))return {response:reply({error:'操作过于频繁，请稍后再试'},429)};
  if(user?.must_reset_password && (write||protectedRead) && !PUBLIC_WRITES.has(url.pathname) && url.pathname!=='/api/logout') return {response:reply({error:'请先通过邮箱重设密码'},403)};
  if(protectedRead) {
    const actor=url.pathname.startsWith('/api/sa/')?'sa_id':url.pathname.startsWith('/api/admin/')?'admin_id':'user_id';
    if(url.searchParams.has(actor)&&Number(url.searchParams.get(actor))!==Number(user.id)) return {response:reply({error:'身份不匹配'},403)};
    url.searchParams.set(actor,user.id);
  }
  // Viewer identity must come exclusively from the session.
  url.searchParams.set('viewer_id',user?.id||'');
  if(write && !PUBLIC_WRITES.has(url.pathname) && request.headers.get('Content-Type')?.includes('application/json')) {
    let body;try{body=await request.json();}catch{return {response:reply({error:'JSON 格式错误'},400)};}
    if(!body || typeof body!=='object' || Array.isArray(body)) return {response:reply({error:'请求格式错误'},400)};
    const actor=url.pathname.startsWith('/api/sa/')?'sa_id':url.pathname.startsWith('/api/admin/')?'admin_id':'user_id';
    if(body[actor]!==undefined && Number(body[actor])!==Number(user.id)) return {response:reply({error:'身份不匹配'},403)};
    body[actor]=user.id;
    request=new Request(url,{method:request.method,headers:request.headers,body:JSON.stringify(body)});
  } else request=new Request(url,request);
  return {user,request};
}
export async function accountRoute(request,env,url,user,sendEmail) {
  const path=url.pathname;
  if(path==='/api/session'&&request.method==='GET') return user?reply({id:user.id,username:user.username,email:user.email,role:isSA(user)?'superadministrator':user.role==='administrator'?'administrator':'user'}):reply({error:'请重新登录'},401);
  if(path==='/api/account/export'&&request.method==='GET') {
    if(!user) return reply({error:'请重新登录'},401);
    const id=Number(user.id);
    const [profile,flights,favorites,appeals,posts,comments,likes,reports,actions,moderationAppeals,achievements,adjustments,notifications]=await Promise.all([
      env.DB.prepare('SELECT id,username,email,role,created_at,avatar,bio,social_media,equipment,favorite_airlines,favorite_airports FROM users WHERE id=?').bind(id).first(),
      env.DB.prepare('SELECT id,airline,flight,route,date,aircraft,airport,image,story,status,reject_reason,created_at FROM flights WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT flight_id,created_at FROM favorites WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT flight_id,reason,status,created_at FROM appeals WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT id,title,content,image,status,needs_review,deleted_at,created_at FROM community_posts WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT id,post_id,content,status,moderation_reason,needs_review,created_at FROM community_comments WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT post_id FROM community_likes WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT target_type,target_id,category,reason,status,resolution,created_at,resolved_at FROM community_reports WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT id,target_type,target_id,severity,reason,clause,created_at,revoked_at FROM moderation_actions WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT action_id,reason,status,decision,created_at,due_at FROM moderation_appeals WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT code,awarded_at FROM user_achievements WHERE user_id=? ORDER BY awarded_at').bind(id).all(),
      env.DB.prepare('SELECT amount,reason,created_at FROM level_adjustments WHERE user_id=? ORDER BY id').bind(id).all(),
      env.DB.prepare('SELECT content,created_at,read_at FROM notifications WHERE user_id=? ORDER BY id').bind(id).all()
    ]);
    return reply({
      exported_at:new Date().toISOString(),
      format:'BoardingPassMuseum personal data export v1',
      profile,
      submissions:flights.results,
      favorites:favorites.results,
      exhibit_appeals:appeals.results,
      community:{posts:posts.results,comments:comments.results,liked_post_ids:likes.results.map(row=>row.post_id),reports:reports.results},
      moderation:{actions:actions.results,appeals:moderationAppeals.results},
      progress:{achievements:achievements.results,level_adjustments:adjustments.results},
      notifications:notifications.results
    });
  }
  if(path==='/api/logout'&&request.method==='POST') {
    const token=request.headers.get('Cookie')?.match(/bpm_session=([a-f0-9]{64})/)?.[1];
    if(token) await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await sha(token)).run();
    const res=reply({success:true});res.headers.set('Set-Cookie','bpm_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');return res;
  }
  const paths=['/api/login','/api/register','/api/send-code','/api/account/reset/send-code','/api/account/reset-password','/api/account/change-email/send-code','/api/account/change-email','/api/account/change-username'];
  if(!paths.includes(path)||request.method!=='POST') return null;
  const body=await request.json();
  const email=String(body.new_email||body.email||'').trim().toLowerCase();
  const ip=request.headers.get('CF-Connecting-IP')||'local';
  if(await limited(env,`${path}:${ip}`,path.includes('send-code')?8:30,600)) return reply({error:'操作过于频繁，请稍后再试'},429);
  if(path==='/api/login') {
    if(await limited(env,`login:${email}`,15,900)) return reply({error:'登录尝试过多，请稍后再试'},429);
    const found=await env.DB.prepare('SELECT * FROM users WHERE lower(email)=?').bind(email).first();
    if(!found || !await passwordMatches(body.password,found.password)) return reply({error:'账号或密码错误'},401);
    if(found.must_reset_password)return reply({error:'账户安全升级：请通过邮箱重设一个新密码后再登录'},403);
    if(!found.password.startsWith('pbkdf2$')) await env.DB.prepare('UPDATE users SET password=? WHERE id=?').bind(await passwordHash(body.password),found.id).run();
    const token=randomHex(32);
    await env.DB.prepare("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+7 days'))").bind(await sha(token),found.id).run();
    const res=reply({id:found.id,username:found.username,email:found.email,role:isSA(found)?'superadministrator':found.role==='administrator'?'administrator':'user'});
    res.headers.set('Set-Cookie',`bpm_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);return res;
  }
  if(path==='/api/account/change-username') {
    if(!await passwordMatches(body.password,user.password)) return reply({error:'密码错误'},403);
    const name=String(body.new_username||'').trim();
    if(!name || name.length>40) return reply({error:'用户名须为1–40个字符'},400);
    await env.DB.prepare('UPDATE users SET username=? WHERE id=?').bind(name,user.id).run();return reply({success:true});
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254) return reply({error:'邮箱格式错误'},400);
  const purpose=path.includes('reset')?'reset':path.includes('change-email')?'email':'register';
  if(path.includes('send-code')) {
    if(await limited(env,`mail:${email}`,1,60)) return reply({error:'请稍后再获取验证码'},429);
    const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%900000+100000);
    await env.DB.prepare('DELETE FROM auth_codes WHERE email=? AND purpose=?').bind(email,purpose).run();
    await env.DB.prepare("INSERT INTO auth_codes(email,purpose,code_hash,user_id,expires_at) VALUES(?,?,?,?,datetime('now','+10 minutes'))").bind(email,purpose,await sha(code),user?.id||null).run();
    await sendEmail(env,email,code);return reply({success:true});
  }
  if(path==='/api/account/change-email'&&!await passwordMatches(body.password,user.password)) return reply({error:'密码错误'},403);
  if(purpose!=='email'&&(typeof body.password!=='string'||body.password.length<8||body.password.length>128)) return reply({error:'密码须为8–128个字符'},400);
  const existing=await env.DB.prepare('SELECT id,password,must_reset_password FROM users WHERE lower(email)=?').bind(email).first();
  if(purpose==='reset'&&existing?.must_reset_password&&await passwordMatches(body.password,existing.password))return reply({error:'请设置一个与旧密码不同的新密码'},400);
  if(purpose!=='reset'&&existing) return reply({error:'邮箱已被使用'},409);
  const name=String(body.username||'').trim();
  if(purpose==='register'&&(!name||name.length>40)) return reply({error:'用户名须为1–40个字符'},400);
  const verified=await env.DB.prepare(`DELETE FROM auth_codes WHERE email=? AND purpose=? AND code_hash=? AND expires_at>datetime('now')
    AND (purpose!='email' OR user_id=?) RETURNING email`).bind(email,purpose,await sha(String(body.code||'')),user?.id||null).first();
  if(!verified) return reply({error:'验证码错误或已过期'},400);
  if(purpose==='register') await env.DB.prepare("INSERT INTO users(username,email,password,role) VALUES(?,?,?,'user')").bind(name,email,await passwordHash(body.password)).run();
  if(purpose==='reset'&&existing) await env.DB.batch([
    env.DB.prepare('UPDATE users SET password=?,must_reset_password=0 WHERE id=?').bind(await passwordHash(body.password),existing.id),
    env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(existing.id)
  ]);
  if(purpose==='email') await env.DB.prepare('UPDATE users SET email=? WHERE id=?').bind(email,user.id).run();
  return reply({success:true});
}
export function responseHeaders(request,response) {
  const headers=new Headers(response.headers);
  headers.delete('Access-Control-Allow-Origin');
  const origin=request.headers.get('Origin');
  if(origin && ['https://bpmuseum.org.cn','https://www.bpmuseum.org.cn','http://localhost:3000','http://127.0.0.1:3000'].includes(origin)) {
    headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Credentials','true');
  }
  headers.set('Vary','Origin');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');
  headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','no-referrer');headers.set('X-Frame-Options','DENY');
  headers.set('Permissions-Policy','geolocation=(), camera=(), microphone=()');
  return new Response(response.body,{status:response.status,headers});
}
export async function boundedRequest(request) {
  if(['GET','HEAD','OPTIONS'].includes(request.method)||!request.body) return request;
  const max=new URL(request.url).pathname==='/api/upload-image'?11*1024*1024:64*1024;
  const reader=request.body.getReader(),chunks=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw new RangeError('请求过大');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return new Request(request.url,{method:request.method,headers:request.headers,body:bytes});
}
export async function uploadImage(request,env) {
  const form=await request.formData(),file=form.get('image');
  if(!file || typeof file.arrayBuffer!=='function'||file.size>10*1024*1024) return reply({error:'请选择10 MB以内的图片'},400);
  const bytes=new Uint8Array(await file.arrayBuffer());
  const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
  const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
  const ext=png?'png':jpeg?'jpg':webp?'webp':null;
  if(!ext) return reply({error:'仅支持 PNG、JPEG、WebP 图片'},400);
  const key=`tickets/${crypto.randomUUID()}.${ext}`;
  await env.IMAGES.put(key,bytes,{httpMetadata:{contentType:ext==='jpg'?'image/jpeg':`image/${ext}`,contentDisposition:'inline'}});
  return reply({success:true,url:`https://images.bpmuseum.org.cn/${key}`});
}
