(() => {
  let installPrompt;
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

  const addInstallButton = () => {
    const nav = document.querySelector('.menubar nav');
    if (!installPrompt || !nav || document.getElementById('bpmInstallApp')) return;
    const button = document.createElement('button');
    button.id = 'bpmInstallApp';
    button.type = 'button';
    button.className = 'bpm-install-app';
    button.textContent = '安装应用';
    button.setAttribute('aria-label', '安装 BoardingPassMuseum 应用');
    button.addEventListener('click', async () => {
      const prompt = installPrompt;
      installPrompt = null;
      button.disabled = true;
      await prompt.prompt();
      await prompt.userChoice;
      button.remove();
    });
    nav.append(button);
  };

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    addInstallButton();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    document.getElementById('bpmInstallApp')?.remove();
  });
  document.addEventListener('DOMContentLoaded', addInstallButton);

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
  }
})();
