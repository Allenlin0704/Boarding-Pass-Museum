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
    issue_airport_code: selectedCode(selectedIssueAirport),
    flight: document.getElementById("flight")?.value || "",
    date: document.getElementById("date")?.value || "",
    story: document.getElementById("story")?.value || ""
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

${item.name_cn || item.name_en || ""}

</strong>


<br>


<span>

${item.name_en || ""}

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



let name =

item.name_cn
||
item.name_en
||
"";



if(item.iata){


name +=
" ("+
item.iata+
")";


}



return name;



}
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

[airlineInput, airportInput, issueAirportInput, document.getElementById("flight"), document.getElementById("date"), document.getElementById("story")]
  .filter(Boolean).forEach(field => field.addEventListener("input", queueDraftSave));

window.addEventListener("pagehide", () => saveDraft(false));

restoreDraft();






// =====================================
// 提交投稿
// =====================================


async function submitFlight(){

if(!currentUser || !currentUser.id){
    showToast("请先登录");
    return;
}

try{



// -------------------------
// 检查选择
// -------------------------


if(!selectedAirline){


showToast(
"请选择航空公司"
);


return;


}



if(!selectedAirport){


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







const flight =

flightInput.value.trim();





if(!flight){


showToast(
"请输入航班号"
);


return;


}




if(!dateInput.value){


showToast(
"请选择日期"
);


return;


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






const blob =

await new Promise(resolve =>

canvas.toBlob(

resolve,

"image/jpeg",

0.9

)

);



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


let flightData = {


airline:

displayName(
selectedAirline
),



airline_iata:

selectedAirline.iata
||
"",



airline_icao:

selectedAirline.icao
||
"",






airport:

displayName(
selectedAirport
),



airport_iata:

selectedAirport.iata
||
"",



airport_icao:

selectedAirport.icao
||
"",


issue_airport:

selectedIssueAirport
?
displayName(selectedIssueAirport)
:
"",






flight:

flight,



date:

dateInput.value,



story:

storyInput.value.trim(),



image:

image,



status:

"screening"



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
