const noticeAPI='https://api.bpmuseum.org.cn';
const text=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){try{
  const res=await fetch(noticeAPI+'/api/notifications');const data=await res.json();if(!res.ok)throw Error(data.error);
  document.getElementById('notifications').innerHTML=data.notifications.map(n=>`<article class="bpm-panel"><p>${text(n.content)}</p><small>${text(n.created_at)}</small></article>`).join('')||'暂无通知';
  document.getElementById('actions').innerHTML=data.actions.map(a=>`<article class="bpm-panel">#${Number(a.id)} · ${text(a.created_at)}<p>${text(a.clause)}：${text(a.reason)}</p>${a.revoked_at?'已撤销或已由最终处理取代':`<button data-action="${Number(a.id)}">提交申诉</button>`}</article>`).join('')||'暂无处理记录';
  document.getElementById('appeals').innerHTML=data.appeals.map(a=>`<article class="bpm-panel">${text(a.status)}<p>${text(a.reason)}</p><p>${text(a.decision)}</p></article>`).join('')||'暂无申诉';
}catch(error){document.getElementById('notifications').textContent=error.message;}}
document.addEventListener('click',async event=>{const button=event.target.closest('[data-action]');if(!button)return;const reason=prompt('请说明申诉理由：');if(!reason)return;button.disabled=true;try{const res=await fetch(noticeAPI+'/api/community/moderation-appeal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action_id:Number(button.dataset.action),reason})});const data=await res.json();if(!res.ok)throw Error(data.error);await load();}catch(error){alert(error.message);}finally{button.disabled=false;}});
load();
