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
const storySource=document.createElement("textarea");
storySource.innerHTML=data.story||"";
const storyForTranslate=storySource.value;
const storyTranslateControls=storyForTranslate.trim()?`<div class="story-translate-links"><span>${window.BPM_LANGUAGE==="en"?"Google Translate (story text is sent to Google)":window.BPM_LANGUAGE==="zh-TW"?"Google 翻譯（故事文字將傳送至 Google）":"Google 翻译（故事文本将发送至 Google）"}</span><a href="${(window.bpmGoogleTranslateUrl?.(storyForTranslate,"en")||"https://translate.google.com/").replace(/&/g,"&amp;")}" target="_blank" rel="noopener noreferrer">${window.BPM_LANGUAGE==="zh-TW"?"英文":"English"}</a><a href="${(window.bpmGoogleTranslateUrl?.(storyForTranslate,"zh-TW")||"https://translate.google.com/").replace(/&/g,"&amp;")}" target="_blank" rel="noopener noreferrer">${window.BPM_LANGUAGE==="en"?"Traditional Chinese":window.BPM_LANGUAGE==="zh-TW"?"繁體中文":"繁体中文"}</a></div>`:"";


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


<p><strong>航司：</strong><span data-user-content>${data.airline || ""}</span></p>

<p><strong>航班：</strong><span data-user-content>${data.flight || ""}</span></p>

<p><strong>机场：</strong><span data-user-content>${data.airport || ""}</span></p>

<p><strong>登机牌签发机场：</strong><span data-user-content>${data.issue_airport || "无"}</span></p>

<p><strong>日期：</strong>${data.date || ""}</p>

<p>
<strong>投稿人：</strong>
<a href="profile.html?id=${data.user_id}">
<span data-user-content>${data.username || ""}</span>
</a>
</p>

<p><strong>状态：</strong>${data.status || ""}</p>


${
data.reject_reason
?
`<p><strong>拒绝理由：</strong><span data-user-content>${data.reject_reason}</span></p>`
:
""
}


${
data.appeal_reason
?
`<p><strong>申诉理由：</strong><span data-user-content>${data.appeal_reason}</span></p>`
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

<p class="detail-story-text" data-user-content>
${data.story || ""}
</p>
${storyTranslateControls}

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
