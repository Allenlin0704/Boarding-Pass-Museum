(() => {
  const API='https://api.bpmuseum.org.cn';
  const email=document.getElementById('loginEmail'),password=document.getElementById('loginPassword');
  const role=document.getElementById('adminRole'),status=document.getElementById('adminLoginHelp');
  const post=async(path,body)=>{const response=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error||'请求失败');return data;};
  const fail=error=>{if(typeof showToast==='function')showToast(error.message);else status.textContent=error.message;};
  const pinLogin=document.getElementById('adminPinLogin');
  pinLogin?.addEventListener('click',async()=>{try{pinLogin.disabled=true;const user=await post('/api/account/admin-pin/login',{email:email.value.trim(),pin:document.getElementById('adminPin').value,admin_role:role.value});sessionStorage.setItem('bpm_admin_entry_authenticated','1');localStorage.setItem('currentUser',JSON.stringify(user));location.replace('console.html');}catch(error){fail(error);}finally{pinLogin.disabled=false;}});
  document.getElementById('saveAdminPin')?.addEventListener('click',async()=>{try{const pin=document.getElementById('newAdminPin').value;await post('/api/account/admin-pin/setup',{email:email.value.trim(),password:password.value,pin,admin_role:role.value});document.getElementById('newAdminPin').value='';status.textContent='PIN 已保存。现在可以用邮箱和 PIN 登录管理中心。';}catch(error){fail(error);}});
})();
