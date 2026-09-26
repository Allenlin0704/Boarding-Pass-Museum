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


        const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
        const today=`${parts.find(x=>x.type==='year').value}-${parts.find(x=>x.type==='month').value}-${parts.find(x=>x.type==='day').value}`;
        if(localStorage.getItem('bpmLastAnnouncementDay')===today)return;


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

            <h2>${window.bpmIcon("megaphone")} BoardingPassMuseum 公告</h2>
            <div class="bpm-update-content bpm-announcement-list">
                ${data.map(item=>`<article class="bpm-announcement"><h3>${bpmEscape(item.title||item.version||'公告')}</h3><time>${bpmEscape(item.created_at||'')}</time><p>${bpmEscape(Array.isArray(item.content)?item.content.join('\n'):item.content||'')}</p></article>`).join('')}
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

            localStorage.setItem('bpmLastAnnouncementDay',today);

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
