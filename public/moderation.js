const endpoint='https://api.bpmuseum.org.cn';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,body){const res=await fetch(endpoint+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await res.json();if(!res.ok)throw Error(data.error||'操作失败');return data;}
async function refresh(){
  try {
    const actor=await api('/api/session');if(actor.id!==1||actor.role!=='superadministrator')throw Error('仅站主可访问');
    const [posts,reports,appeals]=await Promise.all([api('/api/sa/community/posts'),api('/api/sa/community/reports'),api('/api/sa/community/appeals')]);
    document.getElementById('moderationPosts').innerHTML=posts.posts.map(p=>`<article class="bpm-moderation-row"><strong>#${Number(p.id)} ${escape(p.title)}</strong><p>${escape(p.content)}</p><p>${escape(p.status)} ${p.needs_review?'· 需 SA 复核':''}</p><button data-fill="${Number(p.id)}">处理此帖子</button></article>`).join('')||'暂无帖子';
    document.getElementById('moderationReports').innerHTML=reports.reports.map(r=>`<article class="bpm-moderation-row">举报 #${Number(r.id)} · ${escape(r.target_type)} #${Number(r.target_id)}<p>${escape(r.category)}：${escape(r.reason)}</p><p>${escape(r.status)} ${escape(r.resolution)}</p>${r.status==='pending'?`<button data-report="${Number(r.id)}" data-decision="upheld">举报成立</button><button data-report="${Number(r.id)}" data-decision="dismissed">举报不成立</button><button data-report="${Number(r.id)}" data-decision="malicious">查实故意诬陷</button>`:''}</article>`).join('')||'暂无举报';
    document.getElementById('moderationAppeals').innerHTML=appeals.appeals.map(a=>`<article class="bpm-moderation-row">申诉 #${Number(a.id)} · 处理记录 #${Number(a.action_id)}<p>${escape(a.reason)}</p><p>复审截止：${escape(a.due_at)} · ${escape(a.status)}</p>${a.status==='pending'?`<button data-appeal="${Number(a.id)}" data-status="approved">批准申诉</button><button data-appeal="${Number(a.id)}" data-status="rejected">驳回申诉</button>`:''}</article>`).join('')||'暂无申诉';
  }catch(error){document.getElementById('moderationMessage').textContent=error.message;}
}
document.getElementById('moderationForm').onsubmit=async event=>{
  event.preventDefault();const body=Object.fromEntries(new FormData(event.target));
  if(!confirm(`确定执行此操作？处理类型：${body.severity}，内容 #${body.target_id}`))return;
  event.submitter.disabled=true;try{await api('/api/sa/community/moderate',body);document.getElementById('moderationMessage').textContent='处理已保存';await refresh();}catch(error){document.getElementById('moderationMessage').textContent=error.message;}finally{event.submitter.disabled=false;}
};
document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.fill){const form=document.getElementById('moderationForm');form.elements.target_id.value=button.dataset.fill;form.scrollIntoView({behavior:'smooth'});return;}
  const report=button.dataset.report,appeal=button.dataset.appeal;if(!report&&!appeal)return;
  const reason=prompt('请输入处理依据或最终裁定：');if(!reason)return;
  button.disabled=true;try{await api(report?'/api/sa/community/reports/resolve':'/api/sa/community/appeals/resolve',report?{report_id:Number(report),decision:button.dataset.decision,reason}:{appeal_id:Number(appeal),status:button.dataset.status,decision:reason});await refresh();}catch(error){alert(error.message);button.disabled=false;}
});
refresh();
