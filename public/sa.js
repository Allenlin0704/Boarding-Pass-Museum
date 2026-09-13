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
    welcome.textContent=`欢迎 ${user.username}`;
}



// ==========================
// 申诉管理
// ==========================

async function loadAppeals(){

    const box=document.getElementById("appeals");

    if(!box)return;


    try{

        const res = await fetch(
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

            </div>

            `;

        });


    }catch(e){

        box.innerHTML="加载失败:"+e.message;

    }

}






// ==========================
// 社区管理
// ==========================

async function loadSACommunity(){

    const box =
        document.getElementById("saCommunityPosts");

    if(!box) return;

    box.innerHTML = "加载中...";

    try{

        const res = await fetch(
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
                        ❤️ ${Number(post.like_count || 0)}
                        &nbsp;&nbsp;
                        💬 ${Number(post.comment_count || 0)}
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
                        ${hidden ? "↩️ 恢复帖子" : "🚫 下架帖子"}
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

        const res = await fetch(
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

        const res = await fetch(
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
                🗑 移除展品
                </button>

            </div>

            `;

        });


    }catch(e){

        box.innerHTML =
        "加载失败:"+e.message;

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
    await fetch(
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


        const res = await fetch(
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


        const res = await fetch(
            `${API}/api/sa/users?sa_id=${user.id}`
        );


        const data = await res.json();


        box.innerHTML="";


        if(!Array.isArray(data)){

            box.innerHTML="数据错误";

            return;
        }


        data.forEach(x=>{
            x=bpmSafeRecord(x);


            box.innerHTML+=`

            <div class="card">

            <h3>${x.username}</h3>

            <p>${x.email}</p>

            <p>角色:${x.role}</p>

            ${
                x.role==="administrator"
                ?
                `<button
                    class="demote-admin-btn"
                    onclick="openDemoteModal(${x.id}, '${String(x.username).replace(/'/g,"\\'")}')"
                >
                    移除管理员
                </button>`
                :
                ""
            }

            </div>

            `;


        });


    }catch(e){

        box.innerHTML="加载失败:"+e.message;

    }

}

// ==========================
// 账户注销申请（SA 审核）
// ==========================

async function loadAccountDeletionRequests(){
    const box=document.getElementById("accountDeletionRequests");
    if(!box)return;
    try{
        const res=await fetch(`${API}/api/sa/account-deletion-requests?sa_id=${user.id}`);
        const data=await res.json();
        if(!res.ok)throw Error(data.error||"加载失败");
        if(!data.length){box.textContent="暂无注销申请";return;}
        box.innerHTML=data.map(record=>{
            const x=bpmSafeRecord(record),pending=x.status==="pending";
            return `<div class="card"><h3>${x.username}（#${x.user_id}）</h3><p>状态：${x.status}</p><p>投稿：${x.submission_count} 张；社区帖子：${x.post_count} 条</p><p>申请说明：${x.reason||"未填写"}</p><p>提交时间：${x.requested_at||"—"}</p>${x.decision_note?`<p>处理说明：${x.decision_note}</p>`:""}${pending?`<button onclick="resolveAccountDeletion(${x.id},'approved')">批准审核</button><button onclick="resolveAccountDeletion(${x.id},'rejected')">拒绝申请</button>`:""}</div>`;
        }).join("");
    }catch(error){box.textContent=`加载失败：${error.message}`;}
}

async function resolveAccountDeletion(id,decision){
    const label=decision==="approved"?"批准":"拒绝";
    const decision_note=prompt(`可填写${label}说明（将展示给用户，可留空）：`);
    if(decision_note===null)return;
    try{
        const res=await fetch(`${API}/api/sa/account-deletion-requests/resolve`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sa_id:user.id,request_id:id,decision,decision_note})});
        const data=await res.json();
        if(!res.ok)throw Error(data.error||"处理失败");
        showToast(`注销申请已${label}`);loadAccountDeletionRequests();
    }catch(error){showToast(error.message||"处理失败");}
}





async function approveAdmin(id,user_id){

    const res = await fetch(
        `${API}/api/sa/admin-request/approve`,
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                sa_id:user.id,
                request_id:id,
                user_id:user_id
            })
        }
    );


    showToast("管理员申请已处理");

    loadAdminRequests();
    loadUsers();

}



async function rejectAdmin(id){

    const res = await fetch(
        `${API}/api/sa/admin-request/reject`,
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                sa_id:user.id,
                request_id:id
            })
        }
    );


    showToast("申请已拒绝");

    loadAdminRequests();

}




// ==========================
// 启动
// ==========================

loadAppeals();

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


    const res=await fetch(
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
            await fetch(
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


            let reviewButtons = "";


            if(status === "screening"){

                reviewButtons = `
                    <button
                    type="button"
                    onclick="saApproveFlight(${Number(x.id)})">
                    ✅ 批准展品
                    </button>

                    <button
                    type="button"
                    class="danger-button"
                    onclick="saRejectFlight(${Number(x.id)})">
                    ❌ 拒绝展品
                    </button>
                `;

            }else if(status === "approved"){

                reviewButtons = `
                    <button
                    type="button"
                    class="danger-button"
                    onclick="saRejectFlight(${Number(x.id)})">
                    ❌ SA 覆盖为拒绝
                    </button>
                `;

            }else if(status === "rejected"){

                reviewButtons = `
                    <button
                    type="button"
                    onclick="saApproveFlight(${Number(x.id)})">
                    ✅ SA 覆盖为批准
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

            <button
            class="danger-button"
            onclick="deleteSAFlight(${Number(x.id)})">
            🗑 移除展品
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


    // --------------------------
    // 发布更新日志
    // --------------------------

    if(publishNotice){

        publishNotice.addEventListener("click", async function(){

            const version =
                document.getElementById("noticeVersion").value.trim();

            const content =
                document.getElementById("noticeContent").value.trim();


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


            try{

                const res = await fetch(
                    `${API}/api/sa/announcement`,
                    {
                        method:"POST",
                        headers:{
                            "Content-Type":"application/json"
                        },
                        body:JSON.stringify({
                            sa_id:user.id,
                            version:version,
                            content:content
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

                const res = await fetch(
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
        await fetch(
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

        document.getElementById(
            "searchSAFlight"
        ).click();


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
        await fetch(
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

        document.getElementById(
            "searchSAFlight"
        ).click();


    }catch(e){

        showToast(
            e.message ||
            "操作失败"
        );

    }

}
