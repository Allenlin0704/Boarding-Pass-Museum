(() => {
  const heroes = [...document.querySelectorAll('.auth-photo-hero, .welcome')];
  if (!heroes.length) return;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
  }).formatToParts(new Date());
  const part = key => Number(parts.find(item => item.type === key)?.value);
  const year = part('year'), month = part('month'), dateNumber = part('day');
  const weekdayName = parts.find(item => item.type === 'weekday')?.value;
  const weekday = ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 })[weekdayName] || 1;
  const date = `${year}-${String(month).padStart(2, '0')}-${String(dateNumber).padStart(2, '0')}`;
  const slot = weekday - 1;
  const safeUrl = value => {
    try {
      const url = new URL(String(value || ''), location.origin);
      return [location.origin, 'https://images.bpmuseum.org.cn'].includes(url.origin) ? url.href : '';
    } catch { return ''; }
  };
  const fallback = (placement, index) => ({
    image_url: `/assets/auth-covers/${String(index + 1).padStart(2, '0')}.jpg`, credit: 'allenlin'
  });
  const placementFor = hero => hero.classList.contains('welcome')
    ? 'home'
    : location.pathname.toLowerCase().includes('register') ? 'register' : 'login';

  const apply = (hero, photo, placement) => {
    const url = safeUrl(photo?.image_url) || fallback(placement, slot).image_url;
    const cover = `url(${JSON.stringify(url)})`;
    hero.style.setProperty('--auth-cover', cover);
    hero.dataset.photoDay = date;
    const credit = String(photo?.credit || 'allenlin').slice(0, 100);
    const creditNode = hero.closest('.auth-page')?.querySelector('.auth-photo-credit')
      || hero.closest('.welcome')?.querySelector('.home-photo-credit')
      || document.querySelector(placement === 'home' ? '.home-photo-credit' : '.auth-photo-credit');
    const language = window.BPM_LANGUAGE || 'zh-CN';
    const creditLabel = language === 'en' ? 'Photo by' : language === 'zh-TW' ? '攝影' : '摄影';
    if (creditNode) creditNode.textContent = `${creditLabel} ${credit}`;
    document.documentElement.style.setProperty('--auth-cover', cover);
  };

  const placements = [...new Set(heroes.map(placementFor))];
  const lists = new Map();
  // Paint the current weekly slot immediately, then replace it with the SA-managed schedule.
  for (const placement of placements) {
    const photo = fallback(placement, slot);
    heroes.filter(hero => placementFor(hero) === placement).forEach(hero => apply(hero, photo, placement));
  }
  if (document.querySelector('.auth-page')) document.body.classList.add('auth-photo-background');

  Promise.all(placements.map(async placement => {
    try {
      const response = await fetch(`https://api.bpmuseum.org.cn/api/site-photos?placement=${placement}`, { cache: 'no-store' });
      if (!response.ok) return;
      const rows = await response.json();
      if (Array.isArray(rows) && rows.length) lists.set(placement, rows);
    } catch { /* Keep the built-in weekly photos available if the API is offline. */ }
  })).then(() => {
    for (const placement of placements) {
      const rows = lists.get(placement);
      if (!rows?.length) continue;
      const photo = rows[0];
      heroes.filter(hero => placementFor(hero) === placement).forEach(hero => apply(hero, photo, placement));
    }
  });
})();
