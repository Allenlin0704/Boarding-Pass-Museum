const apiFetch=async(input,init={})=>{let response=await fetch(input,{...init,credentials:"include"});if(response.status===428){const resumed=await window.bpmShowSAStepup?.();if(resumed===true)response=await fetch(input,{...init,credentials:"include"});}return response;};
const API = "https://api.bpmuseum.org.cn";

function showToast(message){
    let toast=document.getElementById("bpmToast");
    if(!toast){toast=document.createElement("div");toast.id="bpmToast";document.body.appendChild(toast);}
    toast.textContent=String(message||"");
    toast.className="bpm-toast-show";
    clearTimeout(window.bpmSAToastTimer);
    window.bpmSAToastTimer=setTimeout(()=>{toast.className="";},2500);
}

const user = JSON.parse(
    localStorage.getItem("currentUser")
);


if(!user || user.role !== "superadministrator"){
    document.body.innerHTML="<h1>无权限</h1>";
    throw new Error("No SA");
}


const welcome = document.getElementById("welcome");

if(welcome){
    welcome.innerHTML=`${window.bpmLocaleText("欢迎")} <span data-user-content>${String(user.username||"").replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}</span>`;
}



// ==========================
// 申诉管理
// ==========================

async function loadAppeals(){

    const box=document.getElementById("appeals");

    if(!box)return;


    try{

        const res = await apiFetch(
            `${API}/api/sa/appeals?sa_id=${user.id}`
        );


        const data = await res.json();


        box.innerHTML="";


        if(!Array.isArray(data) || data.length===0){

            box.innerHTML="暂无申诉";

            return;
        }



        data.forEach(x=>{
            x=bpmSafeRecord(x);

            box.innerHTML+=`

            <div class="card">

            <h3>申诉 #${x.id}</h3>

            <p>投稿ID:${x.flight_id}</p>

            <p>原因:${x.reason}</p>

            <p>状态:${x.status}</p>

            <a href="detail.html?id=${Number(x.flight_id)}" target="_blank" rel="noopener">在新窗口查看展品</a>

            ${x.status==='pending'?`<div class="appeal-actions"><button type="button" data-flight-appeal="${Number(x.id)}" data-flight-id="${Number(x.flight_id)}" data-result="approve">通过申诉</button><button type="button" data-flight-appeal="${Number(x.id)}" data-flight-id="${Number(x.flight_id)}" data-result="reject">驳回申诉</button></div>`:''}

            </div>

            `;

        });


    }catch(e){

        box.innerHTML="加载失败:"+e.message;

    }

}

document.getElementById("appeals")?.addEventListener("click",async event=>{
  const button=event.target.closest("button[data-flight-appeal]");if(!button)return;button.disabled=true;
  try{const response=await apiFetch(`${API}/api/sa/appeal/${button.dataset.result}`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,appeal_id:Number(button.dataset.flightAppeal),flight_id:Number(button.dataset.flightId)})}),result=await response.json();if(!response.ok)throw Error(result.error||"处理失败");await loadAppeals();showToast("申诉已处理");}catch(error){button.disabled=false;showToast(error.message);}
});

async function loadFlightCorrections(){
  const box=document.getElementById("flightCorrections");if(!box)return;
  try{
    const response=await apiFetch(`${API}/api/sa/flight-corrections?sa_id=${user.id}`,{credentials:"include"}),rows=await response.json();
    if(!response.ok)throw Error(rows.error||"加载失败");
    if(!Array.isArray(rows)||!rows.length){box.textContent="暂无待处理纠错";return;}
    box.innerHTML=rows.map(raw=>{const x=bpmSafeRecord(raw);return `<article class="card"><h3>${escapeSACommunityHTML(x.airline)} ${escapeSACommunityHTML(x.flight)} · #${Number(x.flight_id)}</h3><p>投稿人：${escapeSACommunityHTML(x.username)} · ${escapeSACommunityHTML(x.created_at)}</p><p>${escapeSACommunityHTML(x.message)}</p><a href="detail.html?id=${Number(x.flight_id)}" target="_blank" rel="noopener">在新窗口查看展品</a><div class="sa-review-actions"><button type="button" data-correction-edit="${Number(x.id)}" data-flight-id="${Number(x.flight_id)}" data-correction-message="${escapeSACommunityHTML(x.message)}">采纳并编辑展品</button><button type="button" class="secondary-button" data-correction="${Number(x.id)}" data-status="dismissed">不采纳</button></div></article>`;}).join("");
  }catch(error){box.textContent=`加载失败：${error.message}`;}
}

async function loadReviewerSchedule(){
  const box=document.getElementById("reviewerSchedule");if(!box)return;
  try{const response=await apiFetch(`${API}/api/sa/reviewer-schedule?sa_id=${user.id}`,{credentials:"include"}),rows=await response.json();if(!response.ok)throw Error(rows.error||"加载失败");
    box.innerHTML=rows.map(row=>`<label class="reviewer-schedule-row" data-schedule-row="${Number(row.id)}"><span><strong>${escapeSACommunityHTML(row.username)}</strong><small>${row.role==="superadministrator"?"SA":"管理员"}</small></span><span class="reviewer-percent-field"><input type="number" min="0" max="100" step="1" inputmode="numeric" aria-label="${escapeSACommunityHTML(row.username)} 的稿件分配百分比" data-reviewer-id="${Number(row.id)}" value="${Math.max(0,Math.min(100,Number(row.allocation_percent)||0))}"><span>%</span></span></label>`).join("")||"目前没有可排班的管理员。";
    updateReviewerScheduleTotal();
  }catch(error){box.textContent=`加载失败：${error.message}`;}
}

function updateReviewerScheduleTotal(){
  const inputs=[...document.querySelectorAll("#reviewerSchedule [data-reviewer-id]")];
  const total=inputs.reduce((sum,input)=>sum+(Number(input.value)||0),0);
  const totalNode=document.getElementById("reviewerScheduleTotal"),save=document.getElementById("saveReviewerSchedule");
  if(totalNode)totalNode.textContent=window.bpmT("sa.reviewerScheduleTotal","当前合计：{percent}%（需要 100%）").replace("{percent}",String(total));
  if(save)save.disabled=total!==100||inputs.length===0;
}
document.getElementById("reviewerSchedule")?.addEventListener("input",updateReviewerScheduleTotal);

document.getElementById("saveReviewerSchedule")?.addEventListener("click",async event=>{
  const status=document.getElementById("reviewerScheduleStatus"),button=event.currentTarget;
  const allocations=[...document.querySelectorAll("#reviewerSchedule [data-reviewer-id]")].map(input=>({user_id:Number(input.dataset.reviewerId),percent:Number(input.value)}));
  if(allocations.reduce((sum,row)=>sum+row.percent,0)!==100){updateReviewerScheduleTotal();status.textContent=window.bpmLocaleText("总分配比例必须正好为 100%。");return;}button.disabled=true;status.textContent=window.bpmLocaleText("保存中…");
  try{const response=await apiFetch(`${API}/api/sa/reviewer-schedule`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({reviewer_allocations:allocations})}),result=await response.json();if(!response.ok)throw Error(result.error||"保存失败");status.textContent=window.bpmLocaleText("分配比例已保存。");await loadReviewerSchedule();}catch(error){status.textContent=window.bpmLocaleText(error.message);}finally{updateReviewerScheduleTotal();}
});

const sitePhotoUrl=value=>{
  try{const parsed=new URL(String(value||""),location.origin);return [location.origin,"https://images.bpmuseum.org.cn"].includes(parsed.origin)?parsed.href:"/favicon.png";}catch{return "/favicon.png";}
};

const photoWeekdays=[[1,"星期一"],[2,"星期二"],[3,"星期三"],[4,"星期四"],[5,"星期五"],[6,"星期六"],[7,"星期日"]];
const photoWeekdayLabel=weekday=>window.bpmT(`sa.photoWeekday.${weekday}`,photoWeekdays.find(([value])=>value===Number(weekday))?.[1]||"星期一");
const photoWeekdaySelect=weekday=>`<label>${window.bpmT("sa.photoWeekdayLabel","展示星期")}<select data-photo-weekday>${photoWeekdays.map(([value,label])=>`<option value="${value}" ${Number(weekday)===value?"selected":""}>${photoWeekdayLabel(value)}</option>`).join("")}</select></label>`;

function addPhotoFocusPicker(card, imageUrl, x=18, y=47, hint="拖动圆点选择移动端/小窗口结束焦点"){
  card.dataset.photoFocusX=String(x);card.dataset.photoFocusY=String(y);
  const picker=document.createElement("div");picker.className="site-photo-focus-picker";picker.dataset.photoFocusPicker="";picker.setAttribute("role","slider");picker.setAttribute("tabindex","0");picker.setAttribute("aria-label","拖动选择移动端焦点");picker.setAttribute("aria-valuemin","0");picker.setAttribute("aria-valuemax","100");picker.setAttribute("aria-valuenow",String(x));picker.style.backgroundImage=`url("${sitePhotoUrl(imageUrl)}")`;
  const marker=document.createElement("span");marker.dataset.photoFocusMarker="";marker.style.left=`${x}%`;marker.style.top=`${y}%`;const note=document.createElement("small");note.textContent=hint;picker.append(marker,note);card.querySelector("img")?.after(picker);return picker;
}

async function loadSitePhotoManager(){
  const library=document.getElementById("sitePhotoLibrary");if(!library)return;
  const requestsBox=document.getElementById("sitePhotoRequests"),adminSelect=document.getElementById("sitePhotoInviteAdmins");
  try{
    const response=await apiFetch(`${API}/api/sa/site-photos?sa_id=${user.id}`,{credentials:"include"}),data=await response.json();
    if(!response.ok)throw Error(data.error||"加载失败");
    const occupiedWeekdays=new Set(data.photos.filter(photo=>photo.active).map(photo=>Number(photo.weekday)));
    const suggestedWeekday=photoWeekdays.find(([weekday])=>!occupiedWeekdays.has(weekday))?.[0]||1;
    if(adminSelect){const selected=new Set([...adminSelect.selectedOptions].map(option=>option.value));adminSelect.innerHTML=data.admins.map(admin=>`<option value="${Number(admin.id)}" ${selected.has(String(admin.id))?"selected":""}>${escapeSACommunityHTML(admin.username)} · ID ${Number(admin.id)}</option>`).join("")||"<option disabled>目前没有普通管理员</option>";}
    library.innerHTML=data.photos.map(photo=>`<article class="site-photo-card" data-site-photo="${Number(photo.id)}" data-photo-focus-x="${Number(photo.focus_x)||18}" data-photo-focus-y="${Number(photo.focus_y)||47}">
      <img src="${escapeSACommunityHTML(sitePhotoUrl(photo.image_url))}" alt="主页照片：${escapeSACommunityHTML(photo.credit)}" loading="lazy">
      <div class="site-photo-focus-picker" data-photo-focus-picker role="slider" tabindex="0" aria-label="拖动选择移动端焦点" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Number(photo.focus_x)||18}" style="background-image:url(&quot;${escapeSACommunityHTML(sitePhotoUrl(photo.image_url))}&quot;)"><span data-photo-focus-marker style="left:${Number(photo.focus_x)||18}%;top:${Number(photo.focus_y)||47}%"></span><small>拖动圆点选择移动端/小窗口结束焦点</small></div>
      <div class="site-photo-card-body"><strong>照片 #${Number(photo.id)}</strong><label>照片署名<input type="text" maxlength="100" data-photo-credit value="${escapeSACommunityHTML(photo.credit)}"></label>
      ${photoWeekdaySelect(photo.weekday)}
      <div class="site-photo-placements"><label><input type="checkbox" data-photo-home ${photo.show_home?"checked":""}> 首页</label><label><input type="checkbox" data-photo-login ${photo.show_login?"checked":""}> 登录页</label><label><input type="checkbox" data-photo-register ${photo.show_register?"checked":""}> 注册页</label><label><input type="checkbox" data-photo-active ${photo.active?"checked":""}> 启用</label></div>
      <div class="site-photo-card-actions"><button type="button" data-site-photo-preview="home">预览首页</button><button type="button" data-site-photo-preview="login">预览登录页</button><button type="button" data-site-photo-preview="register">预览注册页</button><button type="button" data-save-site-photo="${Number(photo.id)}">保存设置</button></div></div></article>`).join("")||"<p>还没有排期照片。</p>";
    requestsBox.innerHTML=data.requests.map(request=>`<article class="site-photo-card site-photo-request" data-photo-request="${Number(request.id)}" data-photo-focus-x="${Number(request.focus_x)||18}" data-photo-focus-y="${Number(request.focus_y)||47}">
      <img src="${escapeSACommunityHTML(sitePhotoUrl(request.image_url))}" alt="待审核照片：${escapeSACommunityHTML(request.credit)}" loading="lazy">
      <div class="site-photo-card-body"><strong>${escapeSACommunityHTML(request.admin_name)} 提交 · #${Number(request.id)}</strong><p>署名：${escapeSACommunityHTML(request.credit)}</p>
      <div class="site-photo-placements"><label><input type="checkbox" data-photo-home ${Number(request.show_home)?"checked":""}> 首页</label><label><input type="checkbox" data-photo-login ${Number(request.show_login)?"checked":""}> 登录页</label><label><input type="checkbox" data-photo-register ${Number(request.show_register)?"checked":""}> 注册页</label></div>
      ${photoWeekdaySelect(Number(request.weekday)||suggestedWeekday)}
      <label>审核说明（驳回时展示给投稿管理员）<textarea data-photo-review-note rows="3" maxlength="1000"></textarea></label>
      <div class="site-photo-card-actions"><button type="button" data-site-photo-preview="home">预览首页</button><button type="button" data-site-photo-preview="login">预览登录页</button><button type="button" data-site-photo-preview="register">预览注册页</button><button type="button" data-photo-request-decision="approved">通过并加入排期</button><button type="button" data-photo-request-decision="rejected">拒绝</button></div></div></article>`).join("")||"<p>目前没有待审核照片。</p>";
    data.photos.forEach(photo=>{const card=library.querySelector(`[data-site-photo="${Number(photo.id)}"]`);if(card)addPhotoFocusPicker(card,photo.image_url,Number(photo.focus_x)||18,Number(photo.focus_y)||47);});
    data.requests.forEach(request=>{const card=requestsBox.querySelector(`[data-photo-request="${Number(request.id)}"]`);if(card)addPhotoFocusPicker(card,request.image_url,Number(request.focus_x)||18,Number(request.focus_y)||47,"审核通过后此焦点用于移动端/小窗口");});
  }catch(error){library.textContent=`照片管理加载失败：${error.message}`;if(requestsBox)requestsBox.textContent="";}
}

document.getElementById("sendSitePhotoInvites")?.addEventListener("click",async event=>{
  const button=event.currentTarget,status=document.getElementById("sitePhotoInviteStatus"),select=document.getElementById("sitePhotoInviteAdmins"),ids=[...select.selectedOptions].map(option=>Number(option.value));
  if(!ids.length){status.textContent="请先选择要邀请的管理员。";return;}button.disabled=true;status.textContent="正在发送邀请…";
  try{const response=await apiFetch(`${API}/api/sa/site-photo-invitations`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,admin_ids:ids})}),result=await response.json();if(!response.ok)throw Error(result.error||"发送失败");status.textContent=`已邀请 ${result.invited} 位管理员。${result.skipped?.length?` ${result.skipped.length} 位已有待处理邀请。`:""}`;await loadSitePhotoManager();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
});

document.getElementById("sitePhotoDirectUploadForm")?.addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=document.getElementById("sitePhotoDirectUploadButton"),status=document.getElementById("sitePhotoDirectUploadStatus"),file=form.elements.image.files[0];
  if(!file)return;
  if(![form.elements.show_home,form.elements.show_login,form.elements.show_register].some(input=>input.checked)){status.textContent="至少选择一个展示位置。";return;}
  button.disabled=true;status.textContent="正在压缩并上传照片…";
  try{
    const compressed=await window.bpmCompressImageFile(file),data=new FormData(form);
    data.set("image",compressed,"homepage-photo.webp");data.set("sa_id",String(user.id));
    const response=await apiFetch(`${API}/api/sa/site-photos/upload`,{method:"POST",credentials:"include",body:data}),result=await response.json();
    if(!response.ok)throw Error(result.error||"照片上传失败");
    form.reset();status.textContent=`已压缩为 WebP，最长边不超过 1280px，${(compressed.size/1024/1024).toFixed(2)} MB，并加入排期。`;
    await loadSitePhotoManager();
  }catch(error){status.textContent=error.message||"照片上传失败";}
  finally{button.disabled=false;}
});

document.getElementById("users")?.addEventListener("click",async event=>{
  const demote=event.target.closest("[data-demote-admin]");
  if(demote){openDemoteModal(Number(demote.dataset.demoteAdmin),demote.dataset.demoteName||"");return;}
  const add=event.target.closest("[data-add-staff-social]");
  if(add){add.closest("[data-staff-user]").querySelector("[data-staff-social-links]").insertAdjacentHTML("beforeend",staffSocialRow());return;}
  const remove=event.target.closest("[data-remove-staff-social]");
  if(remove){remove.closest("[data-staff-social-row]").remove();return;}
  const button=event.target.closest("[data-save-staff-social]");if(!button)return;
  const card=button.closest("[data-staff-user]"),links=[...card.querySelectorAll("[data-staff-social-row]")].map(row=>({platform:row.querySelector("[data-staff-social-platform]").value.trim(),url:row.querySelector("[data-staff-social-url]").value.trim()})).filter(link=>link.platform||link.url);button.disabled=true;
  if(links.some(link=>!link.platform||!link.url)){showToast("请为每条链接填写平台名称和 URL，或删除空行");button.disabled=false;return;}
  try{const response=await apiFetch(`${API}/api/sa/admin-social`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:Number(button.dataset.saveStaffSocial),links})}),result=await response.json();if(!response.ok)throw Error(result.error||"保存失败");showToast("管理员社交链接已保存");await loadUsers();}
  catch(error){showToast(error.message||"保存失败");button.disabled=false;}
});

function staffSocialRow(link={}){
  return `<div class="sa-staff-social-row" data-staff-social-row><label>平台名称<input type="text" maxlength="40" data-staff-social-platform value="${escapeSACommunityHTML(link.platform||"")}" placeholder="例如：小红书、B站、Facebook"></label><label>公开链接<input type="url" maxlength="500" data-staff-social-url value="${escapeSACommunityHTML(link.url||"")}" placeholder="https://…"></label><button type="button" class="secondary-button" data-remove-staff-social aria-label="删除此社交链接">删除</button></div>`;
}

function parseStaffSocialLinks(record){
  if(record.admin_social_links!==null&&record.admin_social_links!==undefined){try{const links=JSON.parse(record.admin_social_links);return Array.isArray(links)?links:[];}catch{return[];}}
  return /^https:\/\//i.test(record.social_media||"")?[{platform:"社交主页",url:record.social_media}]:[];
}

document.getElementById("heroPhotosPanel")?.addEventListener("click",async event=>{
  const preview=event.target.closest("[data-site-photo-preview]");
  if(preview){const card=preview.closest("[data-site-photo],[data-photo-request]"),image=card?.querySelector("img"),credit=card?.querySelector("[data-photo-credit]")?.value||card?.querySelector("p")?.textContent.replace(/^署名：/,"")||"";const dialog=document.getElementById("sitePhotoPreviewDialog"),stage=document.getElementById("sitePhotoPreviewStage"),placement=preview.dataset.sitePhotoPreview;stage.style.backgroundImage=`linear-gradient(180deg,rgba(3,15,29,.12),rgba(3,15,29,.7)),url("${sitePhotoUrl(image?.src)}")`;stage.style.backgroundPosition=`center,${card?.dataset.photoFocusX||18}% ${card?.dataset.photoFocusY||47}%`;document.getElementById("sitePhotoPreviewTitle").textContent=placement==="home"?"首页展厅":placement==="login"?"登录页": "注册页";document.getElementById("sitePhotoPreviewCredit").textContent=credit?`Photo by ${credit}`:"";dialog.showModal();return;}
  const save=event.target.closest("[data-save-site-photo]");
  if(save){const card=save.closest("[data-site-photo]"),id=Number(save.dataset.saveSitePhoto);save.disabled=true;try{const response=await apiFetch(`${API}/api/sa/site-photos/${id}`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,credit:card.querySelector("[data-photo-credit]").value,weekday:Number(card.querySelector("[data-photo-weekday]").value),show_home:card.querySelector("[data-photo-home]").checked,show_login:card.querySelector("[data-photo-login]").checked,show_register:card.querySelector("[data-photo-register]").checked,active:card.querySelector("[data-photo-active]").checked,focus_x:Number(card.dataset.photoFocusX),focus_y:Number(card.dataset.photoFocusY)})}),result=await response.json();if(!response.ok)throw Error(result.error||"保存失败");showToast("照片设置已保存");await loadSitePhotoManager();}catch(error){showToast(error.message);save.disabled=false;}return;}
  const decision=event.target.closest("[data-photo-request-decision]");
  if(decision){const card=decision.closest("[data-photo-request]"),id=Number(card.dataset.photoRequest),approved=decision.dataset.photoRequestDecision==="approved";if(!approved&&!confirm("拒绝这张主页照片？"))return;decision.disabled=true;try{const body={sa_id:user.id,decision:approved?"approved":"rejected",review_note:approved?"":card.querySelector("[data-photo-review-note]")?.value.trim()||"未通过照片审核",show_home:card.querySelector("[data-photo-home]").checked,show_login:card.querySelector("[data-photo-login]").checked,show_register:card.querySelector("[data-photo-register]").checked,weekday:Number(card.querySelector("[data-photo-weekday]").value),focus_x:Number(card.dataset.photoFocusX),focus_y:Number(card.dataset.photoFocusY)};const response=await apiFetch(`${API}/api/sa/site-photo-requests/${id}/decision`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),result=await response.json();if(!response.ok)throw Error(result.error||"处理失败");await loadSitePhotoManager();showToast(approved?"照片已通过并加入轮播":"照片申请已拒绝");}catch(error){showToast(error.message);decision.disabled=false;}}
});

let photoFocusDrag=null;
const updatePhotoFocus=(picker,event)=>{const card=picker.closest("[data-site-photo],[data-photo-request]"),rect=picker.getBoundingClientRect();if(!card||!rect.width||!rect.height)return;const x=Math.round(Math.max(0,Math.min(100,(event.clientX-rect.left)/rect.width*100))),y=Math.round(Math.max(0,Math.min(100,(event.clientY-rect.top)/rect.height*100)));card.dataset.photoFocusX=String(x);card.dataset.photoFocusY=String(y);picker.setAttribute("aria-valuenow",String(x));const marker=picker.querySelector("[data-photo-focus-marker]");marker.style.left=`${x}%`;marker.style.top=`${y}%`;};
document.getElementById("heroPhotosPanel")?.addEventListener("pointerdown",event=>{const picker=event.target.closest("[data-photo-focus-picker]");if(!picker)return;photoFocusDrag=picker;picker.setPointerCapture?.(event.pointerId);updatePhotoFocus(picker,event);event.preventDefault();});
document.getElementById("heroPhotosPanel")?.addEventListener("pointermove",event=>{if(photoFocusDrag)updatePhotoFocus(photoFocusDrag,event);});
for(const eventName of ["pointerup","pointercancel","lostpointercapture"])document.getElementById("heroPhotosPanel")?.addEventListener(eventName,()=>{photoFocusDrag=null;});

document.getElementById("closeSitePhotoPreview")?.addEventListener("click",()=>document.getElementById("sitePhotoPreviewDialog").close());

async function loadSAErrorReports(){
  const box=document.getElementById("saErrorReports");if(!box)return;box.textContent="正在加载…";
  try{const status=document.getElementById("saErrorReportStatus")?.value||"open",response=await apiFetch(`${API}/api/sa/error-reports?status=${encodeURIComponent(status)}`,{credentials:"include",cache:"no-store"}),rows=await response.json();if(!response.ok)throw Error(rows.error||"加载失败");box.innerHTML=rows.map(row=>`<article class="bpm-error-report-row" data-error-report="${Number(row.id)}"><header><strong>#${Number(row.id)} · ${escapeSACommunityHTML(row.category)}</strong><time>${escapeSACommunityHTML(row.created_at||"")}</time></header><p>${escapeSACommunityHTML(row.message||"未填写补充说明")}</p><small>${escapeSACommunityHTML(row.username||"用户")} · ${escapeSACommunityHTML(row.page||"未知页面")} · HTTP ${escapeSACommunityHTML(row.code||"—")}</small><div><button type="button" data-error-status="resolved">标为已解决</button><button type="button" data-error-status="ignored">忽略</button></div></article>`).join("")||"<p>这个筛选下没有问题反馈。</p>";}catch(error){box.textContent=`反馈加载失败：${error.message}`;}
}
document.getElementById("saErrorReportStatus")?.addEventListener("change",loadSAErrorReports);
document.getElementById("saErrorReports")?.addEventListener("click",async event=>{const button=event.target.closest("[data-error-status]");if(!button)return;const card=button.closest("[data-error-report]");button.disabled=true;try{const response=await apiFetch(`${API}/api/sa/error-reports/${Number(card.dataset.errorReport)}/status`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:button.dataset.errorStatus})}),result=await response.json();if(!response.ok)throw Error(result.error||"处理失败");await loadSAErrorReports();}catch(error){button.disabled=false;showToast(error.message||"处理失败");}});
loadSAErrorReports();

document.getElementById("flightCorrections")?.addEventListener("click",async event=>{
  const edit=event.target.closest("button[data-correction-edit]");
  if(edit){try{await openSAFlightEditorById(Number(edit.dataset.flightId),{correctionId:Number(edit.dataset.correctionEdit),correctionMessage:edit.dataset.correctionMessage});}catch(error){showToast(error.message||"无法打开展品编辑窗口");}return;}
  const button=event.target.closest("button[data-correction]");if(!button)return;
  const explanation=prompt("填写不采纳原因","");if(explanation===null)return;if(!explanation.trim()){showToast("请填写处理说明");return;}button.disabled=true;
  try{const response=await apiFetch(`${API}/api/sa/flight-corrections/resolve`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,correction_id:Number(button.dataset.correction),status:button.dataset.status,decision:explanation.trim()})}),result=await response.json();if(!response.ok)throw Error(result.error||"保存失败");await loadFlightCorrections();}catch(error){showToast(error.message);button.disabled=false;}
});






// ==========================
// 社区管理
// ==========================

async function loadSACommunity(){

    const box =
        document.getElementById("saCommunityPosts");

    if(!box) return;

    box.innerHTML = "加载中...";

    try{

        const res = await apiFetch(
            `${API}/api/sa/community/posts?sa_id=${user.id}`
        );

        const data = await res.json();

        if(!res.ok || data.success !== true){

            throw new Error(
                data.error || "加载社区管理数据失败"
            );

        }

        const posts = Array.isArray(data.posts)
            ? data.posts
            : [];

        if(posts.length === 0){

            box.innerHTML = `
                <div class="card">
                    <p>暂无社区动态</p>
                </div>
            `;

            return;
        }

        box.innerHTML = posts.map(post => {

            const hidden =
                post.status === "hidden";

            return `
                <div class="card sa-community-card">

                    <h3>
                        ${escapeSACommunityHTML(post.title)}
                    </h3>

                    <p>
                        作者：
                        ${escapeSACommunityHTML(
                            post.username || "未知用户"
                        )}
                    </p>

                    <p>
                        时间：
                        ${escapeSACommunityHTML(
                            post.created_at || ""
                        )}
                    </p>

                    <p>
                        状态：
                        <strong>
                            ${hidden ? "已下架" : "正常"}
                        </strong>
                    </p>

                    <p>
                        ${window.bpmIcon("heart")} ${Number(post.like_count || 0)}
                        &nbsp;&nbsp;
                        ${window.bpmIcon("message")} ${Number(post.comment_count || 0)}
                    </p>

                    <div class="sa-community-content">
                        ${escapeSACommunityHTML(
                            post.content
                        ).replace(/\n/g,"<br>")}
                    </div>

                    <button
                        type="button"
                        class="${hidden
                            ? "sa-community-restore"
                            : "sa-community-hide"}"
                        onclick="changeSACommunityStatus(
                            ${Number(post.id)},
                            '${hidden ? "visible" : "hidden"}'
                        )"
                    >
                        ${window.bpmIcon(hidden?"rotateLeft":"xCircle")} ${hidden ? "恢复帖子" : "下架帖子"}
                    </button>

                </div>
            `;

        }).join("");

    }catch(e){

        console.error(
            "SA community load error:",
            e
        );

        box.innerHTML = `
            <div class="card">
                <p>加载失败：${escapeSACommunityHTML(
                    e.message
                )}</p>
            </div>
        `;

    }

}


function escapeSACommunityHTML(value){

    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


async function changeSACommunityStatus(
    postId,
    nextStatus
){

    const action =
        nextStatus === "hidden"
            ? "下架"
            : "恢复";


    let moderationReason = "";
    let clause = "";


    if(nextStatus === "hidden"){

        clause = prompt("请输入违反的具体条款（例如：社区条例三、2（4））：") || "";
        if(!clause.trim()) return;
        moderationReason =
            prompt(
                "请输入下架原因："
            );


        if(moderationReason === null){

            return;

        }


        moderationReason =
            moderationReason.trim();


        if(!moderationReason){

            alert(
                "下架失败：必须填写下架原因。"
            );

            return;

        }

    }else{

        const confirmed = confirm(
            "确定要恢复这条社区动态吗？"
        );

        if(!confirmed) return;

    }


    try{

        const res = await apiFetch(
            `${API}/api/sa/community/posts/status`,
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    sa_id:user.id,

                    post_id:postId,

                    status:nextStatus,
                    clause,
                    severity:"temporary",

                    moderation_reason:
                        moderationReason

                })
            }
        );


        const data =
            await res.json();


        if(
            !res.ok ||
            data.success !== true
        ){

            throw new Error(
                data.error ||
                `${action}失败`
            );

        }


        alert(
            action === "hidden"
                ? "帖子已下架"
                : "帖子已恢复"
        );


        await loadSACommunity();


    }catch(e){

        console.error(
            "SA community status error:",
            e
        );


        alert(
            `${action}失败：${e.message}`
        );

    }

}


// ==========================
// 展品管理
// ==========================

async function loadSAFlights(){

    const box =
    document.getElementById("saFlights");


    if(!box)return;


    try{

        const res = await apiFetch(
            `${API}/api/sa/flights?sa_id=${user.id}`
        );


        const data =
        await res.json();


        box.innerHTML="";


        if(!Array.isArray(data) || data.length===0){

            box.innerHTML="暂无展品";

            return;

        }



        data.forEach(x=>{
            x=bpmSafeRecord(x);

            box.innerHTML += `

            <div class="card">

                <img
                src="${x.image || ''}"
                class="ticket-image"
                data-preview="${x.image || ''}"
                alt="登机牌"
                >

                <h3>
                ${x.airline || ""}
                ${x.flight || ""}
                </h3>

                <p>
                投稿用户：
                ${x.username || "未知"}
                </p>

                <p>
                状态：
                ${x.status || ""}
                </p>

                <p>
                日期：
                ${x.date || ""}
                </p>

                <button
                class="danger-button"
                onclick="deleteSAFlight(${x.id})"
                >
                ${window.bpmIcon("trash")} 移除展品
                </button>

            </div>

            `;

        });


    }catch(e){

        box.innerHTML =
        "加载失败:"+e.message;

    }

}

async function loadSAReviewQueue(){
    const box=document.getElementById("saReviewQueue");
    if(!box)return;
    try{
        const response=await apiFetch(`${API}/api/admin/screening?admin_id=${user.id}`);
        const rows=await response.json();
        if(!response.ok||!Array.isArray(rows))throw Error(rows.error||"待审核投稿加载失败");
        if(!rows.length){box.innerHTML='<p>目前没有待审核投稿。</p>';return;}
        box.innerHTML=rows.map(raw=>{
            const flight=raw;
            const unverified=(flight.submission_type==="rail_ticket"||flight.submission_type==="metro_ticket")&&!flight.airline_iata&&!flight.airline_icao;
            return `<article class="sa-review-queue-card"><img src="${escapeSACommunityHTML(flight.image||"")}" alt="投稿展品" loading="lazy"><div><h3>#${Number(flight.id)} · ${escapeSACommunityHTML(flight.airline||"")} ${escapeSACommunityHTML(flight.flight||"")}</h3>${unverified?'<p class="unverified-submission-warning">此投稿相关字段未考证，请先考证其真实性</p>':""}<p>投稿人：${escapeSACommunityHTML(flight.username||"未知")} · ${escapeSACommunityHTML(flight.date||"")}</p><p>分配审核人：${Number(flight.reviewer_id)||"未分配"}</p><p>${escapeSACommunityHTML(flight.story||"暂无故事")}</p><a href="detail.html?id=${Number(flight.id)}" target="_blank" rel="noopener">在新窗口查看展品</a><div class="sa-review-actions"><button type="button" onclick="saApproveFlight(${Number(flight.id)})">批准</button><button type="button" class="danger-button" onclick="saRejectFlight(${Number(flight.id)})">拒绝</button></div></div></article>`;
        }).join("");
    }catch(error){box.textContent=`加载失败：${error.message||"请重试"}`;}
}

async function loadSAIncompleteFlights(){
    const box=document.getElementById("saIncompleteFlights");
    if(!box)return;
    try{
        await loadSAEditCatalogs();
        const response=await apiFetch(`${API}/api/sa/flights?sa_id=${encodeURIComponent(user.id)}`,{credentials:"include",cache:"no-store"});
        const rows=await response.json();
        if(!response.ok||!Array.isArray(rows))throw Error(rows.error||"展品信息读取失败");
        const incomplete=rows.map(bpmSafeRecord).map(flight=>{
            const missing=[];
            const rail=flight.submission_type==="rail_ticket",metro=flight.submission_type==="metro_ticket",transit=rail||metro;
            if(!flight.image)missing.push("展品图片");
            if(!flight.airline)missing.push(metro?"地铁运营公司":rail?"铁路运营公司":"航空公司");
            if(!flight.flight)missing.push(metro?"线路或票号":rail?"车次":"航班号");
            if(!flight.date)missing.push(transit?"乘车日期":"飞行日期");
            if(transit){
                if(!flight.airport)missing.push("出发车站");
                if(!flight.departure_country)missing.push("出发国家或地区");
                if(!flight.route)missing.push("到达车站");
                if(rail&&!flight.arrival_country)missing.push("到达国家或地区");
            }else{
                if(!flight.airport)missing.push("出发机场");
                if(!saEditFindEntity("airline",flight.airline,flight.airline_iata||flight.airline_icao))missing.push("航空公司目录匹配");
                if(!saEditFindEntity("airport",flight.airport,flight.airport_iata||flight.airport_icao))missing.push("机场目录匹配");
                const carrierPrefix=String(flight.flight||"").trim().match(/^([A-Z0-9]{2})[0-9]/i)?.[1]?.toUpperCase();
                if(carrierPrefix&&flight.airline_iata&&carrierPrefix!==String(flight.airline_iata).toUpperCase())missing.push("航司代码与航班号前缀不一致");
                if(!flight.route_scope)missing.push("航线范围");
                if(Number(flight.cabin_class_verified)!==1)missing.push("舱等待核实");
                if(flight.route_scope!=="domestic"&&!flight.arrival_country)missing.push("到达国家或地区");
            }
            return {flight,missing};
        }).filter(item=>item.missing.length);
        if(!incomplete.length){box.textContent="目前没有发现缺少必要信息的展品。";return;}
        box.innerHTML=incomplete.map(({flight,missing})=>`<article class="sa-incomplete-flight"><div><strong>#${Number(flight.id)} · ${escapeSACommunityHTML(flight.airline||"未填写承运方")} ${escapeSACommunityHTML(flight.flight||"")}</strong><p>状态：${escapeSACommunityHTML(flight.status||"未知")} · 投稿日期：${escapeSACommunityHTML(flight.created_at||"未知")}</p><p>缺少：${missing.map(escapeSACommunityHTML).join("、")}</p></div><button type="button" data-sa-incomplete-id="${Number(flight.id)}">编辑信息</button></article>`).join("");
        box.onclick=event=>{
            const button=event.target.closest("[data-sa-incomplete-id]");
            if(!button)return;
            const input=document.getElementById("flightSearchId");
            if(input)input.value=button.dataset.saIncompleteId;
            openSAFlightEditorById(Number(button.dataset.saIncompleteId));
        };
    }catch(error){
        box.textContent=`检查展品失败：${error.message||"请稍后重试"}`;
    }
}



async function deleteSAFlight(id){

    if(
        !confirm(
        "确定移除该展品？此操作无法恢复。"
        )
    ){
        return;
    }


    const res =
    await apiFetch(
        `${API}/api/sa/delete-flight`,
        {
            method:"POST",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({

                sa_id:user.id,

                flight_id:id

            })

        }
    );


    const data =
    await res.json();


    if(data.success){

        showToast("移除成功");

        document.getElementById("saFlights").innerHTML="已移除，请重新查询";

    }else{

        showToast(
            data.error ||
            "操作失败"
        );

    }

}



// ==========================
// 管理员申请
// ==========================

async function loadAdminRequests(){

    const box=document.getElementById("adminRequests");

    if(!box)return;


    try{


        const res = await apiFetch(
            `${API}/api/sa/admin-requests?sa_id=${user.id}`
        );


        const data = await res.json();


        box.innerHTML="";


        if(!Array.isArray(data) || data.length===0){

            box.innerHTML="暂无管理员申请";

            return;
        }



        data.forEach(x=>{
            x=bpmSafeRecord(x);


            box.innerHTML+=`

            <div class="card">

            <h3>${x.username}</h3>

            <p>邮箱:${x.email}</p>

            <p>投稿数量:${x.upload_count}</p>

            <p>理由:${x.reason || "无"}</p>

            <p>社媒:${x.social || "无"}</p>

            <button onclick="approveAdmin(${x.id},${x.user_id})">
            批准
            </button>

            <button onclick="rejectAdmin(${x.id})">
            拒绝
            </button>


            </div>

            `;


        });


    }catch(e){

        box.innerHTML="加载失败:"+e.message;

    }

}

async function loadAdminRecruitment(){
    const toggle=document.getElementById("adminRecruitmentOpen"),status=document.getElementById("adminRecruitmentStatus");
    if(!toggle||!status)return;
    try{
        const response=await apiFetch(`${API}/api/sa/admin-recruitment?sa_id=${encodeURIComponent(user.id)}`,{cache:"no-store"});
        const data=await response.json();if(!response.ok)throw Error(data.error||"读取招募状态失败");
        toggle.checked=data.open===true;status.textContent=data.open?"目前开放接收申请。":"目前暂停接收新申请。";
    }catch(error){status.textContent=`加载失败：${error.message}`;}
}
document.getElementById("saveAdminRecruitment")?.addEventListener("click",async event=>{
    const button=event.currentTarget,toggle=document.getElementById("adminRecruitmentOpen"),status=document.getElementById("adminRecruitmentStatus");
    button.disabled=true;
    try{
        const response=await apiFetch(`${API}/api/sa/admin-recruitment`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,open:toggle.checked})});
        const data=await response.json();if(!response.ok)throw Error(data.error||"保存失败");
        status.textContent=data.open?"目前开放接收申请。":"目前暂停接收新申请。";showToast("招募设置已保存");
    }catch(error){status.textContent=error.message||"保存失败";showToast(status.textContent);}
    finally{button.disabled=false;}
});




// ==========================
// 用户管理
// ==========================


async function loadUsers(){

    const box=document.getElementById("users");

    if(!box)return;


    try{


        const res = await apiFetch(
            `${API}/api/sa/users?sa_id=${user.id}`
        );


        const data = await res.json();


        box.innerHTML="";


        if(!Array.isArray(data)){

            box.innerHTML="数据错误";

            return;
        }


        data.forEach(x=>{
            box.innerHTML+=`
            <article class="card sa-staff-card" data-staff-user="${Number(x.id)}">
              <div><h3>${escapeSACommunityHTML(x.username)}</h3><p>账号 ID ${Number(x.id)} · ${x.role==="superadministrator"?"站主 SA":"普通管理员"}</p></div>
              <p>可直接编辑已有平台和链接，删除后保存；也可添加新社媒资料。公开页面会分别显示平台名称与链接。</p>
              <div class="sa-staff-social-links" data-staff-social-links>${parseStaffSocialLinks(x).map(staffSocialRow).join("")}</div>
              <div class="site-photo-card-actions"><button type="button" data-add-staff-social>添加社交链接</button><button type="button" data-save-staff-social="${Number(x.id)}">保存社交链接</button>
              ${x.role==="administrator"?`<button type="button" class="demote-admin-btn" data-demote-admin="${Number(x.id)}" data-demote-name="${escapeSACommunityHTML(x.username)}">移除管理员</button>`:""}</div>
            </article>`;


        });


    }catch(e){

        box.innerHTML="加载失败:"+e.message;

    }

}

async function loadPublicLinks(){
  const input=document.getElementById('officialWechatUrl');if(!input)return;
  try{const response=await apiFetch(`${API}/api/sa/public-links`,{credentials:'include',cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error||'加载失败');input.value=data.wechat||'';}
  catch(error){const status=document.getElementById('officialWechatUrlStatus');if(status)status.textContent=`公众号链接加载失败：${error.message}`;}
}
document.getElementById('saveOfficialWechatUrl')?.addEventListener('click',async event=>{
  const button=event.currentTarget,input=document.getElementById('officialWechatUrl'),status=document.getElementById('officialWechatUrlStatus');button.disabled=true;
  try{const response=await apiFetch(`${API}/api/sa/public-links`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({wechat:input.value.trim()})}),data=await response.json();if(!response.ok)throw Error(data.error||'保存失败');status.textContent='公众号链接已保存';}
  catch(error){status.textContent=error.message||'保存失败';}
  finally{button.disabled=false;}
});
loadPublicLinks();

function activateSAConsolePanel(panelId){
  const panels=[...document.querySelectorAll(".bpm-sa-page .sa-panel, .bpm-sa-page > #appeals")];
  const selected=panels.some(panel=>panel.id===panelId)?panelId:"saReviewQueuePanel";
  panels.forEach(panel=>{panel.hidden=panel.id!==selected;});
  document.querySelectorAll(".bpm-sa-section-nav a[href^='#']").forEach(link=>{
    const active=link.hash.slice(1)===selected;
    if(active)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
  });
  const mobileSelect=document.getElementById("saMobileSectionSelect");
  if(mobileSelect)mobileSelect.value=selected;
}
document.querySelector(".bpm-sa-section-nav")?.addEventListener("click",event=>{
  const link=event.target.closest("a[href^='#']");if(!link)return;
  const panelId=link.hash.slice(1);if(!document.getElementById(panelId))return;
  event.preventDefault();history.replaceState(null,"",`#${panelId}`);activateSAConsolePanel(panelId);
});
document.getElementById("saMobileSectionSelect")?.addEventListener("change",event=>{
  const panelId=event.currentTarget.value;
  if(!document.getElementById(panelId))return;
  history.replaceState(null,"",`#${panelId}`);activateSAConsolePanel(panelId);
  window.scrollTo({top:0,behavior:"smooth"});
});
window.addEventListener("hashchange",()=>activateSAConsolePanel(location.hash.slice(1)));
activateSAConsolePanel(location.hash.slice(1)||"saReviewQueuePanel");

// ==========================
// 账户注销申请（SA 审核）
// ==========================

async function loadAccountDeletionRequests(){
    const box=document.getElementById("accountDeletionRequests");
    if(!box)return;
    try{
        const res=await apiFetch(`${API}/api/sa/account-deletion-requests?sa_id=${user.id}`);
        const data=await res.json();
        if(!res.ok)throw Error(data.error||"加载失败");
        if(!data.length){box.textContent="暂无注销申请";return;}
        box.innerHTML=data.map(record=>{
            const x=bpmSafeRecord(record),pending=x.status==="pending";
            return `<div class="card"><h3>${x.username}（#${x.user_id}）</h3><p>状态：${x.finalized_at?"已完成匿名化":x.status}</p><p>投稿：${x.submission_count} 张；社区帖子：${x.post_count} 条</p><p>申请说明：${x.reason||"未填写"}</p><p>提交时间：${x.requested_at||"—"}</p>${x.execute_at?`<p>预计执行：${x.execute_at}</p>`:""}</div>`;
        }).join("");
    }catch(error){box.textContent=`加载失败：${error.message}`;}
}





async function approveAdmin(id,user_id){
    try{
        const response=await apiFetch(`${API}/api/sa/admin-request/approve`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,request_id:id,user_id})});
        const result=await response.json();if(!response.ok)throw Error(result.error||"处理失败");
        showToast("管理员申请已批准");await Promise.all([loadAdminRequests(),loadUsers()]);
    }catch(error){showToast(error.message||"管理员申请处理失败");}
}

async function rejectAdmin(id){
    try{
        const response=await apiFetch(`${API}/api/sa/admin-request/reject`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,request_id:id})});
        const result=await response.json();if(!response.ok)throw Error(result.error||"处理失败");
        showToast("申请已拒绝");await loadAdminRequests();
    }catch(error){showToast(error.message||"拒绝申请失败");}
}


// ==========================
// 启动
// ==========================

loadAppeals();

loadReviewerSchedule();

loadFlightCorrections();

loadSitePhotoManager();

loadSAReviewQueue();

loadAdminRequests();

loadAdminRecruitment();

loadUsers();

loadAccountDeletionRequests();


// ==========================
// 移除管理员
// ==========================

let demoteUserId=null;


// 打开确认窗口

function openDemoteModal(id,username){

    if(id===user.id){

        showToast("不能移除自己的超级管理员权限");
        return;

    }

    demoteUserId=id;

    const overlay=document.getElementById("demoteOverlay");
    const name=document.getElementById("demoteUsername");

    if(name){
        name.innerText=username;
    }

    if(overlay){
        overlay.style.display="flex";
    }

    const input=document.getElementById("demoteConfirmInput");

    if(input){
        input.value="";
        setTimeout(()=>input.focus(),100);
    }

}


// 关闭窗口

function closeDemoteModal(){

    const overlay=document.getElementById("demoteOverlay");

    if(overlay){
        overlay.style.display="none";
    }

    demoteUserId=null;

}


// 确认移除

async function confirmDemote(){

    const input=document.getElementById("demoteConfirmInput");

    if(!input || input.value.trim()!=="移除"){

        showToast('请输入“移除”后再确认。');
        return;

    }

    if(!demoteUserId){

        closeDemoteModal();
        return;

    }


    const res=await apiFetch(
        `${API}/api/sa/demote`,
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                sa_id:user.id,
                user_id:demoteUserId
            })
        }
    );


    const data=await res.json();


    if(data.success){

        showToast("管理员权限已移除");

        closeDemoteModal();

        loadUsers();

    }else{

        showToast(
            data.error ||
            "移除失败"
        );

    }

}


// ==========================
// 更新日志 / 长期置顶事项
// ==========================



// ==========================
// SA 展品 ID 查询
// ==========================

let saFlightEditContext=null;
const saEditCatalogs={airline:[],airport:[]};
let saIsoCountries=[];
let saEditCatalogPromise=null;
async function loadSAEditCatalogs(){
    if(saEditCatalogPromise)return saEditCatalogPromise;
    saEditCatalogPromise=Promise.all([
        fetch("/data/airlines-global.json",{cache:"force-cache"}).then(response=>{if(!response.ok)throw Error("航司数据库加载失败");return response.json();}),
        fetch("/data/airports-global.json",{cache:"force-cache"}).then(response=>{if(!response.ok)throw Error("机场数据库加载失败");return response.json();}),
        window.bpmIsoCountriesReady||fetch("/data/countries-iso3166.json",{cache:"force-cache"}).then(response=>{if(!response.ok)throw Error("国家/地区列表加载失败");return response.json();})
    ]).then(([airlines,airports,countries])=>{saEditCatalogs.airline=airlines;saEditCatalogs.airport=airports;saIsoCountries=countries;}).catch(error=>{saEditCatalogPromise=null;throw error;});
    return saEditCatalogPromise;
}
function saEditDisplayEntity(item){
    const name=window.BPM_LANGUAGE==="en"?(item.name_en||item.name_cn||""):(item.name_cn||item.name_en||"");
    return item.iata?`${name} (${item.iata})`:name;
}
function saEditFindEntity(kind,value,code){
    const list=saEditCatalogs[kind],valueText=String(value||"").trim().toLowerCase(),suffixCode=valueText.match(/\(([a-z0-9]{2,4})\)\s*$/i)?.[1]||"",codeText=String(code||suffixCode).trim().toUpperCase();
    if(codeText){const byCode=list.find(item=>[item.iata,item.icao].some(part=>String(part||"").toUpperCase()===codeText));if(byCode)return byCode;}
    return list.find(item=>[item.name_cn,item.name_en,item.iata,item.icao].some(part=>String(part||"").trim().toLowerCase()===valueText))
        ||list.find(item=>[item.name_cn,item.name_en].some(part=>part&&valueText&&valueText.includes(String(part).trim().toLowerCase())));
}
function saEditCountryCode(value){
    const text=String(value||"").trim(),upper=text.toUpperCase();
    if(saIsoCountries.some(country=>country.code===upper))return upper;
    const matched=saIsoCountries.find(country=>[country.name_cn,country.name_tw,country.name_en].some(name=>{const candidate=String(name||"").trim().toLocaleLowerCase();return candidate===text.toLocaleLowerCase()||(candidate.length>1&&text.toLocaleLowerCase().includes(candidate));}));
    if(matched)return matched.code;
    try{return saIsoCountries.find(country=>["zh-CN","zh-TW","en"].some(locale=>new Intl.DisplayNames([locale],{type:"region"}).of(country.code)?.toLocaleLowerCase()===text.toLocaleLowerCase()))?.code||"";}catch{return "";}
}
function bindSAEntityPicker(kind){
    const form=document.getElementById("saFlightEditForm"),input=form?.querySelector(`[data-sa-catalog-input="${kind}"]`),results=form?.querySelector(`[data-sa-catalog-results="${kind}"]`);
    if(!input||!results||input.dataset.pickerBound)return;
    input.dataset.pickerBound="1";
    const codeFields=kind==="airline"?["airline_iata","airline_icao"]:["airport_iata","airport_icao"];
    const setCodes=item=>{form.querySelector(`[data-edit-flight="${codeFields[0]}"]`).value=item?.iata||"";form.querySelector(`[data-edit-flight="${codeFields[1]}"]`).value=item?.icao||"";};
    input.addEventListener("input",()=>{
        setCodes(null);results.replaceChildren();const query=input.value.trim().toLowerCase();if(query.length<2)return;
        const matches=saEditCatalogs[kind].filter(item=>[item.name_cn,item.name_en,item.iata,item.icao].some(part=>String(part||"").toLowerCase().includes(query))).slice(0,10);
        for(const item of matches){const button=document.createElement("button");button.type="button";button.className="search-result";button.textContent=saEditDisplayEntity(item);button.addEventListener("click",()=>{input.value=saEditDisplayEntity(item);setCodes(item);results.replaceChildren();});results.append(button);}
    });
}
function setSAEditMode(type,categoryValue){
    const rail=type==="rail_ticket",transit=rail||type==="metro_ticket",metro=type==="metro_ticket";
    document.querySelectorAll("[data-sa-rail-field]").forEach(element=>element.hidden=!transit);
    document.querySelectorAll("[data-sa-air-field]").forEach(element=>element.hidden=transit);
    const airlineLabel=document.querySelector('[data-sa-catalog-input="airline"]'),airportLabel=document.querySelector('[data-sa-catalog-input="airport"]');
    if(airlineLabel){airlineLabel.placeholder=transit?(metro?"输入地铁运营公司":"输入铁路运营公司"):"搜索航司名称、IATA 或 ICAO";}
    if(airportLabel){airportLabel.placeholder=transit?"输入出发车站":"搜索机场名称、IATA 或 ICAO";}
    const routeLabel=document.querySelector('[data-edit-flight="route"]')?.closest("label")?.querySelector("span");
    if(routeLabel)routeLabel.textContent=transit?"到达车站":"";
    const routeScope=document.querySelector('[data-edit-flight="route_scope"]')?.value;
    const arrivalCountry=document.querySelector('[data-edit-flight="arrival_country"]')?.closest("label");
    if(arrivalCountry)arrivalCountry.hidden=metro||(!transit&&routeScope==="domestic");
    const cabin=document.querySelector('[data-edit-flight="cabin_class"]');if(cabin)cabin.required=!transit;
    const category=document.querySelector('[data-edit-flight="ticket_category"]');
    if(category){const selected=categoryValue??category.value,items=rail?[["train_ticket","火车票"],["reimbursement_voucher","报销凭证"],["other","其他"]]:[["single_trip","单程票"],["day_1","一日票"],["day_2","二日票"],["day_3","三日票"],["monthly","月票"],["other","其他"]];category.replaceChildren(new Option("请选择",""),...items.map(([value,label])=>new Option(label,value)));category.value=items.some(([value])=>value===selected)?selected:"";category.required=transit;}
}
document.querySelector('[data-edit-flight="submission_type"]')?.addEventListener("change",event=>setSAEditMode(event.target.value));
document.querySelector('[data-edit-flight="route_scope"]')?.addEventListener("change",()=>setSAEditMode(document.querySelector('[data-edit-flight="submission_type"]')?.value||"boarding_pass"));
async function loadSAFlightById(flightId){
    let response=await apiFetch(`${API}/api/flight/${encodeURIComponent(flightId)}`,{cache:"no-store"});
    if(response.ok)return bpmSafeRecord(await response.json());
    response=await apiFetch(`${API}/api/sa/flights?sa_id=${encodeURIComponent(user.id)}`,{cache:"no-store"});
    const rows=await response.json();
    if(!response.ok||!Array.isArray(rows))throw Error(rows.error||"展品读取失败");
    const record=rows.find(row=>Number(row.id)===Number(flightId));
    if(!record)throw Error("未找到该展品");
    return bpmSafeRecord(record);
}
function updateSAFlightImagePreview(){
    const wrap=document.getElementById("saFlightImagePreview"),input=document.querySelector('[data-edit-flight="image"]');
    const image=wrap?.querySelector("img"),link=wrap?.querySelector("a");
    if(!wrap||!image||!link)return;
    let url="";
    try{const candidate=new URL(String(input?.value||"").trim());if(candidate.protocol==="https:"&&candidate.hostname==="images.bpmuseum.org.cn")url=candidate.href;}catch{}
    if(!url){image.removeAttribute("src");link.removeAttribute("href");wrap.hidden=true;return;}
    image.referrerPolicy="no-referrer";image.src=url;link.href=url;wrap.hidden=false;
}
async function openSAFlightEditorById(flightId,options={}){
    const flight=await loadSAFlightById(flightId);
    await loadSAEditCatalogs();
    const dialog=document.getElementById("saFlightEditDialog"),form=document.getElementById("saFlightEditForm");
    form.querySelector("#saveSAFlightEdit").disabled=false;
    saFlightEditContext={flightId:Number(flight.id),correctionId:Number(options.correctionId)||null};
    form.querySelectorAll("[data-edit-flight]").forEach(input=>input.value=flight[input.dataset.editFlight]??(input.dataset.editFlight==="submission_type"?"boarding_pass":""));
    if(Number(flight.cabin_class_verified)!==1)form.querySelector('[data-edit-flight="cabin_class"]').value="";
    let existingTags=[];try{existingTags=Array.isArray(flight.special_tags)?flight.special_tags:JSON.parse(flight.special_tags||"[]");}catch{existingTags=[];}
    form.querySelectorAll("[data-edit-special-tag]").forEach(input=>input.checked=existingTags.includes(input.value));
    for(const kind of ["airline","airport"]){
        const input=form.querySelector(`[data-sa-catalog-input="${kind}"]`),codeKey=kind==="airline"?"airline_iata":"airport_iata",match=saEditFindEntity(kind,flight[kind],flight[codeKey]);
        if(match){input.value=saEditDisplayEntity(match);form.querySelector(`[data-edit-flight="${codeKey}"]`).value=match.iata||"";form.querySelector(`[data-edit-flight="${kind==="airline"?"airline_icao":"airport_icao"}"]`).value=match.icao||"";}
    }
    bindSAEntityPicker("airline");bindSAEntityPicker("airport");
    setSAEditMode(flight.submission_type||"boarding_pass",flight.ticket_category||"");
    if((flight.submission_type||"boarding_pass")==="boarding_pass")form.querySelector('[data-edit-flight="route"]').value="";
    for(const key of ["departure_country","arrival_country"]){const select=form.querySelector(`[data-edit-flight="${key}"]`);select.value=saEditCountryCode(flight[key]);window.bpmRefreshIsoCountryPicker?.(select);}
    updateSAFlightImagePreview();
    const decisionField=form.querySelector("[data-correction-decision-field]");
    decisionField.hidden=!saFlightEditContext.correctionId;
    document.getElementById("saFlightEditTitle").textContent=`编辑展品 #${Number(flight.id)}`;
    document.getElementById("saFlightEditHint").textContent=saFlightEditContext.correctionId?`用户纠错：${String(options.correctionMessage||"")}。核对并修改后保存，会一并采纳纠错，审核状态保持不变。`:"补全或修正展品信息；保存后审核状态保持不变。";
    if(saFlightEditContext.correctionId)form.querySelector("[data-correction-decision]").value="已核对并更新展品信息";
    dialog.showModal();
}

document.querySelector('[data-edit-flight="image"]')?.addEventListener("input",updateSAFlightImagePreview);

loadSAIncompleteFlights();

document.getElementById("closeSAFlightEdit")?.addEventListener("click",()=>document.getElementById("saFlightEditDialog").close());
document.getElementById("cancelSAFlightEdit")?.addEventListener("click",()=>document.getElementById("saFlightEditDialog").close());
document.getElementById("saFlightEditForm")?.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!saFlightEditContext)return;
    const form=event.currentTarget,save=form.querySelector("#saveSAFlightEdit"),flightUpdates={};
    form.querySelectorAll("[data-edit-flight]").forEach(input=>flightUpdates[input.dataset.editFlight]=input.value.trim());
    flightUpdates.special_tags=JSON.stringify([...form.querySelectorAll("[data-edit-special-tag]:checked")].map(input=>input.value));
    if(["rail_ticket","metro_ticket"].includes(flightUpdates.submission_type)){flightUpdates.cabin_class="";flightUpdates.special_tags="[]";}
    if(flightUpdates.submission_type==="boarding_pass")flightUpdates.route="";
    save.disabled=true;
    try{
        const correctionId=saFlightEditContext.correctionId;
        const endpoint=correctionId?`${API}/api/sa/flight-corrections/resolve`:`${API}/api/admin/edit`;
        const payload=correctionId?{sa_id:user.id,correction_id:correctionId,status:"accepted",decision:form.querySelector("[data-correction-decision]").value.trim(),flight_updates:flightUpdates}:{flight_id:saFlightEditContext.flightId,...flightUpdates};
        if(correctionId&&!payload.decision)throw Error("请填写采纳说明");
        const response=await apiFetch(endpoint,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),result=await response.json();
        if(!response.ok)throw Error(result.error||"保存失败");
        document.getElementById("saFlightEditDialog").close();
        document.getElementById("searchSAFlight")?.click();
        await loadSAIncompleteFlights();
        if(correctionId)await loadFlightCorrections();
        showToast(correctionId?"展品已更新，纠错已采纳":"展品信息已保存");
    }catch(error){showToast(error.message||"保存失败");save.disabled=false;}
});

const searchSAFlight =
document.getElementById("searchSAFlight");


if(searchSAFlight){

    document.getElementById("flightSearchId")?.addEventListener("keydown",event=>{
        if(event.key==="Enter"){event.preventDefault();searchSAFlight.click();}
    });

    searchSAFlight.onclick = async function(){

        const id =
        document.getElementById("flightSearchId")
        .value
        .trim();


        if(!id){

            showToast("请输入展品ID");
            return;

        }


        const box =
        document.getElementById("saFlights");


        box.innerHTML="查询中...";


        try{

            const x=await loadSAFlightById(id);


            const status =
                String(x.status || "");

            let reviewButtons = "";


            if(status === "screening"){

                reviewButtons = `
                    <button
                    type="button"
                    onclick="saApproveFlight(${Number(x.id)})">
                    ${window.bpmIcon("check")} 批准展品
                    </button>

                    <button
                    type="button"
                    class="danger-button"
                    onclick="saRejectFlight(${Number(x.id)})">
                    ${window.bpmIcon("xCircle")} 拒绝展品
                    </button>
                `;

            }else if(status === "approved"){

                reviewButtons = `
                    <button
                    type="button"
                    class="danger-button"
                    onclick="saRejectFlight(${Number(x.id)})">
                    ${window.bpmIcon("xCircle")} SA 覆盖为拒绝
                    </button>
                `;

            }else if(status === "rejected"){

                reviewButtons = `
                    <button
                    type="button"
                    onclick="saApproveFlight(${Number(x.id)})">
                    ${window.bpmIcon("check")} SA 覆盖为批准
                    </button>
                `;

            }


            box.innerHTML=`

            <div class="card">

            <img
            src="${escapeSACommunityHTML(x.image || '')}"
            class="ticket-image"
            data-preview="${escapeSACommunityHTML(x.image || '')}"
            >

            <h3>
            ${escapeSACommunityHTML(x.airline || "")}
            ${escapeSACommunityHTML(x.flight || "")}
            </h3>

            <p>
            ID:${x.id}
            </p>

            <p>
            投稿用户:${escapeSACommunityHTML(x.username || "未知")}
            </p>

            <p>
            状态:${escapeSACommunityHTML(x.status || "")}
            </p>

            ${
                x.reviewer_id
                ? `<p>审核管理员 ID:${x.reviewer_id}</p>`
                : ""
            }

            ${
                x.reject_reason
                ? `<p>拒绝原因:${escapeSACommunityHTML(x.reject_reason)}</p>`
                : ""
            }

            <div class="sa-review-actions">
                ${reviewButtons}
            </div>

            <button type="button" class="secondary-button" data-open-sa-flight-edit="${Number(x.id)}">编辑展品信息</button>

            <button
            class="danger-button"
            onclick="deleteSAFlight(${Number(x.id)})">
            ${window.bpmIcon("trash")} 移除展品
            </button>

            </div>

            `;
            box.querySelector("[data-open-sa-flight-edit]")?.addEventListener("click",()=>openSAFlightEditorById(Number(x.id)).catch(error=>showToast(error.message||"无法打开展品编辑窗口")));


        }catch(e){

            console.error(
                "SA flight query error:",
                e
            );

            box.innerHTML="查询失败";

        }

    };

}

document.addEventListener("DOMContentLoaded", function(){

    const publishNotice =
        document.getElementById("publishNotice");

    const publishUpdate =
        document.getElementById("publishUpdate");

    const noticeVersionInput=document.getElementById("noticeVersion");
    const noticeContentInput=document.getElementById("noticeContent");
    let announcementRequestKey=null;
    const loadAnnouncementHistory=async()=>{
        const box=document.getElementById("saAnnouncementHistory");if(!box)return;
        try{
            const response=await apiFetch(`${API}/api/sa/announcements?sa_id=${encodeURIComponent(user.id)}`,{cache:"no-store",credentials:"include"}),rows=await response.json();
            if(!response.ok||!Array.isArray(rows))throw Error(rows.error||"公告加载失败");
            const escape=value=>String(value??"").replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
            box.innerHTML=rows.map(item=>{
                const deleted=!!item.deleted_at,hidden=!!Number(item.hidden);
                return `<article class="bpm-panel bpm-announcement-history-item ${deleted?'is-deleted':''}" data-announcement-card data-source="${escape(item.source)}" data-id="${Number(item.id)}" data-deleted="${deleted}" data-hidden="${hidden}">
                  <header><label class="sa-announcement-select"><input type="checkbox" data-announcement-select aria-label="选择公告 ${escape(item.title||item.version||'')}"><small>${escape(item.created_at||"")} · ${item.source==='update'?'历史置顶事项':'公告'} · ${deleted?'已移入回收站':hidden?'已隐藏':'展示中'}</small></label></header>
                  <label>标题<input data-announcement-title maxlength="120" value="${escape(item.title||item.version||'公告')}" ${deleted?'disabled':''}></label>
                  <label>内容<textarea data-announcement-content maxlength="10000" rows="4" ${deleted?'disabled':''}>${escape(item.content||'')}</textarea></label>
                  <div class="bpm-announcement-history-actions">${deleted?'<button type="button" data-announcement-action="restore">恢复</button>':`<button type="button" data-announcement-action="edit">保存修改</button><button type="button" data-announcement-action="${hidden?'show':'hide'}">${hidden?'重新展示':'隐藏'}</button><button type="button" class="secondary-button" data-announcement-action="delete">移入回收站</button>`}</div>
                </article>`;
            }).join("")||"暂无历史公告";
            const selectedCount=()=>box.querySelectorAll('[data-announcement-select]:checked').length;
            const updateSelectedCount=()=>{const count=selectedCount(),label=document.getElementById('selectedAnnouncementCount');if(label)label.textContent=`已选 ${count} 条`;};
            const saveCard=async(card,action)=>{
                const payload={sa_id:user.id,source:card.dataset.source,id:Number(card.dataset.id),action};
                if(action==='edit'){payload.title=card.querySelector('[data-announcement-title]').value;payload.content=card.querySelector('[data-announcement-content]').value;}
                const response=await apiFetch(`${API}/api/sa/announcements/manage`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
                const result=await response.json();if(!response.ok)throw Error(result.error||'保存失败');return result;
            };
            box.onchange=event=>{if(event.target.matches('[data-announcement-select]'))updateSelectedCount();};
            const selectAll=document.getElementById('selectAllAnnouncements');
            if(selectAll){selectAll.checked=false;selectAll.onchange=()=>{box.querySelectorAll('[data-announcement-select]').forEach(input=>input.checked=selectAll.checked);updateSelectedCount();};}
            box.onclick=async event=>{
                const button=event.target.closest('[data-announcement-action]');if(!button)return;
                const card=button.closest('[data-announcement-card]'),action=button.dataset.announcementAction;
                if(action==='delete'&&!confirm('将这条公告移入回收站？之后仍可恢复。'))return;
                button.disabled=true;
                try{await saveCard(card,action);showToast(action==='edit'?'公告已修改':action==='hide'?'公告已隐藏':action==='show'?'公告已重新展示':action==='delete'?'公告已移入回收站':'公告已恢复');await loadAnnouncementHistory();}
                catch(error){showToast(error.message||'操作失败');button.disabled=false;}
            };
            document.querySelectorAll('[data-announcement-bulk-action]').forEach(button=>{
                button.onclick=async()=>{
                    const selected=[...box.querySelectorAll('[data-announcement-select]:checked')].map(input=>input.closest('[data-announcement-card]'));
                    if(!selected.length){showToast('请先选择公告');return;}
                    const action=button.dataset.announcementBulkAction;
                    const eligible=selected.filter(card=>action==='restore'?card.dataset.deleted==='true':card.dataset.deleted!=='true');
                    if(!eligible.length){showToast(action==='restore'?'所选公告中没有可恢复项':'所选公告中没有可操作项');return;}
                    if(action==='delete'&&!confirm(`将 ${eligible.length} 条公告移入回收站？之后仍可逐条恢复。`))return;
                    button.disabled=true;document.querySelectorAll('[data-announcement-bulk-action]').forEach(item=>item.disabled=true);
                    let succeeded=0,failed=0;
                    for(const card of eligible){try{await saveCard(card,action);succeeded++;}catch{failed++;}}
                    showToast(failed?`已完成 ${succeeded} 条，${failed} 条失败，请刷新后检查`:`已批量处理 ${succeeded} 条公告`);
                    await loadAnnouncementHistory();
                    document.querySelectorAll('[data-announcement-bulk-action]').forEach(item=>item.disabled=false);
                };
            });
        }catch(error){box.textContent=error.message||"公告加载失败";}
    };
    loadAnnouncementHistory();
    [noticeVersionInput,noticeContentInput].filter(Boolean).forEach(input=>input.addEventListener("input",()=>{if(!publishNotice?.disabled)announcementRequestKey=null;}));


    // --------------------------
    // 发布更新日志
    // --------------------------

    if(publishNotice){

        publishNotice.addEventListener("click", async function(){

            const version =
                noticeVersionInput.value.trim();

            const content =
                noticeContentInput.value.trim();


            if(!version){

                showToast("请输入版本号。");
                return;

            }


            if(!content){

                showToast("请输入更新内容。");
                return;

            }


            publishNotice.disabled=true;
            publishNotice.innerText="发布中...";
            noticeVersionInput.disabled=true;
            noticeContentInput.disabled=true;
            announcementRequestKey ||= crypto.randomUUID().replaceAll("-","");


            try{

                const res = await apiFetch(
                    `${API}/api/sa/announcement`,
                    {
                        method:"POST",
                        headers:{
                            "Content-Type":"application/json"
                        },
                        body:JSON.stringify({
                            sa_id:user.id,
                            version:version,
                            content:content,
                            idempotency_key:announcementRequestKey
                        })
                    }
                );


                const data = await res.json();


                if(data.success){

                    showToast("更新日志发布成功。");

                    document.getElementById(
                        "noticeVersion"
                    ).value="";

                    document.getElementById(
                        "noticeContent"
                    ).value="";
                    announcementRequestKey=null;
                    await loadAnnouncementHistory();

                }else{

                    showToast(
                        data.error ||
                        "发布失败"
                    );

                }


            }catch(e){

                console.error(e);

                showToast(
                    "网络错误，发布失败。"
                );

            }finally{

                publishNotice.disabled=false;
                publishNotice.innerText="发布更新";
                noticeVersionInput.disabled=false;
                noticeContentInput.disabled=false;

            }

        });

    }



    // --------------------------
    // 发布长期置顶事项
    // --------------------------

    if(publishUpdate){

        publishUpdate.addEventListener("click", async function(){

            const title =
                document.getElementById("updateTitle").value.trim();

            const content =
                document.getElementById("updateContent").value.trim();


            if(!content){

                showToast("请输入置顶事项内容。");
                return;

            }


            publishUpdate.disabled=true;
            publishUpdate.innerText="发布中...";


            try{

                const res = await apiFetch(
                    `${API}/api/sa/update`,
                    {
                        method:"POST",
                        headers:{
                            "Content-Type":"application/json"
                        },
                        body:JSON.stringify({
                            sa_id:user.id,
                            title:title,
                            content:content
                        })
                    }
                );


                const data = await res.json();


                if(data.success){

                    showToast("长期置顶事项发布成功。");

                    document.getElementById(
                        "updateTitle"
                    ).value="";

                    document.getElementById(
                        "updateContent"
                    ).value="";

                }else{

                    showToast(
                        data.error ||
                        "发布失败"
                    );

                }


            }catch(e){

                console.error(e);

                showToast(
                    "网络错误，发布失败。"
                );

            }finally{

                publishUpdate.disabled=false;
                publishUpdate.innerText="发布置顶事项";

            }

        });

    }

});


// =====================================
// SA IMAGE PREVIEW
// =====================================

document.addEventListener(
"click",
e=>{

    const img =
        e.target.closest(
            ".ticket-image"
        );


    if(
        img &&
        img.dataset.preview
    ){

        let overlay =
        document.getElementById(
            "imagePreviewOverlay"
        );


        if(!overlay){

            overlay=document.createElement("div");

            overlay.id="imagePreviewOverlay";

            overlay.innerHTML=`
            
            <img
            id="previewImage"
            >

            `;

            document.body.appendChild(
                overlay
            );


            overlay.onclick=()=>{

                overlay.style.display="none";

            };

        }


        document.getElementById(
            "previewImage"
        ).src =
        img.dataset.preview;


        overlay.style.display="flex";

    }

});


// =====================================
// SA COMMUNITY INIT
// =====================================

if(
    document.getElementById("saCommunityPosts")
){
    loadSACommunity();
}



// ==========================
// SA 审核展品
// ==========================

async function saApproveFlight(flightId){

    if(
        !confirm(
            "确定由 SA 批准该展品？"
        )
    ){
        return;
    }


    try{

        const res =
        await apiFetch(
            `${API}/api/admin/approve`,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    admin_id:user.id,
                    flight_id:Number(flightId)
                })
            }
        );


        const data =
        await res.json();


        if(!res.ok || !data.success){

            throw new Error(
                data.error ||
                "批准失败"
            );

        }


        showToast("SA 已批准展品");

        await loadSAReviewQueue();
        const search=document.getElementById("flightSearchId");
        if(search?.value.trim())document.getElementById("searchSAFlight")?.click();


    }catch(e){

        showToast(
            e.message ||
            "操作失败"
        );

    }

}


async function saRejectFlight(flightId){

    const reason =
        await bpmAskRejectReason();


    if(reason === null){
        return;
    }


    const cleanReason =
        reason.trim();


    if(!cleanReason){

        showToast(
            "拒绝展品必须填写原因"
        );

        return;

    }


    try{

        const res =
        await apiFetch(
            `${API}/api/admin/reject`,
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    admin_id:user.id,
                    flight_id:Number(flightId),
                    reason:cleanReason
                })
            }
        );


        const data =
        await res.json();


        if(!res.ok || !data.success){

            throw new Error(
                data.error ||
                "拒绝失败"
            );

        }


        showToast("SA 已拒绝展品");

        await loadSAReviewQueue();
        const search=document.getElementById("flightSearchId");
        if(search?.value.trim())document.getElementById("searchSAFlight")?.click();


    }catch(e){

        showToast(
            e.message ||
            "操作失败"
        );

    }

}
