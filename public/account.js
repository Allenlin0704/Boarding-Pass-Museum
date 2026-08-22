
let accountUser =
JSON.parse(
localStorage.getItem("currentUser")
);


if(!accountUser){

location.href="login.html";

}



const userId =
accountUser.id;



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
// AVATAR UPLOAD
// ================================

const avatarFile =
document.getElementById("avatarFile");

if(avatarFile){

avatarFile.onchange = async function(){

const file=this.files[0];

if(!file)
return;


const formData =
new FormData();

formData.append(
"image",
file
);


try{

showToast("正在上传头像");


const res =
await fetch(
"https://api.bpmuseum.org.cn/api/upload-image",
{
method:"POST",
body:formData
}
);


const data =
await res.json();


if(data.url){

avatarInput.value=data.url;

avatarPreview.src=data.url;

showToast("头像上传成功");

}else{

showToast("上传失败");

}


}catch(e){

console.error(e);

showToast("网络错误");

}


};


}

