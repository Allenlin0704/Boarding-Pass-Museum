(() => {
  window.bpmHandleClientAdminLogin=data=>{
    if(!['administrator','superadministrator'].includes(data?.role)||location.hostname==='admin.bpmuseum.org.cn')return false;
    const dialog=document.getElementById('adminClientNotice');
    if(dialog)dialog.showModal();
    else alert(`${window.bpmLocaleText?.('此站为用户客户端')||'此站为用户客户端'}：${window.bpmLocaleText?.('管理员与 SA 请前往管理员专属站登录和处理工作。')||'管理员与 SA 请前往管理员专属站登录和处理工作。'}`);
    const password=document.getElementById('loginPassword');if(password)password.value='';
    return true;
  };
  const button=document.getElementById('loginBtn');
  if(!button)return;
  button.addEventListener('click',async()=>{
    const identity=document.getElementById('adminIdentity');
    const email=document.getElementById('loginEmail')?.value.trim()||'';
    const fallbackEmail=document.getElementById('adminFallbackEmail')?.value.trim()||'';
    const password=document.getElementById('loginPassword')?.value||'';
    if(identity&&!identity.disabled&&!identity.value){showToast('请先选择登录身份');return;}
    if(identity&&identity.disabled&&!fallbackEmail){showToast('请输入管理员邮箱');return;}
    if(!identity&&!email){showToast('请输入邮箱');return;}
    if(!password){showToast('请输入密码');return;}
    button.disabled=true;
    try{
      const body=identity?(identity.disabled?{email:fallbackEmail,password}:{account_id:Number(identity.value),password}):{email,password};
      const res=await fetch('https://api.bpmuseum.org.cn/api/login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await res.json();
      if(!res.ok||!data.id)throw Error(data.error||'账号或密码错误');
      if(window.bpmHandleClientAdminLogin(data))return;
      localStorage.setItem('currentUser',JSON.stringify(data));
      if(data.admin_context)sessionStorage.setItem('bpm_admin_entry_authenticated','1');
      showToast('登录成功');
      const requestedNext=new URLSearchParams(location.search).get('next')||'';
      const next=data.role==='superadministrator'?'sa.html#saReviewQueuePanel':(/^[a-zA-Z0-9_-]+\.html(?:[?#][^\s]*)?$/.test(requestedNext)?requestedNext:(data.admin_context?'console.html':'index.html'));
      location.href=next;
    }catch(error){
      console.error(error);
      showToast(error?.message||'登录请求未完成，请检查网络后重试');
    }finally{button.disabled=false;}
  });
})();
