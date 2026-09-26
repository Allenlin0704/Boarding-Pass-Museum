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
bpmSafeRecord(await res.json());


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

${(()=>{const current=JSON.parse(localStorage.getItem("currentUser")||"null");return data.status==="approved"&&current&&Number(current.id)===Number(data.user_id)?`<section class="bpm-panel"><h2>展品信息有误？</h2><p>提交后会送交站主核对，不会直接改动公开展品。</p><form id="flightCorrectionForm"><label for="flightCorrectionMessage">纠错说明</label><textarea id="flightCorrectionMessage" rows="4" maxlength="2000" required></textarea><button type="submit">提交纠错给站主</button><p id="flightCorrectionStatus" role="status"></p></form></section>`:"";})()}


`;

const correctionForm=document.getElementById("flightCorrectionForm");
correctionForm?.addEventListener("submit",async event=>{
  event.preventDefault();const status=document.getElementById("flightCorrectionStatus"),button=correctionForm.querySelector("button[type=submit]");button.disabled=true;status.textContent="正在提交…";
  try{const current=JSON.parse(localStorage.getItem("currentUser")||"null"),response=await fetch(`${API}/api/flight/correction`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({flight_id:Number(id),message:document.getElementById("flightCorrectionMessage").value.trim(),user_id:current?.id})}),result=await response.json();if(!response.ok)throw Error(result.error||"提交失败");status.textContent="已送交站主核对。";correctionForm.reset();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
});


}catch(e){

console.error(e);

detail.innerHTML=
"加载失败："+e.message;

}


}


loadDetail();
