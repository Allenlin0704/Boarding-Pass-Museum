const api='https://api.bpmuseum.org.cn';
const form=document.getElementById('communitySubmitForm'),dialog=document.getElementById('communityRules'),message=document.getElementById('postMessage');
let rulesLoaded=false;
fetch('community-rules.txt').then(r=>{if(!r.ok)throw Error();return r.text();}).then(text=>{document.getElementById('communityRulesText').textContent=text;rulesLoaded=true;}).catch(()=>{document.getElementById('communityRulesText').textContent='条例加载失败，请刷新后重试。';});
form.addEventListener('submit',async event=>{
  event.preventDefault();message.textContent='';
  try {const res=await fetch(`${api}/api/session`);if(!res.ok){location.href='login.html';return;}if(!rulesLoaded)throw Error('条例尚未加载，请稍后再试');dialog.showModal();}catch(error){message.textContent=error.message;}
});
document.getElementById('cancelPublish').onclick=()=>dialog.close();
document.getElementById('acceptPublish').onclick=async()=>{
  const button=document.getElementById('acceptPublish');button.disabled=true;
  try {
    let image='';const file=document.getElementById('postImage').files[0];
    if(file){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('请选择10 MB以内的 PNG、JPEG 或 WebP 图片');
      const data=new FormData();data.append('image',file);const res=await fetch(`${api}/api/upload-image`,{method:'POST',body:data});const result=await res.json();if(!res.ok)throw Error(result.error||'图片上传失败');image=result.url;}
    const res=await fetch(`${api}/api/community/posts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:document.getElementById('postTitle').value.trim(),content:document.getElementById('postContent').value.trim(),image,rules_version:'2026-09-06'})});
    const result=await res.json();if(!res.ok)throw Error(result.error||'发布失败');location.href='community.html';
  }catch(error){dialog.close();message.textContent=error.message;}finally{button.disabled=false;}
};
