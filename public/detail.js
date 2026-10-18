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
window.BPM_EXHIBITS=[data];
const storySource=document.createElement("textarea");
storySource.innerHTML=data.story||"";
const storyForTranslate=storySource.value;
const storyForAttribute=bpmSafeRecord({value:storyForTranslate}).value;
const storyTranslateControls=storyForTranslate.trim()?`<div class="story-translate-links" data-bpm-flight-id="${Number(data.id)||0}" data-bpm-story="${storyForAttribute}"><span>${window.BPM_LANGUAGE==="en"?"Translate public story text with ":"使用"}<span data-bpm-ai-slot>AI</span>${window.BPM_LANGUAGE==="en"?" after you click (public story text is sent)":window.BPM_LANGUAGE==="zh-TW"?" 翻譯（點擊後會傳送公開故事文字）":" 翻译（点击后会发送公开故事文本）"}</span><button type="button" data-bpm-translate="en">${window.BPM_LANGUAGE==="zh-TW"?"英文":"English"}</button><button type="button" data-bpm-translate="zh-TW">${window.BPM_LANGUAGE==="en"?"Traditional Chinese":window.BPM_LANGUAGE==="zh-TW"?"繁體中文":"繁体中文"}</button><p class="story-translation-output" hidden aria-live="polite"></p></div>`:"";
const cabinNames=window.BPM_LANGUAGE==="en"?{economy:"Economy",premium_economy:"Premium economy",business:"Business",first_class:"First class (Business suite)",other:"Other",unverified:"Unverified"}:window.BPM_LANGUAGE==="zh-TW"?{economy:"經濟艙",premium_economy:"超級經濟艙",business:"商務艙",first_class:"頭等艙（豪華商務艙）",other:"其他",unverified:"待核實"}:{economy:"经济舱",premium_economy:"超级经济舱",business:"公务舱",first_class:"头等舱（豪华公务舱）",other:"其他",unverified:"待核实"};


if(!res.ok){

detail.innerHTML="找不到该展品";
return;

}


const transit=data.submission_type==="rail_ticket"||data.submission_type==="metro_ticket",metro=data.submission_type==="metro_ticket";
const categoryNames=window.BPM_LANGUAGE==="en"?{train_ticket:"Train ticket",reimbursement_voucher:"Reimbursement receipt",single_trip:"Single journey",day_1:"1-day pass",day_2:"2-day pass",day_3:"3-day pass",monthly:"Monthly pass",other:"Other"}:window.BPM_LANGUAGE==="zh-TW"?{train_ticket:"火車票",reimbursement_voucher:"報銷憑證",single_trip:"單程票",day_1:"一日票",day_2:"二日票",day_3:"三日票",monthly:"月票",other:"其他"}:{train_ticket:"火车票",reimbursement_voucher:"报销凭证",single_trip:"单程票",day_1:"一日票",day_2:"二日票",day_3:"三日票",monthly:"月票",other:"其他"};
const labels=window.BPM_LANGUAGE==="en"?{operator:"Operator",flight:metro?"Line / ticket number":"Train number",departure:"Departure station",arrival:"Arrival station",date:"Date",submitter:"Contributor",status:"Status"}:window.BPM_LANGUAGE==="zh-TW"?{operator:transit?"營運業者":"航空公司",flight:metro?"路線／票號":transit?"車次":"航班",departure:transit?"出發車站":"出發機場",arrival:"抵達車站",date:"日期",submitter:"投稿人",status:"狀態"}:{operator:transit?"运营公司":"航司",flight:metro?"线路 / 票号":transit?"车次":"航班",departure:transit?"出发车站":"机场",arrival:"到达车站",date:"日期",submitter:"投稿人",status:"状态"};
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


<p><strong>${labels.operator}：</strong><span data-user-content>${data.airline || ""}</span></p>

<p><strong>${labels.flight}：</strong><span data-user-content>${data.flight || ""}</span></p>

<p><strong>${labels.departure}：</strong><span data-user-content>${data.airport || ""}</span></p>

${transit&&data.route?`<p><strong>${labels.arrival}：</strong><span data-user-content>${data.route}</span></p>`:!transit?`<p><strong>登机牌签发机场：</strong><span data-user-content>${data.issue_airport || "无"}</span></p>`:""}

${transit&&data.ticket_category?`<p><strong>${window.BPM_LANGUAGE==="en"?"Ticket type":window.BPM_LANGUAGE==="zh-TW"?"票種":"票种"}：</strong>${categoryNames[data.ticket_category]||categoryNames.other}</p>`:""}

<p><strong>${labels.date}：</strong>${data.date || ""}</p>

${!transit?`<p><strong>${window.BPM_LANGUAGE==="en"?"Cabin class":window.BPM_LANGUAGE==="zh-TW"?"艙等":"舱等"}：</strong>${Number(data.cabin_class_verified)===1?(cabinNames[data.cabin_class]||cabinNames.unverified):cabinNames.unverified}</p>`:""}

<p>
<strong>${labels.submitter}：</strong>
<a href="profile.html?id=${data.user_id}">
<span data-user-content>${data.username || ""}</span>
</a>
</p>

${Number(data.social_share_consent)===1?`<button type="button" class="bpm-share-trigger" data-share-flight="${Number(data.id)}">${window.BPM_LANGUAGE==="en"?"Create share card":window.BPM_LANGUAGE==="zh-TW"?"製作分享卡":"生成分享卡"}</button>`:""}

<p><strong>${labels.status}：</strong>${data.status || ""}</p>


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

<section class="bpm-related-exhibits" id="relatedExhibits" aria-live="polite" aria-busy="true"></section>

${(()=>{const current=JSON.parse(localStorage.getItem("currentUser")||"null");return data.status==="approved"&&current&&Number(current.id)===Number(data.user_id)?`<section class="bpm-panel"><h2>展品信息有误？</h2><p>提交后会送交站主核对，不会直接改动公开展品。</p><form id="flightCorrectionForm"><label for="flightCorrectionMessage">纠错说明</label><textarea id="flightCorrectionMessage" rows="4" maxlength="2000" required></textarea><button type="submit">提交纠错给站主</button><p id="flightCorrectionStatus" role="status"></p></form></section>`:"";})()}


`;

window.BPMRelatedExhibits?.render(data);

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
