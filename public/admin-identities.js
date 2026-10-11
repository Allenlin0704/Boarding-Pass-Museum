(() => {
  const select=document.getElementById('adminIdentity');
  const fallback=document.getElementById('adminIdentityFallback');
  const status=document.getElementById('adminLoginHelp');
  const retry=document.getElementById('adminIdentityRetry');
  if(!select)return;
  const option=(label,value='')=>{const item=document.createElement('option');item.value=value;item.textContent=label;return item;};
  const load=async()=>{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),10000);
    select.disabled=true;
    if(retry){retry.hidden=true;retry.disabled=true;}
    if(status)status.textContent='正在读取管理员名单…';
    try{
      const response=await fetch('https://api.bpmuseum.org.cn/api/admin/identities',{cache:'no-store',credentials:'omit',signal:controller.signal});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'暂时无法读取管理员列表');
      const identities=Array.isArray(data.identities)?data.identities:[];
      select.replaceChildren(option(identities.length?'请选择管理员账户':'当前没有可用的管理员账户'));
      for(const identity of identities){
        const role=identity.role==='superadministrator'?'超级管理员（SA）':'管理员';
        select.append(option(`${identity.username} · ${role}`,String(identity.id)));
      }
      select.disabled=!identities.length;
      if(fallback)fallback.hidden=true;
      if(!identities.length&&status)status.textContent='管理员列表为空，请联系站长检查账户权限。';
      else if(status)status.textContent='此入口只接受管理员和超级管理员账号。';
    }catch(error){
      const message=error.name==='AbortError'?'读取管理员名单超时，请检查网络后重试。':(error.message||'管理员名单加载失败；可使用管理员邮箱登录。');
      select.replaceChildren(option('名单不可用，请使用邮箱继续'));
      select.disabled=true;
      if(fallback)fallback.hidden=false;
      if(status)status.textContent=message;
      if(retry)retry.hidden=false;
    }finally{
      clearTimeout(timeout);
      if(retry)retry.disabled=false;
    }
  };
  retry?.addEventListener('click',load);
  load();
})();
