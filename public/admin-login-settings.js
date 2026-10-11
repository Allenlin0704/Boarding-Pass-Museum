(()=>{
  const API='https://api.bpmuseum.org.cn';
  const get=(path)=>fetch(API+path,{credentials:'include',cache:'no-store'});
  const post=async(path,body)=>{const response=await fetch(API+path,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();if(!response.ok)throw Error(data.error||'操作失败');return data;};
  const password=document.getElementById('adminCurrentPassword');
  const passkeyList=document.getElementById('adminPasskeyList');
  const passkeyStatus=document.getElementById('adminPasskeyStatus');
  const pinStatus=document.getElementById('adminPinStatus');
  const b64=buffer=>btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const bytes=value=>Uint8Array.from(atob(String(value).replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-String(value).length%4)%4)),char=>char.charCodeAt(0));
  const escapeHTML=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const refreshPasskeys=async()=>{
    const response=await get('/api/passkey/status'),data=await response.json();
    if(!response.ok)throw Error(data.error||'Passkey 状态读取失败');
    passkeyList.innerHTML=data.passkeys.length?`<p>已登记 ${data.passkeys.length} 把 Passkey：</p>`+data.passkeys.map(key=>`<div class="admin-passkey-row"><span>添加于 ${escapeHTML(key.created_at||'未知时间')}</span><button type="button" data-remove-passkey="${escapeHTML(key.credential_id)}">移除此 Passkey</button></div>`).join(''):'<p>尚未添加 Passkey。</p>';
  };
  document.getElementById('adminPasskeyList').addEventListener('click',async event=>{
    const button=event.target.closest('[data-remove-passkey]');if(!button)return;
    if(!confirm('移除后，该设备将不能再使用此 Passkey 登录。确定继续？'))return;
    button.disabled=true;
    try{await post('/api/passkey/delete',{credential_id:button.dataset.removePasskey});await refreshPasskeys();passkeyStatus.textContent='Passkey 已移除。';}
    catch(error){passkeyStatus.textContent=error.message||'移除失败';button.disabled=false;}
  });
  document.getElementById('addAdminPasskey').addEventListener('click',async event=>{
    const button=event.currentTarget;button.disabled=true;passkeyStatus.textContent='';
    try{
      if(!window.PublicKeyCredential)throw Error('此浏览器不支持 Passkey');
      if(!password.value)throw Error('请输入当前账户密码');
      const options=await post('/api/passkey/register/options',{password:password.value});
      const credential=await navigator.credentials.create({publicKey:{...options,challenge:bytes(options.challenge),user:{...options.user,id:bytes(options.user.id)},excludeCredentials:(options.excludeCredentials||[]).map(item=>({...item,id:bytes(item.id)}))}});
      await post('/api/passkey/register/verify',{credential:{id:credential.id,rawId:b64(credential.rawId),type:credential.type,response:{clientDataJSON:b64(credential.response.clientDataJSON),attestationObject:b64(credential.response.attestationObject),transports:credential.response.getTransports?.()||[]}}});
      password.value='';passkeyStatus.textContent='Passkey 已添加。';await refreshPasskeys();
    }catch(error){passkeyStatus.textContent=error.message||'Passkey 添加失败';}
    finally{button.disabled=false;}
  });
  document.getElementById('saveAdminPin').addEventListener('click',async event=>{
    const button=event.currentTarget,pin=document.getElementById('adminNewPin').value;
    button.disabled=true;pinStatus.textContent='';
    try{
      if(!password.value)throw Error('请输入当前账户密码');
      const response=await get('/api/session'),account=await response.json();
      if(!response.ok||!account.admin_context||!['administrator','superadministrator'].includes(account.role))throw Error('管理员登录已失效，请重新登录');
      await post('/api/account/admin-pin/setup',{account_id:account.id,admin_role:account.role,password:password.value,pin});
      password.value='';document.getElementById('adminNewPin').value='';pinStatus.textContent='PIN 已保存，可在管理员专属登录页使用。';
    }catch(error){pinStatus.textContent=error.message||'PIN 设置失败';}
    finally{button.disabled=false;}
  });
  (async()=>{
    try{
      const response=await get('/api/session'),account=await response.json();
      if(!response.ok||!account.admin_context||!['administrator','superadministrator'].includes(account.role)||location.hostname!=='admin.bpmuseum.org.cn')throw Error('请从管理员专属入口登录');
      document.getElementById('adminSettingsIdentity').textContent=`${account.username} · ${account.role==='superadministrator'?'超级管理员（SA）':'管理员'}`;
      await refreshPasskeys();
    }catch(error){document.getElementById('adminSettingsIdentity').textContent=error.message||'管理员登录已失效';document.querySelectorAll('#addAdminPasskey,#saveAdminPin').forEach(button=>button.disabled=true);}
  })();
})();
