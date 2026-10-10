const consoleApi="https://api.bpmuseum.org.cn";
const welcome=document.getElementById("consoleWelcome");
const frame=document.getElementById("consoleFrame");
window.addEventListener("message",event=>{
  if(event.origin!==location.origin||event.source!==frame?.contentWindow||event.data?.type!=="bpm-admin-frame-height")return;
  const height=Number(event.data.height);
  if(Number.isFinite(height))frame.style.height=Math.max(560,Math.min(7000,height))+"px";
});
const controls=[...document.querySelectorAll(".bpm-console-nav[data-page]")];
const selectPage=button=>{
  controls.forEach(control=>control.classList.toggle("active",control===button));
  frame.src=button.dataset.page;
};
controls.forEach(button=>button.addEventListener("click",()=>selectPage(button)));
document.getElementById("consoleChatButton")?.addEventListener("click",()=>frame.contentWindow.postMessage('bpm-open-staff-chat',location.origin));
(async()=>{
  try{
    const response=await fetch(`${consoleApi}/api/session`,{credentials:"include",cache:"no-store"});
    const account=await response.json();
    if(!response.ok||!account.id)throw Error("请先登录");
    welcome.innerHTML=account.role==="user"?window.bpmLocaleText("管理员申请"):`<span data-user-content>${String(account.username||"").replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}</span> ${window.bpmLocaleText("的工作区")}`;
    if(account.role==="user"){
      controls.forEach(control=>control.hidden=true);
      document.getElementById("consoleChatButton").hidden=true;
      const hint=document.createElement("p");
      hint.className="bpm-console-application-hint";
      hint.textContent="填写申请理由和社交账号，提交后由站主审核。";
      document.querySelector(".bpm-console-sidebar").append(hint);
      frame.src="admin.html?embed=1#admin-apply";
    }else if(!["administrator","superadministrator"].includes(account.role))throw Error("无权限");
  }catch{
    location.replace("login.html");
  }
})();
