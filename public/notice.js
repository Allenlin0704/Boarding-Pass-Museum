function showToast(message){

    let toast =
    document.getElementById("bpmToast");


    if(!toast){

        toast =
        document.createElement("div");

        toast.id="bpmToast";

        document.body.appendChild(toast);

    }


    toast.innerText = message;

    toast.className="bpm-toast-show";


    setTimeout(()=>{

        toast.className="";

    },2500);

}



// =====================================
// 公告 + 更新日志统一弹窗
// =====================================

async function loadNotice(){

    try{


        const pinnedRes =
        await fetch(
            "https://api.bpmuseum.org.cn/api/updates"
        );


        const pinned =
        await pinnedRes.json();



        const noticeRes =
        await fetch(
            "https://api.bpmuseum.org.cn/api/announcements"
        );


        const notices =
        await noticeRes.json();



        const pinnedItem =
        Array.isArray(pinned) && pinned.length
        ?
        pinned[0]
        :
        null;



        const updateItem =
        Array.isArray(notices) && notices.length
        ?
        notices[0]
        :
        null;



        if(!pinnedItem && !updateItem){

            return;

        }



        const overlay =
        document.createElement("div");


        overlay.className =
        "bpm-update-overlay";



        overlay.innerHTML = `

        <div class="bpm-update-modal">


        <h2>
        📢 BoardingPassMuseum 公告
        </h2>



        ${
        pinnedItem
        ?
        `
        <h3>
        📌 长期事项
        </h3>

        <p>
        ${pinnedItem.content || ""}
        </p>

        `
        :
        ""
        }



        ${
        updateItem
        ?
        `
        <hr>

        <h3>
        📝 更新日志
        </h3>

        <p>
        ${updateItem.content || ""}
        </p>

        `
        :
        ""
        }



        <button id="closeBpmUpdate">
        我知道了
        </button>


        </div>

        `;



        document.body.appendChild(overlay);



        document.getElementById(
            "closeBpmUpdate"
        ).onclick=function(){

            overlay.remove();

        };



    }catch(e){

        console.error(
            "公告加载失败",
            e
        );

    }

}



document.addEventListener(
"DOMContentLoaded",
()=>{

    loadNotice();

});
