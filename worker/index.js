// =====================================
// BoardingPassMuseum API V5.0
// User + Submission + Admin + SA System
// =====================================



function cors(){

return {

"Access-Control-Allow-Origin":"*",

"Access-Control-Allow-Headers":
"Content-Type",

"Access-Control-Allow-Methods":
"GET,POST,OPTIONS"

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






async function getUser(env,id){

return await env.DB.prepare(
`
SELECT *
FROM users
WHERE id=?
`
)
.bind(id)
.first();

}






async function requireAdmin(env,id){

const user =
await getUser(env,id);



if(
!user ||
(
user.role!=="administrator"
&&
user.role!=="superadministrator"
)
){

return null;

}


return user;

}







async function requireSA(env,id){

const user =
await getUser(env,id);


// =====================================
// SA 安全规则
// SA 永远只有 ID=1
// 前端 role 不可信
// 必须同时满足：
// 1. 用户 ID = 1
// 2. 数据库 role = superadministrator
// =====================================

if(
!user ||
Number(user.id)!==1 ||
user.role!=="superadministrator"
){

return null;

}


return user;

}


// =====================================
// RESEND EMAIL
// =====================================

async function sendVerificationEmail(env,email,code){

const response =
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

to:[email],

subject:
"BoardingPassMuseum 账户验证码",

html:`
<div style="
font-family:-apple-system,BlinkMacSystemFont,
'Segoe UI',Arial,sans-serif;
line-height:1.7;
max-width:600px;
margin:0 auto;
padding:32px 24px;
color:#222;
">

<h2>BoardingPassMuseum</h2>

<p>
您好，您正在进行 BoardingPassMuseum 账户验证。
</p>

<p>
Hello, you are verifying your BoardingPassMuseum account.
</p>

<p>
您的验证码：<br>
Your verification code:
</p>

<div style="
font-size:32px;
font-weight:700;
letter-spacing:8px;
margin:24px 0;
">
${code}
</div>

<p>
验证码将在 10 分钟后失效。<br>
This code will expire in 10 minutes.
</p>

<p>
如果这不是您的操作，请忽略此邮件。<br>
If you did not request this code, please ignore this email.
</p>

<hr style="
border:0;
border-top:1px solid #ddd;
margin:32px 0;
">

<p>
<strong>BoardingPassMuseum</strong><br>
Preserving memories of every journey.<br>
记录每一次旅程的登机牌博物馆。
</p>

</div>
`

})
}
);

return response.ok;

}





export default {

async fetch(request,env){


const headers =
cors();

const url =
new URL(request.url);

// =====================================
// ACCOUNT RECOVERY
// =====================================


// 忘记密码发送验证码
if(
url.pathname==="/api/account/reset/send-code"
&&
request.method==="POST"
){

const { email } = await request.json();

const code =
Math.floor(
100000+
Math.random()*900000
).toString();

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

await sendVerificationEmail(
env,
email,
code
);

return Response.json(
{
success:true,
message:"Verification code generated"
},
{
headers
}
);

}



// 重置密码

if(
url.pathname==="/api/account/reset-password"
&&
request.method==="POST"
){

const {
email,
code,
password
}=await request.json();



const verify =
await env.DB.prepare(
`
SELECT *
FROM email_codes
WHERE email=?
AND code=?
ORDER BY id DESC
LIMIT 1
`
)
.bind(
email,
code
)
.first();



if(!verify){

return Response.json(
{
error:"验证码错误"
},
{
status:400,
headers
}
);

}



const hash =
await hashPassword(
password
);



await env.DB.prepare(
`
UPDATE users
SET password=?
WHERE email=?
`
)
.bind(
hash,
email
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





// 修改邮箱发送验证码

if(
url.pathname==="/api/account/change-email/send-code"
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
).toString();



await env.DB.prepare(
`
INSERT INTO email_codes
(email,code,expires_at)
VALUES(?,?,?)
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



return Response.json(
{
success:true
},
{
headers
}
);

}




// 修改邮箱

if(
url.pathname==="/api/account/change-email"
&&
request.method==="POST"
){

const {
user_id,
password,
new_email,
code
}=await request.json();



const user =
await env.DB.prepare(
`
SELECT *
FROM users
WHERE id=?
`
)
.bind(
user_id
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



const oldHash =
await hashPassword(
password
);



if(
oldHash!==user.password
){

return Response.json(
{
error:"密码错误"
},
{
status:403,
headers
}
);

}



const verify =
await env.DB.prepare(
`
SELECT *
FROM email_codes
WHERE email=?
AND code=?
ORDER BY id DESC
LIMIT 1
`
)
.bind(
new_email,
code
)
.first();



if(!verify){

return Response.json(
{
error:"验证码错误"
},
{
status:400,
headers
}
);

}



await env.DB.prepare(
`
UPDATE users
SET email=?
WHERE id=?
`
)
.bind(
new_email,
user_id
)
.run();

await sendVerificationEmail(
env,
email,
code
);

return Response.json(
{
success:true
},
{
headers
}
);

}



// ================================
// 获取用户档案
// ================================

if(
url.pathname==="/api/account/profile"
&&
request.method==="GET"
){

const id =
url.searchParams.get("id");


const user =
await env.DB.prepare(
`
SELECT
id,
username,
role,
avatar,
bio,
social_media,
equipment,
favorite_airlines,
favorite_airports,
created_at
FROM users
WHERE id=?
`
)
.bind(id)
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


return Response.json(
user,
{
headers
}
);

}



// ================================
// 更新用户档案
// ================================

if(
url.pathname==="/api/account/profile"
&&
request.method==="POST"
){

const {
user_id,
avatar,
bio,
social_media,
equipment,
favorite_airlines,
favorite_airports
}
=
await request.json();



await env.DB.prepare(
`
UPDATE users
SET
avatar=?,
bio=?,
social_media=?,
equipment=?,
favorite_airlines=?,
favorite_airports=?
WHERE id=?
`
)
.bind(
avatar || "",
bio || "",
social_media || "",
equipment || "",
favorite_airlines || "",
favorite_airports || "",
user_id
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


// ================================
// 修改用户名
// ================================

if(
url.pathname==="/api/account/change-username"
&&
request.method==="POST"
){

const {
user_id,
password,
new_username
}=await request.json();



const user =
await env.DB.prepare(
`
SELECT *
FROM users
WHERE id=?
`
)
.bind(
user_id
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



const oldHash =
await hashPassword(
password
);



if(
oldHash!==user.password
){

return Response.json(
{
error:"密码错误"
},
{
status:403,
headers
}
);

}



await env.DB.prepare(
`
UPDATE users
SET username=?
WHERE id=?
`
)
.bind(
new_username,
user_id
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



if(
request.method==="OPTIONS"
){

return new Response(
null,
{
headers
}
);

}





console.log(
request.method,
url.pathname
);








// =====================================
// TEST
// =====================================


if(
url.pathname==="/api/test"
){

return Response.json(
{
message:
"BoardingPassMuseum API V5.0 online"
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
}
=
await request.json();




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
)
.toISOString()
)
.run();

await sendVerificationEmail(
env,
email,
code
);

return Response.json(
{
success:true,
message:"Verification code generated"
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

const {

username,

email,

password,

code

}
=
await request.json();





const verify =
await env.DB.prepare(
`
SELECT *
FROM email_codes
WHERE email=?
AND code=?
ORDER BY id DESC
LIMIT 1
`
)
.bind(
email,
code
)
.first();





if(!verify){

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





const hash =
await hashPassword(password);





await env.DB.prepare(
`
INSERT INTO users
(
username,
email,
password,
role
)
VALUES
(?,?,?,?)
`
)
.bind(
username,
email,
hash,
"user"
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
// IMAGE UPLOAD TO R2
// =====================================

if(
url.pathname === "/api/upload-image"
&&
request.method === "POST"
){

const form =
await request.formData();


const file =
form.get("image");


if(!file){

return Response.json(
{
error:"No image"
},
{
status:400,
headers
}
);

}


const ext =
file.type === "image/png"
?
"png"
:
"jpg";


const key =
`tickets/${Date.now()}.${ext}`;



await env.IMAGES.put(
key,
file,
{
httpMetadata:{
contentType:file.type
}
}
);



return Response.json(
{
success:true,

url:
`https://images.bpmuseum.org.cn/${key}`
},
{
headers
}
);

}




// =====================================
// LOGIN
// =====================================


if(
url.pathname==="/api/login"
&&
request.method==="POST"
){

const {

email,

password

}
=
await request.json();





const hash =
await hashPassword(password);





const user =
await env.DB.prepare(
`
SELECT id,username,email,role
FROM users
WHERE email=?
AND password=?
`
)
.bind(
email,
hash
)
.first();





if(!user){

return Response.json(
{
error:"Invalid login"
},
{
status:401,
headers
}
);

}





return Response.json(
user,
{
headers
}
);

}

// =====================================
// SUBMIT
// 新投稿 + 自动分配审核管理员
// =====================================

if(
url.pathname==="/api/submit"
&&
request.method==="POST"
){

const {

user_id,

airline,

flight,

airport,

date,

story,

image,

issue_airport

}
=
await request.json();


// =====================================
// 用户身份验证
// 服务器不信任前端传入的 user_id
// =====================================

const submitUser =
await getUser(
env,
user_id
);

if(!submitUser){

return Response.json(
{
success:false,
error:"用户不存在或登录已失效"
},
{
status:401,
headers
}
);

}


// =====================================
// 查找当前所有普通管理员
// SA 不参与普通投稿分配
// =====================================

const admins =
await env.DB.prepare(
`
SELECT
users.id,
(
    SELECT COUNT(*)
    FROM flights
    WHERE flights.status='pending'
    AND flights.reviewer_id=users.id
) AS pending_count
FROM users
WHERE users.role='administrator'
ORDER BY pending_count ASC, users.id ASC
`
)
.all();


const adminList =
admins.results || [];


// =====================================
// 如果存在普通管理员
// 分配给当前待审核数量最少的管理员
// =====================================

let reviewer_id = null;

if(adminList.length > 0){

    reviewer_id =
        Number(
            adminList[0].id
        );

}


// =====================================
// 写入投稿
// =====================================

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
issue_airport,
image,
story,
status,
reviewer_id
)
VALUES
(?,?,?,?,?,?,?,?,?,?,?,?)
`
)
.bind(

user_id,

airline || "",

flight || "",

"",

date || "",

"",

airport || "",

issue_airport || "",

image || "",

story || "",

"pending",

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


if(
url.pathname==="/api/submit"
&&
request.method==="POST"
){

const {

user_id,

airline,

flight,

airport,

date,

story,

image,

issue_airport

}
=
await request.json();





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
issue_airport,
image,
story,
status
)
VALUES
(?,?,?,?,?,?,?,?,?,?,?)
`
)
.bind(

user_id,

airline || "",

flight || "",

"",

date || "",

"",

airport || "",

issue_airport || "",

image || "",

story || "",

"pending"

)
.run();





return Response.json(
{
success:true,
message:"Submission received"
},
{
headers
}
);

}










// =====================================
// 我的投稿
// 用户只能查看自己的投稿及审核状态
// =====================================

if(
url.pathname==="/api/account/my-flights"
&&
request.method==="GET"
){

const user_id =
url.searchParams.get("user_id");

if(!user_id){

return Response.json(
{
success:false,
error:"请先登录"
},
{
status:401,
headers
}
);

}

const result =
await env.DB.prepare(
`
SELECT
flights.*,
users.username,
users.avatar,
COUNT(favorites.id) AS favorite_count
FROM flights

LEFT JOIN users
ON flights.user_id = users.id

LEFT JOIN favorites
ON favorites.flight_id = flights.id

WHERE flights.user_id=?

GROUP BY flights.id

ORDER BY flights.id DESC
`
)
.bind(
Number(user_id)
)
.all();

return Response.json(
{
success:true,
flights:result.results || []
},
{
headers
}
);

}


// =====================================
// PUBLIC GALLERY
// =====================================




if(
url.pathname==="/api/flights"
&&
request.method==="GET"
){

const result =
await env.DB.prepare(
`
SELECT
flights.*,
users.username,
users.avatar,
COUNT(favorites.id) AS favorite_count
FROM flights

LEFT JOIN users
ON flights.user_id = users.id

LEFT JOIN favorites
ON favorites.flight_id = flights.id

WHERE flights.status='approved'

GROUP BY flights.id

ORDER BY flights.id DESC
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
// SINGLE FLIGHT DETAIL
// =====================================

if(
url.pathname.startsWith("/api/flight/")
&&
request.method==="GET"
){

const id =
url.pathname.split("/").pop();


const result =
await env.DB.prepare(
`
SELECT
flights.*,
users.username,
appeals.reason AS appeal_reason,
appeals.status AS appeal_status
FROM flights
LEFT JOIN users
ON flights.user_id = users.id
LEFT JOIN appeals
ON flights.id = appeals.flight_id
WHERE flights.id=?
`
)
.bind(id)
.first();



if(!result){

return Response.json(
{
error:"Not found"
},
{
status:404,
headers
}
);

}



return Response.json(
result,
{
headers
}
);

}

// =====================================
// USER WITHDRAW
// =====================================

if(
url.pathname==="/api/my/withdraw"
&&
request.method==="POST"
){

const {
flight_id,
user_id
}
=
await request.json();


await env.DB.prepare(
`
UPDATE flights
SET status='hidden'
WHERE id=?
AND user_id=?
`
)
.bind(
flight_id,
user_id
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
// USER SUBMISSIONS
// =====================================


if(
url.pathname==="/api/my-flights"
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
SELECT
flights.*,
appeals.status AS appeal_status,
appeals.id AS appeal_id
FROM flights
LEFT JOIN appeals
ON flights.id = appeals.flight_id
WHERE flights.user_id=?
ORDER BY flights.id DESC
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
// CREATE APPEAL
// =====================================

if(
url.pathname==="/api/appeal"
&&
request.method==="POST"
){

const data =
await request.json();


const {
user_id,
flight_id,
reason
}
=
data;



if(
!user_id ||
!flight_id ||
!reason
){

return Response.json(
{
error:"Missing fields"
},
{
status:400,
headers
}
);

}



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
user_id,
flight_id,
reason
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
// FAVORITES LIST
// =====================================


if(
url.pathname==="/api/favorites"
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
SELECT
flights.*
FROM favorites

JOIN flights

ON favorites.flight_id=flights.id

WHERE favorites.user_id=?

ORDER BY favorites.id DESC
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
// ADD FAVORITE
// =====================================


if(
url.pathname==="/api/favorites/add"
&&
request.method==="POST"
){

const {

user_id,

flight_id

}
=
await request.json();





const exists =
await env.DB.prepare(
`
SELECT id
FROM favorites
WHERE user_id=?
AND flight_id=?
`
)
.bind(
user_id,
flight_id
)
.first();


if(exists){

return Response.json(
{
success:false,
error:"Already favorited"
},
{
headers
}
);

}



await env.DB.prepare(
`
INSERT INTO favorites
(
user_id,
flight_id
)
VALUES
(?,?)
`
)
.bind(
user_id,
flight_id
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
// REMOVE FAVORITE
// =====================================


if(
url.pathname==="/api/favorites/remove"
&&
request.method==="POST"
){

const {

user_id,

flight_id

}
=
await request.json();





await env.DB.prepare(
`
DELETE FROM favorites
WHERE user_id=?
AND flight_id=?
`
)
.bind(
user_id,
flight_id
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
await requireAdmin(
env,
admin_id
);



if(!admin){

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
FROM flights
WHERE status='pending'
AND reviewer_id=?
ORDER BY id DESC
`
)
.bind(
admin.id
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
// ADMIN APPROVED
// =====================================


if(
url.pathname==="/api/admin/approved"
&&
request.method==="GET"
){

const admin_id =
url.searchParams.get(
"admin_id"
);




const admin =
await requireAdmin(
env,
admin_id
);



if(!admin){

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
FROM flights
WHERE status='approved'
AND reviewer_id=?
ORDER BY id DESC
`
)
.bind(
admin.id
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
// APPROVE
// =====================================


if(
url.pathname==="/api/admin/approve"
&&
request.method==="POST"
){

const {
admin_id,
flight_id
}
=
await request.json();


const admin =
await requireAdmin(
env,
admin_id
);


if(!admin){

return Response.json(
{
success:false,
error:"No permission"
},
{
status:403,
headers
}
);

}


// =====================================
// 审核权限
// SA 可以审核任何展品
// 普通管理员只能审核分配给自己的 pending 展品
// =====================================

const flight =
await env.DB.prepare(
`
SELECT
id,
status,
reviewer_id
FROM flights
WHERE id=?
`
)
.bind(
Number(flight_id)
)
.first();


if(!flight){

return Response.json(
{
success:false,
error:"展品不存在"
},
{
status:404,
headers
}
);

}


if(admin.role==="administrator"){

if(
flight.status!=="pending"
||
Number(flight.reviewer_id)!==
Number(admin.id)
){

return Response.json(
{
success:false,
error:"你没有权限审核这件展品"
},
{
status:403,
headers
}
);

}

}


await env.DB.prepare(
`
UPDATE flights
SET
status='approved',
reviewer_id=?
WHERE id=?
`
)
.bind(
admin.id,
Number(flight_id)
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
// REJECT
// =====================================




if(
url.pathname==="/api/admin/reject"
&&
request.method==="POST"
){

const {
admin_id,
flight_id,
reason
}
=
await request.json();


const admin =
await requireAdmin(
env,
admin_id
);


if(!admin){

return Response.json(
{
success:false,
error:"No permission"
},
{
status:403,
headers
}
);

}


// =====================================
// 审核权限
// SA 可以拒绝任何展品
// 普通管理员只能拒绝分配给自己的 pending 展品
// =====================================

const flight =
await env.DB.prepare(
`
SELECT
id,
status,
reviewer_id
FROM flights
WHERE id=?
`
)
.bind(
Number(flight_id)
)
.first();


if(!flight){

return Response.json(
{
success:false,
error:"展品不存在"
},
{
status:404,
headers
}
);

}


if(admin.role==="administrator"){

if(
flight.status!=="pending"
||
Number(flight.reviewer_id)!==
Number(admin.id)
){

return Response.json(
{
success:false,
error:"你没有权限审核这件展品"
},
{
status:403,
headers
}
);

}

}


const rejectReason =
String(reason || "").trim();


if(!rejectReason){

return Response.json(
{
success:false,
error:"拒绝展品必须填写原因"
},
{
status:400,
headers
}
);

}


await env.DB.prepare(
`
UPDATE flights
SET
status='rejected',
reject_reason=?,
reviewer_id=?
WHERE id=?
`
)
.bind(
rejectReason,
admin.id,
Number(flight_id)
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
// ADMIN EDIT

// =====================================


if(
url.pathname==="/api/admin/edit"
&&
request.method==="POST"
){

const data =
await request.json();





const {

admin_id,

flight_id,

airline,

flight,

airport,

date,

story,

image

}
=
data;





const admin =
await requireAdmin(
env,
admin_id
);



if(!admin){

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





await env.DB.prepare(
`
UPDATE flights

SET

airline=?,

flight=?,

airport=?,

date=?,

story=?,

image=?

WHERE id=?

`
)
.bind(

airline || "",

flight || "",

airport || "",

date || "",

story || "",

image || "",

flight_id

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
// SA VIEW APPEALS
// =====================================


if(
url.pathname==="/api/sa/appeals"
&&
request.method==="GET"
){

const sa_id =
url.searchParams.get(
"sa_id"
);




const sa =
await requireSA(
env,
sa_id
);



if(!sa){

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
WHERE status='pending'
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
// SA APPROVE APPEAL
// =====================================

if(
url.pathname==="/api/sa/appeal/approve"
&&
request.method==="POST"
){

const data =
await request.json();


const sa =
await requireSA(
env,
data.sa_id
);


if(!sa){

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



await env.DB.prepare(
`
UPDATE flights
SET status='pending'
WHERE id=?
`
)
.bind(
data.flight_id
)
.run();



await env.DB.prepare(
`
UPDATE appeals
SET status='approved'
WHERE id=?
`
)
.bind(
data.appeal_id
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
// SA REJECT APPEAL
// =====================================

if(
url.pathname==="/api/sa/appeal/reject"
&&
request.method==="POST"
){

const data =
await request.json();


const sa =
await requireSA(
env,
data.sa_id
);


if(!sa){

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



await env.DB.prepare(
`
UPDATE appeals
SET status='rejected'
WHERE id=?
`
)
.bind(
data.appeal_id
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
// SA WITHDRAW APPROVED
// =====================================


if(
url.pathname==="/api/sa/withdraw"
&&
request.method==="POST"
){

const {

sa_id,

flight_id

}
=
await request.json();





const sa =
await requireSA(
env,
sa_id
);



if(!sa){

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





await env.DB.prepare(
`
UPDATE flights

SET

status='pending',

reviewer_id=NULL

WHERE id=?

`
)
.bind(
flight_id
)
.run();





return Response.json(
{
success:true,
message:"Returned to review"
},
{
headers
}
);

}









// =====================================
// SA RE-REVIEW REJECTED
// =====================================


if(
url.pathname==="/api/sa/review"
&&
request.method==="POST"
){

const {

sa_id,

flight_id

}
=
await request.json();





const sa =
await requireSA(
env,
sa_id
);



if(!sa){

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





await env.DB.prepare(
`
UPDATE flights

SET

status='pending',

reject_reason=NULL

WHERE id=?

`
)
.bind(
flight_id
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
// SA DELETE FLIGHT
// =====================================


if(
url.pathname==="/api/sa/delete-flight"
&&
request.method==="POST"
){

const {

sa_id,

flight_id

}
=
await request.json();



const sa =
await requireSA(
env,
sa_id
);



if(!sa){

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



await env.DB.prepare(
`
DELETE FROM flights
WHERE id=?
`
)
.bind(
flight_id
)
.run();



return Response.json(
{
success:true,
message:"Flight deleted"
},
{
headers
}
);

}







// =====================================


// =====================================
// SA ALL FLIGHTS
// =====================================

if(
url.pathname==="/api/sa/flights"
&&
request.method==="GET"
){

const sa_id =
url.searchParams.get("sa_id");


const sa =
await requireSA(
env,
sa_id
);


if(!sa){

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
SELECT
flights.*,
users.username
FROM flights
LEFT JOIN users
ON flights.user_id = users.id
ORDER BY flights.id DESC
`
)
.all();



return Response.json(
result.results || [],
{
headers
}
);

}


// SA UPDATE LOGS
// =====================================


if(
url.pathname==="/api/sa/updates"
&&
request.method==="GET"
){

const sa_id =
url.searchParams.get(
"sa_id"
);




const sa =
await requireSA(
env,
sa_id
);



if(!sa){

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
FROM updates
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









if(
url.pathname==="/api/sa/updates"
&&
request.method==="POST"
){

const {

sa_id,

title,

content

}
=
await request.json();





const sa =
await requireSA(
env,
sa_id
);



if(!sa){

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





await env.DB.prepare(
`
INSERT INTO updates
(
title,
content
)
VALUES
(?,?)
`
)
.bind(
title,
content
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
// ANNOUNCEMENTS / UPDATES
// =====================================

// 获取首页更新日志

if(
url.pathname==="/api/announcements"
&&
request.method==="GET"
){

const result =
await env.DB.prepare(
`
SELECT
id,
version,
content,
created_at
FROM announcements
ORDER BY id DESC
`
).all();

return Response.json(
result.results || [],
{
headers
}
);

}


// 获取长期置顶事项

if(
url.pathname==="/api/updates"
&&
request.method==="GET"
){

const result =
await env.DB.prepare(
`
SELECT
id,
title,
content,
created_at
FROM updates
ORDER BY id DESC
`
).all();

return Response.json(
result.results || [],
{
headers
}
);

}


// SA 发布更新日志

if(
url.pathname==="/api/sa/announcement"
&&
request.method==="POST"
){

const {
sa_id,
version,
content
}=await request.json();

const sa =
await requireSA(
env,
sa_id
);

if(!sa){

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

if(
!version ||
!content
){

return Response.json(
{
error:"版本号和内容不能为空"
},
{
status:400,
headers
}
);

}

await env.DB.prepare(
`
INSERT INTO announcements
(title,version,content)
VALUES (?,?,?)
`
)
.bind(
"BoardingPassMuseum 更新日志",
version.trim(),
content.trim()
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


// SA 发布长期置顶事项

if(
url.pathname==="/api/sa/update"
&&
request.method==="POST"
){

const {
sa_id,
title,
content
}=await request.json();

const sa =
await requireSA(
env,
sa_id
);

if(!sa){

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

if(
!content
){

return Response.json(
{
error:"内容不能为空"
},
{
status:400,
headers
}
);

}

await env.DB.prepare(
`
INSERT INTO updates
(title,content)
VALUES (?,?)
`
)
.bind(
(title || "").trim(),
content.trim()
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
// SA USER MANAGEMENT
// =====================================


// 获取用户列表

if(
url.pathname==="/api/sa/users"
&&
request.method==="GET"
){

const sa_id =
url.searchParams.get("sa_id");


const sa =
await requireSA(
env,
sa_id
);


if(!sa){

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



const users =
await env.DB.prepare(
`
SELECT
id,
username,
email,
role,
created_at
FROM users
ORDER BY id ASC
`
)
.all();



return Response.json(
users.results,
{
headers
}
);

}



// 提升管理员

if(
url.pathname==="/api/sa/promote"
&&
request.method==="POST"
){

const {
sa_id,
user_id
}=await request.json();



const sa =
await requireSA(
env,
sa_id
);



if(!sa){

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


// ID=1 是唯一 SA，禁止改变其角色
if(Number(user_id)===1){

return Response.json(
{
success:false,
error:"SA 账号不可修改"
},
{
status:403,
headers
}
);

}



await env.DB.prepare(
`
UPDATE users
SET role='administrator'
WHERE id=?
AND role!='superadministrator'
`
)
.bind(
user_id
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



// 撤销管理员

if(
url.pathname==="/api/sa/demote"
&&
request.method==="POST"
){

const {
sa_id,
user_id
}=await request.json();



const sa =
await requireSA(
env,
sa_id
);



if(!sa){

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


// ID=1 是唯一 SA，禁止撤销其权限
if(Number(user_id)===1){

return Response.json(
{
success:false,
error:"SA 账号不可降级"
},
{
status:403,
headers
}
);

}



await env.DB.prepare(
`
UPDATE users
SET role='user'
WHERE id=?
AND role='administrator'
`
)
.bind(
user_id
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
// USER APPLY ADMIN
// =====================================

if(
url.pathname==="/api/account/admin-request"
&&
request.method==="POST"
){

const {
user_id,
reason,
social
}=await request.json();


await env.DB.prepare(
`
INSERT INTO admin_requests
(
user_id,
reason,
social
)
VALUES
(?,?,?)
`
)
.bind(
user_id,
reason,
social
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
// SA VIEW ADMIN REQUEST
// =====================================

if(
url.pathname==="/api/sa/admin-requests"
){

const {
sa_id
}=Object.fromEntries(
url.searchParams
);


const sa =
await requireSA(
env,
sa_id
);


if(!sa){

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
SELECT

admin_requests.*,

users.username,
users.email,

COUNT(flights.id)
AS upload_count

FROM admin_requests

JOIN users
ON users.id=admin_requests.user_id

LEFT JOIN flights
ON flights.user_id=users.id

WHERE admin_requests.status='pending'

GROUP BY admin_requests.id

ORDER BY admin_requests.id DESC

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
// SA APPROVE ADMIN
// =====================================

if(
url.pathname==="/api/sa/admin-request/approve"
&&
request.method==="POST"
){

const {
sa_id,
request_id,
user_id
}=await request.json();


const sa =
await requireSA(
env,
sa_id
);


if(!sa){

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


await env.DB.prepare(
`
UPDATE users
SET role='administrator'
WHERE id=?
`
)
.bind(user_id)
.run();



await env.DB.prepare(
`
UPDATE admin_requests
SET status='approved'
WHERE id=?
`
)
.bind(request_id)
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
// SA REJECT ADMIN
// =====================================

if(
url.pathname==="/api/sa/admin-request/reject"
&&
request.method==="POST"
){

const {
sa_id,
request_id
}=await request.json();


const sa =
await requireSA(
env,
sa_id
);


if(!sa){

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


await env.DB.prepare(
`
UPDATE admin_requests
SET status='rejected'
WHERE id=?
`
)
.bind(request_id)
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
// SA COMMUNITY MANAGEMENT
// SA 社区管理
// =====================================

if(
url.pathname==="/api/sa/community/posts"
&&
request.method==="GET"
){

try{

const sa_id =
Number(url.searchParams.get("sa_id"));

const sa =
await requireSA(
env,
sa_id
);

if(!sa){

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
SELECT
community_posts.id,
community_posts.user_id,
community_posts.title,
community_posts.content,
community_posts.status,
community_posts.created_at,

users.username,
users.email,
users.avatar,

(
    SELECT COUNT(*)
    FROM community_likes
    WHERE community_likes.post_id=community_posts.id
) AS like_count,

(
    SELECT COUNT(*)
    FROM community_comments
    WHERE community_comments.post_id=community_posts.id
) AS comment_count

FROM community_posts

JOIN users
ON users.id=community_posts.user_id

ORDER BY community_posts.created_at DESC

LIMIT 100
`
)
.all();

return Response.json(
{
success:true,
posts:result.results || []
},
{
headers
}
);

}catch(error){

console.error(error);

return Response.json(
{
success:false,
error:"加载社区管理数据失败"
},
{
status:500,
headers
}
);

}

}



// =====================================
// SA COMMUNITY STATUS
// 下架 / 恢复社区帖子
// =====================================

if(
url.pathname==="/api/sa/community/posts/status"
&&
request.method==="POST"
){

try{

const {
sa_id,
post_id,
status,
moderation_reason
}=await request.json();


const sa =
await requireSA(
env,
Number(sa_id)
);


if(!sa){

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


const validStatus =
status==="visible" ||
status==="hidden";


if(!validStatus){

return Response.json(
{
success:false,
error:"Invalid status"
},
{
status:400,
headers
}
);

}


const post =
await env.DB.prepare(
`
SELECT id
FROM community_posts
WHERE id=?
`
)
.bind(
Number(post_id)
)
.first();


if(!post){

return Response.json(
{
success:false,
error:"帖子不存在"
},
{
status:404,
headers
}
);

}


let reason = null;

if(status === "hidden"){

    reason =
        String(moderation_reason || "").trim();

    if(!reason){

        return Response.json(
            {
                success:false,
                error:"下架帖子必须填写原因"
            },
            {
                status:400,
                headers
            }
        );

    }

}


await env.DB.prepare(
`
UPDATE community_posts
SET
status=?,
moderation_reason=?
WHERE id=?
`
)
.bind(
    status,
    reason,
    Number(post_id)
)
.run();


return Response.json(
{
success:true,
status
},
{
headers
}
);

}catch(error){

console.error(error);

return Response.json(
{
success:false,
error:"更新帖子状态失败"
},
{
status:500,
headers
}
);

}

}


// =====================================
// 用户个人档案社区动态
// 包括本人被 SA 下架的帖子
// =====================================

if(
url.pathname==="/api/community/user-posts"
&&
request.method==="GET"
){

try{

const userId =
Number(
    url.searchParams.get("id")
);

const viewerId =
Number(
    url.searchParams.get("viewer_id")
);

if(!userId){

return Response.json(
{
success:false,
error:"用户 ID 无效"
},
{
status:400,
headers
}
);

}

/*
 * 公开查看他人档案：
 * 只能看到正常帖子。
 *
 * 查看自己的档案：
 * 可以看到自己的正常帖子和被下架帖子，
 * 这样作者才能看到 SA 给出的下架原因。
 */

const isOwner =
viewerId &&
viewerId === userId;

const query = isOwner
?
`
SELECT
community_posts.id,
community_posts.title,
community_posts.content,
community_posts.created_at,
community_posts.status,
community_posts.moderation_reason,
users.id AS user_id,
users.username,
users.avatar,

(
    SELECT COUNT(*)
    FROM community_likes
    WHERE community_likes.post_id=community_posts.id
) AS like_count,

(
    SELECT COUNT(*)
    FROM community_comments
    WHERE community_comments.post_id=community_posts.id
) AS comment_count

FROM community_posts
JOIN users
ON users.id=community_posts.user_id

WHERE community_posts.user_id=?

ORDER BY community_posts.created_at DESC
LIMIT 100
`
:
`
SELECT
community_posts.id,
community_posts.title,
community_posts.content,
community_posts.created_at,
community_posts.status,
NULL AS moderation_reason,
users.id AS user_id,
users.username,
users.avatar,

(
    SELECT COUNT(*)
    FROM community_likes
    WHERE community_likes.post_id=community_posts.id
) AS like_count,

(
    SELECT COUNT(*)
    FROM community_comments
    WHERE community_comments.post_id=community_posts.id
) AS comment_count

FROM community_posts
JOIN users
ON users.id=community_posts.user_id

WHERE
community_posts.user_id=?
AND
community_posts.status='visible'

ORDER BY community_posts.created_at DESC
LIMIT 100
`;

const result =
await env.DB
.prepare(query)
.bind(userId)
.all();

return Response.json(
{
success:true,
posts:
result.results || []
},
{
headers
}
);

}catch(error){

console.error(
"User community posts error:",
error
);

return Response.json(
{
success:false,
error:"加载用户社区动态失败"
},
{
status:500,
headers
}
);

}

}

// =====================================
// COMMUNITY V1
// 帖子列表 + 发布帖子
// =====================================

if(
url.pathname==="/api/community/posts"
&&
request.method==="GET"
){

try{

const result =
await env.DB.prepare(
`
SELECT
community_posts.id,
community_posts.title,
community_posts.content,
community_posts.created_at,
users.id AS user_id,
users.username,
users.avatar,

(
    SELECT COUNT(*)
    FROM community_likes
    WHERE community_likes.post_id=community_posts.id
) AS like_count,

(
    SELECT COUNT(*)
    FROM community_comments
    WHERE community_comments.post_id=community_posts.id
) AS comment_count

FROM community_posts
JOIN users
ON users.id=community_posts.user_id
WHERE community_posts.status='visible'
ORDER BY community_posts.created_at DESC
LIMIT 50
`
).all();


return Response.json(
{
success:true,
posts:result.results || []
},
{
headers
}
);


}catch(error){

console.error(error);

return Response.json(
{
success:false,
error:"加载社区帖子失败"
},
{
status:500,
headers
}
);

}

}



if(
url.pathname==="/api/community/posts"
&&
request.method==="POST"
){

try{

const body =
await request.json();

const user_id =
Number(body.user_id);

const title =
String(body.title || "").trim();

const content =
String(body.content || "").trim();


if(!user_id){

return Response.json(
{
success:false,
error:"请先登录"
},
{
status:401,
headers
}
);

}


if(!title || !content){

return Response.json(
{
success:false,
error:"标题和内容不能为空"
},
{
status:400,
headers
}
);

}


if(title.length>100){

return Response.json(
{
success:false,
error:"标题不能超过100字"
},
{
status:400,
headers
}
);

}


if(content.length>5000){

return Response.json(
{
success:false,
error:"内容不能超过5000字"
},
{
status:400,
headers
}
);

}


const user =
await env.DB.prepare(
`
SELECT id
FROM users
WHERE id=?
`
)
.bind(user_id)
.first();


if(!user){

return Response.json(
{
success:false,
error:"用户不存在"
},
{
status:404,
headers
}
);

}


const result =
await env.DB.prepare(
`
INSERT INTO community_posts
(
user_id,
title,
content
)
VALUES (?, ?, ?)
`
)
.bind(
user_id,
title,
content
)
.run();


return Response.json(
{
success:true,
id:result.meta.last_row_id
},
{
headers
}
);


}catch(error){

console.error(error);

return Response.json(
{
success:false,
error:"发布帖子失败"
},
{
status:500,
headers
}
);

}

}




// =====================================
// COMMUNITY POST DELETE
// 删除自己的社区帖子
// =====================================

if(
url.pathname.startsWith("/api/community/posts/")
&&
request.method==="DELETE"
){

try{

const post_id =
Number(
url.pathname.split("/").pop()
);

const body =
await request.json();

const user_id =
Number(body.user_id);


if(!post_id || !user_id){

return Response.json(
{
success:false,
error:"参数不完整"
},
{
status:400,
headers
}
);

}


/*
 * 必须由服务器验证帖子所有者。
 * 不能只相信前端传来的身份。
 */

const post =
await env.DB.prepare(
`
SELECT
id,
user_id
FROM community_posts
WHERE id=?
`
)
.bind(post_id)
.first();


if(!post){

return Response.json(
{
success:false,
error:"帖子不存在"
},
{
status:404,
headers
}
);

}


if(
Number(post.user_id)
!==
user_id
){

return Response.json(
{
success:false,
error:"你没有权限删除这条帖子"
},
{
status:403,
headers
}
);

}


/*
 * 先删除点赞和评论，
 * 再删除帖子。
 */

await env.DB.prepare(
`
DELETE FROM community_likes
WHERE post_id=?
`
)
.bind(post_id)
.run();


await env.DB.prepare(
`
DELETE FROM community_comments
WHERE post_id=?
`
)
.bind(post_id)
.run();


await env.DB.prepare(
`
DELETE FROM community_posts
WHERE id=?
AND user_id=?
`
)
.bind(
post_id,
user_id
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


}catch(error){

console.error(
"Community post delete error:",
error
);


return Response.json(
{
success:false,
error:"删除帖子失败"
},
{
status:500,
headers
}
);

}

}



// =====================================
// COMMUNITY COMMENTS
// =====================================

if(
url.pathname==="/api/community/comments"
&&
request.method==="GET"
){

const post_id =
Number(url.searchParams.get("post_id"));

if(!post_id){

return Response.json(
{error:"Invalid post_id"},
{status:400,headers}
);

}

const result =
await env.DB.prepare(
`
SELECT
community_comments.id,
community_comments.content,
community_comments.created_at,
users.id AS user_id,
users.username,
users.avatar
FROM community_comments
JOIN users
ON users.id=community_comments.user_id
WHERE community_comments.post_id=?
ORDER BY community_comments.created_at ASC
`
)
.bind(post_id)
.all();

return Response.json(
{
success:true,
comments:result.results || []
},
{headers}
);

}


if(
url.pathname==="/api/community/comments"
&&
request.method==="POST"
){

const body =
await request.json();

const user_id =
Number(body.user_id);

const post_id =
Number(body.post_id);

const content =
String(body.content || "").trim();

if(!user_id || !post_id || !content){

return Response.json(
{
success:false,
error:"参数不完整"
},
{status:400,headers}
);

}

if(content.length>2000){

return Response.json(
{
success:false,
error:"评论不能超过2000字"
},
{status:400,headers}
);

}

const user =
await env.DB.prepare(
`SELECT id FROM users WHERE id=?`
)
.bind(user_id)
.first();

if(!user){

return Response.json(
{error:"用户不存在"},
{status:404,headers}
);

}

const post =
await env.DB.prepare(
`SELECT id FROM community_posts WHERE id=?`
)
.bind(post_id)
.first();

if(!post){

return Response.json(
{error:"帖子不存在"},
{status:404,headers}
);

}

const result =
await env.DB.prepare(
`
INSERT INTO community_comments
(post_id,user_id,content)
VALUES(?,?,?)
`
)
.bind(
post_id,
user_id,
content
)
.run();

return Response.json(
{
success:true,
id:result.meta.last_row_id
},
{headers}
);

}


// =====================================
// COMMUNITY LIKE
// =====================================

if(
url.pathname==="/api/community/like"
&&
request.method==="POST"
){

const body =
await request.json();

const user_id =
Number(body.user_id);

const post_id =
Number(body.post_id);

if(!user_id || !post_id){

return Response.json(
{error:"参数不完整"},
{status:400,headers}
);

}

const existing =
await env.DB.prepare(
`
SELECT id
FROM community_likes
WHERE post_id=? AND user_id=?
`
)
.bind(post_id,user_id)
.first();

if(existing){

await env.DB.prepare(
`
DELETE FROM community_likes
WHERE post_id=? AND user_id=?
`
)
.bind(post_id,user_id)
.run();

}else{

await env.DB.prepare(
`
INSERT INTO community_likes
(post_id,user_id)
VALUES(?,?)
`
)
.bind(post_id,user_id)
.run();

}

const count =
await env.DB.prepare(
`
SELECT COUNT(*) AS count
FROM community_likes
WHERE post_id=?
`
)
.bind(post_id)
.first();

return Response.json(
{
success:true,
liked:!existing,
count:count?.count || 0
},
{headers}
);

}



// =====================================
// NOT FOUND
// =====================================


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

