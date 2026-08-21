
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


