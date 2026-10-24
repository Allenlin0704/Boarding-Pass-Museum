import {isSA,reply} from './security.mjs';

export async function userManagementRoute(request,env,url,user){
  if(!url.pathname.startsWith('/api/sa/user-management'))return null;
  if(!isSA(user))return reply({error:'No permission'},403);
  if(request.method==='GET'&&url.pathname==='/api/sa/user-management'){
    const query=String(url.searchParams.get('q')||'').trim().slice(0,80),pattern=`%${query.replace(/[\\%_]/g,'\\$&')}%`;
    if(!query)return reply({error:'请先输入昵称、邮箱或账户 ID'},400);
    const rows=await env.DB.prepare(`SELECT id,username,role,created_at,account_permanent_ban,account_banned_until,
      CASE WHEN account_permanent_ban=1 OR (account_banned_until IS NOT NULL AND account_banned_until>datetime('now')) THEN 1 ELSE 0 END AS banned
      ,(SELECT reason FROM user_ban_events e WHERE e.target_user_id=users.id AND e.action='ban' ORDER BY e.id DESC LIMIT 1) AS ban_reason
      FROM users WHERE deleted_at IS NULL AND id!=1
        AND (?='' OR username LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR CAST(id AS TEXT)=?)
      ORDER BY created_at DESC,id DESC LIMIT 50`).bind(query,pattern,pattern,query).all();
    return reply(rows.results||[]);
  }
  if(request.method!=='POST')return reply({error:'请求方式不支持'},405);
  const body=await request.json(),id=Number(body.user_id);
  if(!Number.isSafeInteger(id)||id<=0||id===1)return reply({error:'请选择有效用户，站主账号不能封禁'},400);
  const target=await env.DB.prepare('SELECT id,role,account_permanent_ban,account_banned_until FROM users WHERE id=? AND deleted_at IS NULL').bind(id).first();
  if(!target)return reply({error:'用户不存在'},404);
  if(target.role!=='user')return reply({error:'此处只管理普通用户；管理员权限请在管理员管理中处理'},409);
  if(url.pathname==='/api/sa/user-management/ban'){
    const reason=String(body.reason||'').trim(),permanent=body.permanent===true,days=Number(body.days);
    if(reason.length<5||reason.length>500)return reply({error:'请填写 5–500 个字的封禁理由'},400);
    if(!permanent&&(!Number.isInteger(days)||days<1||days>365))return reply({error:'临时封禁时长须为 1–365 天'},400);
    const active=Number(target.account_permanent_ban)===1||(target.account_banned_until&&Date.parse(`${String(target.account_banned_until).replace(' ','T')}Z`)>Date.now());
    if(active)return reply({error:'该账户目前已处于封禁状态'},409);
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET account_permanent_ban=?,account_banned_until=CASE WHEN ?=1 THEN NULL ELSE datetime('now','+'||?||' days') END WHERE id=? AND role='user' AND id!=1").bind(permanent?1:0,permanent?1:0,permanent?0:days,id),
      env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(id),
      env.DB.prepare("UPDATE account_deletion_requests SET status='cancelled',resolved_at=CURRENT_TIMESTAMP,decision_note='账户封禁期间取消注销申请' WHERE user_id=? AND status IN ('pending','approved') AND finalized_at IS NULL").bind(id),
      env.DB.prepare("INSERT INTO user_ban_events(target_user_id,actor_user_id,action,reason,permanent,banned_until) SELECT id,?,'ban',?,?,account_banned_until FROM users WHERE id=?").bind(user.id,reason,permanent?1:0,id)
    ]);
    return reply({success:true,banned:true,permanent,days:permanent?null:days});
  }
  if(url.pathname==='/api/sa/user-management/unban'){
    const active=Number(target.account_permanent_ban)===1||(target.account_banned_until&&Date.parse(`${String(target.account_banned_until).replace(' ','T')}Z`)>Date.now());
    if(!active)return reply({error:'该账户目前没有有效封禁'},409);
    const reason=String(body.reason||'站主解除封禁').trim().slice(0,500);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET account_permanent_ban=0,account_banned_until=NULL WHERE id=? AND id!=1').bind(id),
      env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(id),
      env.DB.prepare("INSERT INTO user_ban_events(target_user_id,actor_user_id,action,reason,permanent,banned_until) VALUES(?,?,'unban',?,0,NULL)").bind(id,user.id,reason)
    ]);
    return reply({success:true,banned:false});
  }
  return reply({error:'请求不存在'},404);
}
