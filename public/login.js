// =====================================
// BoardingPassMuseum Login V4.3.1
// =====================================


const btn =
document.getElementById(
"loginBtn"
);



btn.onclick = async function(){



const email =
document.getElementById(
"loginEmail"
)
.value
.trim();



const password =
document.getElementById(
"loginPassword"
)
.value
.trim();




try{


const res =
await fetch(
"http://localhost:8788/api/login",
{

method:"POST",

headers:
{
"Content-Type":
"application/json"
},

body:
JSON.stringify(
{
email:email,
password:password
}
)

}

);




const data =
await res.json();




if(
data.success
){



// 保存服务器返回身份

localStorage.setItem(
"currentUser",
JSON.stringify(
data.user
)
);



alert(
"登录成功"
);



window.location.href =
"index.html";



}

else{


alert(
data.error ||
"账号或密码错误"
);


}



}

catch(e){


console.error(e);


alert(
"服务器连接失败"
);


}


};