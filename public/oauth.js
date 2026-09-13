(()=>{
  const API='https://api.bpmuseum.org.cn',host=document.querySelector('[data-oauth]');
  if(!host)return;
  const labels={apple:'Apple',microsoft:'Microsoft'};
  const start=async provider=>{
    const button=host.querySelector(`[data-provider="${provider}"]`);button.disabled=true;
    try{const response=await fetch(`${API}/api/oauth/${provider}/start`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:host.dataset.oauth})}),data=await response.json();if(!response.ok)throw Error(data.error||'登录暂不可用');location.assign(data.url);}
    catch(error){(window.showToast||alert)(error.message||'登录暂不可用');button.disabled=false;}
  };
  fetch(`${API}/api/oauth/providers`,{credentials:'include'}).then(response=>response.json()).then(status=>{
    const linked=new Set(status.linked||[]);
    for(const provider of ['apple','microsoft']){
      const button=host.querySelector(`[data-provider="${provider}"]`);
      if(!button)continue;
      button.hidden=!status[provider];
      if(host.dataset.oauth==='link'&&linked.has(provider)){button.disabled=true;button.textContent=`已绑定 ${labels[provider]}`;}
      else button.onclick=()=>start(provider);
    }
    host.hidden=!status.apple&&!status.microsoft;
  }).catch(()=>{host.hidden=true;});
})();
