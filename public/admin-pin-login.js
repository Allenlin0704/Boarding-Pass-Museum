(() => {
  const API='https://api.bpmuseum.org.cn';
  const identity=document.getElementById('adminIdentity');
  const password=document.getElementById('loginPassword');
  const status=document.getElementById('adminLoginHelp');
  const post=async(path,body)=>{const response=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error||'请求失败');return data;};
  const selectedIdentity=()=>{if(identity&&!identity.disabled){const id=Number(identity.value);if(!Number.isSafeInteger(id)||id<1)throw Error('请先选择登录身份');return{account_id:id};}const email=document.getElementById('adminFallbackEmail')?.value.trim()||'';if(email)return{email};throw Error('管理员名单暂不可用，请刷新页面重试');};
  const fail=error=>{if(typeof showToast==='function')showToast(error.message);else if(status)status.textContent=error.message;};
  const pinLogin=document.getElementById('adminPinLogin');
  pinLogin?.addEventListener('click',async()=>{try{pinLogin.disabled=true;const user=await post('/api/account/admin-pin/login',{...selectedIdentity(),pin:document.getElementById('adminPin').value});sessionStorage.setItem('bpm_admin_entry_authenticated','1');localStorage.setItem('currentUser',JSON.stringify(user));location.replace(user.role==='superadministrator'?'sa.html#saReviewQueuePanel':'console.html');}catch(error){fail(error);}finally{pinLogin.disabled=false;}});
  document.getElementById('saveAdminPin')?.addEventListener('click',async()=>{try{const pin=document.getElementById('newAdminPin').value;await post('/api/account/admin-pin/setup',{...selectedIdentity(),password:password?.value||'',pin});document.getElementById('newAdminPin').value='';status.textContent='PIN 已保存。之后可选择该账户并使用 PIN 登录。';}catch(error){fail(error);}});
})();
