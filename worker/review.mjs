import { isSA, isAdmin, reply } from './security.mjs';
export async function reviewRoute(request,env,url,user) {
  const path=url.pathname;
  if(request.method==='GET'&&/^\/api\/flight\/\d+$/.test(path)) {
    const flight=await env.DB.prepare('SELECT flights.*,users.username FROM flights LEFT JOIN users ON users.id=flights.user_id WHERE flights.id=?').bind(Number(path.split('/').pop())).first();
    if(!flight || (flight.status!=='approved' && !isSA(user) && Number(user?.id)!==Number(flight.user_id) && !(isAdmin(user)&&Number(flight.reviewer_id)===Number(user.id)))) return reply({error:'展品不存在'},404);
    return reply(flight);
  }
  if(request.method!=='POST') return null;
  if(path==='/api/submit') {
    const body=await request.clone().json();
    for(const key of ['airline','flight','airport','date','image']) if(typeof body[key]!=='string'||!body[key].trim())return reply({error:'请完整填写航司、航班、机场、日期并上传图片'},400);
    if(body.airline.length>200||body.flight.length>30||body.airport.length>200||String(body.story||'').length>5000||!/^https:\/\/images\.bpmuseum\.org\.cn\/tickets\/[a-zA-Z0-9.-]+$/.test(body.image)||!/^\d{4}-\d{2}-\d{2}$/.test(body.date)||!Number.isFinite(Date.parse(body.date)))return reply({error:'投稿格式无效'},400);
  }

  const reviewPaths=['/api/admin/approve','/api/admin/reject','/api/sa/approve','/api/sa/reject'];
  if(reviewPaths.includes(path)) {
    if(!isAdmin(user)) return reply({error:'No permission'},403);
    const body=await request.json(); const id=Number(body.flight_id);
    const flight=await env.DB.prepare('SELECT * FROM flights WHERE id=?').bind(id).first();
    if(!flight) return reply({error:'展品不存在'},404);
    if(!isSA(user)&&(flight.status!=='screening'||Number(flight.reviewer_id)!==Number(user.id))) return reply({error:'只能审核分配给自己的待审展品'},403);
    const status=path.endsWith('/approve')?'approved':'rejected';
    const reason=String(body.reason||'').trim();
    if(status==='rejected'&&(!/^【(投稿基本要求|隐私守护规范|审核流程)】.+/s.test(reason)||reason.length>2000)) return reply({error:'拒绝展品必须填写条例条款及原因'},400);
    // Conditional write and audit insert share one transaction; duplicate or stale actions do not count.
    const updates=[env.DB.prepare(`UPDATE flights SET status=?,reject_reason=?,reviewer_id=? WHERE id=? AND status=? AND reviewer_id IS ?`).bind(status,status==='rejected'?reason:null,user.id,id,flight.status,flight.reviewer_id),
      env.DB.prepare(`INSERT INTO flight_reviews(flight_id,user_id,reviewer_id,previous_status,status,reason)
      SELECT ?,?,?,?,?,? WHERE changes()>0 AND ?!=?`).bind(id,flight.user_id,user.id,flight.status,status,reason,flight.status,status)];
    if(status==='approved') updates.push(env.DB.prepare(`INSERT OR IGNORE INTO flight_approvals(flight_id,user_id,approved_at,submitted_at,airline,airport,flight_date)
      SELECT id,user_id,datetime('now'),created_at,airline,airport,date FROM flights WHERE id=? AND status='approved'`).bind(id));
    const results=await env.DB.batch(updates);
    if(!results[0].meta.changes) return reply({error:'展品状态已变化，请刷新后重试'},409);
    return reply({success:true});
  }
  if(path==='/api/my/withdraw') {
    const body=await request.json();
    const result=await env.DB.prepare("UPDATE flights SET status='hidden' WHERE id=? AND user_id=? AND status!='hidden'").bind(Number(body.flight_id),user.id).run();
    return result.meta.changes?reply({success:true}):reply({error:'展品不存在、不属于你或已下架'},409);
  }
  if(path==='/api/account/admin-request') {
    const body=await request.json(); const reason=String(body.reason||'').trim(),social=String(body.social||'').trim();
    if(!reason||!social||reason.length>2000||social.length>300) return reply({error:'请填写申请理由和社交账号（理由不超过2000字）'},400);
    if(user.role!=='user') return reply({error:'你已是管理员'},409);
    const pending=await env.DB.prepare("SELECT id FROM admin_requests WHERE user_id=? AND status='pending'").bind(user.id).first();
    if(pending) return reply({error:'已有待处理申请'},409);
    await env.DB.prepare('INSERT INTO admin_requests(user_id,reason,social) VALUES(?,?,?)').bind(user.id,reason,social).run();return reply({success:true});
  }
  if(path==='/api/sa/admin-request/approve'||path==='/api/sa/admin-request/reject') {
    const body=await request.json();
    const application=await env.DB.prepare("SELECT * FROM admin_requests WHERE id=? AND status='pending'").bind(Number(body.request_id)).first();
    if(!application) return reply({error:'申请不存在或已处理'},409);
    if(Number(application.user_id)===1) return reply({error:'不能通过申请修改站主身份'},403);
    if(body.user_id!==undefined&&Number(body.user_id)!==Number(application.user_id)) return reply({error:'申请人不匹配'},400);
    const approved=path.endsWith('/approve');
    const statements=[env.DB.prepare("UPDATE admin_requests SET status=? WHERE id=? AND status='pending'").bind(approved?'approved':'rejected',application.id)];
    if(approved) statements.push(env.DB.prepare("UPDATE users SET role='administrator' WHERE id=? AND role='user' AND EXISTS(SELECT 1 FROM admin_requests WHERE id=? AND status='approved')").bind(application.user_id,application.id),env.DB.prepare('INSERT OR IGNORE INTO admin_memberships(user_id) VALUES(?)').bind(application.user_id));
    await env.DB.batch(statements);return reply({success:true});
  }
  if(path==='/api/admin/edit') {
    const body=await request.json();
    for(const field of ['airline','flight','airport','date','story','image']) if(body[field]!==undefined&&typeof body[field]!=='string')return reply({error:'字段格式错误'},400);
    const result=await env.DB.prepare(`UPDATE flights SET airline=?,flight=?,airport=?,date=?,story=?,image=? WHERE id=? AND (?=1 OR (reviewer_id=? AND status='screening'))`)
      .bind(body.airline||'',body.flight||'',body.airport||'',body.date||'',body.story||'',body.image||'',Number(body.flight_id),Number(isSA(user)),user.id).run();
    return result.meta.changes?reply({success:true}):reply({error:'只能修改分配给自己的待审展品'},403);
  }
  if(path==='/api/appeal') {
    const body=await request.json(); const reason=String(body.reason||'').trim();
    if(!reason||reason.length>2000) return reply({error:'请填写不超过2000字的申诉理由'},400);
    const flight=await env.DB.prepare("SELECT id FROM flights WHERE id=? AND user_id=? AND status='rejected'").bind(Number(body.flight_id),user.id).first();
    if(!flight) return reply({error:'只能申诉自己被拒绝的展品'},403);
    const prior=await env.DB.prepare('SELECT id FROM appeals WHERE flight_id=?').bind(flight.id).first();
    if(prior) return reply({error:'该展品已提交过申诉'},409);
    await env.DB.prepare('INSERT INTO appeals(user_id,flight_id,reason) VALUES(?,?,?)').bind(user.id,flight.id,reason).run();return reply({success:true});
  }
  if(path==='/api/sa/appeal/approve'||path==='/api/sa/appeal/reject') {
    const body=await request.json(); const appeal=await env.DB.prepare("SELECT * FROM appeals WHERE id=? AND status='pending'").bind(Number(body.appeal_id)).first();
    if(!appeal) return reply({error:'申诉不存在或已处理'},409);
    if(body.flight_id!==undefined&&Number(body.flight_id)!==Number(appeal.flight_id)) return reply({error:'展品不匹配'},400);
    const approve=path.endsWith('/approve');
    const statements=[env.DB.prepare("UPDATE appeals SET status=? WHERE id=? AND status='pending'").bind(approve?'approved':'rejected',appeal.id)];
    if(approve) statements.push(env.DB.prepare("UPDATE flights SET status='screening',reject_reason=NULL,reviewer_id=NULL WHERE id=? AND status='rejected'").bind(appeal.flight_id));
    await env.DB.batch(statements);return reply({success:true});
  }
  return null;
}
