(() => {
  const select=document.getElementById('adminIdentity');
  const status=document.getElementById('adminLoginHelp');
  if(!select)return;
  const option=(label,value='')=>{const item=document.createElement('option');item.value=value;item.textContent=label;return item;};
  fetch('https://api.bpmuseum.org.cn/api/admin/identities',{cache:'no-store',credentials:'omit'})
    .then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error||'暂时无法读取管理员列表');return data;})
    .then(data=>{
      select.replaceChildren(option('请选择管理员账户'));
      for(const identity of data.identities||[]){
        const role=identity.role==='superadministrator'?'超级管理员（SA）':'管理员';
        select.append(option(`${identity.username} · ${role}`,String(identity.id)));
      }
      if(!select.options.length||select.options.length===1){select.replaceChildren(option('当前没有可用的管理员账户'));select.disabled=true;if(status)status.textContent='管理员列表为空，请联系站长检查账户权限。';}
    })
    .catch(error=>{select.replaceChildren(option('管理员列表加载失败，请刷新重试'));select.disabled=true;if(status)status.textContent=error.message||'管理员列表加载失败，请刷新重试。';});
})();
