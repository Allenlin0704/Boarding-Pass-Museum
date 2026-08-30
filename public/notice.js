function showToast(message){

    let toast =
    document.getElementById(
        "bpmToast"
    );

    if(!toast){

        toast =
        document.createElement(
            "div"
        );

        toast.id="bpmToast";

        document.body.appendChild(
            toast
        );

    }

    toast.innerText =
    message;

    toast.className =
    "bpm-toast-show";

    setTimeout(()=>{

        toast.className="";

    },2500);

}


// =====================================
// 更新日志弹窗
// 只有发现新版本时才弹出
// =====================================

async function loadNotice(){

    try{

        const res =
        await fetch(
            "https://api.bpmuseum.org.cn/api/announcements",
            {
                cache:"no-store"
            }
        );


        if(!res.ok){

            throw new Error(
                "公告接口请求失败"
            );

        }


        const data =
        await res.json();


        if(
            !Array.isArray(data)
            ||
            data.length===0
        ){

            return;

        }


        // 最新公告
        const item =
        data[0];


        // 版本号作为唯一标识
        const version =
        String(
            item.version || ""
        ).trim();


        if(!version){

            return;

        }


        // 用户已经看过这个版本
        const lastSeen =
        localStorage.getItem(
            "bpmLastSeenChangelog"
        );


        if(
            lastSeen === version
        ){

            return;

        }


        // ==============================
        // 创建弹窗
        // ==============================

        const overlay =
        document.createElement(
            "div"
        );


        overlay.className =
        "bpm-update-overlay";


        overlay.innerHTML = `

        <div class="bpm-update-modal">

            <h2>
            📢 BoardingPassMuseum 更新日志
            </h2>

            <h3>
            ${item.version || ""}
            </h3>

            ${
                item.date
                ?
                `<p class="bpm-update-date">
                    ${item.date}
                </p>`
                :
                ""
            }

            <div class="bpm-update-content">
                ${
                    Array.isArray(item.content)
                    ?
                    `<ul>
                        ${
                            item.content
                            .map(
                                x =>
                                `<li>${x}</li>`
                            )
                            .join("")
                        }
                    </ul>`
                    :
                    `<p>${item.content || ""}</p>`
                }
            </div>

            <button id="closeBpmUpdate">
            我知道了
            </button>

        </div>

        `;


        document.body.appendChild(
            overlay
        );


        const closeButton =
        document.getElementById(
            "closeBpmUpdate"
        );


        closeButton.onclick =
        function(){

            // 只有用户确认后才记录
            localStorage.setItem(
                "bpmLastSeenChangelog",
                version
            );

            overlay.remove();

        };


    }catch(e){

        console.error(
            "更新日志加载失败",
            e
        );

    }

}


document.addEventListener(
"DOMContentLoaded",
()=>{

    loadNotice();

});
