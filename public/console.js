const consoleApi="https://api.bpmuseum.org.cn";
const welcome=document.getElementById("consoleWelcome");
const frame=document.getElementById("consoleFrame");
const controls=[...document.querySelectorAll(".bpm-console-nav")];
const selectPage=button=>{
  controls.forEach(control=>control.classList.toggle("active",control===button));
  frame.src=button.dataset.page;
};
controls.forEach(button=>button.addEventListener("click",()=>selectPage(button)));
(async()=>{
  try{
    const response=await fetch(`${consoleApi}/api/session`);
    const account=await response.json();
    if(!response.ok||!account.id)throw Error("请先登录");
    welcome.textContent=account.role==="user"?"管理员申请":`${account.username} 的工作区`;
    if(account.role==="user"){
      controls.forEach(control=>control.hidden=true);
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
