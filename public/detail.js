const API =
"https://api.bpmuseum.org.cn";


const params =
new URLSearchParams(
window.location.search
);

const id =
params.get("id");


const detail =
document.getElementById("detail");


async function loadDetail(){

if(!id){

detail.innerHTML="缺少展品ID";
return;

}


try{

const res =
await fetch(
`${API}/api/flight/${id}`
);


const data =
await res.json();


console.log("DETAIL DATA:",data);


if(!res.ok){

detail.innerHTML="找不到该展品";
return;

}


detail.innerHTML=`

<h1>
${data.airline || ""}
${data.flight || ""}
</h1>


<p><strong>ID：</strong>#${data.id}</p>


<img
src="${data.image || ""}"
class="detail-image"
>


<p><strong>航司：</strong>${data.airline || ""}</p>

<p><strong>航班：</strong>${data.flight || ""}</p>

<p><strong>机场：</strong>${data.airport || ""}</p>

<p><strong>登机牌签发机场：</strong>${data.issue_airport || "无"}</p>

<p><strong>日期：</strong>${data.date || ""}</p>

<p>
<strong>投稿人：</strong>
<a href="profile.html?id=${data.user_id}">
${data.username || ""}
</a>
</p>

<p><strong>状态：</strong>${data.status || ""}</p>


${
data.reject_reason
?
`<p><strong>拒绝理由：</strong>${data.reject_reason}</p>`
:
""
}


${
data.appeal_reason
?
`<p><strong>申诉理由：</strong>${data.appeal_reason}</p>`
:
""
}


${
data.appeal_status
?
`<p><strong>申诉状态：</strong>${data.appeal_status}</p>`
:
""
}


<h2>展品故事</h2>

<p>
${data.story || ""}
</p>


`;


}catch(e){

console.error(e);

detail.innerHTML=
"加载失败："+e.message;

}


}


loadDetail();
