const API =
"https://api.bpmuseum.org.cn";


const sendCodeBtn = document.getElementById("sendCodeBtn");
const registerBtn = document.getElementById("registerBtn");

const message =
document.getElementById("registerMessage");



sendCodeBtn.addEventListener(
"click",
async () => {


const email =
document.getElementById("email").value.trim();



if (!email) {

message.textContent =
"请输入邮箱";

return;

}



sendCodeBtn.disabled = true;

sendCodeBtn.textContent =
"发送中...";



try {


const response =
await fetch(
`${API}/api/send-code`,
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
await response.json();



if(data.success){

message.textContent =
"验证码已发送，请检查邮箱（包括垃圾邮件）";

}
else{

message.textContent =
"发送失败";

}


}

catch(error){

console.error(error);

message.textContent =
"服务器连接失败";

}



sendCodeBtn.disabled = false;

sendCodeBtn.textContent =
"获取验证码";


}

);