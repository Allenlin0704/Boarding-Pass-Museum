const CACHE = 'bpmuseum-shell-v44';
const SHELL = [
  '/', '/index.html', '/app.js', '/transit-operators.js', '/explore.html', '/submit.html', '/rules.html', '/admin-login.html', '/admin-pin-login.js', '/admin-settings.html', '/admin-login-settings.js', '/admin-oauth-complete.html', '/console.html', '/admin.html', '/sa.html', '/sa.js', '/submit.js', '/moderation.html', '/detail.html', '/detail.js', '/share-card.js', '/style.css', '/site-polish.css', '/explore.css', '/explore.js', '/detail-relations.js', '/auth-hero.js', '/assets/auth-covers/01.jpg', '/assets/auth-covers/02.jpg', '/assets/auth-covers/03.jpg', '/assets/auth-covers/04.jpg', '/assets/auth-covers/05.jpg', '/assets/auth-covers/06.jpg', '/assets/auth-covers/07.jpg', '/features.css', '/submit-page.css', '/watermark-fonts.css', '/theme.js', '/community-rules-i18n.js', '/rules-i18n.js', '/entity-aliases.json', '/ai-provider.js', '/pwa.js', '/watermark.js', '/image-editor.js', '/image-compression.js', '/about.js', '/staff-chat.js', '/pwa-icon-192.png', '/pwa-icon-512.png',
  '/image-handoff.js', '/windows-store-links.js', '/iso-country-picker.js', '/data/countries-iso3166.json', '/fonts/inter-boardingpass-600.woff2', '/fonts/ibm-plex-sans-boardingpass-600.woff2', '/fonts/playfair-display-boardingpass-600.woff2',
  '/manifest.webmanifest', '/favicon.png', '/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then(hit => hit || caches.match('/offline.html'))));
    return;
  }

  event.respondWith(fetch(request).then(response => {
    if (response.ok && (url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.endsWith('.html'))) {
      caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => caches.match(request)));
});
