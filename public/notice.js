// =================================
// BoardingPassMuseum
// notice.js
// 启动更新日志弹窗
// =================================


window.addEventListener(
"DOMContentLoaded",
function(){



// 创建遮罩

const overlay =
document.createElement(
"div"
);


overlay.id =
"noticeOverlay";





// 创建弹窗

const box =
document.createElement(
"div"
);


box.id =
"noticeBox";




box.innerHTML = `


<h2>
BoardingPassMuseum 更新日志
</h2>


<h3>
v1.0.0
</h3>


<p>
欢迎来到 BoardingPassMuseum。
</p>


<p>
这里展示全球旅客珍藏的登机牌。
</p>


<ul>

<li>
新增在线投稿功能
</li>


<li>
新增管理员审核系统
</li>


<li>
新增我的投稿页面
</li>


<li>
优化网站界面
</li>


</ul>



<button id="closeNotice">
知道了
</button>


`;




overlay.appendChild(
box
);


document.body.appendChild(
overlay
);






document
.getElementById(
"closeNotice"
)
.onclick=function(){


overlay.remove();


};



});
