// =================================
// BoardingPassMuseum
// auth.js
// 用户状态管理 + 顶部导航
// =================================


// 获取当前用户

let currentUser = JSON.parse(
    localStorage.getItem("currentUser")
);

function bindCheckUpdates(){
    const button=document.getElementById('checkUpdate');if(!button)return;
    button.onclick=async()=>{
        button.disabled=true;button.textContent=window.BPM_LANGUAGE==='en'?'Checking…':'正在检查…';
        try{
            const serviceWorker=navigator.serviceWorker,registration=await serviceWorker?.getRegistration(),previousController=serviceWorker?.controller;let changed=false;
            const onChange=()=>{changed=true;};serviceWorker?.addEventListener('controllerchange',onChange,{once:true});
            if(registration)await registration.update();else await fetch(location.href,{cache:'no-store',credentials:'same-origin'});
            if(registration&&previousController)await Promise.race([new Promise(resolve=>serviceWorker.addEventListener('controllerchange',resolve,{once:true})),new Promise(resolve=>setTimeout(resolve,8000))]);
            if(changed||(previousController&&serviceWorker?.controller!==previousController)){button.textContent=window.BPM_LANGUAGE==='en'?'Update found, reloading…':'发现更新，正在加载…';location.reload();return;}
            serviceWorker?.removeEventListener('controllerchange',onChange);button.disabled=false;button.textContent=window.BPM_LANGUAGE==='en'?'Check for updates':'检查新版本';alert(window.BPM_LANGUAGE==='en'?'This is the latest version.':'当前已是最新版。');
        }catch{button.disabled=false;button.textContent=window.BPM_LANGUAGE==='en'?'Check for updates':'检查新版本';alert(window.BPM_LANGUAGE==='en'?'Unable to check for updates. Please try again later.':'暂时无法检查更新，请稍后重试。');}
    };
}


// 更新顶部导航

function updateNavbar(){


    const nav = document.querySelector(
        ".menubar nav"
    );


    if(!nav){
        return;
    }

    const header = nav.closest(".menubar");

    function localizeNavigation(){
        if(window.BPM_LANGUAGE!=="en")return;
        const labels={
            "index.html":"Gallery","submit.html":"Submit","community.html":"Community",
            "my.html":"My submissions","favorites.html":"Favorites","admin.html":"Management center",
            "login.html":"Log in","register.html":"Sign up","notifications.html":"Notifications & appeals",
            "account.html":"Account settings"
        };
        nav.querySelectorAll("a[href]").forEach(link=>{
            const label=labels[link.getAttribute("href")];
            if(label)link.textContent=label;
        });
        const update=nav.querySelector("#checkUpdate");if(update)update.textContent="Check for updates";
        const logout=nav.querySelector("#logout");if(logout)logout.textContent="Log out";
        const profile=nav.querySelector("[data-nav-profile]");if(profile)profile.textContent="View profile";
    }

    function setupMobileNavigation(){

        if(!header) return;
        if(document.documentElement.classList.contains("bpm-console-embed")) return;

        let toggle = header.querySelector("#mobileNavToggle");

        if(!toggle){
            toggle=document.createElement("button");
            toggle.id="mobileNavToggle";
            toggle.type="button";
            toggle.className="mobile-nav-toggle";
            toggle.setAttribute("aria-label","展开导航");
            toggle.setAttribute("aria-expanded","false");
            toggle.innerHTML=window.bpmIcon("menu");
            header.appendChild(toggle);
            toggle.onclick=()=>{
                const open=header.classList.toggle("mobile-nav-open");
                toggle.setAttribute("aria-expanded",String(open));
                toggle.setAttribute("aria-label",open?"关闭导航":"展开导航");
                toggle.innerHTML=window.bpmIcon(open?"close":"menu");
            };
        }

        nav.querySelectorAll("a").forEach(link=>{
            link.onclick=()=>{
                header.classList.remove("mobile-nav-open");
                toggle.setAttribute("aria-expanded","false");
                toggle.innerHTML=window.bpmIcon("menu");
            };
        });
        nav.querySelectorAll("button").forEach(button=>button.addEventListener('click',()=>{header.classList.remove('mobile-nav-open');toggle.setAttribute('aria-expanded','false');toggle.innerHTML=window.bpmIcon('menu');},{once:true}));

    }


    const adminWorkspacePage=location.hostname==="admin.bpmuseum.org.cn"&&["/sa.html","/sa","/moderation.html","/moderation"].includes(location.pathname);
    if(adminWorkspacePage){
        const isSAConsole=["/sa.html","/sa"].includes(location.pathname);
        nav.innerHTML=`${isSAConsole?"":"<a href=\"sa.html\">返回 SA 工作台</a>"}<a href="admin-settings.html">登录设置</a><a href="#" id="logout">退出管理中心</a>`;
        setupMobileNavigation();
        document.getElementById("logout")?.addEventListener("click",async event=>{
            event.preventDefault();
            if(!confirm("要退出管理员工作区吗？"))return;
            try{await fetch("https://api.bpmuseum.org.cn/api/logout",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});}catch{}
            localStorage.removeItem("currentUser");
            sessionStorage.removeItem("bpm_admin_entry_authenticated");
            location.replace("admin-login.html");
        });
        return;
    }



    // 未登录状态

    if(!currentUser){


        nav.innerHTML = `

        <a href="index.html">
        展厅
        </a>


        <a href="submit.html">
        投稿
        </a>


        <a href="community.html">
        社区
        </a>

        <button type="button" id="checkUpdate">检查新版本</button>


        <a href="my.html">
        我的投稿
        </a>


        <a href="favorites.html">
        我的收藏
        </a>



        <span id="userArea">

        <a href="login.html">
        登录
        </a>


        <a href="register.html">
        注册
        </a>

        </span>

        `;

        localizeNavigation();
        setupMobileNavigation();
        bindCheckUpdates();


    }



    // 登录状态

    else{


        nav.innerHTML = `

        <a href="index.html">
        展厅
        </a>


        <a href="submit.html">
        投稿
        </a>


        <a href="community.html">
        社区
        </a>

        <button type="button" id="checkUpdate">检查新版本</button>


        <div class="user-menu">


            <button id="userMenuBtn">
            ${bpmEscape(currentUser.username)} ▼
            </button>


            <div id="userDropdown" class="user-dropdown">


                <a href="profile.html?id=${encodeURIComponent(currentUser.id)}" data-nav-profile>查看个人主页</a>
                <a href="admin.html?embed=1#admin-apply" data-nav-admin-application hidden>申请成为管理员</a>
                <a href="notifications.html">通知与申诉</a>
                <a href="account.html">
                账户设置
                </a>


                <a href="my.html">
                我的投稿
                </a>

                <a href="annual-report.html" data-nav-annual-report>年度旅程报告</a>


                <a href="favorites.html">
                我的收藏
                </a>


            </div>


        </div>


        <a href="#" id="logout">
        退出
        </a>


        `;

        localizeNavigation();

        const applicationLink=nav.querySelector("[data-nav-admin-application]");
        if(applicationLink){
            fetch("https://api.bpmuseum.org.cn/api/admin-recruitment",{cache:"no-store",credentials:"include"})
                .then(response=>response.ok?response.json():null)
                .then(data=>{applicationLink.hidden=data?.open!==true||data?.eligible!==true;})
                .catch(()=>{applicationLink.hidden=true;});
        }

        const userMenu=nav.querySelector(".user-menu");

        if(userMenu && header){
            header.insertBefore(userMenu,nav);
        }

        setupMobileNavigation();



        const btn =
        document.getElementById(
            "userMenuBtn"
        );


        const menu =
        document.getElementById(
            "userDropdown"
        );



        btn.onclick=function(e){

            e.stopPropagation();

            menu.classList.toggle(
                "show"
            );

        };



        document.addEventListener(
        "click",
        function(){

            menu.classList.remove(
                "show"
            );

        });



        const logout =
        document.getElementById(
            "logout"
        );


        if(logout){

            logout.onclick=async function(e){

                e.preventDefault();


                try {
                    await fetch("https://api.bpmuseum.org.cn/api/logout", {
                        method:"POST", headers:{"Content-Type":"application/json"}, body:"{}"
                    });
                } catch { return; }

                localStorage.removeItem(
                    "currentUser"
                );
                sessionStorage.removeItem("bpm_admin_entry_authenticated");


                location.reload();

            };

        }

        bindCheckUpdates();


    }


}

// 执行

updateNavbar();
