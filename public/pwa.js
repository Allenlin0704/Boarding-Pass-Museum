(() => {
  if (location.hostname === 'admin.bpmuseum.org.cn') return;
  let installPrompt;
  const language = () => ['en', 'zh-TW'].includes(window.BPM_LANGUAGE) ? window.BPM_LANGUAGE : 'zh-CN';
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

  const messages = {
    'zh-CN': {
      button: '安装应用', iosButton: '添加到主屏幕', title: '把展厅放到桌面',
      intro: '这是 BoardingPassMuseum 网站的快捷入口，打开后仍使用同一套网页功能和在线内容；网站更新后会自动使用新版。',
      use: '安装后，从桌面图标打开即可。暂时不安装也没关系，当前网页可以照常使用。',
      close: '继续浏览网页', done: '知道了', openBrowser: '你现在在微信、QQ 或其他应用内置浏览器中。请点右上角“…”并选择“在浏览器中打开”，再按下面步骤添加。',
      ios: ['在 Safari 打开 bpmuseum.org.cn。', '点工具栏“分享”按钮；如果看不到，点页面菜单后再点“分享”。', '在分享菜单中选“添加到主屏幕”。如未显示，滑到菜单底部点“编辑操作”添加它。', '打开“作为网页 App 打开”（如果有此选项），再点“添加”。'],
      androidChrome: ['在 Chrome 打开 bpmuseum.org.cn。', '点右上角“⋮”。', '点“安装应用”；部分版本显示“安装并创建快捷方式”，继续选择“安装”。', '如果菜单里没有安装项，尝试“分享 → 添加到主屏幕”；仍没有时，换 Chrome 打开本站。'],
      androidSamsung: ['在 Samsung Internet 打开 bpmuseum.org.cn。', '点菜单“≡”，再找“添加页面到”。', '选择“主屏幕”。'],
      androidFirefox: ['在 Firefox 打开 bpmuseum.org.cn。', '点“⋮”打开完整菜单，再点“添加到快捷方式”。', '快捷方式会出现在 Firefox 首页；点它即可进入展厅。'],
      androidEdge: ['在 Edge 打开 bpmuseum.org.cn。', '点底部或右上角“…”菜单。', '选择“添加到手机”或“安装应用”；不同版本名称可能略有不同。', '如果没有该选项，请在 Chrome 打开本站并使用“安装应用”。'],
      desktopChrome: ['在 Chrome 打开 bpmuseum.org.cn。', '点地址栏右侧的安装图标；如果没有，点“⋮ → 投放、保存和分享 → 将网页安装为应用”。', '按提示选择“安装”。'],
      desktopEdge: ['在 Edge 打开 bpmuseum.org.cn。', '点“… → 更多工具 → 应用 → 将此站点安装为应用”。', '按提示完成安装。'],
      desktopSafari: ['在 macOS Sonoma 或更新版本的 Safari 打开 bpmuseum.org.cn。', '点工具栏“分享”并选“添加到程序坞”；也可以从菜单栏选“文件 → 添加到程序坞”。', '输入名称后点“添加”。'],
      desktopOther: ['打开浏览器菜单，查找“安装应用”“将网页安装为应用”或“创建快捷方式”。', '如果当前浏览器没有这些选项，网页仍可正常使用；可改用 Chrome、Edge 或 Safari。'],
      androidOther: ['打开浏览器菜单（“⋮”或“≡”），查找“安装应用”“添加到主屏幕”或“添加快捷方式”。', '如果菜单没有这些选项，可在 Chrome 打开本站后选“安装应用”。', '无需安装也能正常使用网页。'],
      note: '添加到桌面只创建本站入口，不需要另注册账号；安装与否都使用同一网站服务。'
    },
    en: {
      button: 'Install app', iosButton: 'Add to Home Screen', title: 'Add the museum to your device',
      intro: 'This is a shortcut to the BoardingPassMuseum website. It uses the same web features and live collection, and updates arrive with the website.',
      use: 'After adding it, open the museum from its home-screen icon. You can also keep using this page without installing anything.',
      close: 'Keep browsing', done: 'Done', openBrowser: 'You are in an in-app browser. Tap “…” and choose “Open in browser,” then follow the steps below.',
      ios: ['Open bpmuseum.org.cn in Safari.', 'Tap Share. If it is not visible, open the page menu and then tap Share.', 'Choose “Add to Home Screen.” If missing, scroll to the bottom of the share sheet and add it from “Edit Actions.”', 'Turn on “Open as Web App,” if shown, then tap Add.'],
      androidChrome: ['Open bpmuseum.org.cn in Chrome.', 'Tap “⋮” in the top-right corner.', 'Choose “Install app.” Some versions show “Install and create shortcut”; continue and tap Install.', 'If no install option appears, try “Share → Add to Home screen,” or open the site in Chrome.'],
      androidSamsung: ['Open bpmuseum.org.cn in Samsung Internet.', 'Tap “≡,” then choose “Add page to.”', 'Choose “Home screen.”'],
      androidFirefox: ['Open bpmuseum.org.cn in Firefox.', 'Tap “⋮” to open the full menu, then choose “Add to shortcuts.”', 'The shortcut appears on Firefox Home; tap it to open the museum.'],
      androidEdge: ['Open bpmuseum.org.cn in Edge.', 'Tap the “…” menu at the bottom or top-right.', 'Choose “Add to phone” or “Install app.” The wording can vary by version.', 'If that option is missing, open the site in Chrome and choose “Install app.”'],
      desktopChrome: ['Open bpmuseum.org.cn in Chrome.', 'Click the install icon in the address bar. If it is not shown, choose “⋮ → Cast, save, and share → Install page as app.”', 'Follow the prompt and choose Install.'],
      desktopEdge: ['Open bpmuseum.org.cn in Edge.', 'Choose “… → More tools → Apps → Install this site as an app.”', 'Follow the installation prompt.'],
      desktopSafari: ['Open bpmuseum.org.cn in Safari on macOS Sonoma or later.', 'Choose Share → Add to Dock, or use File → Add to Dock.', 'Name the web app and click Add.'],
      desktopOther: ['Open the browser menu and look for “Install app,” “Install this site as an app,” or “Create shortcut.”', 'If unavailable, the website still works normally. You can also use Chrome, Edge, or Safari.'],
      androidOther: ['Open the browser menu (“⋮” or “≡”) and look for “Install app,” “Add to Home screen,” or “Add shortcut.”', 'If none is available, open the site in Chrome and choose “Install app.”', 'The website works normally without installation.'],
      note: 'Adding it only creates a shortcut to the website. No separate account is needed; both ways use the same service.'
    },
    'zh-TW': {
      button: '安裝應用程式', iosButton: '加入主畫面', title: '將展廳加入裝置',
      intro: '這是 BoardingPassMuseum 網站的捷徑，使用同一套網頁功能與線上館藏；網站更新後會自動使用新版。',
      use: '加入後可從桌面圖示開啟。暫時不安裝也沒關係，目前網頁仍可正常使用。',
      close: '繼續瀏覽網頁', done: '知道了', openBrowser: '你目前使用微信、QQ 或其他應用程式內建瀏覽器。請點右上角「⋯」並選擇「在瀏覽器中開啟」，再依照下方步驟操作。',
      ios: ['在 Safari 開啟 bpmuseum.org.cn。', '點工具列「分享」按鈕；若看不到，先點頁面選單再點「分享」。', '在分享選單中選「加入主畫面」。若未顯示，滑到選單底部並從「編輯動作」加入。', '若有「以網頁 App 開啟」選項，請開啟後點「加入」。'],
      androidChrome: ['在 Chrome 開啟 bpmuseum.org.cn。', '點右上角「⋮」。', '選「安裝應用程式」；部分版本會顯示「安裝並建立捷徑」，接著選「安裝」。', '若沒有安裝選項，試試「分享 → 加入主畫面」；仍沒有時，改用 Chrome 開啟本站。'],
      androidSamsung: ['在 Samsung Internet 開啟 bpmuseum.org.cn。', '點「≡」選單，再找「新增頁面至」。', '選擇「主畫面」。'],
      androidFirefox: ['在 Firefox 開啟 bpmuseum.org.cn。', '點「⋮」開啟完整選單，再選「新增至捷徑」。', '捷徑會出現在 Firefox 首頁，點一下即可進入展廳。'],
      androidEdge: ['在 Edge 開啟 bpmuseum.org.cn。', '點底部或右上角的「⋯」選單。', '選擇「新增至手機」或「安裝應用程式」；不同版本名稱可能略有差異。', '若沒有此選項，請改用 Chrome 開啟本站並選「安裝應用程式」。'],
      desktopChrome: ['在 Chrome 開啟 bpmuseum.org.cn。', '點網址列右側的安裝圖示；若沒有，選「⋮ → 投放、儲存及分享 → 將網頁安裝為應用程式」。', '依照提示選擇「安裝」。'],
      desktopEdge: ['在 Edge 開啟 bpmuseum.org.cn。', '選擇「⋯ → 更多工具 → 應用程式 → 將此網站安裝為應用程式」。', '依照提示完成安裝。'],
      desktopSafari: ['在 macOS Sonoma 或更新版本的 Safari 開啟 bpmuseum.org.cn。', '點工具列「分享」並選「加入 Dock」，或從選單列選「檔案 → 加入 Dock」。', '輸入名稱後點「加入」。'],
      desktopOther: ['開啟瀏覽器選單，尋找「安裝應用程式」、「將網站安裝為應用程式」或「建立捷徑」。', '若目前瀏覽器沒有這些選項，網頁仍可正常使用；也可改用 Chrome、Edge 或 Safari。'],
      androidOther: ['開啟瀏覽器選單（「⋮」或「≡」），尋找「安裝應用程式」、「加入主畫面」或「新增捷徑」。', '若選單沒有這些選項，可在 Chrome 開啟本站後選「安裝應用程式」。', '不安裝也能正常使用網頁。'],
      note: '加入桌面只會建立本站捷徑，不需要另外註冊帳號；安裝與否都使用同一網站服務。'
    }
  };

  const getGuideKey = () => {
    const ua = navigator.userAgent || '';
    const lower = ua.toLowerCase();
    const mobile = /android|iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const embedded = /MicroMessenger|QQ\/|Instagram|FBAN|FBAV|TikTok|XHS|xiaohongshu/i.test(ua);
    if (embedded) return { key: isIOS() ? 'ios' : 'androidOther', embedded: true };
    if (isIOS()) return { key: 'ios', embedded: false };
    if (/android/i.test(ua)) {
      if (/SamsungBrowser/i.test(ua)) return { key: 'androidSamsung', embedded: false };
      if (/Firefox|FxiOS/i.test(ua)) return { key: 'androidFirefox', embedded: false };
      if (/EdgA|EdgiOS/i.test(ua)) return { key: 'androidEdge', embedded: false };
      if (/Chrome|CriOS/i.test(ua)) return { key: 'androidChrome', embedded: false };
      return { key: 'androidOther', embedded: false };
    }
    if (/Macintosh|MacIntel/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)) return { key: 'desktopSafari', embedded: false };
    if (/Edg\//i.test(ua)) return { key: mobile ? 'androidEdge' : 'desktopEdge', embedded: false };
    if (/Chrome|Chromium/i.test(ua)) return { key: mobile ? 'androidChrome' : 'desktopChrome', embedded: false };
    return { key: mobile ? 'androidOther' : 'desktopOther', embedded: false };
  };

  const createDialog = () => {
    let dialog = document.getElementById('bpmInstallHelp');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'bpmInstallHelp';
    dialog.className = 'bpm-dialog bpm-install-dialog';
    const style = document.createElement('style');
    style.textContent = '.bpm-install-dialog{box-sizing:border-box;width:min(560px,calc(100% - 24px));max-height:min(86dvh,760px);padding:clamp(20px,5vw,30px);border:1px solid color-mix(in srgb,var(--bpm-border,#8da9c0) 60%,transparent);border-radius:22px;background:var(--bpm-card,#fff);color:var(--bpm-text,#163148);box-shadow:0 28px 90px #001b3655}.bpm-install-dialog h2{margin:0 0 10px;font-size:clamp(21px,5vw,27px)}.bpm-install-dialog p{line-height:1.7}.bpm-install-steps{display:grid;gap:10px;margin:18px 0;padding-left:24px}.bpm-install-steps li{padding-left:3px;line-height:1.65}.bpm-install-note{padding:12px 14px;border-radius:12px;background:color-mix(in srgb,var(--bpm-card,#fff) 84%,#73b9ee);font-size:14px}.bpm-install-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.bpm-install-actions button{min-height:44px;padding:10px 16px;border:1px solid var(--bpm-border,#8da9c0);border-radius:12px;background:var(--bpm-card,#fff);color:var(--bpm-text,#163148);font:inherit;font-weight:650;cursor:pointer}.bpm-install-actions button[type=submit]{border-color:#003c6b;background:#003c6b;color:#fff}.bpm-install-dialog::backdrop{background:#001b3680;backdrop-filter:blur(3px)}@media(max-width:480px){.bpm-install-dialog{margin:auto auto 0;border-radius:22px 22px 0 0;max-height:88dvh;padding:22px 18px calc(18px + env(safe-area-inset-bottom))}}';
    const shell = document.createElement('div');
    shell.innerHTML = '<h2 id="bpmInstallTitle"></h2><p id="bpmInstallIntro"></p><p id="bpmInstallEmbedded" hidden></p><ol class="bpm-install-steps" id="bpmInstallSteps"></ol><p id="bpmInstallUse"></p><p class="bpm-install-note" id="bpmInstallNote"></p><form method="dialog" class="bpm-install-actions"><button type="submit" id="bpmInstallClose"></button></form>';
    dialog.append(style, shell);
    document.body.append(dialog);
    return dialog;
  };

  const showInstallHelp = () => {
    const t = messages[language()];
    const { key, embedded } = getGuideKey();
    const dialog = createDialog();
    dialog.querySelector('#bpmInstallTitle').textContent = t.title;
    dialog.querySelector('#bpmInstallIntro').textContent = t.intro;
    const embeddedCopy = dialog.querySelector('#bpmInstallEmbedded');
    embeddedCopy.hidden = !embedded;
    embeddedCopy.textContent = t.openBrowser;
    dialog.querySelector('#bpmInstallSteps').replaceChildren(...t[key].map(step => {
      const item = document.createElement('li');
      item.textContent = step;
      return item;
    }));
    dialog.querySelector('#bpmInstallUse').textContent = t.use;
    dialog.querySelector('#bpmInstallNote').textContent = t.note;
    dialog.querySelector('#bpmInstallClose').textContent = t.close;
    if (!dialog.open) dialog.showModal();
  };

  const addInstallButton = () => {
    const nav = document.querySelector('.menubar nav');
    if (!nav || document.getElementById('bpmInstallApp') || isStandalone()) return;
    const t = messages[language()];
    const button = document.createElement('button');
    button.id = 'bpmInstallApp';
    button.type = 'button';
    button.className = 'bpm-install-app';
    button.textContent = isIOS() ? t.iosButton : t.button;
    button.setAttribute('aria-label', isIOS() ? t.iosButton : t.button);
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', async () => {
      const prompt = installPrompt;
      if (!prompt) return showInstallHelp();
      installPrompt = null;
      button.disabled = true;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice?.outcome === 'accepted') button.remove();
        else { button.disabled = false; showInstallHelp(); }
      } catch {
        button.disabled = false;
        showInstallHelp();
      }
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
  const installControls = () => { addInstallButton(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installControls, { once: true });
  else installControls();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
  }
})();
