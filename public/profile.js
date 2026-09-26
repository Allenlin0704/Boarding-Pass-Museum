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
        avatar.style.borderRadius=user.avatar_shape==="square"?"12px":"50%";


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
                    ${window.bpmIcon("calendar")} ${escapeHTML(
                        flight.date || ""
                    )}
                </p>

                <p>
                    ${window.bpmIcon("heart")} ${Number(
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
                <strong>${window.bpmIcon("xCircle")} 该动态已被下架</strong>
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
            ${window.bpmIcon("heart")} ${Number(post.like_count || 0)}
            </span>

            <span>
            ${window.bpmIcon("message")} ${Number(post.comment_count || 0)}
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
    const english=window.BPM_LANGUAGE==='en',traditional=window.BPM_LANGUAGE==='zh-TW';
    const catalog={
      star:['新星','Star','首件投稿通过审核。','Your first submission passed review.','你已有至少 1 件投稿通过审核。','At least one of your submissions passed review.'],
      resilient:['百折不挠','Resilient','经历挫折后首次获得审核通过。','Earned your first approval after setbacks.','在第一件通过审核的投稿之前，你至少有 3 件投稿被拒。','At least three submissions were rejected before your first approval.'],
      fifteen:['再接再厉','Going Strong','累计通过审核 15 件投稿。','15 submissions passed review.','你累计有至少 15 件投稿通过审核。','At least 15 of your submissions passed review.'],
      thirty:['高处不胜寒','High Flyer','累计通过审核 30 件投稿。','30 submissions passed review.','你累计有至少 30 件投稿通过审核。','At least 30 of your submissions passed review.'],
      fifty:['云端常客','Frequent Flyer','累计通过审核 50 件投稿。','50 submissions passed review.','你累计有至少 50 件投稿通过审核。','At least 50 of your submissions passed review.'],
      streak:['连击之王','Streak','连续六个完整月份每月投稿至少 3 件，且这些月份没有被拒的稿件。','Submitted at least three items in each of six consecutive full months, with no rejected submission in those months.','系统记录确认你达成了连续六个月的投稿条件。','Your submission history meets the six-month streak criteria.'],
      admin:['中流砥柱','Pillar of the Museum','成为 BoardingPassMuseum 管理员。','Became a BoardingPassMuseum administrator.','你的账号已成为管理员。','Your account is an administrator.'],
      review50:['为站发电','Powering the Museum','管理员经手审核 50 件投稿。','Reviewed 50 submissions as an administrator.','你已累计经手审核至少 50 件投稿。','You have reviewed at least 50 submissions.'],
      review100:['审核圣手','Review Master','管理员经手审核 100 件投稿。','Reviewed 100 submissions as an administrator.','你已累计经手审核至少 100 件投稿。','You have reviewed at least 100 submissions.'],
      night:['深夜加班','Night Shift','管理员在北京时间 00:00–05:59 经手审核投稿。','Reviewed a submission between 00:00 and 05:59 Beijing time.','你的审核记录中包含北京时间 00:00–05:59 的工作时段。','Your review history includes work between 00:00 and 05:59 Beijing time.'],
      world:['寰宇行者','World Traveler','集齐五眼国家馆藏，或在境外（含港澳台）投稿超过 5 次。','Collected exhibits from all Five Eyes countries, or submitted more than five exhibits abroad, including Hong Kong, Macao and Taiwan.','你的已展出馆藏满足该成就的国家与境外投稿条件。','Your approved collection meets the country and overseas-submission criteria.'],
      gateways:['国门常客','Gateway Collector','集齐北京首都 PEK、上海浦东 PVG、广州白云 CAN 三座机场的展品。','Collected exhibits from Beijing Capital (PEK), Shanghai Pudong (PVG), and Guangzhou Baiyun (CAN).','你的馆藏包含 PEK、PVG 和 CAN 三座机场。','Your collection includes PEK, PVG, and CAN.'],
      big3:['三航元勋','Big Three','集齐中国国际航空、中国东方航空、中国南方航空的展品。','Collected exhibits from Air China, China Eastern, and China Southern.','你的馆藏包含国航、东航和南航。','Your collection includes Air China, China Eastern, and China Southern.'],
      vintage:['真古收藏','Vintage Collector','投稿并通过审核的行程日期距投稿时间至少十年。','An approved submission documents a journey at least ten years before it was submitted.','你有至少一件通过审核的投稿记录了十年或更早的旅程。','At least one approved submission documents a journey from ten or more years earlier.'],
      polar:['极地探险家','Polar Explorer','馆藏涉及北极圈国家或地区。','Your collection includes a country or region in the Arctic Circle.','你的馆藏涉及北极圈国家或地区。','Your collection includes an Arctic Circle country or region.'],
      continents:['洲际飞人','Continental Flyer','馆藏覆盖三个或更多大洲。','Your collection spans at least three continents.','你的馆藏覆盖至少三个大洲。','Your collection spans at least three continents.'],
      airport5:['时光荏苒','Airport Regular','同一机场累计集齐至少五件展品。','Collected at least five exhibits from the same airport.','你的馆藏中有同一机场的至少五件展品。','Your collection has at least five exhibits from one airport.'],
      complete:['大满贯','Grand Slam','获得本馆全部其他成就。','Earned every other museum achievement.','你已获得本馆列出的全部其他成就。','You have earned every other museum achievement.']
    };
    const text=(zh,en)=>english?en:traditional?window.bpmLocaleText(zh):zh;
    const achievements=data.achievements.map(a=>{
      const item=catalog[a.code];
      const name=item?text(item[0],item[1]):a.name;
      return `<li><button type="button" class="bpm-achievement-button" data-achievement="${escapeHTML(a.code)}" data-awarded="${escapeHTML(a.awarded_at||'')}">${escapeHTML(name)}</button></li>`;
    }).join('');
    box.innerHTML=`<h2>Lv${Number(data.level)}</h2><progress class="bpm-progress" max="100" value="${Number(data.progress)}" aria-label="等级进度"></progress>
      <p>${data.next===null?text('已达到当前角色最高等级','You have reached the highest level for this role'):traditional?`升至下一級需 ${Number(data.next)} 件${data.review_count===null?'等級計數投稿':'經手審核稿件'}`:`下一级需 ${Number(data.next)} 张${data.review_count===null?'等级计数投稿':'经手审核稿件'}`}</p>
      <div class="bpm-stats"><div><strong>${Number(data.level_count)}</strong>等级计数投稿</div><div><strong>${Number(data.total_submissions)}</strong>累计投稿</div>${data.review_count===null?'':`<div><strong>${Number(data.review_count)}</strong>审核数量</div>`}</div>
      <h3>${text('成就','Achievements')}</h3><ul class="bpm-achievements">${achievements||`<li>${text('尚未获得成就','No achievements yet')}</li>`}</ul>${data.historical_note?`<p>${escapeHTML(data.historical_note)}</p>`:''}
      <dialog class="bpm-dialog bpm-achievement-dialog" id="achievementDialog" aria-labelledby="achievementDialogTitle"><h2 id="achievementDialogTitle"></h2><p class="bpm-achievement-detail"></p><p class="bpm-achievement-reason"></p><p class="bpm-achievement-date"></p><form method="dialog"><button type="submit">${text('关闭','Close')}</button></form></dialog>`;
    box.addEventListener('click',event=>{
      const button=event.target.closest('[data-achievement]');if(!button)return;
      const item=catalog[button.dataset.achievement];if(!item)return;
      const dialog=box.querySelector('#achievementDialog');
      dialog.querySelector('#achievementDialogTitle').textContent=text(item[0],item[1]);
      dialog.querySelector('.bpm-achievement-detail').textContent=text(item[2],item[3]);
      dialog.querySelector('.bpm-achievement-reason').textContent=`${text('获得原因：','Why you earned it: ')}${text(item[4],item[5])}`;
      const awarded=button.dataset.awarded?new Date(button.dataset.awarded):null;
      dialog.querySelector('.bpm-achievement-date').textContent=awarded&&!Number.isNaN(awarded.getTime())?`${text('获得时间：','Awarded: ')}${awarded.toLocaleDateString(english?'en-US':traditional?'zh-TW':'zh-CN')}`:'';
      dialog.showModal();
    });
  }catch{box.textContent='等级信息暂时无法加载';}
}
