const btn =
document.getElementById(
"loginBtn"
);



btn.onclick=function(){


const email =
document.getElementById(
"loginEmail"
).value.trim();



const password =
document.getElementById(
"loginPassword"
).value.trim();



const users =

JSON.parse(

localStorage.getItem(
"users"
)

)

|| [];



const user =

users.find(

u=>

u.email===email
&&
u.password===password

);



if(user){


localStorage.setItem(
"currentUser",
JSON.stringify(user)
);



alert(
"登录成功"
);



window.location.href =
"index.html";


}

else{


alert(
"账号或密码错误"
);


}


};