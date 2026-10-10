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

function cleanSocialLinks(value) {
  if (!Array.isArray(value) || value.length > 12) return null;
  const links = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const platform = String(item.platform || '').trim();
    const url = safeSocialUrl(item.url);
    if (!platform || platform.length > 40 || url === null || !url) return null;
    links.push({ platform, url });
  }
  return links;
}

function storedSocialLinks(raw, legacyUrl) {
  if (raw === null || raw === undefined) {
    const legacy = safeSocialUrl(legacyUrl);
    return legacy ? [{ platform: '社交主页', url: legacy }] : [];
  }
  try {
    const parsed = JSON.parse(raw || '[]');
    const links = cleanSocialLinks(parsed);
    if (links) return links;
  } catch { /* Fall through to the legacy single-link field. */ }
  return [];
}

export async function staffRoute(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/public/staff' && method === 'GET') {
    const rows = await env.DB.prepare(`SELECT id,username,role,social_media,admin_social_links FROM users
      WHERE deleted_at IS NULL AND (role='administrator' OR (id=1 AND role='superadministrator'))
      ORDER BY CASE WHEN id=1 THEN 0 ELSE 1 END,username,id`).all();
    return reply((rows.results || []).map(row => ({
      id: Number(row.id), username: row.username, role: row.role,
      social_links: storedSocialLinks(row.admin_social_links, row.social_media),
      social_url: safeSocialUrl(row.social_media) || null
    })));
  }

  if (path === '/api/public/site-links' && method === 'GET') {
    const row = await env.DB.prepare("SELECT url FROM site_public_links WHERE key='wechat'").first();
    return reply({ wechat: safeSocialUrl(row?.url) || '' });
  }

  if (path === '/api/sa/public-links' && method === 'GET') {
    if (!isSA(user)) return reply({ error: 'No permission' }, 403);
    const row = await env.DB.prepare("SELECT url FROM site_public_links WHERE key='wechat'").first();
    return reply({ wechat: row?.url || '' });
  }

  if (path === '/api/sa/public-links' && method === 'POST') {
    if (!isSA(user)) return reply({ error: 'No permission' }, 403);
    const body = await request.json();
    const wechat = safeSocialUrl(body.wechat);
    if (wechat === null) return reply({ error: '请输入有效的 HTTPS 公众号链接' }, 400);
    await env.DB.prepare(`INSERT INTO site_public_links(key,url,updated_by,updated_at) VALUES('wechat',?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET url=excluded.url,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`)
      .bind(wechat, user.id).run();
    return reply({ success: true });
  }

  if (path === '/api/sa/admin-social' && method === 'POST') {
    if (!isSA(user)) return reply({ error: 'No permission' }, 403);
    const body = await request.json();
    const targetId = Number(body.user_id);
    const links = body.links === undefined
      ? (() => { const url = safeSocialUrl(body.url); return url === null ? null : url ? [{ platform: '社交主页', url }] : []; })()
      : cleanSocialLinks(body.links);
    if (!Number.isSafeInteger(targetId) || targetId < 1 || links === null) return reply({ error: '请为每个社交平台填写名称和有效的 HTTPS 链接（最多 12 个）' }, 400);
    const target = await env.DB.prepare(`SELECT id FROM users WHERE id=? AND
      ((id=1 AND role='superadministrator') OR (id<>1 AND role='administrator'))`).bind(targetId).first();
    if (!target) return reply({ error: '只能修改站主或普通管理员的公开链接' }, 404);
    const updated = await env.DB.prepare(`UPDATE users SET admin_social_links=? WHERE id=? AND
      ((id=1 AND role='superadministrator') OR (id<>1 AND role='administrator'))`).bind(JSON.stringify(links), targetId).run();
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
