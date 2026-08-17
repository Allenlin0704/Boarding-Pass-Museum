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



    // 未登录状态

    if(!currentUser){


        nav.innerHTML = `

        <a href="index.html">
        展厅
        </a>


        <a href="submit.html">
        投稿
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


        <a href="my.html">
        我的投稿
        </a>


        <a href="favorites.html">
        我的收藏
        </a>


        <a href="admin.html">
        Admin
        </a>


        <span>

        ${currentUser.username}

        </span>


        <a href="#" id="logout">
        退出
        </a>


        `;



        const logout =
        document.getElementById(
            "logout"
        );


        if(logout){


            logout.onclick = function(e){


                e.preventDefault();


                localStorage.removeItem(
                    "currentUser"
                );


                location.reload();


            };


        }


    }


}


// 执行

updateNavbar();