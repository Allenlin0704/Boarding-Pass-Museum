(() => {
  const addHead = (tag, attributes) => {
    const selector = tag === 'link' && attributes.href
      ? `${tag}[href="${attributes.href}"]`
      : `${tag}[${Object.keys(attributes)[0]}="${Object.values(attributes)[0]}"]`;
    if (document.head.querySelector(selector)) return;
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.append(element);
  };

  addHead('link', { rel: 'manifest', href: 'manifest.webmanifest' });
  addHead('link', { rel: 'icon', type: 'image/svg+xml', href: 'pwa-icon.svg' });
  addHead('link', { rel: 'apple-touch-icon', href: 'favicon.png' });
  addHead('meta', { name: 'theme-color', content: '#003c6b' });
  addHead('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  addHead('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
  addHead('meta', { name: 'apple-mobile-web-app-title', content: 'BPMuseum' });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
  }
})();
