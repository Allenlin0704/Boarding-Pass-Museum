(() => {
  const list = document.getElementById('publicStaffLinks');
  const wechatLink = document.getElementById('officialWechatLink');
  const hero = document.querySelector('.bpm-info-page .bpm-page-hero');
  if (hero) {
    const section = document.createElement('section');
    section.className = 'bpm-panel bpm-launch-counter';
    section.setAttribute('aria-live', 'off');
    const sinceLabel = window.bpmLocaleText?.('从第一版上线至今') || '从第一版上线至今';
    const dateLabel = window.bpmLocaleText?.('首版上线时间') || '首版上线时间';
    const launchDate = window.BPM_LANGUAGE === 'en'
      ? '2026-08-17 14:29:04 (China Standard Time)'
      : '2026-08-17 14:29:04（北京时间）';
    section.innerHTML = `<span class="bpm-launch-eyebrow">${sinceLabel}</span><strong class="bpm-launch-elapsed" id="bpmLaunchElapsed"></strong><p>${dateLabel}：${launchDate}</p>`;
    hero.after(section);
    const elapsed = document.getElementById('bpmLaunchElapsed');
    const start = Date.parse('2026-08-17T14:29:04+08:00');
    const update = () => {
      let seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const days = Math.floor(seconds / 86400); seconds %= 86400;
      const hours = Math.floor(seconds / 3600); seconds %= 3600;
      const minutes = Math.floor(seconds / 60); seconds %= 60;
      elapsed.textContent = window.BPM_LANGUAGE === 'en'
        ? `${days} days · ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
        : window.BPM_LANGUAGE === 'zh-TW'
          ? `${days} 天 · ${String(hours).padStart(2,'0')} 時 ${String(minutes).padStart(2,'0')} 分 ${String(seconds).padStart(2,'0')} 秒`
          : `${days} 天 · ${String(hours).padStart(2,'0')} 小时 ${String(minutes).padStart(2,'0')} 分 ${String(seconds).padStart(2,'0')} 秒`;
    };
    update();
    window.setInterval(update,1000);
  }
  if (!list) return;
  const escapeHTML = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  fetch('https://api.bpmuseum.org.cn/api/public/staff', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : [])
    .then(rows => {
      const visible = Array.isArray(rows) ? rows.filter(row => /^https:\/\//i.test(row.social_url || '')) : [];
      list.innerHTML = visible.length ? visible.map(row => `<a class="public-staff-link" href="${escapeHTML(row.social_url)}" target="_blank" rel="noopener noreferrer"><strong data-user-content>${escapeHTML(row.username)}</strong><span>查看社交主页 ↗</span></a>`).join('') : '<p>暂无公开的管理员社交主页。</p>';
    })
    .catch(() => {});
  fetch('https://api.bpmuseum.org.cn/api/public/site-links', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : {})
    .then(data => { if (/^https:\/\//i.test(data.wechat || '') && wechatLink) { wechatLink.href = data.wechat; wechatLink.target = '_blank'; wechatLink.rel = 'noopener noreferrer'; document.getElementById('officialWechatHint')?.replaceChildren(document.createTextNode('（公众号入口）')); } })
    .catch(() => {});
})();
