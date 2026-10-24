import { isSA, reply } from './security.mjs';

const categories = new Set(['页面打不开','按钮没有反应','投稿或图片处理','登录与账户','内容显示错误','其他']);
const clean = (value, max) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export async function errorReportsRoute(request, env, url, user) {
  const path = url.pathname;
  if (path === '/api/error-reports' && request.method === 'POST') {
    if (!user?.id) return reply({ error: '请先登录后再提交问题反馈' }, 401);
    const body = await request.json().catch(() => ({}));
    const category = clean(body.category, 30);
    if (!categories.has(category)) return reply({ error: '请选择问题类型' }, 400);
    const code = clean(body.code, 80).replace(/[^\w.:-]/g, '');
    const message = clean(body.message, 300);
    const page = clean(body.page, 180).split('?')[0].split('#')[0];
    const recent = await env.DB.prepare("SELECT COUNT(*) AS count FROM error_reports WHERE user_id=? AND created_at>=datetime('now','-1 day')").bind(user.id).first();
    if (Number(recent?.count || 0) >= 10) return reply({ error: '每天最多提交 10 条问题反馈，请稍后再试' }, 429);
    const result = await env.DB.prepare('INSERT INTO error_reports(user_id,category,code,message,page) VALUES(?,?,?,?,?)').bind(user.id, category, code, message, page).run();
    return reply({ success: true, id: Number(result.meta?.last_row_id || 0) });
  }
  if (path === '/api/sa/error-reports' && request.method === 'GET') {
    if (!isSA(user)) return reply({ error: '无权查看问题反馈' }, 403);
    const status = ['open','resolved','ignored'].includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'open';
    const rows = await env.DB.prepare(`SELECT r.id,r.category,r.code,r.message,r.page,r.status,r.created_at,u.username FROM error_reports r JOIN users u ON u.id=r.user_id WHERE r.status=? ORDER BY r.created_at DESC LIMIT 200`).bind(status).all();
    return reply(rows.results || []);
  }
  const match = path.match(/^\/api\/sa\/error-reports\/(\d+)\/status$/);
  if (match && request.method === 'POST') {
    if (!isSA(user)) return reply({ error: '无权处理问题反馈' }, 403);
    const body = await request.json().catch(() => ({}));
    if (!['resolved','ignored','open'].includes(body.status)) return reply({ error: '处理状态无效' }, 400);
    const result = await env.DB.prepare('UPDATE error_reports SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?').bind(body.status,user.id,Number(match[1])).run();
    return result.meta.changes ? reply({ success: true }) : reply({ error: '反馈不存在' }, 404);
  }
  return null;
}
