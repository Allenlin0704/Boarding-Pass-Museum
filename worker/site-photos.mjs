import { isAdmin, isSA, reply } from './security.mjs';

const LICENSE_VERSION = 'bpm-cover-photo-2026-09';
const placementFields = {
  home: 'show_home',
  login: 'show_login',
  register: 'show_register'
};

function photoRow(row) {
  return {
    id: Number(row.id),
    image_url: row.image_url,
    credit: row.credit,
    show_home: Number(row.show_home) === 1,
    show_login: Number(row.show_login) === 1,
    show_register: Number(row.show_register) === 1,
    sort_order: Number(row.sort_order),
    active: Number(row.active) === 1,
    created_at: row.created_at
  };
}

const boolField = (form, key) => ['1', 'true', 'on'].includes(String(form.get(key) || '').toLowerCase());

export async function sitePhotoRoute(request, env, url, user, uploadImage) {
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/site-photos' && method === 'GET') {
    const field = placementFields[url.searchParams.get('placement') || 'home'];
    if (!field) return reply({ error: '照片位置无效' }, 400);
    const result = await env.DB.prepare(`SELECT id,image_url,credit,show_home,show_login,show_register,sort_order,active,created_at FROM site_cover_photos WHERE active=1 AND ${field}=1 ORDER BY sort_order,id`).all();
    return reply((result.results || []).map(photoRow));
  }

  if (path === '/api/sa/site-photos' && method === 'GET') {
    if (!isSA(user)) return reply({ error: 'No permission' }, 403);
    const [photos, requests, admins] = await Promise.all([
      env.DB.prepare('SELECT id,image_url,credit,show_home,show_login,show_register,sort_order,active,created_at FROM site_cover_photos ORDER BY sort_order,id').all(),
      env.DB.prepare(`SELECT r.*,u.username AS admin_name FROM site_photo_requests r JOIN users u ON u.id=r.admin_id WHERE r.status='pending_review' ORDER BY r.submitted_at,r.id`).all(),
      env.DB.prepare("SELECT id,username FROM users WHERE role='administrator' ORDER BY username,id").all()
    ]);
    return reply({ photos: (photos.results || []).map(photoRow), requests: requests.results || [], admins: admins.results || [] });
  }

  if (path === '/api/sa/site-photo-invitations' && method === 'POST') {
    if (!isSA(user)) return reply({ error: 'No permission' }, 403);
    const body = await request.json();
    const ids = body.admin_ids;
    if (!Array.isArray(ids) || !ids.length || ids.length > 50 || ids.some(id => !Number.isSafeInteger(Number(id)) || Number(id) <= 1) || new Set(ids.map(Number)).size !== ids.length) {
      return reply({ error: '请选择有效的管理员' }, 400);
    }
    const adminIds = ids.map(Number);
    const validAdmins = await env.DB.prepare(`SELECT id FROM users WHERE id IN (${adminIds.map(() => '?').join(',')}) AND role='administrator'`).bind(...adminIds).all();
    if ((validAdmins.results || []).length !== adminIds.length) return reply({ error: '邀请名单中有非普通管理员账号' }, 400);
    let invited = 0;
    const skipped = [];
    for (const adminId of adminIds) {
      const existing = await env.DB.prepare("SELECT id FROM site_photo_requests WHERE admin_id=? AND status IN ('invited','accepted','uploading','pending_review') LIMIT 1").bind(adminId).first();
      if (existing) { skipped.push(adminId); continue; }
      const created = await env.DB.prepare("INSERT INTO site_photo_requests(admin_id,invited_by,status) VALUES(?,?,'invited') RETURNING id").bind(adminId, user.id).first();
      await env.DB.prepare('INSERT INTO notifications(user_id,content) VALUES(?,?)').bind(adminId, 'SA 邀请你参与主页照片征集。请打开通知与申诉查看并选择是否参加。').run();
      invited++;
      if (!created?.id) return reply({ error: '邀请未能保存，请重试' }, 500);
    }
    return reply({ success: true, invited, skipped });
  }

  if (path === '/api/admin/site-photo-invitations' && method === 'GET') {
    if (!isAdmin(user)) return reply({ error: 'No permission' }, 403);
    const result = await env.DB.prepare('SELECT id,invited_by,status,created_at,responded_at,submitted_at,reviewed_at,review_note FROM site_photo_requests WHERE admin_id=? ORDER BY id DESC LIMIT 50').bind(user.id).all();
    return reply(result.results || []);
  }

  const respondMatch = path.match(/^\/api\/admin\/site-photo-invitations\/(\d+)\/respond$/);
  if (respondMatch && method === 'POST') {
    if (!isAdmin(user)) return reply({ error: 'No permission' }, 403);
    const body = await request.json();
    if (!['accepted', 'declined'].includes(body.response)) return reply({ error: '请选择同意或不同意' }, 400);
    const invitationId = Number(respondMatch[1]);
    const result = await env.DB.prepare("UPDATE site_photo_requests SET status=?,responded_at=CURRENT_TIMESTAMP WHERE id=? AND admin_id=? AND status='invited'").bind(body.response, invitationId, user.id).run();
    if (!result.meta.changes) return reply({ error: '邀请不存在或已处理' }, 409);
    const row = await env.DB.prepare('SELECT invited_by FROM site_photo_requests WHERE id=?').bind(invitationId).first();
    await env.DB.prepare('INSERT INTO notifications(user_id,content) VALUES(?,?)').bind(row.invited_by, body.response === 'accepted' ? '管理员已接受主页照片征集邀请。' : '管理员暂不参加主页照片征集。').run();
    return reply({ success: true });
  }

  const submitMatch = path.match(/^\/api\/admin\/site-photo-requests\/(\d+)\/submit$/);
  if (submitMatch && method === 'POST') {
    if (!isAdmin(user)) return reply({ error: 'No permission' }, 403);
    const form = await request.formData();
    const file = form.get('image');
    const credit = String(form.get('credit') || '').trim();
    const placements = Object.fromEntries(Object.entries(placementFields).map(([key, field]) => [field, boolField(form, field)]));
    if (!file || typeof file.arrayBuffer !== 'function' || file.size < 1 || file.size > 10 * 1024 * 1024) return reply({ error: '请选择 10 MB 以内的照片' }, 400);
    if (!credit || credit.length > 100) return reply({ error: '请填写照片署名（不超过 100 字）' }, 400);
    if (!Object.values(placements).some(Boolean)) return reply({ error: '至少选择一个展示位置' }, 400);
    if (!boolField(form, 'license_confirmed')) return reply({ error: '请先阅读并同意照片使用授权' }, 400);
    const requestId = Number(submitMatch[1]);
    const locked = await env.DB.prepare("UPDATE site_photo_requests SET status='uploading' WHERE id=? AND admin_id=? AND status='accepted'").bind(requestId, user.id).run();
    if (!locked.meta.changes) return reply({ error: '请先接受有效邀请，再提交照片' }, 409);
    const uploadForm = new FormData();
    uploadForm.set('image', file, file.name || 'cover-photo.jpg');
    let upload;
    try {
      const response = await uploadImage(new Request(request.url, { method: 'POST', body: uploadForm }), env);
      upload = await response.json();
      if (!response.ok || !upload.success || !upload.url) throw new Error(upload.error || '照片上传失败');
    } catch (error) {
      await env.DB.prepare("UPDATE site_photo_requests SET status='accepted' WHERE id=? AND admin_id=? AND status='uploading'").bind(requestId, user.id).run();
      return reply({ error: error.message || '照片上传失败，请重试' }, 400);
    }
    const submitted = await env.DB.prepare(`UPDATE site_photo_requests SET status='pending_review',image_url=?,credit=?,show_home=?,show_login=?,show_register=?,license_confirmed=1,license_version=?,submitted_at=CURRENT_TIMESTAMP WHERE id=? AND admin_id=? AND status='uploading'`)
      .bind(upload.url, credit, Number(placements.show_home), Number(placements.show_login), Number(placements.show_register), LICENSE_VERSION, requestId, user.id).run();
    if (!submitted.meta.changes) return reply({ error: '照片已上传，但提交状态发生变化，请联系 SA 检查' }, 409);
    await env.DB.prepare('INSERT INTO notifications(user_id,content) VALUES(1,?)').bind(`管理员 ${user.username} 提交了主页照片，等待 SA 审核。`).run();
    return reply({ success: true, status: 'pending_review' });
  }

  const photoSaveMatch = path.match(/^\/api\/sa\/site-photos\/(\d+)$/);
  if (photoSaveMatch && method === 'POST') {
    if (!isSA(user)) return reply({ error: 'No permission' }, 403);
    const body = await request.json();
    const credit = String(body.credit || '').trim();
    const sortOrder = Number(body.sort_order);
    const flags = ['show_home', 'show_login', 'show_register'].map(key => body[key] === true || body[key] === 1);
    if (!credit || credit.length > 100 || !Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > 1000 || (body.active !== false && body.active !== 0 && !flags.some(Boolean))) return reply({ error: '请填写署名并检查顺序与展示位置' }, 400);
    const result = await env.DB.prepare('UPDATE site_cover_photos SET credit=?,show_home=?,show_login=?,show_register=?,sort_order=?,active=? WHERE id=?')
      .bind(credit, Number(flags[0]), Number(flags[1]), Number(flags[2]), sortOrder, Number(body.active !== false && body.active !== 0), Number(photoSaveMatch[1])).run();
    return result.meta.changes ? reply({ success: true }) : reply({ error: '照片不存在' }, 404);
  }

  const decisionMatch = path.match(/^\/api\/sa\/site-photo-requests\/(\d+)\/decision$/);
  if (decisionMatch && method === 'POST') {
    if (!isSA(user)) return reply({ error: 'No permission' }, 403);
    const body = await request.json();
    if (!['approved', 'rejected'].includes(body.decision)) return reply({ error: '处理结果无效' }, 400);
    const id = Number(decisionMatch[1]);
    const proposal = await env.DB.prepare("SELECT * FROM site_photo_requests WHERE id=? AND status='pending_review'").bind(id).first();
    if (!proposal) return reply({ error: '照片申请不存在或已处理' }, 409);
    let result;
    if (body.decision === 'rejected') {
      const note = String(body.review_note || '').trim().slice(0, 1000);
      result = await env.DB.prepare("UPDATE site_photo_requests SET status='rejected',reviewer_id=?,review_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending_review'").bind(user.id, note, id).run();
      if (result.meta.changes) await env.DB.prepare('INSERT INTO notifications(user_id,content) VALUES(?,?)').bind(proposal.admin_id, `你提交的主页照片未通过审核。${note}`).run();
    } else {
      const showHome = body.show_home === true || body.show_home === 1;
      const showLogin = body.show_login === true || body.show_login === 1;
      const showRegister = body.show_register === true || body.show_register === 1;
      const sortOrder = Number(body.sort_order);
      if ((!showHome && !showLogin && !showRegister) || !Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > 1000) return reply({ error: '至少选择一个位置，并填写 1 到 1000 的排期顺序' }, 400);
      const statements = [
        env.DB.prepare("UPDATE site_photo_requests SET status='approved',show_home=?,show_login=?,show_register=?,sort_order=?,reviewer_id=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending_review'").bind(Number(showHome), Number(showLogin), Number(showRegister), sortOrder, user.id, id),
        env.DB.prepare(`INSERT OR IGNORE INTO site_cover_photos(image_url,credit,show_home,show_login,show_register,sort_order,active,submitted_by,request_id)
          SELECT image_url,credit,show_home,show_login,show_register,sort_order,1,admin_id,id FROM site_photo_requests WHERE id=? AND status='approved' AND reviewer_id=?`)
          .bind(id, user.id),
        env.DB.prepare("INSERT INTO notifications(user_id,content) SELECT admin_id,'你提交的主页照片已通过 SA 审核并加入照片排期。' FROM site_photo_requests WHERE id=? AND status='approved' AND reviewer_id=? AND changes()>0")
          .bind(id, user.id)
      ];
      const results = await env.DB.batch(statements);
      return results[0].meta.changes ? reply({ success: true }) : reply({ error: '照片申请状态已变化，请刷新后重试' }, 409);
    }
    return result.meta.changes ? reply({ success: true }) : reply({ error: '照片申请状态已变化，请刷新后重试' }, 409);
  }

  return null;
}
