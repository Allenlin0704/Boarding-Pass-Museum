const CACHE = 'bpmuseum-shell-v14';
const SHELL = [
  '/', '/index.html', '/style.css', '/auth-hero.js', '/assets/auth-covers/01.jpg', '/assets/auth-covers/02.jpg', '/assets/auth-covers/03.jpg', '/assets/auth-covers/04.jpg', '/assets/auth-covers/05.jpg', '/assets/auth-covers/06.jpg', '/assets/auth-covers/07.jpg', '/features.css', '/submit-page.css', '/watermark-fonts.css', '/theme.js', '/community-rules-i18n.js', '/pwa.js', '/watermark.js', '/image-editor.js',
  '/fonts/inter-boardingpass-600.woff2', '/fonts/ibm-plex-sans-boardingpass-600.woff2', '/fonts/playfair-display-boardingpass-600.woff2',
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
