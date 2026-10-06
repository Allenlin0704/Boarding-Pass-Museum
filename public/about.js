(() => {
  const panel = document.getElementById('publicStaffPanel');
  const list = document.getElementById('publicStaffLinks');
  if (!panel || !list) return;
  const escapeHTML = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  fetch('https://api.bpmuseum.org.cn/api/public/staff', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : [])
    .then(rows => {
      const visible = Array.isArray(rows) ? rows.filter(row => /^https:\/\//i.test(row.social_url || '')) : [];
      if (!visible.length) return;
      list.innerHTML = visible.map(row => `<a class="public-staff-link" href="${escapeHTML(row.social_url)}" target="_blank" rel="noopener noreferrer"><strong data-user-content>${escapeHTML(row.username)}</strong><span>查看社交主页 ↗</span></a>`).join('');
      panel.hidden = false;
    })
    .catch(() => {});
})();
