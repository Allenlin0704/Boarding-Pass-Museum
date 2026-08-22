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
// =====================================

async function loadNotice(){

    try{

        const res =
        await fetch(
            "https://api.bpmuseum.org.cn/api/announcements"
        );


        const data =
        await res.json();



        if(
            !Array.isArray(data)
            ||
            data.length===0
        ){

            return;

        }



        const item =
        data[0];



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


            <p>
            ${item.content || ""}
            </p>


            <button id="closeBpmUpdate">
            我知道了
            </button>


        </div>

        `;



        document.body.appendChild(
            overlay
        );



        document.getElementById(
            "closeBpmUpdate"
        ).onclick=function(){

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
