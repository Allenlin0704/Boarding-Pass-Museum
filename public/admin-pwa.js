(() => {
  if(location.hostname!=='admin.bpmuseum.org.cn')return;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  let installPrompt=null;
  const nav=document.querySelector('.menubar nav');
  const showHelp=()=>{
    let dialog=document.getElementById('adminInstallHelp');
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='adminInstallHelp';dialog.className='bpm-dialog bpm-admin-install-help';
      const title=document.createElement('h2');title.textContent='安装管理中心';
      const text=document.createElement('p');text.textContent=ios()?'在 Safari 点“分享”，再选择“添加到主屏幕”。':'在浏览器菜单中选择“安装应用”或“将此网站安装为应用”。';
      const note=document.createElement('p');note.textContent='管理中心会以独立应用显示，与公开展厅分开。安装后仍需登录。';
      const close=document.createElement('button');close.type='button';close.textContent='知道了';close.addEventListener('click',()=>dialog.close());
      dialog.append(title,text,note,close);document.body.append(dialog);
    }
    if(!dialog.open)dialog.showModal();
  };
  const addButton=()=>{
    if(!nav||document.getElementById('adminInstallApp')||standalone())return;
    const button=document.createElement('button');button.id='adminInstallApp';button.type='button';button.className='bpm-admin-pwa-install';button.textContent='安装管理端';
    button.addEventListener('click',async()=>{
      if(!installPrompt){showHelp();return;}
      const prompt=installPrompt;installPrompt=null;button.disabled=true;
      try{await prompt.prompt();const choice=await prompt.userChoice;if(choice?.outcome==='accepted')button.remove();else button.disabled=false;}
      catch{button.disabled=false;showHelp();}
    });
    nav.append(button);
  };
  addButton();
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;addButton();});
  window.addEventListener('appinstalled',()=>{installPrompt=null;document.getElementById('adminInstallApp')?.remove();});
  if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/admin-service-worker.js',{scope:'/'}).catch(error=>console.error('Admin PWA worker registration failed',error)));
})();
