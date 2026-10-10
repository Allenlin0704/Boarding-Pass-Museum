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
"https://api.bpmuseum.org.cn/api/login",
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
password:password,
admin_role:document.getElementById("adminRole")?.value
}
)

}

);




const data =
await res.json();




if(
data.id
){



// 保存服务器返回身份

localStorage.setItem(
"currentUser",
JSON.stringify(
data
)
);

if(data.admin_context) sessionStorage.setItem("bpm_admin_entry_authenticated","1");



showToast(
"登录成功"
);



const requestedNext=new URLSearchParams(location.search).get("next")||"";
const next=/^[a-zA-Z0-9_-]+\.html(?:[?#][^\s]*)?$/.test(requestedNext)?requestedNext:(data.admin_context?"console.html":"index.html");
window.location.href = next;



}

else{


showToast(
data.error ||
"账号或密码错误"
);


}



}

catch(e){


console.error(e);


showToast(
e?.message ||
"登录请求未完成，请检查网络后重试"
);


}


};
