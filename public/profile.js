const API = "https://api.bpmuseum.org.cn";

const params =
new URLSearchParams(
window.location.search
);

const profileId =
params.get("id");


function escapeHTML(value){

    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


/* =========================
   用户身份 Title
========================= */

function getRoleTitle(role){

    if(role==="superadministrator"){
        return "超级管理员";
    }

    if(role==="administrator"){
        return "管理员";
    }

    return "用户";

}


function getRoleClass(role){

    if(role==="superadministrator"){
        return "role-sa";
    }

    if(role==="administrator"){
        return "role-administrator";
    }

    return "role-user";

}


/* =========================
   加载个人资料
========================= */

async function loadProfile(){

    if(!profileId){

        document.getElementById(
            "profileUsername"
        ).innerText =
        "用户不存在";

        return;

    }


    try{

        const res =
        await fetch(
            `${API}/api/account/profile?id=${encodeURIComponent(profileId)}`
        );


        const user =
        await res.json();


        if(!res.ok){

            throw new Error(
                user.error || "加载失败"
            );

        }


        const avatar =
        document.getElementById(
            "profileAvatar"
        );

        avatar.src =
        user.avatar ||
        "logo.png";


        avatar.onerror = ()=>{

            avatar.src="logo.png";

        };


        document.getElementById(
            "profileUsername"
        ).innerText =
        user.username ||
        "未知用户";


        const roleBox =
        document.getElementById(
            "profileRole"
        );


        roleBox.innerText =
        getRoleTitle(user.role);


        roleBox.className =
        `profile-role ${getRoleClass(user.role)}`;


        document.getElementById(
            "profileBio"
        ).innerText =
        user.bio ||
        "这个用户还没有填写简介";


        document.getElementById(
            "profileSocial"
        ).innerText =
        user.social_media ||
        "未填写";


        document.getElementById(
            "profileEquipment"
        ).innerText =
        user.equipment ||
        "未填写";


        document.getElementById(
            "profileAirlines"
        ).innerText =
        user.favorite_airlines ||
        "未填写";


        document.getElementById(
            "profileAirports"
        ).innerText =
        user.favorite_airports ||
        "未填写";


        await Promise.all([
            loadProgress(profileId),
            loadUserFlights(profileId),
            loadUserPosts(profileId)
        ]);


    }catch(e){

        console.error(
            "Profile load error:",
            e
        );


        document.getElementById(
            "profileUsername"
        ).innerText =
        "加载失败";

    }

}


/* =========================
   我的展品
========================= */

async function loadUserFlights(id){

    const box =
    document.getElementById(
        "profileFlights"
    );

    if(!box)return;

    try{

        const res =
        await fetch(
            `${API}/api/account/my-flights?user_id=${encodeURIComponent(id)}`
        );

        const data =
        await res.json();

        if(!res.ok || data.success !== true){

            throw new Error(
                data.error ||
                "投稿加载失败"
            );

        }

        const list =
            Array.isArray(data.flights)
            ? data.flights
            : [];

        renderFlightFootprint(list);

        if(list.length===0){

            box.innerHTML =
            `<p class="profile-empty">
                暂无投稿
            </p>`;

            return;

        }

        box.innerHTML = "";

        list.forEach(
        flight=>{

            let statusText = "审核中";
            let statusClass = "pending";

            if(flight.status === "approved"){

                statusText = "已通过";
                statusClass = "approved";

            }else if(flight.status === "rejected"){

                statusText = "已拒绝";
                statusClass = "rejected";

            }

            const rejectReason =
                flight.status === "rejected"
                && flight.reject_reason
                ?
                `
                <div class="profile-flight-reason">
                    <strong>拒绝原因：</strong>
                    ${escapeHTML(
                        flight.reject_reason
                    )}
                </div>
                `
                :
                "";

            box.innerHTML += `

            <div
                class="card profile-flight-card"
            >

                <div class="profile-flight-status ${statusClass}">
                    ${statusText}
                </div>

                <img
                    src="${escapeHTML(flight.image || '')}"
                    class="ticket-image"
                    alt="登机牌"
                >

                <h3>
                    ${escapeHTML(
                        (flight.airline || "") +
                        " " +
                        (flight.flight || "")
                    )}
                </h3>

                <p>
                    📅 ${escapeHTML(
                        flight.date || ""
                    )}
                </p>

                <p>
                    ❤️ ${Number(
                        flight.favorite_count || 0
                    )} 收藏
                </p>

                ${rejectReason}

            </div>

            `;

        });

    }catch(e){

        console.error(
            "Profile flights error:",
            e
        );

        box.innerHTML =
        `<p class="profile-empty">
            投稿加载失败
        </p>`;

        const footprint = document.getElementById("flightFootprintContent");
        if(footprint) footprint.textContent = "飞行足迹暂时无法加载";

    }

}

function renderFlightFootprint(flights){
    const box = document.getElementById("flightFootprintContent");
    if(!box) return;
    if(!flights.length){
        box.innerHTML = '<p class="profile-empty">通过审核的展品会在这里形成足迹。</p>';
        return;
    }

    const countBy = field => {
        const counts = new Map();
        flights.forEach(flight => {
            const value = String(flight[field] || "").trim();
            if(value) counts.set(value, (counts.get(value) || 0) + 1);
        });
        return counts;
    };
    const top = counts => [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))[0];
    const airlines = countBy("airline");
    const airports = countBy("airport");
    const years = new Map();
    flights.forEach(flight => {
        const year = String(flight.date || "").match(/^\d{4}/)?.[0];
        if(year) years.set(year, (years.get(year) || 0) + 1);
    });
    const max = Math.max(...years.values(), 1);
    const timeline = [...years.entries()].sort((a,b) => a[0].localeCompare(b[0])).map(([year, count]) => `
        <li><span>${escapeHTML(year)}</span><i style="width:${Math.max(12, Math.round(count / max * 100))}%"></i><strong>${count}</strong></li>`).join("") || '<li><span>暂无日期信息</span></li>';
    const describe = item => item ? `${escapeHTML(item[0])} · ${Number(item[1])} 张` : "暂无";

    box.innerHTML = `
      <div class="footprint-stats">
        <div><strong>${flights.length}</strong><span>公开展品</span></div>
        <div><strong>${airlines.size}</strong><span>航空公司</span></div>
        <div><strong>${airports.size}</strong><span>机场</span></div>
        <div><strong>${years.size}</strong><span>年份</span></div>
      </div>
      <div class="footprint-highlights"><p><span>常见航司</span>${describe(top(airlines))}</p><p><span>常见机场</span>${describe(top(airports))}</p></div>
      <h3>按年份收藏</h3><ul class="footprint-timeline">${timeline}</ul>`;
}

/* =========================
   社区动态
========================= */

async function loadUserPosts(id){

    const box =
    document.getElementById(
        "profilePosts"
    );


    if(!box)return;


    try{

        const currentUser =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            ) || "null"
        );

        const viewerId =
            currentUser
            ? currentUser.id
            : "";

        const res =
        await fetch(
            `${API}/api/community/user-posts?id=${encodeURIComponent(id)}&viewer_id=${encodeURIComponent(viewerId)}`
        );


        const data =
        await res.json();


        if(!res.ok){

            throw new Error(
                data.error ||
                "社区动态加载失败"
            );

        }


        const posts =
            Array.isArray(data.posts)
            ? data.posts
            : [];


        if(posts.length===0){

            box.innerHTML =
            `<p class="profile-empty">
                暂无社区动态
            </p>`;

            return;

        }


        box.innerHTML =
        posts
        .map(
            post =>
            renderProfilePost(
                post
            )
        )
        .join("");


    }catch(e){

        console.error(
            "Profile posts error:",
            e
        );


        box.innerHTML =
        `<p class="profile-empty">
            社区动态加载失败
        </p>`;

    }

}


/* =========================
   社区帖子渲染
========================= */

function renderProfilePost(post){

    const currentUser =
    JSON.parse(
        localStorage.getItem(
            "currentUser"
        ) || "null"
    );


    const isOwner =
    currentUser &&
    String(currentUser.id)
    ===
    String(post.user_id);


    return `

    <article
    class="profile-post"
    data-post-id="${Number(post.id)}"
    >

        <div class="profile-post-header">

            <h3>
            ${escapeHTML(post.title)}
            </h3>

            ${
                isOwner
                ?
                `
                <button
                type="button"
                class="profile-post-delete"
                data-post-id="${Number(post.id)}"
                >
                删除
                </button>
                `
                :
                ""
            }

        </div>


        <div class="profile-post-content">
        ${escapeHTML(post.content)}
        </div>


        ${
            post.status === "hidden"
            ?
            `
            <div class="profile-post-moderation">
                <strong>🚫 该动态已被下架</strong>
                <p>
                    下架原因：
                    ${escapeHTML(
                        post.moderation_reason ||
                        "管理员未提供具体原因"
                    )}
                </p>
            </div>
            `
            :
            ""
        }


        <div class="profile-post-meta">

            <span>
            ${escapeHTML(post.created_at || "")}
            </span>

            <span>
            ❤️ ${Number(post.like_count || 0)}
            </span>

            <span>
            💬 ${Number(post.comment_count || 0)}
            </span>

        </div>

    </article>

    `;

}


/* =========================
   删除自己的动态
   后端 API 下一步接入
========================= */

async function deleteOwnPost(postId){

    const currentUser =
    JSON.parse(
        localStorage.getItem(
            "currentUser"
        ) || "null"
    );


    if(!currentUser){

        alert("请先登录");

        return;

    }


    if(
        !confirm(
            "确定要删除这条社区动态吗？\n删除后无法恢复。"
        )
    ){

        return;

    }


    try{

        const res =
        await fetch(
            `${API}/api/community/posts/${encodeURIComponent(postId)}`,
            {
                method:"DELETE",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    user_id:
                    currentUser.id
                })

            }
        );


        const data =
        await res.json();


        if(!res.ok || !data.success){

            throw new Error(
                data.error ||
                "删除失败"
            );

        }


        await loadUserPosts(
            profileId
        );


    }catch(e){

        console.error(
            "Delete post error:",
            e
        );


        alert(
            e.message ||
            "删除失败，请稍后重试"
        );

    }

}


/* =========================
   删除按钮事件
========================= */

document.addEventListener(
"click",
event=>{

    const button =
    event.target.closest(
        ".profile-post-delete"
    );


    if(!button)return;


    const postId =
    Number(
        button.dataset.postId
    );


    if(!postId)return;


    deleteOwnPost(
        postId
    );

});


/* =========================
   初始化
========================= */

loadProfile();

async function loadProgress(id){
  const box=document.getElementById('profileProgress');
  try {
    const res=await fetch(`${API}/api/account/progress?id=${encodeURIComponent(id)}`);
    if(!res.ok)throw Error();const data=await res.json();
    box.innerHTML=`<h2>Lv${Number(data.level)}</h2><progress class="bpm-progress" max="100" value="${Number(data.progress)}" aria-label="等级进度"></progress>
      <p>${data.next===null?'已达到当前角色最高等级':`下一级需 ${Number(data.next)} 张${data.review_count===null?'等级计数投稿':'经手审核稿件'}`}</p>
      <div class="bpm-stats"><div><strong>${Number(data.level_count)}</strong>等级计数投稿</div><div><strong>${Number(data.total_submissions)}</strong>累计投稿</div>${data.review_count===null?'':`<div><strong>${Number(data.review_count)}</strong>审核数量</div>`}</div>
      <h3>成就</h3><ul class="bpm-achievements">${data.achievements.map(a=>`<li title="${escapeHTML(a.awarded_at)}">${escapeHTML(a.name)}</li>`).join('')||'<li>尚未获得成就</li>'}</ul>${data.historical_note?`<p>${escapeHTML(data.historical_note)}</p>`:''}`;
  }catch{box.textContent='等级信息暂时无法加载';}
}
