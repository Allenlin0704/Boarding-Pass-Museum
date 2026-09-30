const noticeAPI='https://api.bpmuseum.org.cn';
const text=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){try{
  const res=await fetch(noticeAPI+'/api/notifications');const data=await res.json();if(!res.ok)throw Error(data.error);
  document.getElementById('notifications').innerHTML=data.notifications.map(n=>`<article class="bpm-panel"><p>${text(n.content)}</p><small>${text(n.created_at)}</small></article>`).join('')||'暂无通知';
  document.getElementById('actions').innerHTML=data.actions.map(a=>`<article class="bpm-panel">#${Number(a.id)} · ${text(a.created_at)}<p>${text(a.clause)}：${text(a.reason)}</p>${a.revoked_at?'已撤销或已由最终处理取代':`<button data-action="${Number(a.id)}">提交申诉</button>`}</article>`).join('')||'暂无处理记录';
  document.getElementById('appeals').innerHTML=data.appeals.map(a=>`<article class="bpm-panel">${text(a.status)}<p>${text(a.reason)}</p><p>${text(a.decision)}</p></article>`).join('')||'暂无申诉';
}catch(error){document.getElementById('notifications').textContent=error.message;}}
const photoInviteBox=document.getElementById('sitePhotoInvitations');
const photoInviteSection=document.getElementById('sitePhotoInvitationsSection');
const photoUploadDialog=document.getElementById('sitePhotoUploadDialog');
const photoUploadForm=document.getElementById('sitePhotoUploadForm');
async function loadPhotoInvitations(){
  if(!photoInviteBox||!photoInviteSection)return;
  try{
    const response=await fetch(`${noticeAPI}/api/admin/site-photo-invitations`,{credentials:'include'});
    if(!response.ok){photoInviteSection.hidden=true;return;}
    const rows=await response.json();
    if(!Array.isArray(rows)||!rows.length){photoInviteSection.hidden=true;return;}
    photoInviteSection.hidden=false;
    photoInviteBox.innerHTML=rows.map(row=>{
      const id=Number(row.id),status=String(row.status||''),note=text(row.review_note||'');
      const state=status==='invited'?'等待你选择是否参加':status==='accepted'?'已同意，请上传照片与署名':status==='pending_review'?'照片已提交，等待 SA 审核':status==='approved'?'SA 已通过，照片已加入轮播':status==='rejected'?`未通过审核${note?`：${note}`:''}`:status==='declined'?'你已选择暂不参加':'';
      const actions=status==='invited'?`<button type="button" data-photo-invite-action="accepted" data-invitation-id="${id}">同意并继续</button><button type="button" data-photo-invite-action="declined" data-invitation-id="${id}">不同意</button>`:status==='accepted'?`<button type="button" data-photo-upload-id="${id}">上传照片</button>`:'';
      return `<article class="bpm-panel site-photo-invitation"><p><strong>主页照片征集邀请</strong></p><p>${state}</p><small>${text(row.created_at||'')}</small><div class="bpm-dialog-actions">${actions}</div></article>`;
    }).join('');
  }catch{photoInviteSection.hidden=true;}
}
const appealDialog=document.getElementById('appealDialog');
const appealForm=document.getElementById('appealForm');
let appealActionId=null;
document.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button)return;appealActionId=Number(button.dataset.action);appealForm.reset();document.getElementById('appealError').textContent='';appealDialog.showModal();});
appealForm.addEventListener('click',event=>{if(event.target.value==='cancel')appealDialog.close();});
appealForm.addEventListener('submit',async event=>{event.preventDefault();const submit=event.submitter,reason=new FormData(appealForm).get('reason').trim();if(!reason)return;submit.disabled=true;try{const res=await fetch(noticeAPI+'/api/community/moderation-appeal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action_id:appealActionId,reason})});const data=await res.json();if(!res.ok)throw Error(data.error);appealDialog.close();await load();}catch(error){document.getElementById('appealError').textContent=error.message||'提交失败';}finally{submit.disabled=false;}});
load();
loadPhotoInvitations();

photoInviteBox?.addEventListener('click',async event=>{
  const responseButton=event.target.closest('[data-photo-invite-action]');
  const uploadButton=event.target.closest('[data-photo-upload-id]');
  if(uploadButton){photoUploadForm.dataset.invitationId=uploadButton.dataset.photoUploadId;photoUploadForm.reset();document.getElementById('sitePhotoUploadStatus').textContent='';photoUploadDialog.showModal();return;}
  if(!responseButton)return;
  const id=Number(responseButton.dataset.invitationId),answer=responseButton.dataset.photoInviteAction;responseButton.disabled=true;
  try{
    const response=await fetch(`${noticeAPI}/api/admin/site-photo-invitations/${id}/respond`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({response:answer})}),result=await response.json();
    if(!response.ok)throw Error(result.error||'处理邀请失败');
    await loadPhotoInvitations();
    if(answer==='accepted'){photoUploadForm.dataset.invitationId=String(id);photoUploadForm.reset();document.getElementById('sitePhotoUploadStatus').textContent='';photoUploadDialog.showModal();}
  }catch(error){responseButton.disabled=false;window.alert(error.message);}
});

document.getElementById('cancelSitePhotoUpload')?.addEventListener('click',()=>photoUploadDialog.close());
photoUploadForm?.addEventListener('submit',async event=>{
  event.preventDefault();const button=document.getElementById('submitSitePhoto'),status=document.getElementById('sitePhotoUploadStatus'),id=Number(photoUploadForm.dataset.invitationId);
  if(!id)return;button.disabled=true;status.textContent='正在上传照片并送交 SA 审核…';
  try{
    const form=new FormData(photoUploadForm);form.set('license_confirmed',photoUploadForm.elements.license_confirmed.checked?'1':'0');
    const response=await fetch(`${noticeAPI}/api/admin/site-photo-requests/${id}/submit`,{method:'POST',credentials:'include',body:form}),result=await response.json();
    if(!response.ok)throw Error(result.error||'提交失败');
    photoUploadDialog.close();await loadPhotoInvitations();window.alert('照片已送交 SA 审核，通过后才会加入每日轮播。');
  }catch(error){status.textContent=error.message||'提交失败';}
  finally{button.disabled=false;}
});
