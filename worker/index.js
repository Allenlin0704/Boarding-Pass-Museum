// =====================================
// BoardingPassMuseum API V4.3.1
// User + Submission + Admin System
// =====================================


function cors(){

return {

"Access-Control-Allow-Origin":"*",
"Access-Control-Allow-Headers":"Content-Type",
"Access-Control-Allow-Methods":"GET,POST,OPTIONS"

};

}




async function hashPassword(password){

const data =
new TextEncoder()
.encode(password);


const hash =
await crypto.subtle.digest(
"SHA-256",
data
);


return Array.from(
new Uint8Array(hash)
)
.map(
b=>b.toString(16).padStart(2,"0")
)
.join("");

}





export default {


async fetch(request,env){


const headers=cors();



if(request.method==="OPTIONS"){

return new Response(
null,
{
headers
}
);

}



const url =
new URL(request.url);




// =====================================
// TEST
// =====================================

if(
url.pathname==="/api/test"
){

return Response.json(
{
message:
"BoardingPassMuseum API V4.3.1 online"
},
{
headers
}
);

}





// =====================================
// SEND CODE
// =====================================


if(
url.pathname==="/api/send-code"
&&
request.method==="POST"
){

const {
email
}=await request.json();



const code =
Math.floor(
100000+
Math.random()*900000
)
.toString();



await env.DB.prepare(
`
INSERT INTO email_codes
(
email,
code,
expires_at
)
VALUES
(?,?,?)
`
)
.bind(
email,
code,
new Date(
Date.now()+10*60*1000
).toISOString()
)
.run();

// Send email with Resend

await fetch(
"https://api.resend.com/emails",
{
method:"POST",

headers:{
"Authorization":
`Bearer ${env.RESEND_API_KEY}`,

"Content-Type":
"application/json"
},

body:JSON.stringify({

from:
"BoardingPassMuseum <noreply@bpmuseum.org.cn>",

to:[
email
],

subject:
"BoardingPassMuseum 验证码 / Verification Code",

html:
`
<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">

<h2>BoardingPassMuseum</h2>

<p>
您好，您正在进行 BoardingPassMuseum 账户验证。
</p>

<p>
Hello, you are verifying your BoardingPassMuseum account.
</p>


<p>
您的验证码：
<br>
Your verification code:
</p>


<h1>${code}</h1>


<p>
验证码将在 10 分钟后失效。
<br>
This code will expire in 10 minutes.
</p>


<p>
如果这不是您的操作，请忽略此邮件。
<br>
If you did not request this code, please ignore this email.
</p>


<hr>

<p style="font-size:12px;color:#666">

BoardingPassMuseum<br>
Preserving memories of every journey.

记录每一次旅程的登机牌博物馆。

</p>

</div>
`

})

}
);

return Response.json(
{
success:true,
message:"Verification code sent"
},
{
headers
}
);

}






// =====================================
// REGISTER
// =====================================


if(
url.pathname==="/api/register"
&&
request.method==="POST"
){

const body =
await request.json();



const password =
await hashPassword(
body.password
);



try{


await env.DB.prepare(
`
INSERT INTO users
(
username,
email,
password
)
VALUES
(?,?,?)
`
)
.bind(
body.username,
body.email,
password
)
.run();



return Response.json(
{
success:true
},
{
headers
}
);


}
catch(e){


return Response.json(
{
error:e.message
},
{
status:400,
headers
}
);


}


}







// =====================================
// LOGIN
// =====================================


if(
url.pathname==="/api/login"
&&
request.method==="POST"
){


const body =
await request.json();



const user =
await env.DB.prepare(
`
SELECT *
FROM users
WHERE email=?
`
)
.bind(
body.email
)
.first();



if(!user){

return Response.json(
{
error:"User not found"
},
{
status:404,
headers
}
);

}



const password =
await hashPassword(
body.password
);



if(
password!==user.password
){

return Response.json(
{
error:"Wrong password"
},
{
status:401,
headers
}
);

}



return Response.json(
{
success:true,

user:{

id:user.id,

username:user.username,

email:user.email,

role:user.role

}

},
{
headers
}
);

}

// =====================================
// SUBMIT FLIGHT
// =====================================

if(
url.pathname==="/api/submit"
&&
request.method==="POST"
){

const body =
await request.json();



// 找 administrator

const admins =
await env.DB.prepare(
`
SELECT id
FROM users
WHERE role='administrator'
ORDER BY id ASC
`
)
.all();



let reviewer_id=null;



if(
admins.results.length>0
){

const total =
await env.DB.prepare(
`
SELECT COUNT(*) as count
FROM flights
WHERE reviewer_id IS NOT NULL
`
)
.first();



const index =
total.count %
admins.results.length;



reviewer_id =
admins.results[index].id;

}




await env.DB.prepare(
`
INSERT INTO flights
(
user_id,
airline,
flight,
route,
date,
aircraft,
airport,
image,
story,
status,
reviewer_id
)
VALUES
(?,?,?,?,?,?,?,?,?,'pending',?)
`
)
.bind(

body.user_id,

body.airline || "",

body.flight || "",

body.route || "",

body.date || "",

body.aircraft || "",

body.airport || "",

body.image || "",

body.story || "",

reviewer_id

)
.run();



return Response.json(
{
success:true,
message:"Submission received",
reviewer_id
},
{
headers
}
);


}


// =====================================
// CHANGE PASSWORD
// =====================================

if(
url.pathname==="/api/change-password"
&&
request.method==="POST"
){

const body =
await request.json();


// 查询用户

const user =
await env.DB.prepare(
`
SELECT *
FROM users
WHERE id=?
`
)
.bind(
body.user_id
)
.first();



if(!user){

return Response.json(
{
error:"User not found"
},
{
status:404,
headers
}
);

}



// 验证旧密码

const oldPassword =
await hashPassword(
body.old_password
);



if(
oldPassword !== user.password
){

return Response.json(
{
error:"Old password incorrect"
},
{
status:401,
headers
}
);

}



// 更新新密码

const newPassword =
await hashPassword(
body.new_password
);



await env.DB.prepare(
`
UPDATE users
SET password=?
WHERE id=?
`
)
.bind(
newPassword,
body.user_id
)
.run();



return Response.json(
{
success:true,
message:"Password changed"
},
{
headers
}
);


}



// =====================================
// MY SUBMISSIONS
// =====================================


if(
url.pathname==="/api/my-submissions"
&&
request.method==="GET"
){

const user_id =
url.searchParams.get(
"user_id"
);



const result =
await env.DB.prepare(
`
SELECT *
FROM flights
WHERE user_id=?
ORDER BY id DESC
`
)
.bind(
user_id
)
.all();



return Response.json(
result.results,
{
headers
}
);

}






// =====================================
// ADMIN PENDING
// =====================================


if(
url.pathname==="/api/admin/pending"
&&
request.method==="GET"
){

const admin_id =
url.searchParams.get(
"admin_id"
);



const admin =
await env.DB.prepare(
`
SELECT role
FROM users
WHERE id=?
`
)
.bind(
admin_id
)
.first();



if(
!admin ||
(
admin.role!=="administrator"
&&
admin.role!=="superadministrator"
)
){

return Response.json(
{
error:"No permission"
},
{
status:403,
headers
}
);

}



let result;



if(
admin.role==="superadministrator"
){

result =
await env.DB.prepare(
`
SELECT *
FROM flights
WHERE status='pending'
ORDER BY id DESC
`
)
.all();


}
else
{

result =
await env.DB.prepare(
`
SELECT *
FROM flights
WHERE status='pending'
AND reviewer_id=?
ORDER BY id DESC
`
)
.bind(
admin_id
)
.all();

}



return Response.json(
result.results,
{
headers
}
);


}







// =====================================
// ADMIN APPROVE
// =====================================


if(
url.pathname==="/api/admin/approve"
&&
request.method==="POST"
){

const body =
await request.json();



await env.DB.prepare(
`
UPDATE flights
SET status='approved'
WHERE id=?
`
)
.bind(
body.id
)
.run();



return {
 success:true,
 message:"Verification code sent"
},
{
headers
}
;


}








// =====================================
// ADMIN REJECT
// =====================================


if(
url.pathname==="/api/admin/reject"
&&
request.method==="POST"
){

const body =
await request.json();



await env.DB.prepare(
`
UPDATE flights
SET
status='rejected',
reject_reason=?
WHERE id=?
`
)
.bind(
body.reason || "",
body.id
)
.run();



return Response.json(
{
success:true
},
{
headers
}
);


}



// =====================================
// CREATE APPEAL
// =====================================

if(
url.pathname==="/api/appeal"
&&
request.method==="POST"
){

const body =
await request.json();


await env.DB.prepare(
`
INSERT INTO appeals
(
user_id,
flight_id,
reason
)
VALUES
(?,?,?)
`
)
.bind(
body.user_id,
body.flight_id,
body.reason
)
.run();



return Response.json(
{
success:true,
message:"Appeal submitted"
},
{
headers
}
);

}






// =====================================
// USER APPEALS
// =====================================

if(
url.pathname==="/api/my-appeals"
&&
request.method==="GET"
){

const user_id =
url.searchParams.get(
"user_id"
);



const result =
await env.DB.prepare(
`
SELECT *
FROM appeals
WHERE user_id=?
ORDER BY id DESC
`
)
.bind(
user_id
)
.all();



return Response.json(
result.results,
{
headers
}
);

}






// =====================================
// ADMIN VIEW APPEALS
// =====================================

if(
url.pathname==="/api/admin/appeals"
&&
request.method==="GET"
){


const admin_id =
url.searchParams.get(
"admin_id"
);



const admin =
await env.DB.prepare(
`
SELECT role
FROM users
WHERE id=?
`
)
.bind(
admin_id
)
.first();



if(
!admin
||
(
admin.role!=="administrator"
&&
admin.role!=="superadministrator"
)
){

return Response.json(
{
error:"No permission"
},
{
status:403,
headers
}
);

}




const result =
await env.DB.prepare(
`
SELECT *
FROM appeals
ORDER BY id DESC
`
)
.all();



return Response.json(
result.results,
{
headers
}
);


}

// =====================================
// RESET PASSWORD
// =====================================

if(
url.pathname==="/api/reset-password"
&&
request.method==="POST"
){

const body =
await request.json();


const record =
await env.DB.prepare(
`
SELECT *
FROM email_codes
WHERE email=?
AND code=?
AND expires_at > ?
ORDER BY id DESC
LIMIT 1
`
)
.bind(
body.email,
body.code,
new Date().toISOString()
)
.first();



if(!record){

return Response.json(
{
error:"Invalid code"
},
{
status:400,
headers
}
);

}



const password =
await hashPassword(
body.new_password
);



await env.DB.prepare(
`
UPDATE users
SET password=?
WHERE email=?
`
)
.bind(
password,
body.email
)
.run();

await env.DB.prepare(
`
DELETE FROM email_codes
WHERE email=?
AND code=?
`
)
.bind(
body.email,
body.code
)
.run();

return Response.json(
{
success:true,
message:"Password updated"
},
{
headers
}
);


}

return Response.json(
{
error:"Not Found"
},
{
status:404,
headers
}
);



}


};