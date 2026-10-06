import { isAdmin, isSA, reply } from './security.mjs';

function safeSocialUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.length > 500) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

export async function staffRoute(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/public/staff' && method === 'GET') {
    const rows = await env.DB.prepare(`SELECT id,username,role,social_media FROM users
      WHERE deleted_at IS NULL AND (role='administrator' OR (id=1 AND role='superadministrator'))
      ORDER BY CASE WHEN id=1 THEN 0 ELSE 1 END,username,id`).all();
    return reply((rows.results || []).map(row => ({
      id: Number(row.id), username: row.username, role: row.role,
      social_url: safeSocialUrl(row.social_media) || null
    })));
  }

  if (path === '/api/sa/admin-social' && method === 'POST') {
    if (!isSA(user)) return reply({ error: 'No permission' }, 403);
    const body = await request.json();
    const targetId = Number(body.user_id);
    const socialUrl = safeSocialUrl(body.url);
    if (!Number.isSafeInteger(targetId) || targetId < 1 || socialUrl === null) return reply({ error: '请输入有效的 HTTPS 社交主页链接' }, 400);
    const target = await env.DB.prepare(`SELECT id FROM users WHERE id=? AND
      ((id=1 AND role='superadministrator') OR (id<>1 AND role='administrator'))`).bind(targetId).first();
    if (!target) return reply({ error: '只能修改站主或普通管理员的公开链接' }, 404);
    const updated = await env.DB.prepare(`UPDATE users SET social_media=? WHERE id=? AND
      ((id=1 AND role='superadministrator') OR (id<>1 AND role='administrator'))`).bind(socialUrl || null, targetId).run();
    return updated.meta.changes ? reply({ success: true }) : reply({ error: '管理员资料已变化，请刷新后重试' }, 409);
  }

  if (path === '/api/staff-chat' && ['GET', 'POST'].includes(method)) {
    if (!isAdmin(user)) return reply({ error: '仅管理员与 SA 可使用工作聊天' }, user ? 403 : 401);
    if (method === 'GET') {
      const rows = await env.DB.prepare(`SELECT m.id,m.user_id,m.message,m.created_at,u.username,u.role
        FROM staff_chat_messages m JOIN users u ON u.id=m.user_id
        WHERE u.role='administrator' OR (u.id=1 AND u.role='superadministrator')
        ORDER BY m.id DESC LIMIT 100`).all();
      return reply((rows.results || []).reverse().map(row => ({
        id: Number(row.id), user_id: Number(row.user_id), message: row.message,
        created_at: row.created_at, username: row.username, role: row.role
      })));
    }
    const body = await request.json();
    const message = String(body.message || '').trim();
    if (!message || message.length > 2000) return reply({ error: '消息需为 1 至 2000 字' }, 400);
    const inserted = await env.DB.prepare('INSERT INTO staff_chat_messages(user_id,message) VALUES(?,?) RETURNING id,created_at')
      .bind(user.id, message).first();
    return reply({ success: true, id: Number(inserted.id), created_at: inserted.created_at });
  }

  return null;
}
