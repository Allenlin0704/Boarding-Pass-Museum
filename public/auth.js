// =================================
// BoardingPassMuseum
// auth.js
// 用户状态管理 + 顶部导航
// =================================


// 获取当前用户

let currentUser = JSON.parse(
    localStorage.getItem("currentUser")
);


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
    }

    function setupMobileNavigation(){

        if(!header) return;

        let toggle = header.querySelector("#mobileNavToggle");

        if(!toggle){
            toggle=document.createElement("button");
            toggle.id="mobileNavToggle";
            toggle.type="button";
            toggle.className="mobile-nav-toggle";
            toggle.setAttribute("aria-label","展开导航");
            toggle.setAttribute("aria-expanded","false");
            toggle.textContent="☰";
            header.appendChild(toggle);
            toggle.onclick=()=>{
                const open=header.classList.toggle("mobile-nav-open");
                toggle.setAttribute("aria-expanded",String(open));
                toggle.textContent=open?"×":"☰";
            };
        }

        nav.querySelectorAll("a").forEach(link=>{
            link.onclick=()=>{
                header.classList.remove("mobile-nav-open");
                toggle.setAttribute("aria-expanded","false");
                toggle.textContent="☰";
            };
        });

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


        <a href="my.html">
        我的投稿
        </a>


        <a href="favorites.html">
        我的收藏
        </a>


        <a href="admin.html">
        Admin
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


        <div class="user-menu">


            <button id="userMenuBtn">
            ${bpmEscape(currentUser.username)} ▼
            </button>


            <div id="userDropdown" class="user-dropdown">


                <a href="notifications.html">通知与申诉</a>
                <a href="account.html">
                账户设置
                </a>


                <a href="my.html">
                我的投稿
                </a>


                <a href="favorites.html">
                我的收藏
                </a>


                <a href="admin.html">
                管理员中心
                </a>

                ${currentUser.role==="superadministrator"?'<a href="sa.html">SA 控制台</a>':''}

                <button type="button" id="checkUpdate">检查新版本</button>


            </div>


        </div>


        <a href="#" id="logout">
        退出
        </a>


        `;

        localizeNavigation();

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


                location.reload();

            };

        }

        const checkUpdate=document.getElementById("checkUpdate");
        if(checkUpdate){
            checkUpdate.onclick=async function(){
                checkUpdate.disabled=true;
                checkUpdate.textContent="正在检查…";
                try{
                    const registration=await navigator.serviceWorker?.getRegistration();
                    await registration?.update();
                    await fetch(location.href,{cache:"reload",credentials:"same-origin"});
                    checkUpdate.textContent="正在加载最新版…";
                    location.reload();
                }catch{
                    checkUpdate.disabled=false;
                    checkUpdate.textContent="检查新版本";
                    alert("暂时无法检查更新，请稍后重试。");
                }
            };
        }


    }


}

// 执行

updateNavbar();
