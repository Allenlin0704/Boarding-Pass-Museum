(() => {
  let account;
  try { account = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch {}
  if (!['administrator', 'superadministrator'].includes(account?.role)) return;

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const embeddedConsole = document.documentElement.classList.contains('bpm-console-embed');
  const launcher = embeddedConsole ? null : document.createElement('button');
  if (launcher) {
    launcher.type = 'button'; launcher.className = 'bpm-staff-chat-launcher'; launcher.innerHTML = `${window.bpmIcon?.('message') || ''}<span>管理员工作聊天</span>`;
    launcher.setAttribute('aria-haspopup', 'dialog'); launcher.setAttribute('aria-controls', 'bpmStaffChatDialog');
  }
  const dialog = document.createElement('dialog');
  dialog.id = 'bpmStaffChatDialog'; dialog.className = 'bpm-staff-chat-dialog';
  dialog.innerHTML = `<header><div><span>BOARDINGPASSMUSEUM</span><h2>管理员与 SA 工作聊天</h2></div><button type="button" data-chat-close aria-label="关闭">${window.bpmIcon?.('close') || '×'}</button></header><div class="bpm-staff-chat-messages" role="log" aria-live="polite">打开后加载消息…</div><form><label class="sr-only" for="bpmStaffChatInput">发送消息</label><textarea id="bpmStaffChatInput" rows="2" maxlength="2000" placeholder="仅管理员与 SA 可见，最多 2000 字" required></textarea><button type="submit">发送</button></form><p class="bpm-staff-chat-status" role="status"></p>`;
  if (launcher) document.body.append(launcher);
  document.body.append(dialog);
  const messages = dialog.querySelector('.bpm-staff-chat-messages');
  const status = dialog.querySelector('.bpm-staff-chat-status');
  const input = dialog.querySelector('textarea');
  let polling = null;
  const chatLocale = window.BPM_LANGUAGE === 'en' ? 'en-US' : window.BPM_LANGUAGE === 'zh-TW' ? 'zh-TW' : 'zh-CN';
  const timeLabel = value => {
    const date = new Date(`${String(value || '').replace(' ', 'T')}Z`);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(chatLocale, {timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);
  };
  async function loadMessages() {
    try {
      const response = await fetch('https://api.bpmuseum.org.cn/api/staff-chat', {credentials:'include',cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '聊天暂不可用');
      const wasAtBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80;
      messages.innerHTML = data.map(row => `<article class="bpm-staff-chat-message ${Number(row.user_id)===Number(account.id)?'mine':''}"><header><strong data-user-content>${escapeHTML(row.username)}</strong><time>${escapeHTML(timeLabel(row.created_at))}</time></header><p data-user-content>${escapeHTML(row.message)}</p></article>`).join('') || '<p class="bpm-staff-chat-empty">还没有消息。可以在这里和审核团队沟通。</p>';
      if (wasAtBottom || messages.scrollTop === 0) messages.scrollTop = messages.scrollHeight;
      status.textContent = '';
    } catch (error) { status.textContent = error.message; }
  }
  function openChat() { if (!dialog.open) dialog.showModal(); loadMessages(); input.focus(); if (!polling) polling = setInterval(loadMessages, 12000); }
  function closeChat() { if (dialog.open) dialog.close(); clearInterval(polling); polling = null; }
  launcher?.addEventListener('click', openChat);
  dialog.querySelector('[data-chat-close]').addEventListener('click', closeChat);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeChat(); });
  dialog.addEventListener('close', () => { clearInterval(polling); polling = null; });
  dialog.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault(); const message = input.value.trim(); if (!message) return;
    const send = event.currentTarget.querySelector('button[type="submit"]'); send.disabled = true;
    try {
      const response = await fetch('https://api.bpmuseum.org.cn/api/staff-chat', {method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});
      const result = await response.json(); if (!response.ok) throw new Error(result.error || '发送失败');
      input.value = ''; await loadMessages(); input.focus();
    } catch (error) { status.textContent = error.message; }
    finally { send.disabled = false; }
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.data !== 'bpm-open-staff-chat') return;
    openChat();
  });
})();
