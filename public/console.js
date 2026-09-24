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
    if(!response.ok||!["administrator","superadministrator"].includes(account.role))throw Error("无权限");
    welcome.textContent=`${account.username} 的工作区`;
  }catch{
    location.replace("login.html");
  }
})();
