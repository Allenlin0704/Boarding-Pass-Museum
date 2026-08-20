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
    welcome.innerHTML=`欢迎 ${user.username}`;
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


    alert("管理员申请已处理");

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


    alert("申请已拒绝");

    loadAdminRequests();

}




// ==========================
// 启动
// ==========================

loadAppeals();

loadAdminRequests();

loadUsers();


// ==========================
// 移除管理员
// ==========================

let demoteUserId=null;


// 打开确认窗口

function openDemoteModal(id,username){

    if(id===user.id){

        alert("不能移除自己的超级管理员权限");
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

        alert('请输入“移除”后再确认。');
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

        alert("管理员权限已移除");

        closeDemoteModal();

        loadUsers();

    }else{

        alert(
            data.error ||
            "移除失败"
        );

    }

}


// ==========================
// 更新日志 / 长期置顶事项
// ==========================

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

                alert("请输入版本号。");
                return;

            }


            if(!content){

                alert("请输入更新内容。");
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

                    alert("更新日志发布成功。");

                    document.getElementById(
                        "noticeVersion"
                    ).value="";

                    document.getElementById(
                        "noticeContent"
                    ).value="";

                }else{

                    alert(
                        data.error ||
                        "发布失败"
                    );

                }


            }catch(e){

                console.error(e);

                alert(
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

                alert("请输入置顶事项内容。");
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

                    alert("长期置顶事项发布成功。");

                    document.getElementById(
                        "updateTitle"
                    ).value="";

                    document.getElementById(
                        "updateContent"
                    ).value="";

                }else{

                    alert(
                        data.error ||
                        "发布失败"
                    );

                }


            }catch(e){

                console.error(e);

                alert(
                    "网络错误，发布失败。"
                );

            }finally{

                publishUpdate.disabled=false;
                publishUpdate.innerText="发布置顶事项";

            }

        });

    }

});
