import {progressFor} from './progress.mjs';
import {isSA,isAdmin,reply} from './security.mjs';
const categories=['涉黄涉政','虚假误导','侵犯隐私/版权','恶意灌水或骚扰'];
const validType=type=>['post','comment'].includes(type);
const tableFor=type=>type==='post'?'community_posts':'community_comments';
const future=date=>date&&new Date(date.replace(' ','T')+'Z').getTime()>Date.now();
export function workingDays(date,days) {
  const value=new Date(date);let left=days;
  while(left>0){value.setUTCDate(value.getUTCDate()+1);const weekday=new Date(value.getTime()+8*3600000).getUTCDay();if(weekday!==0&&weekday!==6)left--;}
  return value.toISOString();
}
export async function communityRoute(request,env,url,user) {
  const path=url.pathname,method=request.method;
  if(method==='GET' && ['/api/community/posts','/api/community/user-posts','/api/sa/community/posts'].includes(path)) {
    const owner=Number(url.searchParams.get('id')),sa=path.startsWith('/api/sa/');
    const personal=path.endsWith('/user-posts');
    if(personal&&!Number.isSafeInteger(owner)) return reply({error:'用户 ID 无效'},400);
    const filters=["p.deleted_at IS NULL"];
    if(!sa&&!(personal&&Number(user?.id)===owner)) filters.push("p.status='visible'");
    if(personal) filters.push('p.user_id=?');
    const statement=env.DB.prepare(`SELECT p.*,CASE WHEN u.deleted_at IS NOT NULL THEN '账号已注销' ELSE u.username END AS username,CASE WHEN u.deleted_at IS NOT NULL THEN NULL ELSE u.avatar END AS avatar,(SELECT COUNT(*) FROM community_likes WHERE post_id=p.id) AS like_count,
      (SELECT COUNT(*) FROM community_comments WHERE post_id=p.id AND status='visible') AS comment_count
      FROM community_posts p JOIN users u ON u.id=p.user_id WHERE ${filters.join(' AND ')} ORDER BY p.created_at DESC LIMIT 100`);
    const result=await (personal?statement.bind(owner):statement).all();
    return reply({success:true,posts:result.results});
  }
  if(method==='GET'&&/^\/api\/community\/posts\/\d+$/.test(path)) {
    const post=await env.DB.prepare("SELECT p.*,CASE WHEN u.deleted_at IS NOT NULL THEN '账号已注销' ELSE u.username END AS username FROM community_posts p JOIN users u ON u.id=p.user_id WHERE p.id=? AND p.deleted_at IS NULL").bind(Number(path.split('/').pop())).first();
    if(!post||(post.status!=='visible'&&!isSA(user)&&Number(user?.id)!==post.user_id)) return reply({error:'帖子不存在'},404);
    return reply({success:true,post});
  }
  if(path==='/api/community/comments'&&method==='GET') {
    const rows=await env.DB.prepare(`SELECT c.*,CASE WHEN u.deleted_at IS NOT NULL THEN '账号已注销' ELSE u.username END AS username,CASE WHEN u.deleted_at IS NOT NULL THEN NULL ELSE u.avatar END AS avatar FROM community_comments c JOIN users u ON u.id=c.user_id JOIN community_posts p ON p.id=c.post_id
      WHERE c.post_id=? AND c.status='visible' AND p.status='visible' AND p.deleted_at IS NULL ORDER BY c.created_at`).bind(Number(url.searchParams.get('post_id'))).all();
    return reply({success:true,comments:rows.results});
  }
  if(path==='/api/notifications'&&method==='GET') {
    if(!user)return reply({error:'请登录'},401);
    const rows=await env.DB.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100').bind(user.id).all();
    const actions=await env.DB.prepare('SELECT * FROM moderation_actions WHERE user_id=? ORDER BY id DESC LIMIT 100').bind(user.id).all();
    const appeals=await env.DB.prepare('SELECT * FROM moderation_appeals WHERE user_id=? ORDER BY id DESC LIMIT 100').bind(user.id).all();
    return reply({notifications:rows.results,actions:actions.results,appeals:appeals.results});
  }
  if(path==='/api/sa/community/reports'&&method==='GET') return reply({reports:(await env.DB.prepare("SELECT * FROM community_reports ORDER BY id DESC LIMIT 200").all()).results});
  if(path==='/api/sa/community/appeals'&&method==='GET') return reply({appeals:(await env.DB.prepare("SELECT * FROM moderation_appeals ORDER BY id DESC LIMIT 200").all()).results});
  if(!['POST','DELETE'].includes(method)) return null;
  const relevant=path.startsWith('/api/community/')||path.startsWith('/api/sa/community/')||path==='/api/admin/community/hide';
  if(!relevant) return null;
  const body=await request.json();
  if(path==='/api/community/posts'&&method==='POST') {
    if(future(user.posting_until)) return reply({error:'发帖权限暂停中'},403);
    const title=String(body.title||'').trim(),content=String(body.content||'').trim(),image=String(body.image||'');
    if(!title||!content||title.length>100||content.length>5000) return reply({error:'标题1–100字，正文1–5000字'},400);
    if(body.rules_version!=='2026-09-06') return reply({error:'请先阅读并同意社区条例'},400);
    if(image&&!/^https:\/\/images\.bpmuseum\.org\.cn\/tickets\/[a-zA-Z0-9.-]+$/.test(image)) return reply({error:'图片地址无效'},400);
    const duplicates=await env.DB.prepare("SELECT COUNT(*) AS n FROM community_posts WHERE user_id=? AND title=? AND content=? AND created_at>datetime('now','-10 minutes')").bind(user.id,title,content).first();
    const recent=await env.DB.prepare("SELECT COUNT(*) AS n FROM community_posts WHERE user_id=? AND created_at>datetime('now','-1 minute')").bind(user.id).first();
    if(duplicates.n>=2||recent.n>=3) return reply({error:'请勿重复刷帖，稍后再试'},429);
    const result=await env.DB.prepare('INSERT INTO community_posts(user_id,title,content,image) VALUES(?,?,?,?)').bind(user.id,title,content,image).run();return reply({success:true,id:result.meta.last_row_id});
  }
  if(method==='DELETE'&&/^\/api\/community\/posts\/\d+$/.test(path)) {
    const id=Number(path.split('/').pop());
    const result=await env.DB.prepare("UPDATE community_posts SET deleted_at=datetime('now'),status='hidden' WHERE id=? AND user_id=? AND deleted_at IS NULL").bind(id,user.id).run();
    return result.meta.changes?reply({success:true}):reply({error:'只能删除自己的帖子'},403);
  }
  if(path==='/api/community/comments'||path==='/api/community/like') {
    const id=Number(body.post_id);const parent=await env.DB.prepare("SELECT id FROM community_posts WHERE id=? AND status='visible' AND deleted_at IS NULL").bind(id).first();
    if(!parent)return reply({error:'帖子不存在或已下架'},404);
    if(path.endsWith('/comments')) {
      if(future(user.posting_until)) return reply({error:'发言权限暂停中'},403);
      const content=String(body.content||'').trim();if(!content||content.length>2000)return reply({error:'评论1–2000字'},400);
      const recent=await env.DB.prepare("SELECT COUNT(*) AS n FROM community_comments WHERE user_id=? AND created_at>datetime('now','-1 minute')").bind(user.id).first();
      if(recent.n>=5)return reply({error:'发言过于频繁'},429);
      await env.DB.prepare('INSERT INTO community_comments(post_id,user_id,content) VALUES(?,?,?)').bind(id,user.id,content).run();return reply({success:true});
    }
    const liked=await env.DB.prepare('SELECT id FROM community_likes WHERE post_id=? AND user_id=?').bind(id,user.id).first();
    if(liked) await env.DB.prepare('DELETE FROM community_likes WHERE post_id=? AND user_id=?').bind(id,user.id).run();
    else await env.DB.prepare('INSERT OR IGNORE INTO community_likes(post_id,user_id) VALUES(?,?)').bind(id,user.id).run();
    const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM community_likes WHERE post_id=?').bind(id).first();return reply({success:true,liked:!liked,likes:count.n,like_count:count.n});
  }
  if(path==='/api/community/report') {
    if(future(user.reporting_until))return reply({error:'举报权限暂停30天中'},403);
    const type=body.target_type,id=Number(body.target_id),reason=String(body.reason||'').trim();
    if(!validType(type)||!categories.includes(body.category)||!reason||reason.length>1000)return reply({error:'请选择举报分类并填写1–1000字理由'},400);
    const target=await env.DB.prepare(`SELECT id FROM ${tableFor(type)} WHERE id=? AND status='visible'`).bind(id).first();if(!target)return reply({error:'内容不存在'},404);
    const recent=await env.DB.prepare("SELECT COUNT(*) AS n FROM community_reports WHERE user_id=? AND created_at>datetime('now','-1 hour')").bind(user.id).first();
    if(recent.n>=20)return reply({error:'举报过于频繁'},429);
    const result=await env.DB.prepare('INSERT OR IGNORE INTO community_reports(user_id,target_type,target_id,category,reason) VALUES(?,?,?,?,?)').bind(user.id,type,id,body.category,reason).run();
    return result.meta.changes?reply({success:true}):reply({error:'该内容已有待处理举报'},409);
  }
  if(path==='/api/sa/community/reports/resolve') {
    const report=await env.DB.prepare("SELECT * FROM community_reports WHERE id=? AND status='pending'").bind(Number(body.report_id)).first();
    const decision=body.decision,reason=String(body.reason||'').trim();
    if(!report||!['upheld','dismissed','malicious'].includes(decision)||!reason)return reply({error:'请选择处理结果并说明依据'},400);
    const statements=[env.DB.prepare("UPDATE community_reports SET status=?,resolution=?,resolved_at=datetime('now') WHERE id=? AND status='pending'").bind(decision,reason,report.id)];
    if(decision==='malicious') statements.push(env.DB.prepare("UPDATE users SET malicious_reports=malicious_reports+1,reporting_until=CASE WHEN (malicious_reports+1)%3=0 THEN datetime('now','+30 days') ELSE reporting_until END WHERE id=? AND changes()>0").bind(report.user_id));
    statements.push(env.DB.prepare('INSERT INTO notifications(user_id,content) VALUES(?,?)').bind(report.user_id,`举报处理结果：${decision}。${reason}`));
    await env.DB.batch(statements);return reply({success:true});
  }
  if(path==='/api/admin/community/hide'||path==='/api/sa/community/posts/status'||path==='/api/sa/community/moderate') {
    if(!isAdmin(user))return reply({error:'No permission'},403);
    const temporary=path.startsWith('/api/admin/'),type=body.target_type||'post',id=Number(body.target_id||body.post_id),status=body.status||'hidden';
    const reason=String(body.reason||body.moderation_reason||'').trim(),clause=String(body.clause||'').trim(),severity=temporary?'temporary':body.severity||'moderate';
    if(!validType(type)||!['hidden','visible'].includes(status)||!['temporary','light','moderate','heavy','severe'].includes(severity))return reply({error:'处理参数无效'},400);
    if(status==='visible'&&!isSA(user))return reply({error:'恢复需由 SA 决定'},403);
    if(status==='hidden'&&(!reason||!clause||reason.length>2000||clause.length>200))return reply({error:'请填写下架原因和违反条款'},400);
    const table=tableFor(type),target=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first();
    if(!target||target.deleted_at)return reply({error:'内容不存在或已被作者删除'},404);
    if(Number(target.user_id)===1&&['heavy','severe'].includes(severity))return reply({error:'不能封禁站主'},403);
    if(status==='visible') {
      await env.DB.prepare(`UPDATE ${table} SET status='visible',moderation_reason=NULL ,needs_review=0 WHERE id=?`).bind(id).run();
      await env.DB.prepare('INSERT INTO notifications(user_id,content) VALUES(?,?)').bind(target.user_id,'你的社区内容已恢复展示。').run();return reply({success:true});
    }
    if(target.status==='hidden'&&!target.needs_review)return reply({error:'内容已处理，不能重复处罚'},409);
    const days=Number(body.days||7);if(severity==='heavy'&&(!Number.isInteger(days)||days<7||days>30))return reply({error:'封禁须为7–30天'},400);
    const affected=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(target.user_id).first();
    const oldProgress=await progressFor(env,affected);
    const previous=JSON.stringify({role:affected.role,achievements:oldProgress.achievements,status:target.status});
    const deduction=severity==='heavy'?Math.min(50,oldProgress.level_count):0;
    const statements=[];
    if(severity==='light') {
      const postId=type==='post'?id:target.post_id;
      statements.push(env.DB.prepare('INSERT INTO community_comments(post_id,user_id,content) VALUES(?,?,?)').bind(postId,user.id,`友善提醒：${reason}（${clause}）`));
    } else statements.push(env.DB.prepare(`UPDATE ${table} SET status='hidden',moderation_reason=?,needs_review=? WHERE id=?`).bind(`${clause}：${reason}`,severity==='temporary'?1:0,id));
    if(!temporary && severity!=='temporary') statements.push(env.DB.prepare("UPDATE moderation_actions SET revoked_at=datetime('now') WHERE target_type=? AND target_id=? AND severity='temporary' AND revoked_at IS NULL").bind(type,id));
    statements.push(env.DB.prepare('INSERT INTO moderation_actions(user_id,actor_id,target_type,target_id,severity,reason,clause,previous_state,penalty_days,deducted) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(target.user_id,user.id,type,id,severity,reason,clause,previous,severity==='heavy'?days:0,deduction));
    if(severity==='moderate') statements.push(env.DB.prepare("UPDATE users SET warning_count=warning_count+1,posting_until=CASE WHEN (warning_count+1)%3=0 THEN datetime('now','+7 days') ELSE posting_until END WHERE id=?").bind(target.user_id));
    if(severity==='heavy') statements.push(env.DB.prepare("UPDATE users SET banned_until=max(COALESCE(banned_until,''),datetime('now',?)) WHERE id=?").bind(`+${days} days`,target.user_id),env.DB.prepare('INSERT INTO level_adjustments(user_id,amount,reason) VALUES(?,?,?)').bind(target.user_id,-deduction,reason));
    if(severity==='severe') statements.push(env.DB.prepare("UPDATE users SET permanent_ban=1,role='user' WHERE id=? AND id!=1").bind(target.user_id),env.DB.prepare('DELETE FROM user_achievements WHERE user_id=?').bind(target.user_id));
    statements.push(env.DB.prepare('INSERT INTO notifications(user_id,content) VALUES(?,?)').bind(target.user_id,`社区处理：${severity}。${clause}：${reason}。如有异议，可在7个工作日内于通知页申诉或联系维护邮箱；SA 在14个工作日内复审。`));
    try { await env.DB.batch(statements); } catch(error) { if(String(error.message).includes('moderation_conflict'))return reply({error:'内容已被处理，请刷新后重试'},409);throw error; }
    await progressFor(env,await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(target.user_id).first());return reply({success:true});
  }
  if(path==='/api/community/moderation-appeal') {
    const action=await env.DB.prepare('SELECT * FROM moderation_actions WHERE id=? AND user_id=?').bind(Number(body.action_id),user.id).first();
    const reason=String(body.reason||'').trim();if(!action||!reason||reason.length>2000)return reply({error:'处理记录无效或申诉理由为空'},400);
    if(new Date()>new Date(workingDays(action.created_at.replace(' ','T')+'Z',7)))return reply({error:'已超过7个工作日申诉期，请联系维护邮箱'},400);
    const result=await env.DB.prepare('INSERT OR IGNORE INTO moderation_appeals(user_id,action_id,reason,due_at) VALUES(?,?,?,?)').bind(user.id,action.id,reason,workingDays(new Date(),14)).run();return result.meta.changes?reply({success:true}):reply({error:'已有待处理申诉'},409);
  }
  if(path==='/api/sa/community/appeals/resolve') {
    const decision=String(body.decision||'').trim();if(!decision||!['approved','rejected'].includes(body.status))return reply({error:'请填写最终裁定'},400);
    const appeal=await env.DB.prepare("SELECT * FROM moderation_appeals WHERE id=? AND status='pending'").bind(Number(body.appeal_id)).first();if(!appeal)return reply({error:'申诉不存在或已处理'},409);
    const action=await env.DB.prepare('SELECT * FROM moderation_actions WHERE id=?').bind(appeal.action_id).first();
    if(!action || action.revoked_at) return reply({error:'处理记录已撤销'},409);
    const statements=[env.DB.prepare("UPDATE moderation_appeals SET status=?,decision=? WHERE id=? AND status='pending'").bind(body.status,decision,appeal.id),env.DB.prepare('INSERT INTO notifications(user_id,content) VALUES(?,?)').bind(appeal.user_id,`社区申诉裁定：${decision}`)];
    if(body.status==='approved') {
      const previous=JSON.parse(action.previous_state||'{}');
      statements.push(env.DB.prepare("UPDATE moderation_actions SET revoked_at=datetime('now') WHERE id=?").bind(action.id));
      const targetTable=tableFor(action.target_type);
      statements.push(env.DB.prepare(`UPDATE ${targetTable} SET status='visible',moderation_reason=NULL,needs_review=0 WHERE id=? ${action.target_type==='post'?'AND deleted_at IS NULL':''}
        AND NOT EXISTS(SELECT 1 FROM moderation_actions WHERE target_type=? AND target_id=? AND revoked_at IS NULL AND severity!='light')`).bind(action.target_id,action.target_type,action.target_id));
      if(action.deducted>0) statements.push(env.DB.prepare('INSERT INTO level_adjustments(user_id,amount,reason) VALUES(?,?,?)').bind(action.user_id,action.deducted,`申诉撤销处理 #${action.id}`));
      if(action.severity==='severe') {
        statements.push(env.DB.prepare("UPDATE users SET role=? WHERE id=? AND NOT EXISTS(SELECT 1 FROM moderation_actions WHERE user_id=? AND severity='severe' AND revoked_at IS NULL)").bind(previous.role||'user',action.user_id,action.user_id));
        for(const award of previous.achievements||[]) statements.push(env.DB.prepare('INSERT OR IGNORE INTO user_achievements(user_id,code,awarded_at) VALUES(?,?,?)').bind(action.user_id,award.code,award.awarded_at));
      }
    }
    await env.DB.batch(statements);
    if(body.status==='approved') {
      const active=(await env.DB.prepare("SELECT * FROM moderation_actions WHERE user_id=? AND revoked_at IS NULL ORDER BY id").bind(action.user_id).all()).results;
      const warnings=active.filter(a=>a.severity==='moderate');
      const addDays=(date,days)=>new Date(new Date(date.replace(' ','T')+'Z').getTime()+days*86400000).toISOString().slice(0,19).replace('T',' ');
      const banned=active.filter(a=>a.severity==='heavy').map(a=>addDays(a.created_at,a.penalty_days)).sort().at(-1)||null;
      const posting=warnings.filter((a,i)=>(i+1)%3===0).map(a=>addDays(a.created_at,7)).sort().at(-1)||null;
      await env.DB.prepare('UPDATE users SET warning_count=?,posting_until=?,banned_until=?,permanent_ban=? WHERE id=?').bind(warnings.length,posting,banned,Number(active.some(a=>a.severity==='severe')),action.user_id).run();
      await progressFor(env,await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(action.user_id).first());
    }
    return reply({success:true});
  }
  return null;
}
