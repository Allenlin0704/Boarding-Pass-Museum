// =================================
// BoardingPassMuseum
// register.js
// 用户注册
// =================================


// 获取按钮

const registerBtn =
document.getElementById(
    "registerBtn"
);


const sendCodeBtn =
document.getElementById(
    "sendCodeBtn"
);




// 临时验证码
// 后期替换为服务器邮件验证码

let emailCode = "";




// 发送验证码

sendCodeBtn.onclick = function(){


    const email =
    document.getElementById(
        "email"
    ).value.trim();



    if(!email){

        alert(
            "请输入邮箱"
        );

        return;

    }



    // 生成6位验证码

    emailCode =
    Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();



    console.log(
        "测试验证码:",
        emailCode
    );



    alert(
        "验证码已发送（测试模式）"
    );


};







// 注册

registerBtn.onclick=function(){



const username =
document.getElementById(
    "username"
).value.trim();



const email =
document.getElementById(
    "email"
).value.trim();



const verifyCode =
document.getElementById(
    "verifyCode"
).value.trim();



const password =
document.getElementById(
    "password"
).value.trim();



const confirmPassword =
document.getElementById(
    "confirmPassword"
).value.trim();





if(
!username ||
!email ||
!verifyCode ||
!password ||
!confirmPassword
){


alert(
"请填写完整信息"
);


return;


}







if(
verifyCode !== emailCode
){


alert(
"验证码错误"
);


return;


}






if(
password !== confirmPassword
){


alert(
"两次密码不一致"
);


return;


}






const users =

JSON.parse(

localStorage.getItem(
"users"
)

)

|| [];








const exists =

users.some(

user =>

user.email === email

);




if(exists){


alert(
"该邮箱已经注册"
);


return;


}







users.push({

username,

email,

password,


// 权限预留

role:
"user"

});







localStorage.setItem(

"users",

JSON.stringify(users)

);






alert(
"注册成功，请登录"
);




window.location.href =
"login.html";



};