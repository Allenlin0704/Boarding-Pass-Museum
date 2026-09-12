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
  addHead('link', { rel: 'apple-touch-icon', href: 'favicon.png' });
  addHead('meta', { name: 'theme-color', content: '#003c6b' });
  addHead('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  addHead('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
  addHead('meta', { name: 'apple-mobile-web-app-title', content: 'BPMuseum' });

  const showInstallHelp = () => {
    let dialog=document.getElementById('bpmInstallHelp');
    if(!dialog){dialog=document.createElement('dialog');dialog.id='bpmInstallHelp';dialog.className='bpm-dialog';dialog.innerHTML='<h2>安装 BoardingPassMuseum</h2><p>请使用浏览器菜单中的“安装应用”或“添加到主屏幕”。如果按钮暂时不可用，请刷新页面后再试。</p><button type="button">知道了</button>';dialog.querySelector('button').onclick=()=>dialog.close();document.body.append(dialog);}dialog.showModal();
  };
  const addInstallButton = () => {
    const nav = document.querySelector('.menubar nav');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) return;
    if (!nav || document.getElementById('bpmInstallApp')) return;
    const button = document.createElement('button');
    button.id = 'bpmInstallApp';
    button.type = 'button';
    button.className = 'bpm-install-app';
    button.textContent = '安装应用';
    button.setAttribute('aria-label', '安装 BoardingPassMuseum 应用');
    button.addEventListener('click', async () => {
      const prompt = installPrompt;
      if (!prompt) return showInstallHelp();
      installPrompt = null;button.disabled = true;
      await prompt.prompt();await prompt.userChoice;button.remove();
    });
    nav.append(button);
  };

  const addIOSInstallGuide = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const nav = document.querySelector('.menubar nav');
    if (!isIOS || standalone || !nav || document.getElementById('bpmIOSInstall')) return;
    const button = document.createElement('button');
    button.id = 'bpmIOSInstall';button.type = 'button';button.className = 'bpm-install-app';button.textContent = '添加到主屏幕';
    button.addEventListener('click', () => {
      let dialog = document.getElementById('bpmIOSInstallGuide');
      if (!dialog) {
        dialog = document.createElement('dialog');dialog.id = 'bpmIOSInstallGuide';dialog.className = 'bpm-dialog';
        dialog.innerHTML = '<h2>添加到主屏幕</h2><p>在 Safari 底部或顶部点击“分享”按钮，选择“添加到主屏幕”，再点击“添加”。以后可像普通 App 一样从桌面打开 BoardingPassMuseum。</p><button type="button">知道了</button>';
        dialog.querySelector('button').addEventListener('click', () => dialog.close());document.body.append(dialog);
      }
      dialog.showModal();
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
  const installControls = () => { addInstallButton();addIOSInstallGuide(); };
  if(document.readyState === 'loading')document.addEventListener('DOMContentLoaded', installControls,{once:true});else installControls();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
  }
})();
