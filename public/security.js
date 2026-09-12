// Attach the HttpOnly session cookie to this site's API requests.
(() => {
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,init={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    if(url.origin==='https://api.bpmuseum.org.cn' || url.origin==='http://localhost:8789') {
      if(['localhost','127.0.0.1'].includes(location.hostname)) {
        url.protocol='http:';url.host='localhost:8789';input=typeof input==='string'?url.href:new Request(url,input);
      }
      return nativeFetch(input,{...init,credentials:'include'}).then(response=>{
        if(response.status===401 && !url.pathname.includes('login')) {
          const wasLoggedIn=localStorage.getItem('currentUser');
          localStorage.removeItem('currentUser');
          if(wasLoggedIn) {
            const show=()=>{if(document.getElementById('sessionNotice'))return;const notice=document.createElement('div');notice.id='sessionNotice';notice.setAttribute('role','status');notice.style.cssText='padding:14px;text-align:center;background:#cbf0ff;color:#003c6b';notice.append('登录已失效或网站已完成安全升级，请重新登录后继续。 ');const link=document.createElement('a');link.href='login.html';link.textContent='重新登录';notice.append(link);document.body.prepend(notice);};
            if(document.body)show();else document.addEventListener('DOMContentLoaded',show,{once:true});
          }
        }
        return response;
      });
    }
    return nativeFetch(input,init);
  };
})();
window.bpmEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.bpmSafeRecord=record=>Object.fromEntries(Object.entries(record).map(([key,value])=>[key,typeof value==='string'?bpmEscape(value):value]));
