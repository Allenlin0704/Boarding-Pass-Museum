// =================================
// BoardingPassMuseum
// notice.js
// 首页更新日志弹窗
// =================================

window.addEventListener("DOMContentLoaded", async function(){

    const overlay = document.createElement("div");
    overlay.id = "noticeOverlay";

    const box = document.createElement("div");
    box.id = "noticeBox";

    box.innerHTML = `
        <h2>BoardingPassMuseum 更新日志</h2>
        <p>正在加载更新日志……</p>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    try {

        const res = await fetch(
            "https://api.bpmuseum.org.cn/api/announcements"
        );

        const data = await res.json();

        if(!Array.isArray(data) || data.length === 0){

            box.innerHTML = `
                <h2>BoardingPassMuseum 更新日志</h2>

                <p>
                    暂无更新日志。
                </p>

                <button id="closeNotice">
                    知道了
                </button>
            `;

        }else{

            let html = `
                <h2>
                    BoardingPassMuseum 更新日志
                </h2>
            `;

            data.forEach(item => {

                html += `
                    <div class="notice-update">

                        <h3>
                            ${escapeNoticeHtml(item.version)}
                        </h3>

                        <div class="notice-content">
                            ${formatNoticeContent(item.content)}
                        </div>

                    </div>
                `;

            });

            html += `
                <button id="closeNotice">
                    知道了
                </button>
            `;

            box.innerHTML = html;

        }

    }catch(e){

        console.error("更新日志加载失败:", e);

        box.innerHTML = `
            <h2>
                BoardingPassMuseum 更新日志
            </h2>

            <p>
                更新日志暂时无法加载。
            </p>

            <button id="closeNotice">
                知道了
            </button>
        `;

    }

    const closeNotice =
        document.getElementById("closeNotice");

    if(closeNotice){

        closeNotice.onclick = function(){

            overlay.remove();

        };

    }

});


// =================================
// 防止更新日志内容直接执行 HTML
// =================================

function escapeNoticeHtml(text){

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =================================
// 更新日志内容格式化
// =================================

function formatNoticeContent(text){

    return escapeNoticeHtml(text)
        .replace(/\[\[RED\]\]([\s\S]*?)\[\[\/RED\]\]/g,
            '<span class="notice-red">$1</span>'
        )
        .replace(/\n/g, "<br>");
}
