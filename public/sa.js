const apiFetch=(input,init={})=>fetch(input,{...init,credentials:"include"});
const API = "https://api.bpmuseum.org.cn";

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
    box.innerHTML=rows.map(raw=>{const x=bpmSafeRecord(raw);return `<article class="card"><h3>${escapeSACommunityHTML(x.airline)} ${escapeSACommunityHTML(x.flight)} · #${Number(x.flight_id)}</h3><p>投稿人：${escapeSACommunityHTML(x.username)} · ${escapeSACommunityHTML(x.created_at)}</p><p>${escapeSACommunityHTML(x.message)}</p><a href="detail.html?id=${Number(x.flight_id)}" target="_blank" rel="noopener">在新窗口查看展品</a><label>处理说明<textarea data-correction-decision="${Number(x.id)}" rows="3" maxlength="2000"></textarea></label><button type="button" data-correction="${Number(x.id)}" data-status="accepted">采纳</button><button type="button" data-correction="${Number(x.id)}" data-status="dismissed">不采纳</button></article>`;}).join("");
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

async function loadSitePhotoManager(){
  const library=document.getElementById("sitePhotoLibrary");if(!library)return;
  const requestsBox=document.getElementById("sitePhotoRequests"),adminSelect=document.getElementById("sitePhotoInviteAdmins");
  try{
    const response=await apiFetch(`${API}/api/sa/site-photos?sa_id=${user.id}`,{credentials:"include"}),data=await response.json();
    if(!response.ok)throw Error(data.error||"加载失败");
    const occupiedWeekdays=new Set(data.photos.filter(photo=>photo.active).map(photo=>Number(photo.weekday)));
    const suggestedWeekday=photoWeekdays.find(([weekday])=>!occupiedWeekdays.has(weekday))?.[0]||1;
    if(adminSelect){const selected=new Set([...adminSelect.selectedOptions].map(option=>option.value));adminSelect.innerHTML=data.admins.map(admin=>`<option value="${Number(admin.id)}" ${selected.has(String(admin.id))?"selected":""}>${escapeSACommunityHTML(admin.username)} · ID ${Number(admin.id)}</option>`).join("")||"<option disabled>目前没有普通管理员</option>";}
    library.innerHTML=data.photos.map(photo=>`<article class="site-photo-card" data-site-photo="${Number(photo.id)}">
      <img src="${escapeSACommunityHTML(sitePhotoUrl(photo.image_url))}" alt="主页照片：${escapeSACommunityHTML(photo.credit)}" loading="lazy">
      <div class="site-photo-card-body"><strong>照片 #${Number(photo.id)}</strong><label>照片署名<input type="text" maxlength="100" data-photo-credit value="${escapeSACommunityHTML(photo.credit)}"></label>
      ${photoWeekdaySelect(photo.weekday)}
      <div class="site-photo-placements"><label><input type="checkbox" data-photo-home ${photo.show_home?"checked":""}> 首页</label><label><input type="checkbox" data-photo-login ${photo.show_login?"checked":""}> 登录页</label><label><input type="checkbox" data-photo-register ${photo.show_register?"checked":""}> 注册页</label><label><input type="checkbox" data-photo-active ${photo.active?"checked":""}> 启用</label></div>
      <div class="site-photo-card-actions"><button type="button" data-site-photo-preview="home">预览首页</button><button type="button" data-site-photo-preview="login">预览登录页</button><button type="button" data-site-photo-preview="register">预览注册页</button><button type="button" data-save-site-photo="${Number(photo.id)}">保存设置</button></div></div></article>`).join("")||"<p>还没有排期照片。</p>";
    requestsBox.innerHTML=data.requests.map(request=>`<article class="site-photo-card site-photo-request" data-photo-request="${Number(request.id)}">
      <img src="${escapeSACommunityHTML(sitePhotoUrl(request.image_url))}" alt="待审核照片：${escapeSACommunityHTML(request.credit)}" loading="lazy">
      <div class="site-photo-card-body"><strong>${escapeSACommunityHTML(request.admin_name)} 提交 · #${Number(request.id)}</strong><p>署名：${escapeSACommunityHTML(request.credit)}</p>
      <div class="site-photo-placements"><label><input type="checkbox" data-photo-home ${Number(request.show_home)?"checked":""}> 首页</label><label><input type="checkbox" data-photo-login ${Number(request.show_login)?"checked":""}> 登录页</label><label><input type="checkbox" data-photo-register ${Number(request.show_register)?"checked":""}> 注册页</label></div>
      ${photoWeekdaySelect(Number(request.weekday)||suggestedWeekday)}
      <label>审核说明（驳回时展示给投稿管理员）<textarea data-photo-review-note rows="3" maxlength="1000"></textarea></label>
      <div class="site-photo-card-actions"><button type="button" data-site-photo-preview="home">预览首页</button><button type="button" data-site-photo-preview="login">预览登录页</button><button type="button" data-site-photo-preview="register">预览注册页</button><button type="button" data-photo-request-decision="approved">通过并加入排期</button><button type="button" data-photo-request-decision="rejected">拒绝</button></div></div></article>`).join("")||"<p>目前没有待审核照片。</p>";
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
    const compressed=await window.bpmCompressImageFile(file,{maxBytes:4*1024*1024,maxEdge:2600,quality:.9}),data=new FormData(form);
    data.set("image",compressed,"homepage-photo.jpg");data.set("sa_id",String(user.id));
    const response=await apiFetch(`${API}/api/sa/site-photos/upload`,{method:"POST",credentials:"include",body:data}),result=await response.json();
    if(!response.ok)throw Error(result.error||"照片上传失败");
    form.reset();status.textContent=`已压缩至 ${(compressed.size/1024/1024).toFixed(2)} MB，并加入排期。`;
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
  if(preview){const card=preview.closest("[data-site-photo],[data-photo-request]"),image=card?.querySelector("img"),credit=card?.querySelector("[data-photo-credit]")?.value||card?.querySelector("p")?.textContent.replace(/^署名：/,"")||"";const dialog=document.getElementById("sitePhotoPreviewDialog"),stage=document.getElementById("sitePhotoPreviewStage"),placement=preview.dataset.sitePhotoPreview;stage.style.backgroundImage=`linear-gradient(180deg,rgba(3,15,29,.12),rgba(3,15,29,.7)),url("${sitePhotoUrl(image?.src)}")`;document.getElementById("sitePhotoPreviewTitle").textContent=placement==="home"?"首页展厅":placement==="login"?"登录页": "注册页";document.getElementById("sitePhotoPreviewCredit").textContent=credit?`Photo by ${credit}`:"";dialog.showModal();return;}
  const save=event.target.closest("[data-save-site-photo]");
  if(save){const card=save.closest("[data-site-photo]"),id=Number(save.dataset.saveSitePhoto);save.disabled=true;try{const response=await apiFetch(`${API}/api/sa/site-photos/${id}`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,credit:card.querySelector("[data-photo-credit]").value,weekday:Number(card.querySelector("[data-photo-weekday]").value),show_home:card.querySelector("[data-photo-home]").checked,show_login:card.querySelector("[data-photo-login]").checked,show_register:card.querySelector("[data-photo-register]").checked,active:card.querySelector("[data-photo-active]").checked})}),result=await response.json();if(!response.ok)throw Error(result.error||"保存失败");showToast("照片设置已保存");await loadSitePhotoManager();}catch(error){showToast(error.message);save.disabled=false;}return;}
  const decision=event.target.closest("[data-photo-request-decision]");
  if(decision){const card=decision.closest("[data-photo-request]"),id=Number(card.dataset.photoRequest),approved=decision.dataset.photoRequestDecision==="approved";if(!approved&&!confirm("拒绝这张主页照片？"))return;decision.disabled=true;try{const body={sa_id:user.id,decision:approved?"approved":"rejected",review_note:approved?"":card.querySelector("[data-photo-review-note]")?.value.trim()||"未通过照片审核",show_home:card.querySelector("[data-photo-home]").checked,show_login:card.querySelector("[data-photo-login]").checked,show_register:card.querySelector("[data-photo-register]").checked,weekday:Number(card.querySelector("[data-photo-weekday]").value)};const response=await apiFetch(`${API}/api/sa/site-photo-requests/${id}/decision`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),result=await response.json();if(!response.ok)throw Error(result.error||"处理失败");await loadSitePhotoManager();showToast(approved?"照片已通过并加入轮播":"照片申请已拒绝");}catch(error){showToast(error.message);decision.disabled=false;}}
});

document.getElementById("closeSitePhotoPreview")?.addEventListener("click",()=>document.getElementById("sitePhotoPreviewDialog").close());

document.getElementById("flightCorrections")?.addEventListener("click",async event=>{
  const button=event.target.closest("button[data-correction]");if(!button)return;const id=Number(button.dataset.correction),decision=document.querySelector(`[data-correction-decision="${id}"]`)?.value.trim();if(!decision){showToast("请填写处理说明");return;}button.disabled=true;
  try{const response=await apiFetch(`${API}/api/sa/flight-corrections/resolve`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,correction_id:id,status:button.dataset.status,decision})}),result=await response.json();if(!response.ok)throw Error(result.error||"保存失败");await loadFlightCorrections();}catch(error){showToast(error.message);button.disabled=false;}
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
            return `<article class="sa-review-queue-card"><img src="${escapeSACommunityHTML(flight.image||"")}" alt="投稿展品" loading="lazy"><div><h3>#${Number(flight.id)} · ${escapeSACommunityHTML(flight.airline||"")} ${escapeSACommunityHTML(flight.flight||"")}</h3><p>投稿人：${escapeSACommunityHTML(flight.username||"未知")} · ${escapeSACommunityHTML(flight.date||"")}</p><p>分配审核人：${Number(flight.reviewer_id)||"未分配"}</p><p>${escapeSACommunityHTML(flight.story||"暂无故事")}</p><a href="detail.html?id=${Number(flight.id)}" target="_blank" rel="noopener">在新窗口查看展品</a><div class="sa-review-actions"><button type="button" onclick="saApproveFlight(${Number(flight.id)})">批准</button><button type="button" class="danger-button" onclick="saRejectFlight(${Number(flight.id)})">拒绝</button></div></div></article>`;
        }).join("");
    }catch(error){box.textContent=`加载失败：${error.message||"请重试"}`;}
}

async function loadSAIncompleteFlights(){
    const box=document.getElementById("saIncompleteFlights");
    if(!box)return;
    try{
        const response=await apiFetch(`${API}/api/sa/flights?sa_id=${encodeURIComponent(user.id)}`,{credentials:"include",cache:"no-store"});
        const rows=await response.json();
        if(!response.ok||!Array.isArray(rows))throw Error(rows.error||"展品信息读取失败");
        const incomplete=rows.map(bpmSafeRecord).map(flight=>{
            const missing=[];
            const rail=flight.submission_type==="rail_ticket";
            if(!flight.image)missing.push("展品图片");
            if(!flight.airline)missing.push(rail?"铁路运营公司":"航空公司");
            if(!flight.flight)missing.push(rail?"车次":"航班号");
            if(!flight.date)missing.push(rail?"乘车日期":"飞行日期");
            if(rail){
                if(!flight.airport)missing.push("出发车站");
                if(!flight.departure_country)missing.push("出发国家或地区");
                if(!flight.route)missing.push("到达车站");
                if(!flight.arrival_country)missing.push("到达国家或地区");
            }else{
                if(!flight.airport)missing.push("出发机场");
                if(!flight.route_scope)missing.push("航线范围");
            }
            return {flight,missing};
        }).filter(item=>item.missing.length);
        if(!incomplete.length){box.textContent="目前没有发现缺少必要信息的展品。";return;}
        box.innerHTML=incomplete.map(({flight,missing})=>`<article class="sa-incomplete-flight"><div><strong>#${Number(flight.id)} · ${escapeSACommunityHTML(flight.airline||"未填写承运方")} ${escapeSACommunityHTML(flight.flight||"")}</strong><p>状态：${escapeSACommunityHTML(flight.status||"未知")} · 投稿日期：${escapeSACommunityHTML(flight.created_at||"未知")}</p><p>缺少：${missing.map(escapeSACommunityHTML).join("、")}</p></div><button type="button" data-sa-incomplete-id="${Number(flight.id)}">查看记录</button></article>`).join("");
        box.onclick=event=>{
            const button=event.target.closest("[data-sa-incomplete-id]");
            if(!button)return;
            const input=document.getElementById("flightSearchId");
            if(input)input.value=button.dataset.saIncompleteId;
            document.getElementById("searchSAFlight")?.click();
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
  const selected=panels.some(panel=>panel.id===panelId)?panelId:"saSecurityPanel";
  panels.forEach(panel=>{panel.hidden=panel.id!==selected;});
  document.querySelectorAll(".bpm-sa-section-nav a[href^='#']").forEach(link=>{
    const active=link.hash.slice(1)===selected;
    if(active)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
  });
}
document.querySelector(".bpm-sa-section-nav")?.addEventListener("click",event=>{
  const link=event.target.closest("a[href^='#']");if(!link)return;
  const panelId=link.hash.slice(1);if(!document.getElementById(panelId))return;
  event.preventDefault();history.replaceState(null,"",`#${panelId}`);activateSAConsolePanel(panelId);
});
window.addEventListener("hashchange",()=>activateSAConsolePanel(location.hash.slice(1)));
activateSAConsolePanel(location.hash.slice(1)||"saSecurityPanel");

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

loadSAIncompleteFlights();

loadAdminRequests();

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

async function saSaveHiddenFlight(flightId,button){
    const editor=button.closest(".sa-hidden-flight-edit");
    const value=key=>editor.querySelector(`[data-hidden-edit="${key}"]`).value.trim();
    const body={flight_id:Number(flightId),airline:value("airline"),flight:value("flight"),airport:value("airport"),date:value("date"),story:value("story"),image:value("image")};
    button.disabled=true;
    try{
        const response=await apiFetch(`${API}/api/admin/edit`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
        const result=await response.json();
        if(!response.ok)throw Error(result.error||"保存失败");
        showToast("已下架展品已更新");
        document.getElementById("searchSAFlight")?.click();
    }catch(error){showToast(error.message||"保存失败");button.disabled=false;}
}

const searchSAFlight =
document.getElementById("searchSAFlight");


if(searchSAFlight){

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

            const res =
            await apiFetch(
                `${API}/api/flight/${encodeURIComponent(id)}`
            );


            const x =
            bpmSafeRecord(await res.json());


            if(!res.ok){

                box.innerHTML="未找到该展品";
                return;

            }


            const status =
                String(x.status || "");

            const hiddenEdit = status === "hidden" ? `
              <details class="sa-hidden-flight-edit">
                <summary>编辑已下架展品（仅 SA）</summary>
                <label>航空公司 / 运营公司<input data-hidden-edit="airline" value="${x.airline||""}"></label>
                <label>航班 / 班次<input data-hidden-edit="flight" value="${x.flight||""}"></label>
                <label>机场 / 出发地点<input data-hidden-edit="airport" value="${x.airport||""}"></label>
                <label>日期<input type="date" data-hidden-edit="date" value="${x.date||""}"></label>
                <label>故事<textarea rows="4" data-hidden-edit="story">${x.story||""}</textarea></label>
                <label>图片地址<input type="url" data-hidden-edit="image" value="${x.image||""}"></label>
                <button type="button" onclick="saSaveHiddenFlight(${Number(x.id)},this)">保存展品修改</button>
              </details>` : "";


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
            src="${x.image || ''}"
            class="ticket-image"
            data-preview="${x.image || ''}"
            >

            <h3>
            ${x.airline || ""}
            ${x.flight || ""}
            </h3>

            <p>
            ID:${x.id}
            </p>

            <p>
            投稿用户:${x.username || "未知"}
            </p>

            <p>
            状态:${x.status || ""}
            </p>

            ${
                x.reviewer_id
                ? `<p>审核管理员 ID:${x.reviewer_id}</p>`
                : ""
            }

            ${
                x.reject_reason
                ? `<p>拒绝原因:${x.reject_reason}</p>`
                : ""
            }

            <div class="sa-review-actions">
                ${reviewButtons}
            </div>

            ${hiddenEdit}

            <button
            class="danger-button"
            onclick="deleteSAFlight(${Number(x.id)})">
            ${window.bpmIcon("trash")} 移除展品
            </button>

            </div>

            `;


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
            box.innerHTML=rows.map(item=>{const deleted=!!item.deleted_at,hidden=!!Number(item.hidden);return `<article class="bpm-panel bpm-announcement-history-item ${deleted?'is-deleted':''}" data-announcement-card data-source="${escape(item.source)}" data-id="${Number(item.id)}"><header><small>${escape(item.created_at||"")} · ${item.source==='update'?'历史置顶事项':'公告'} · ${deleted?'已移入回收站':hidden?'已隐藏':'展示中'}</small></header><label>标题<input data-announcement-title maxlength="120" value="${escape(item.title||item.version||'公告')}"></label><label>内容<textarea data-announcement-content maxlength="10000" rows="4">${escape(item.content||'')}</textarea></label><div class="bpm-announcement-history-actions">${deleted?'<button type="button" data-announcement-action="restore">恢复</button>':`<button type="button" data-announcement-action="edit">保存修改</button><button type="button" data-announcement-action="${hidden?'show':'hide'}">${hidden?'重新展示':'隐藏'}</button><button type="button" class="secondary-button" data-announcement-action="delete">移入回收站</button>`}</div></article>`;}).join("")||"暂无历史公告";
            box.onclick=async event=>{const button=event.target.closest('[data-announcement-action]');if(!button)return;const card=button.closest('[data-announcement-card]'),action=button.dataset.announcementAction;if(action==='delete'&&!confirm('将这条公告移入回收站？之后仍可恢复。'))return;button.disabled=true;try{const payload={sa_id:user.id,source:card.dataset.source,id:Number(card.dataset.id),action};if(action==='edit'){payload.title=card.querySelector('[data-announcement-title]').value;payload.content=card.querySelector('[data-announcement-content]').value;}const result=await apiFetch(`${API}/api/sa/announcements/manage`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(res=>res.json().then(data=>{if(!res.ok)throw Error(data.error||'保存失败');return data;}));if(result.success){showToast(action==='edit'?'公告已修改':action==='hide'?'公告已隐藏':action==='show'?'公告已重新展示':action==='delete'?'公告已移入回收站':'公告已恢复');await loadAnnouncementHistory();}}catch(error){showToast(error.message||'操作失败');button.disabled=false;}};
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
