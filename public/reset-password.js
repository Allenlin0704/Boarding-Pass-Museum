const API =
"https://api.bpmuseum.org.cn";


const msg =
document.getElementById("message");



document.getElementById(
"sendCodeBtn"
)
.onclick = async ()=>{


const email =
document.getElementById(
"resetEmail"
).value;



const res =
await fetch(
`${API}/api/account/reset/send-code`,
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email
})

}
);



const data =
await res.json();


msg.innerText =
data.message ||
data.error ||
"发送完成";


};



document.getElementById(
"resetBtn"
)
.onclick = async ()=>{


const email =
document.getElementById(
"resetEmail"
).value;


const code =
document.getElementById(
"resetCode"
).value;


const password =
document.getElementById(
"newPassword"
).value;



const res =
await fetch(
`${API}/api/account/reset-password`,
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email,
code,
password
})

}
);



const data =
await res.json();



msg.innerText =
data.success?
"密码重置成功，请重新登录":
data.error ||
"失败";


};