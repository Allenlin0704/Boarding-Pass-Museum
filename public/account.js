
let accountUser =
JSON.parse(
localStorage.getItem("currentUser")
);


if(!accountUser){

location.href="login.html";

}



const userId =
accountUser.id;

const exportDataButton=document.getElementById("exportData");

if(exportDataButton){
exportDataButton.onclick=async()=>{
  exportDataButton.disabled=true;
  const original=exportDataButton.textContent;
  exportDataButton.textContent="正在准备文件…";
  try{
    const res=await fetch(`${API}/api/account/export`,{credentials:"include"});
    const data=await res.json();
    if(!res.ok)throw Error(data.error||"导出失败");
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download=`BoardingPassMuseum-我的数据-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(link.href);
    showToast("数据文件已下载，请妥善保管");
  }catch(error){showToast(error.message||"导出失败");}
  finally{exportDataButton.disabled=false;exportDataButton.textContent=original;}
};
}

const deletionStatus=document.getElementById("deletionRequestStatus");
const requestDeletionButton=document.getElementById("requestDeletion");
const cancelDeletionButton=document.getElementById("cancelDeletion");
const deletionReason=document.getElementById("deletionReason");
const deletionPassword=document.getElementById("deletionPassword");
const deletionLabels={pending:"已提交，48 小时冷静期中",cancelled:"你已取消这项申请"};
async function loadDeletionRequest(){
  if(!deletionStatus)return;
  try{
    const response=await fetch(`${API}/api/account/deletion-request`);
    const data=await response.json();
    if(!response.ok)throw Error(data.error||"无法读取注销申请状态");
    const current=data.request;
    deletionStatus.textContent=current?`当前状态：${current.finalized_at?"已完成匿名化":deletionLabels[current.status]||current.status}${current.execute_at&&!current.finalized_at?`。可在 ${new Date(current.execute_at+"Z").toLocaleString("zh-CN")} 前取消。`:""}`:"你尚未提交注销申请。";
    const active=current&&current.status==="pending"&&!current.finalized_at;
    requestDeletionButton.hidden=!!active;
    cancelDeletionButton.hidden=!active;
    deletionReason.disabled=!!active;
    deletionPassword.disabled=!!active;
  }catch(error){deletionStatus.textContent=error.message||"无法读取注销申请状态";}
}
if(requestDeletionButton){
  requestDeletionButton.onclick=async()=>{
    const password=deletionPassword.value;
    if(!password){showToast("请输入当前密码确认");return;}
    if(!confirm("提交后进入 48 小时冷静期；期间可取消，到期后账户会匿名化。是否继续？"))return;
    requestDeletionButton.disabled=true;
    try{
      const response=await fetch(`${API}/api/account/deletion-request`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:userId,password,reason:deletionReason.value.trim()})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||"提交失败");
      deletionPassword.value="";showToast("注销申请已提交");await loadDeletionRequest();
    }catch(error){showToast(error.message||"提交失败");}
    finally{requestDeletionButton.disabled=false;}
  };
}
if(cancelDeletionButton){
  cancelDeletionButton.onclick=async()=>{
    if(!confirm("确定取消注销申请吗？"))return;
    cancelDeletionButton.disabled=true;
    try{
      const response=await fetch(`${API}/api/account/deletion-request/cancel`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:userId})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||"取消失败");
      showToast("注销申请已取消");await loadDeletionRequest();
    }catch(error){showToast(error.message||"取消失败");}
    finally{cancelDeletionButton.disabled=false;}
  };
}
loadDeletionRequest();



document.getElementById(
"usernameInput"
).value =
accountUser.username || "";



document.getElementById(
"emailInput"
).value =
accountUser.email || "";




// ================================
// 修改用户名
// ================================

document.getElementById(
"saveInfo"
).onclick=async()=>{


const newUsername =
document.getElementById(
"usernameInput"
).value.trim();


const password =
prompt(
"请输入当前密码确认"
);



if(!newUsername || !password){

showToast(
"请输入完整信息"
);

return;

}



const res =
await fetch(
`${API}/api/account/change-username`,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

user_id:userId,

new_username:newUsername,

password:password

})

}
);



const data =
await res.json();



if(data.success){

accountUser.username =
newUsername;


localStorage.setItem(
"currentUser",
JSON.stringify(accountUser)
);


showToast(
"用户名修改成功"
);


location.reload();


}else{

showToast(
data.error ||
"修改失败"
);

}


};




// ================================
// 发送邮箱验证码
// ================================

document.getElementById(
"sendEmailCode"
).onclick=async()=>{


const email =
document.getElementById(
"newEmail"
).value.trim();



if(!email){

showToast(
"请输入新邮箱"
);

return;

}



const res =
await fetch(
`${API}/api/account/change-email/send-code`,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

email:email

})

}

);



const data =
await res.json();


if(data.success){

showToast(
"验证码已发送"
);

}else{

showToast(
data.error ||
"发送失败"
);

}


};




// ================================
// 修改邮箱
// ================================

document.getElementById(
"changeEmail"
).onclick=async()=>{


const new_email =
document.getElementById(
"newEmail"
).value.trim();


const code =
document.getElementById(
"emailCode"
).value.trim();


const password =
document.getElementById(
"emailPassword"
).value;



const res =
await fetch(
`${API}/api/account/change-email`,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

user_id:userId,

password:password,

new_email:new_email,

code:code

})

}

);



const data =
await res.json();



if(data.success){

accountUser.email =
new_email;


localStorage.setItem(
"currentUser",
JSON.stringify(accountUser)
);


showToast(
"邮箱修改成功"
);


location.reload();


}else{

showToast(
data.error ||
"修改失败"
);

}


};



// ================================
// 发送修改密码验证码
// ================================

const sendPasswordCode =
document.getElementById(
"sendPasswordCode"
);


if(sendPasswordCode){


sendPasswordCode.onclick=async()=>{


const email =
accountUser.email;



const res =
await fetch(
`${API}/api/account/change-email/send-code`,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

email:email

})

}

);



const data =
await res.json();



if(data.success){

showToast(
"验证码已发送到当前邮箱"
);

}else{

showToast(
data.error ||
"发送失败"
);

}


};


}



// ================================
// 修改密码
// ================================

const changePassword =
document.getElementById(
"changePassword"
);



if(changePassword){


changePassword.onclick=async()=>{


const code =
document.getElementById(
"passwordCode"
).value.trim();



const password =
document.getElementById(
"newPassword"
).value;



const confirm =
document.getElementById(
"confirmPassword"
).value;



if(!code || !password || !confirm){

showToast(
"请填写完整信息"
);

return;

}



if(password!==confirm){

showToast(
"两次密码不一致"
);

return;

}



const res =
await fetch(
`${API}/api/account/reset-password`,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

email:accountUser.email,

code:code,

password:password

})

}

);



const data =
await res.json();



if(data.success){


showToast(
"密码修改成功，请重新登录"
);



setTimeout(()=>{


localStorage.removeItem(
"currentUser"
);


location.href="login.html";


},1500);



}else{


showToast(
data.error ||
"修改失败"
);


}


};


}




// =====================================
// 航空收藏家档案
// =====================================


async function loadProfileSettings(){


const user =
JSON.parse(
localStorage.getItem("currentUser")
);


if(!user)
return;



try{


const res =
await fetch(
`https://api.bpmuseum.org.cn/api/account/profile?id=${user.id}`
);



const data =
await res.json();



if(!res.ok)
return;



document.getElementById(
"profileAvatarInput"
).value =
data.avatar || "";



document.getElementById(
"profileBioInput"
).value =
data.bio || "";



document.getElementById(
"profileSocialInput"
).value =
data.social_media || "";



document.getElementById(
"profileEquipmentInput"
).value =
data.equipment || "";



document.getElementById(
"profileAirlinesInput"
).value =
data.favorite_airlines || "";



document.getElementById(
"profileAirportsInput"
).value =
data.favorite_airports || "";



}catch(e){

console.error(
"加载档案失败",
e
);

}


}







// ================================
// 头像实时预览
// ================================

const avatarInput =
document.getElementById(
"profileAvatarInput"
);

const avatarPreview =
document.getElementById(
"profileAvatarPreview"
);


if(avatarInput && avatarPreview){

avatarInput.oninput =
function(){

avatarPreview.src =
this.value.trim()
||
"logo.png";

};

}

const saveProfile =
document.getElementById(
"saveProfile"
);



if(saveProfile){


saveProfile.onclick =
async function(){



const user =
JSON.parse(
localStorage.getItem("currentUser")
);



if(!user){

showToast(
"请先登录"
);

return;

}



const body={

user_id:user.id,

avatar:
document.getElementById(
"profileAvatarInput"
).value.trim(),


bio:
document.getElementById(
"profileBioInput"
).value.trim(),


social_media:
document.getElementById(
"profileSocialInput"
).value.trim(),


equipment:
document.getElementById(
"profileEquipmentInput"
).value.trim(),


favorite_airlines:
document.getElementById(
"profileAirlinesInput"
).value.trim(),


favorite_airports:
document.getElementById(
"profileAirportsInput"
).value.trim()

};



try{


const res =
await fetch(
"https://api.bpmuseum.org.cn/api/account/profile",
{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:
JSON.stringify(body)

}

);



const data =
await res.json();



if(data.success){

showToast(
"航空档案保存成功"
);


}else{

showToast(
data.error ||
"保存失败"
);

}


}catch(e){

showToast(
"网络错误"
);

}


};


}



document.addEventListener(
"DOMContentLoaded",
()=>{

loadProfileSettings();

});



// ================================
// AVATAR CANVAS UPLOAD
// ================================

const avatarFile =
document.getElementById("avatarFile");

const avatarCanvas =
document.getElementById("avatarCanvas");

const avatarCtx =
avatarCanvas
? avatarCanvas.getContext("2d")
: null;


if(avatarFile && avatarCanvas && avatarCtx){

avatarFile.onchange = function(){

const file=this.files[0];

if(!file)
return;

if(!file.type.startsWith("image/")){

showToast("请选择图片文件");
return;

}

const reader=new FileReader();

reader.onload=function(e){

const img=new Image();

img.onload=function(){

const size=300;

const side=Math.min(
img.naturalWidth,
img.naturalHeight
);

const sx=
(img.naturalWidth-side)/2;

const sy=
(img.naturalHeight-side)/2;

avatarCtx.clearRect(
0,
0,
size,
size
);

avatarCtx.drawImage(
img,
sx,
sy,
side,
side,
0,
0,
size,
size
);

avatarCanvas.style.display="block";

avatarCanvas.toBlob(
async function(blob){

if(!blob){

showToast("图片处理失败");
return;

}

const formData=new FormData();

formData.append(
"image",
blob,
"avatar.jpg"
);

try{

showToast("正在上传头像");

const res=await fetch(
"https://api.bpmuseum.org.cn/api/upload-image",
{
method:"POST",
body:formData
}
);

const data=await res.json();

if(!res.ok || !data.url){

showToast(
data.error || "头像上传失败"
);

return;

}

avatarInput.value=data.url;

avatarPreview.src=data.url;

showToast("头像上传成功");

}catch(err){

console.error(err);

showToast("头像上传失败");

}

},
"image/jpeg",
0.9
);

};

img.src=e.target.result;

};

reader.readAsDataURL(file);

};

}



// =====================================
// PROFILE 航司 / 机场选择器
// =====================================

(function(){

const airlinesSearch =
document.getElementById(
"profileAirlinesSearch"
);

const airportsSearch =
document.getElementById(
"profileAirportsSearch"
);

const airlineResults =
document.getElementById(
"airlineResults"
);

const airportResults =
document.getElementById(
"airportResults"
);

const selectedAirlines =
document.getElementById(
"selectedAirlines"
);

const selectedAirports =
document.getElementById(
"selectedAirports"
);

const airlineHidden =
document.getElementById(
"profileAirlinesInput"
);

const airportHidden =
document.getElementById(
"profileAirportsInput"
);


if(
!airlinesSearch ||
!airportsSearch ||
!airlineResults ||
!airportResults
){

return;

}


let airlines = [];
let airports = [];

let selectedAirlineValues = [];
let selectedAirportValues = [];


// =====================================
// 数据加载
// =====================================

async function loadSelectorData(){

try{

const [
airlineRes,
airportRes
] = await Promise.all([

fetch("data/airlines-global.json"),

fetch("data/airports-global.json")

]);


airlines =
await airlineRes.json();

airports =
await airportRes.json();


console.log(
"Profile 航司数据:",
airlines.length
);

console.log(
"Profile 机场数据:",
airports.length
);


}catch(e){

console.error(
"Profile 数据加载失败",
e
);

}

}


// =====================================
// 文本搜索
// =====================================

function matchItem(item, keyword){

keyword =
keyword
.trim()
.toLowerCase();

if(!keyword)
return true;

const fields = [

item.name_cn,
item.name_en,
item.iata,
item.icao,
item.country_cn,
item.country,
item.city_cn,
item.city_en

];

return fields.some(
x =>
String(x || "")
.toLowerCase()
.includes(keyword)
);

}


// =====================================
// 航司显示名称
// =====================================

function airlineLabel(item){

return `

<div class="profile-result-main">

<strong>
${item.name_cn || item.name_en || "未知航空公司"}
</strong>

<span>
${item.iata || "-"}
${item.icao ? " · " + item.icao : ""}
</span>

</div>

<div class="profile-result-sub">

${item.country_cn || item.country || ""}

</div>

`;

}


// =====================================
// 机场显示名称
// =====================================

function airportLabel(item){

return `

<div class="profile-result-main">

<strong>
${item.name_cn || item.name_en || "未知机场"}
</strong>

<span>
${item.iata || "-"}
${item.icao ? " · " + item.icao : ""}
</span>

</div>

<div class="profile-result-sub">

${
item.city_cn ||
item.city_en ||
""
}

${
item.country_cn
?
" · " + item.country_cn
:
""
}

</div>

`;

}


// =====================================
// 标签
// =====================================

function renderSelected(){

selectedAirlines.innerHTML =
selectedAirlineValues
.map(value => {

const item =
airlines.find(
x =>
String(x.iata || "")
.toUpperCase()
=== value
);

if(!item)
return "";

return `

<span class="profile-chip">

${item.name_cn || item.name_en}

<button
type="button"
data-remove-airline="${value}"
>
×
</button>

</span>

`;

})
.join("");


selectedAirports.innerHTML =
selectedAirportValues
.map(value => {

const item =
airports.find(
x =>
String(x.iata || "")
.toUpperCase()
=== value
);

if(!item)
return "";

return `

<span class="profile-chip">

${item.name_cn || item.name_en}

<button
type="button"
data-remove-airport="${value}"
>
×
</button>

</span>

`;

})
.join("");


airlineHidden.value =
selectedAirlineValues.join(",");

airportHidden.value =
selectedAirportValues.join(",");

}


// =====================================
// 航司搜索
// =====================================

function searchAirlines(){

const keyword =
airlinesSearch.value;


const list =
airlines
.filter(matchItem.bind(null))
.filter(
x =>
x.active !== false
)
.slice(0,30);


airlineResults.innerHTML =
list
.map(item => `

<div
class="profile-result"
data-airline="${String(item.iata || "").toUpperCase()}"
>

${airlineLabel(item)}

</div>

`)
.join("");


if(!list.length){

airlineResults.innerHTML =
`<div class="profile-no-result">
没有找到相关航空公司
</div>`;

}

}


// =====================================
// 机场搜索
// =====================================

function searchAirports(){

const keyword =
airportsSearch.value;


const list =
airports
.filter(matchItem.bind(null))
.filter(
x =>
x.active !== false
)
.slice(0,30);


airportResults.innerHTML =
list
.map(item => `

<div
class="profile-result"
data-airport="${String(item.iata || "").toUpperCase()}"
>

${airportLabel(item)}

</div>

`)
.join("");


if(!list.length){

airportResults.innerHTML =
`<div class="profile-no-result">
没有找到相关机场
</div>`;

}

}


// =====================================
// 点击选择
// =====================================

airlineResults.onclick =
function(e){

const row =
e.target.closest(
"[data-airline]"
);

if(!row)
return;

const value =
row.dataset.airline;

if(!value)
return;

if(
!selectedAirlineValues
.includes(value)
){

selectedAirlineValues.push(
value
);

}

renderSelected();

airlinesSearch.value="";

airlineResults.innerHTML="";

};


airportResults.onclick =
function(e){

const row =
e.target.closest(
"[data-airport]"
);

if(!row)
return;

const value =
row.dataset.airport;

if(!value)
return;

if(
!selectedAirportValues
.includes(value)
){

selectedAirportValues.push(
value
);

}

renderSelected();

airportsSearch.value="";

airportResults.innerHTML="";

};


// =====================================
// 删除标签
// =====================================

selectedAirlines.onclick =
function(e){

const btn =
e.target.closest(
"[data-remove-airline]"
);

if(!btn)
return;

selectedAirlineValues =
selectedAirlineValues.filter(
x =>
x !== btn.dataset.removeAirline
);

renderSelected();

};


selectedAirports.onclick =
function(e){

const btn =
e.target.closest(
"[data-remove-airport]"
);

if(!btn)
return;

selectedAirportValues =
selectedAirportValues.filter(
x =>
x !== btn.dataset.removeAirport
);

renderSelected();

};


// =====================================
// 输入
// =====================================

airlinesSearch.oninput =
searchAirlines;

airportsSearch.oninput =
searchAirports;


// =====================================
// 点击输入框显示结果
// =====================================

airlinesSearch.onfocus =
searchAirlines;

airportsSearch.onfocus =
searchAirports;


// =====================================
// 初始化
// =====================================

loadSelectorData().then(()=>{

const oldAirlines =
airlineHidden.value
.split(",")
.map(x =>
x.trim().toUpperCase()
)
.filter(Boolean);

const oldAirports =
airportHidden.value
.split(",")
.map(x =>
x.trim().toUpperCase()
)
.filter(Boolean);


selectedAirlineValues =
[
...new Set(oldAirlines)
];


selectedAirportValues =
[
...new Set(oldAirports)
];


renderSelected();

});


})();
