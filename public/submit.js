// =====================================
// BoardingPassMuseum
// submit.js P1
// 登录 + 全球航司机场搜索
// =====================================


// =====================================
// 登录检查
// =====================================

if(!currentUser){

    showToast(
        "请登录后再投稿"
    );

    window.location.href =
    "login.html";

}



// =====================================
// 数据
// =====================================

let airlines = [];

let airports = [];


let selectedAirline = null;

let selectedAirport = null;
let selectedIssueAirport = null;
let selectedRailOperator = null;
const railOperators=[
  {name_cn:"中国国家铁路 CR",name_en:"China Railway",iata:"CR"},
  {name_cn:"德国铁路 DB",name_en:"Deutsche Bahn",iata:"DB"},
  {name_cn:"Amtrak",name_en:"Amtrak",iata:"AM"},
  {name_cn:"Acela",name_en:"Amtrak Acela",iata:"AC"},
  {name_cn:"欧洲之星 Eurostar",name_en:"Eurostar",iata:"ES"},
  {name_cn:"法国国家铁路 SNCF",name_en:"SNCF",iata:"SN"},
  {name_cn:"日本铁路 JR",name_en:"Japan Railways",iata:"JR"},
  {name_cn:"瑞士联邦铁路 SBB",name_en:"Swiss Federal Railways",iata:"SBB"}
];
let draftRestored = false;
let draftTimer = null;
const draftKey = currentUser?.id ? `bpmuseum-submit-draft:v1:${currentUser.id}` : null;



// =====================================
// 页面元素
// =====================================

const airlineInput =
document.getElementById(
    "airlineSearch"
);


const airlineResults =
document.getElementById(
    "airlineResults"
);



const airportInput =
document.getElementById(
    "departureSearch"
);



const airportResults =
document.getElementById(
    "departureResults"
);

const routeScopeInput=document.getElementById("routeScope");


const issueAirportInput =
document.getElementById(
    "issueAirportSearch"
);


const issueAirportResults =
document.getElementById(
    "issueAirportResults"
);



const submitBtn =
document.getElementById(
    "submitBtn"
);

const saveDraftBtn = document.getElementById("saveDraftBtn");
const clearDraftBtn = document.getElementById("clearDraftBtn");
const draftStatus = document.getElementById("draftStatus");
const submissionTypeInput=document.getElementById("submissionType");
const railOperatorInput=document.getElementById("railOperatorSearch");
const railOperatorResults=document.getElementById("railOperatorResults");
const airSubmissionFields=document.getElementById("airSubmissionFields");
const railSubmissionFields=document.getElementById("railSubmissionFields");

function updateSubmissionType(){
  const rail=submissionTypeInput?.value==="rail_ticket";
  if(airSubmissionFields)airSubmissionFields.hidden=rail;
  if(railSubmissionFields)railSubmissionFields.hidden=!rail;
  const recognition=document.querySelector(".ai-recognition-controls");
  if(recognition)recognition.hidden=rail;
}
submissionTypeInput?.addEventListener("change",updateSubmissionType);
updateSubmissionType();

function setDraftStatus(message){
  if(draftStatus) draftStatus.textContent = message;
}

function selectedCode(item){
  return item?.iata || item?.icao || "";
}

function draftValue(){
  return {
    saved_at: new Date().toISOString(),
    airline_text: airlineInput?.value || "",
    airport_text: airportInput?.value || "",
    issue_airport_text: issueAirportInput?.value || "",
    airline_code: selectedCode(selectedAirline),
    airport_code: selectedCode(selectedAirport),
    route_scope:routeScopeInput?.value||"",
    issue_airport_code: selectedCode(selectedIssueAirport),
    flight: document.getElementById("flight")?.value || "",
    date: document.getElementById("date")?.value || "",
    story: document.getElementById("story")?.value || "",
    submission_type:submissionTypeInput?.value||"boarding_pass",
    ticket_format:document.getElementById("ticketFormat")?.value||"paper",
    cabin_class:document.getElementById("cabinClass")?.value||"economy",
    special_tags:[...document.querySelectorAll('input[name="specialTag"]:checked')].map(input=>input.value),
    rail_operator_code:selectedRailOperator?.iata||"",
    rail_operator_text:railOperatorInput?.value||"",
    rail_train:document.getElementById("railTrainNumber")?.value||"",
    rail_date:document.getElementById("railDate")?.value||"",
    rail_ticket_format:document.getElementById("railTicketFormat")?.value||"paper",
    rail_departure:document.getElementById("railDepartureStation")?.value||"",
    rail_arrival:document.getElementById("railArrivalStation")?.value||"",
    departure_country:document.getElementById("departureCountry")?.value||"",
    arrival_country:document.getElementById("arrivalCountry")?.value||""
  };
}

function saveDraft(manual=false){
  if(!draftKey || !draftRestored) return;
  const draft = draftValue();
  const hasContent = Object.entries(draft).some(([key, value]) => key !== "saved_at" && value);
  if(!hasContent) return;
  localStorage.setItem(draftKey, JSON.stringify(draft));
  setDraftStatus(manual ? "草稿已保存在此设备" : "草稿已自动保存");
}

function queueDraftSave(){
  if(!draftRestored) return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => saveDraft(false), 700);
}

function clearDraft(){
  if(draftKey) localStorage.removeItem(draftKey);
  setDraftStatus("草稿已清除");
}

function restoreDraft(){
  if(!draftKey){ draftRestored = true; return; }
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || "null");
    const age = draft?.saved_at ? Date.now() - new Date(draft.saved_at).getTime() : Infinity;
    if(!draft || !Number.isFinite(age) || age > 30 * 24 * 60 * 60 * 1000){
      if(draft) localStorage.removeItem(draftKey);
      draftRestored = true;
      return;
    }
    airlineInput.value = draft.airline_text || "";
    airportInput.value = draft.airport_text || "";
    issueAirportInput.value = draft.issue_airport_text || "";
    document.getElementById("flight").value = draft.flight || "";
    document.getElementById("date").value = draft.date || "";
    document.getElementById("story").value = draft.story || "";
    if(submissionTypeInput)submissionTypeInput.value=draft.submission_type||"boarding_pass";
    updateSubmissionType();
    for(const [id,value] of [["ticketFormat",draft.ticket_format],["cabinClass",draft.cabin_class],["routeScope",draft.route_scope],["railOperatorSearch",draft.rail_operator_text],["railTrainNumber",draft.rail_train],["railDate",draft.rail_date],["railTicketFormat",draft.rail_ticket_format],["railDepartureStation",draft.rail_departure],["railArrivalStation",draft.rail_arrival],["departureCountry",draft.departure_country],["arrivalCountry",draft.arrival_country]]){const input=document.getElementById(id);if(input&&value!==undefined&&value!=="")input.value=value;}
    document.querySelectorAll('input[name="specialTag"]').forEach(input=>input.checked=(draft.special_tags||[]).includes(input.value));
    window.bpmSubmitDraft = draft;
    setDraftStatus("已恢复未提交草稿；图片需重新选择。");
  } catch { localStorage.removeItem(draftKey); }
  draftRestored = true;
}

function hydrateDraftSelections(){
  const draft = window.bpmSubmitDraft;
  if(!draft) return;
  const find = (list, code) => list.find(item => code && [item.iata, item.icao].includes(code));
  selectedAirline = find(airlines, draft.airline_code) || selectedAirline;
  selectedAirport = find(airports, draft.airport_code) || selectedAirport;
  selectedIssueAirport = find(airports, draft.issue_airport_code) || selectedIssueAirport;
  selectedRailOperator=railOperators.find(item=>item.iata===draft.rail_operator_code)||selectedRailOperator;
}




// =====================================
// 加载航司数据库
// =====================================


fetch(
    "/data/airlines-global.json"
)

.then(
    res => res.json()
)

.then(
    data => {

        airlines = data;

        hydrateDraftSelections();


    }

)

.catch(
    err => {

        console.error(
            "航司加载失败",
            err
        );

    }
);





// =====================================
// 加载机场数据库
// =====================================


fetch(
    "/data/airports-global.json"
)

.then(
    res => res.json()
)

.then(
    data => {

        airports = data;

        const countries=new Map();
        data.forEach(item=>{
          const code=String(item.country||"").trim();
          let name=String(item.country_cn||item.country_en||code).trim();
          try{const locale=window.BPM_LANGUAGE==="en"?"en":window.BPM_LANGUAGE==="zh-TW"?"zh-TW":"zh-CN";if(/^[A-Z]{2}$/.test(code))name=new Intl.DisplayNames([locale],{type:"region"}).of(code)||name;}catch{}
          if(code&&name&&!countries.has(code))countries.set(code,name);
        });
        const countryOptions=document.getElementById("countryOptions");
        if(countryOptions)countryOptions.innerHTML=[...countries].sort((a,b)=>a[1].localeCompare(b[1],"zh-CN")).map(([code,name])=>`<option value="${name}" label="${code}"></option>`).join("");

        hydrateDraftSelections();


    }

)

.catch(
    err => {

        console.error(
            "机场加载失败",
            err
        );

    }
);






// =====================================
// 航司搜索
// =====================================


if(airlineInput){


airlineInput.addEventListener(
"input",

function(){


selectedAirline = null;


searchList(

this.value,

airlines,

airlineResults,

"airline"

);



}


);


}






// =====================================
// 机场搜索
// =====================================


if(airportInput){


airportInput.addEventListener(
"input",

function(){


selectedAirport = null;


searchList(

this.value,

airports,

airportResults,

"airport"

);



}


);


}




if(issueAirportInput){


issueAirportInput.addEventListener(
"input",

function(){

selectedIssueAirport = null;


searchList(

this.value,

airports,

issueAirportResults,

"issue_airport"

);


}


);


}

railOperatorInput?.addEventListener("input",function(){
  selectedRailOperator=null;
  searchList(this.value,railOperators,railOperatorResults,"rail_operator");
});






// =====================================
// 搜索函数
// =====================================


function searchList(

keyword,

data,

container,

type

){



if(!container)
return;



const text =

keyword
.toLowerCase()
.trim();



container.innerHTML = "";

queueDraftSave();



if(!text)
return;





const results =

data.filter(

item => {


const target = [

item.name_cn || "",

item.name_en || "",

item.iata || "",

item.icao || ""

]

.join(" ")

.toLowerCase();



return target.includes(text);



}

);





results
.slice(0,10)
.forEach(

item => {


const div =
document.createElement(
"div"
);



div.className =
"search-result";





div.innerHTML = `


<strong>

${displayName(item)}

</strong>


<br>


<span>

${window.BPM_LANGUAGE==="en"?item.name_cn||"":item.name_en||""}

</span>


<br>


<small>

IATA:
${item.iata || "-"}

/

ICAO:
${item.icao || "-"}

</small>


`;







div.onclick = function(){



if(type==="airline"){


selectedAirline = item;


airlineInput.value =
displayName(item);



}



if(type==="airport"){


selectedAirport = item;


airportInput.value =
displayName(item);



}



if(type==="issue_airport"){


selectedIssueAirport = item;


issueAirportInput.value =
displayName(item);



}

if(type==="rail_operator"){
  selectedRailOperator=item;
  railOperatorInput.value=displayName(item);
}



container.innerHTML = "";

queueDraftSave();



};




container.appendChild(div);



}

);



}






// =====================================
// 显示名称
// =====================================


function displayName(item){


if(!item)
return "";



let name=window.BPM_LANGUAGE==="en"
  ? item.name_en||item.name_cn||""
  : item.name_cn||item.name_en||"";



if(item.iata){


name +=
" ("+
item.iata+
")";


}

return name;



}

function canonicalDisplayName(item){
  if(!item)return "";
  const name=item.name_cn||item.name_en||"";
  return item.iata?`${name} (${item.iata})`:name;
}

const flightAssistBtn=document.getElementById("flightAssistBtn");
const flightAssistStatus=document.getElementById("flightAssistStatus");
const normalizeFlight=value=>String(value||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
function matchCatalog(list,value){const text=String(value||"").toLowerCase();return list.find(item=>[item.iata,item.icao,item.name_cn,item.name_en].some(part=>part&&text.includes(String(part).toLowerCase())));}
function inferAirlineFromFlight(flight){const prefix=normalizeFlight(flight).match(/^[A-Z0-9]{2}/)?.[0];return airlines.find(item=>String(item.iata||"").toUpperCase()===prefix)||null;}
async function assistFlight(){
  const flight=normalizeFlight(document.getElementById("flight")?.value),date=document.getElementById("date")?.value||"";
  if(flight.length<3){if(flightAssistStatus)flightAssistStatus.textContent="请先输入完整航班号";return;}
  flightAssistBtn.disabled=true;if(flightAssistStatus)flightAssistStatus.textContent="正在查找航班信息…";
  try{
    const localAirline=inferAirlineFromFlight(flight);if(localAirline){selectedAirline=localAirline;airlineInput.value=displayName(localAirline);}
    const response=await fetch(`https://api.bpmuseum.org.cn/api/flight-assist?flight=${encodeURIComponent(flight)}&date=${encodeURIComponent(date)}`),data=await response.json();
    if(response.ok&&data.found){const airline=matchCatalog(airlines,data.airline),airport=matchCatalog(airports,data.airport);if(airline){selectedAirline=airline;airlineInput.value=displayName(airline);}if(airport){selectedAirport=airport;airportInput.value=displayName(airport);}flightAssistStatus.textContent="已根据馆内审核记录补全，请核对后提交";}
    else flightAssistStatus.textContent=localAirline?"已识别航空公司；馆内暂无该航班的出发机场记录，请手动选择":"暂无可靠记录，请手动选择航司和机场";
    queueDraftSave();
  }catch{flightAssistStatus.textContent="自动补全暂不可用，请手动填写";}finally{flightAssistBtn.disabled=false;}
}
flightAssistBtn?.addEventListener("click",()=>startAIRecognition());

const recognizeTicketBtn=document.getElementById("recognizeTicketBtn");
const recognizeTicketStatus=document.getElementById("recognizeTicketStatus");
const aiPrivacyConsent=document.getElementById("aiPrivacyConsent");
const localizedChoiceText=(zh,en,tw)=>window.BPM_LANGUAGE==="en"?en:window.BPM_LANGUAGE==="zh-TW"?tw:zh;
const setRecognitionStatus=message=>{if(recognizeTicketStatus)recognizeTicketStatus.textContent=message;if(flightAssistStatus)flightAssistStatus.textContent=message;};
function startAIRecognition(){
  const canvas=document.getElementById("watermarkCanvas");
  if(!aiPrivacyConsent?.checked||!canvas?.width){
    document.querySelector(".submit-image-card")?.scrollIntoView({behavior:"smooth",block:"center"});
    setRecognitionStatus(localizedChoiceText("先选择图片、在本机遮挡隐私并勾选发送处理后图片的授权。","Choose an image, redact private details locally, and consent to sending the edited image first.","請先選擇圖片、在本機遮蔽個人資料，並勾選傳送處理後圖片的授權。"));
    aiPrivacyConsent?.focus({preventScroll:true});
    return;
  }
  recognizeTicket();
}
const findCatalogItem=(list,code,name)=>{
  const normalized=String(name||"").trim().toLocaleLowerCase(),upper=String(code||"").trim().toUpperCase();
  return list.find(item=>upper&&[item.iata,item.icao].some(value=>String(value||"").toUpperCase()===upper))
    ||list.find(item=>normalized&&[item.name_cn,item.name_en].some(value=>String(value||"").trim().toLocaleLowerCase()===normalized))||null;
};
async function recognizeTicket(){
  if(!aiPrivacyConsent?.checked){setRecognitionStatus(localizedChoiceText("请先确认已遮挡隐私并同意发送处理后的图片。","Confirm that private details are redacted and that you agree to send the edited image.","請先確認已遮蔽個人資料，並同意傳送處理後的圖片。"));return;}
  if(window.bpmImageEditorReady&&!window.bpmImageEditorReady()){setRecognitionStatus(localizedChoiceText("请先应用或取消当前裁剪框。","Apply or cancel the current crop first.","請先套用或取消目前的裁切框。"));return;}
  const canvas=document.getElementById("watermarkCanvas");
  if(!canvas||!canvas.width||!canvas.height){setRecognitionStatus(localizedChoiceText("请先选择并处理票据图片。","Choose and edit a ticket image first.","請先選擇並處理票據圖片。"));return;}
  if(recognizeTicketBtn)recognizeTicketBtn.disabled=true;setRecognitionStatus(localizedChoiceText("正在识别已处理的票面…","Reading the edited ticket…","正在辨識已處理的票面…"));
  try{
    const blob=await (window.bpmCompressCanvas?window.bpmCompressCanvas(canvas,{maxBytes:2*1024*1024,maxEdge:1800,quality:.82}):new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.78)));
    if(!blob||blob.size>2*1024*1024)throw Error(localizedChoiceText("处理后的图片仍超过 2 MB，请先压缩。","The edited image is still larger than 2 MB. Compress it first.","處理後的圖片仍超過 2 MB，請先壓縮。"));
    const form=new FormData();form.append("image",blob,"edited-ticket.jpg");form.append("consent","1");
    const response=await fetch("https://api.bpmuseum.org.cn/api/flight-assist/recognize",{method:"POST",body:form}),data=await response.json();
    if(!response.ok)throw Error(data.error||localizedChoiceText("识别失败，请稍后重试。","Recognition failed. Try again later.","辨識失敗，請稍後重試。"));
    const fields=data.fields||{};
    const airline=findCatalogItem(airlines,fields.airline_iata||fields.airline_icao,fields.airline_name),departure=findCatalogItem(airports,fields.departure_airport_iata||fields.departure_airport_icao,fields.departure_airport_name),issue=findCatalogItem(airports,fields.issue_airport_iata||fields.issue_airport_icao,fields.issue_airport_name);
    if(airline){selectedAirline=airline;airlineInput.value=displayName(airline);}
    if(departure){selectedAirport=departure;airportInput.value=displayName(departure);}
    if(issue){selectedIssueAirport=issue;issueAirportInput.value=displayName(issue);}
    const flight=String(fields.flight_number||"").trim().toUpperCase();if(/^[A-Z0-9][A-Z0-9 -]{1,11}$/.test(flight))document.getElementById("flight").value=flight;
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(fields.flight_date||"")))document.getElementById("date").value=fields.flight_date;
    if(["domestic","international","regional"].includes(fields.route_scope)&&routeScopeInput)routeScopeInput.value=fields.route_scope;
    queueDraftSave();
    setRecognitionStatus(localizedChoiceText("识别完成。请逐项核对票面；AI 结果可能有误，未能确认的字段请手动填写。","Recognition is ready. Verify every field against the ticket; AI may be wrong. Fill unresolved fields manually.","辨識完成。請逐項核對票面；AI 結果可能有誤，未確認的欄位請手動填寫。"));
  }catch(error){setRecognitionStatus(error.message||localizedChoiceText("识别暂不可用，请手动填写。","Recognition is unavailable. Fill the fields manually.","辨識暫不可用，請手動填寫。"));}
  finally{if(recognizeTicketBtn)recognizeTicketBtn.disabled=false;}
}
recognizeTicketBtn?.addEventListener("click",recognizeTicket);
// =====================================
// BoardingPassMuseum
// submit.js P2
// 图片处理 + 水印 + 投稿
// =====================================




// =====================================
// 提交按钮
// =====================================


if(submitBtn){


submitBtn.onclick = submitFlight;


}

saveDraftBtn?.addEventListener("click", () => saveDraft(true));
clearDraftBtn?.addEventListener("click", () => {
  clearDraft();
  resetSubmitForm();
});

[airlineInput, airportInput, issueAirportInput, document.getElementById("flight"), document.getElementById("date"), document.getElementById("story"), railOperatorInput, document.getElementById("railTrainNumber"), document.getElementById("railDate"), document.getElementById("railDepartureStation"), document.getElementById("railArrivalStation"), document.getElementById("departureCountry"), document.getElementById("arrivalCountry")]
  .filter(Boolean).forEach(field => field.addEventListener("input", queueDraftSave));
for(const field of [submissionTypeInput,document.getElementById("ticketFormat"),routeScopeInput,document.getElementById("railTicketFormat"),...document.querySelectorAll('input[name="specialTag"]')].filter(Boolean))field.addEventListener("change",queueDraftSave);

window.addEventListener("pagehide", () => saveDraft(false));

restoreDraft();






// =====================================
// 提交投稿
// =====================================


async function submitFlight(){

if(window.bpmImageEditorReady&&!window.bpmImageEditorReady()){
showToast("请先应用或取消当前裁剪框，再提交图片");
return;
}

if(!currentUser || !currentUser.id){
    showToast("请先登录");
    return;
}

if(!document.getElementById("rulesConsent")?.checked){showToast(localizedChoiceText("请先阅读并同意投稿条例。","Read and accept the submission rules first.","請先閱讀並同意投稿規則。"));document.getElementById("rulesConsent")?.focus();return;}
if(!document.getElementById("socialShareConsent")?.checked){showToast(localizedChoiceText("请先勾选展品社交媒体分享授权。","Authorize official social-media sharing to submit.","請先勾選展品社群媒體分享授權。"));document.getElementById("socialShareConsent")?.focus();return;}

try{

const isRail=submissionTypeInput?.value==="rail_ticket";

if(!isRail&&!routeScopeInput?.value){showToast(localizedChoiceText("请选择国内、国际或地区航线","Choose domestic, international, or regional route.","請選擇國內、國際或地區航線。"));return;}



// -------------------------
// 检查选择
// -------------------------


if(!isRail&&!selectedAirline){


showToast(
"请选择航空公司"
);


return;


}



if(!isRail&&!selectedAirport){


showToast(
"请选择出发机场"
);


return;


}







// -------------------------
// 基础信息
// -------------------------


const flightInput =

document.getElementById(
"flight"
);



const dateInput =

document.getElementById(
"date"
);



const storyInput =

document.getElementById(
"story"
);



const imageInput =

document.getElementById(
"ticketImage"
);







const railFlight=document.getElementById("railTrainNumber");
const flight = (isRail?railFlight?.value:flightInput.value).trim();





if(!flight){


showToast(
"请输入航班号"
);


return;


}




const dateValue=(isRail?document.getElementById("railDate")?.value:dateInput.value)||"";
if(!dateValue){


showToast(
"请选择日期"
);


return;


}

if(isRail){
  if(!selectedRailOperator){showToast("请选择火车运营公司");return;}
  for(const [id,label] of [["railDepartureStation","出发车站"],["departureCountry","出发国家 / 地区"],["railArrivalStation","到达车站"],["arrivalCountry","到达国家 / 地区"]]){
    if(!document.getElementById(id)?.value.trim()){showToast(`请填写${label}`);return;}
  }
}






// -------------------------
// 图片
// -------------------------


const canvas =

document.getElementById(
"watermarkCanvas"
);





if(!canvas || canvas.width===0){


showToast(
"请先上传并处理图片"
);


return;


}






const blob = await (window.bpmCompressCanvas
  ? window.bpmCompressCanvas(canvas, { maxBytes: 4 * 1024 * 1024, maxEdge: 2600, quality: 0.9 })
  : new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.82)));
if(!blob || blob.size > 5 * 1024 * 1024) throw new Error("图片仍超过 5 MB，请打开图片编辑器压缩后重试");



const formData = new FormData();


formData.append(

"image",

blob,

"ticket.jpg"

);



const uploadResponse =

await fetch(

"https://api.bpmuseum.org.cn/api/upload-image",

{

method:"POST",

body:formData

}

);



const uploadResult =

await uploadResponse.json();



if(!uploadResult.success){

showToast(
"图片上传失败"
);

return;

}



const image =

uploadResult.url;






// -------------------------
// 创建投稿数据
// -------------------------


const rail=isRail;
const originStation=rail?document.getElementById("railDepartureStation").value.trim():canonicalDisplayName(selectedAirport);
const destStation=rail?document.getElementById("railArrivalStation").value.trim():"";
const operator=rail?selectedRailOperator:selectedAirline;
let flightData = {

submission_type:rail?"rail_ticket":"boarding_pass",
ticket_format:rail?document.getElementById("railTicketFormat").value:document.getElementById("ticketFormat").value,
cabin_class:rail?"":(document.getElementById("cabinClass")?.value||"economy"),
departure_country:rail?document.getElementById("departureCountry").value.trim():(selectedAirport?.country_cn||""),
arrival_country:rail?document.getElementById("arrivalCountry").value.trim():(selectedAirport?.country_cn||""),
special_tags:rail?[]:[...document.querySelectorAll('input[name="specialTag"]:checked')].map(input=>input.value),
route_scope:rail?"":(routeScopeInput?.value||""),


airline:

rail?operator.name_cn:canonicalDisplayName(operator),



airline_iata:

operator.iata
||
"",



airline_icao:

operator.icao
||
"",






airport:

originStation,



airport_iata:

selectedAirport?.iata
||
"",



airport_icao:

selectedAirport?.icao
||
"",


issue_airport:

selectedIssueAirport
?
canonicalDisplayName(selectedIssueAirport)
:
"",






flight:

flight,



date:

dateValue,



story:

storyInput.value.trim(),



route:destStation,

image:

image,



status:

"screening",

rules_consent:document.getElementById("rulesConsent")?.checked===true,
social_share_consent:document.getElementById("socialShareConsent")?.checked===true



};







// -------------------------
// 保存投稿
// -------------------------




await fetch(
API_BASE + "/api/submit",
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(
flightData
)

}
)
.then(
res=>res.json()
)
.then(
data=>{

if(!data.success) throw new Error(data.error || "投稿失败");

}
);






showToast(
"投稿成功！已进入管理员审核队列"
);

clearDraft();






resetSubmitForm();





}

catch(error){



console.error(

"投稿错误:",

error

);



showToast(
error.message || "投稿失败，请稍后重试"
);



}



}







// =====================================
// 清空表单
// =====================================


function resetSubmitForm(){



selectedAirline = null;


selectedAirport = null;

selectedIssueAirport = null;





if(airlineInput)

airlineInput.value="";



if(airportInput)

airportInput.value="";

if(issueAirportInput)

issueAirportInput.value="";

if(routeScopeInput)routeScopeInput.value="";
document.querySelectorAll('input[name="specialTag"]').forEach(input=>input.checked=false);
if(aiPrivacyConsent)aiPrivacyConsent.checked=false;





if(airlineResults)

airlineResults.innerHTML="";



if(airportResults)

airportResults.innerHTML="";

if(issueAirportResults)

issueAirportResults.innerHTML="";







const flightInput =

document.getElementById(
"flight"
);



const dateInput =

document.getElementById(
"date"
);



const storyInput =

document.getElementById(
"story"
);



const imageInput =

document.getElementById(
"ticketImage"
);






if(flightInput)

flightInput.value="";



if(dateInput)

dateInput.value="";



if(storyInput)

storyInput.value="";



if(imageInput)

imageInput.value="";



}
