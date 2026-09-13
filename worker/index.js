import { communityRoute } from "./community.mjs";
import { progressRoute, progressFor } from "./progress.mjs";
import { wechatRoute } from "./wechat.mjs";
import { reviewRoute } from "./review.mjs";
import { saSecurityRoute, requireSAStepup } from "./sa-security.mjs";
import { authenticate, boundedRequest, uploadImage, accountRoute, responseHeaders, reply, isSA, verifyTurnstile } from "./security.mjs";
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
(user.role!=="superadministrator" || Number(user.id)!==1)
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

if(!response.ok) throw new Error("Verification email delivery failed");
return true;

}


const legacy = {

async fetch(request,env){


const headers =
cors();

const url =
new URL(request.url);

// =====================================
// ACCOUNT RECOVERY
// =====================================


// 忘记密码发送验证码


// 重置密码


// 修改邮箱发送验证码


// 修改邮箱


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
CASE WHEN deleted_at IS NOT NULL THEN '账号已注销' ELSE username END AS username,
role,
avatar,
bio,
social_media,
equipment,
favorite_airlines,
favorite_airports,
created_at
FROM users
WHERE id=? AND deleted_at IS NULL
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


// =====================================
// REGISTER
// =====================================


// =====================================
// IMAGE UPLOAD TO R2
// =====================================


// =====================================
// LOGIN
// =====================================


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
    WHERE flights.status='screening'
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

"screening",

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
CASE WHEN users.deleted_at IS NOT NULL THEN '账号已注销' ELSE users.username END AS username,
CASE WHEN users.deleted_at IS NOT NULL THEN NULL ELSE users.avatar END AS avatar,
COUNT(favorites.id) AS favorite_count
FROM flights

LEFT JOIN users
ON flights.user_id = users.id

LEFT JOIN favorites
ON favorites.flight_id = flights.id

WHERE flights.user_id=? AND flights.status='approved'

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
CASE WHEN users.deleted_at IS NOT NULL THEN '账号已注销' ELSE users.username END AS username,
CASE WHEN users.deleted_at IS NOT NULL THEN NULL ELSE users.avatar END AS avatar,
COUNT(favorites.id) AS favorite_count
FROM flights

LEFT JOIN users
ON flights.user_id = users.id

LEFT JOIN favorites
ON favorites.flight_id = flights.id

WHERE flights.status='approved'

GROUP BY flights.id

ORDER BY COALESCE((SELECT priority FROM progress_cache WHERE user_id=flights.user_id AND year=CAST(strftime('%Y','now','+8 hours') AS INTEGER)),0) DESC,flights.id DESC
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
CASE WHEN users.deleted_at IS NOT NULL THEN '账号已注销' ELSE users.username END AS username,
appeals.reason AS appeal_reason,
appeals.status AS appeal_status
FROM flights
LEFT JOIN users
ON flights.user_id = users.id
LEFT JOIN appeals
ON appeals.id = (SELECT MAX(a.id) FROM appeals a WHERE a.flight_id=flights.id)
WHERE flights.id=? AND flights.status='approved'
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
// USER RESTORE / WITHDRAW
// =====================================

if (url.pathname === "/api/my/restore" && request.method === "POST") {
  const { flight_id, user_id } = await request.json();
  if (!Number.isSafeInteger(Number(flight_id)) || Number(flight_id) <= 0 ||
      !Number.isSafeInteger(Number(user_id)) || Number(user_id) <= 0) {
    return Response.json({ success: false, error: "无效的展品或用户 ID" }, { status: 400, headers });
  }
  const result = await env.DB.prepare(`
    UPDATE flights SET status='screening', reject_reason=NULL,
      reviewer_id=(SELECT users.id FROM users WHERE users.role='administrator'
        ORDER BY (SELECT COUNT(*) FROM flights AS queue
          WHERE queue.status='screening' AND queue.reviewer_id=users.id), users.id LIMIT 1)
    WHERE id=? AND user_id=? AND status='hidden'
  `).bind(Number(flight_id), Number(user_id)).run();
  if (!result.meta.changes) {
    return Response.json({ success: false, error: "展品不存在、不属于你或未下架" }, { status: 409, headers });
  }
  return Response.json({ success: true }, { headers });
}

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
ON appeals.id = (SELECT MAX(a.id) FROM appeals a WHERE a.flight_id=flights.id)
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


let result;

if(admin.role==="superadministrator"){

result =
await env.DB.prepare(
`
SELECT *
FROM flights
WHERE status='screening'
ORDER BY COALESCE((SELECT priority FROM progress_cache WHERE user_id=flights.user_id AND year=CAST(strftime('%Y','now','+8 hours') AS INTEGER)),0) DESC,id DESC
`
)
.all();

}else{

result =
await env.DB.prepare(
`
SELECT *
FROM flights
WHERE status='screening'
AND reviewer_id=?
ORDER BY COALESCE((SELECT priority FROM progress_cache WHERE user_id=flights.user_id AND year=CAST(strftime('%Y','now','+8 hours') AS INTEGER)),0) DESC,id DESC
`
)
.bind(
admin.id
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
ORDER BY COALESCE((SELECT priority FROM progress_cache WHERE user_id=flights.user_id AND year=CAST(strftime('%Y','now','+8 hours') AS INTEGER)),0) DESC,id DESC
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


// =====================================
// REJECT
// =====================================


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


// =====================================
// SA REJECT APPEAL
// =====================================


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

status='screening',

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
// SA APPROVE FLIGHT
// =====================================


// =====================================
// SA REJECT FLIGHT
// =====================================


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

status='screening',

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


// =====================================
// SA REJECT ADMIN
// =====================================


// =====================================
// SA COMMUNITY MANAGEMENT
// SA 社区管理
// =====================================


// =====================================
// SA COMMUNITY STATUS
// 下架 / 恢复社区帖子
// =====================================


// =====================================
// 用户个人档案社区动态
// 包括本人被 SA 下架的帖子
// =====================================


// =====================================
// COMMUNITY V1
// 帖子列表 + 发布帖子
// =====================================


// =====================================
// COMMUNITY POST DELETE
// 删除自己的社区帖子
// =====================================


// =====================================
// COMMUNITY COMMENTS
// =====================================


// =====================================
// COMMUNITY LIKE
// =====================================


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

export default {
  async fetch(request, env) {
    const original = request;
    try {
      const url = new URL(request.url);
      if(url.pathname==="/api/admin/screening") url.pathname="/api/admin/pending";
      if (request.method === "OPTIONS") return responseHeaders(original, new Response(null,{status:204}));
      if (!["GET", "HEAD"].includes(request.method)) {
        const origin=request.headers.get("Origin");
        if (origin && !["https://bpmuseum.org.cn","https://www.bpmuseum.org.cn","http://localhost:3000","http://127.0.0.1:3000"].includes(origin)) {
          return responseHeaders(original,reply({error:"来源不受信任"},403));
        }
        const type=request.headers.get("Content-Type")||"";
        if (!type.includes("application/json") && !(url.pathname==="/api/upload-image"&&type.includes("multipart/form-data")) && !(url.pathname==='/wechat'&&type.includes('xml'))) {
          return responseHeaders(original,reply({error:"请求格式不支持"},415));
        }
      }
      request = await boundedRequest(request);
      const wechat=await wechatRoute(request.clone(),env,url);
      if(wechat)return responseHeaders(original,wechat);
      const auth = await authenticate(request,env,url);
      if (auth.response) return responseHeaders(original,auth.response);
      request=auth.request;
      const turnstile=await verifyTurnstile(request,env,url);
      if(turnstile)return responseHeaders(original,turnstile);
      const saSecurity=await saSecurityRoute(request.clone(),env,url,auth.user);
      if(saSecurity)return responseHeaders(original,saSecurity);
      const saStepup=await requireSAStepup(request,env,auth.user,url);
      if(saStepup)return responseHeaders(original,saStepup);
      if(request.method==='GET' && ['/api/flights','/api/admin/pending'].includes(url.pathname)) {
        const stale=await env.DB.prepare("SELECT users.* FROM users LEFT JOIN progress_cache ON progress_cache.user_id=users.id WHERE progress_cache.user_id IS NULL OR progress_cache.year!=CAST(strftime('%Y','now','+8 hours') AS INTEGER) LIMIT 5").all();
        for(const account of stale.results) await progressFor(env,account);
      }
      if(url.pathname==="/api/upload-image"&&request.method==="POST") return responseHeaders(original,await uploadImage(request,env));
      const account = await accountRoute(request.clone(),env,url,auth.user,sendVerificationEmail);
      if(account) return responseHeaders(original,account);
      const progress = await progressRoute(request,env,url);
      if(progress) return responseHeaders(original,progress);
      const community = await communityRoute(request.clone(),env,url,auth.user);
      if(community) return responseHeaders(original,community);
      const reviewed = await reviewRoute(request.clone(),env,url,auth.user);
      if(reviewed) {
        if(reviewed.ok && /\/(approve|reject)$/.test(url.pathname)) {
          const body=await request.clone().json();
          const flight=body.flight_id?await env.DB.prepare('SELECT user_id FROM flights WHERE id=?').bind(Number(body.flight_id)).first():null;
          for(const id of new Set([auth.user.id,flight?.user_id].filter(Boolean))) {
            const account=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
            if(account) await progressFor(env,account);
          }
        }
        return responseHeaders(original,reviewed);
      }

      if(url.pathname==='/api/submit' && request.method==='POST') await progressFor(env,auth.user);
      const response = await legacy.fetch(request,env);
      return responseHeaders(original,response);
    } catch (error) {
      if(error instanceof RangeError) return responseHeaders(original,reply({error:"请求过大"},413));
      if(error instanceof SyntaxError) return responseHeaders(original,reply({error:"请求格式错误"},400));
      console.error("API request failed", error.name);
      return responseHeaders(original,reply({success:false,error:"服务暂时不可用，请稍后再试"},500));
    }
  },
  async scheduled(controller,env) {
    let cursor=0;
    while(true) {
      const batch=await env.DB.prepare('SELECT * FROM users WHERE id>? ORDER BY id LIMIT 50').bind(cursor).all();
      if(!batch.results.length) break;
      for(const user of batch.results) await progressFor(env,user);
      cursor=batch.results.at(-1).id;
    }
    await env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at<=datetime('now')").run();
    await env.DB.prepare("DELETE FROM auth_codes WHERE expires_at<=datetime('now')").run();
    await env.DB.prepare('DELETE FROM auth_limits WHERE bucket<?').bind(Math.floor(Date.now()/1000)-86400).run();
    const due=await env.DB.prepare("SELECT id,user_id FROM account_deletion_requests WHERE status='pending' AND finalized_at IS NULL AND execute_at<=datetime('now')").all();
    for(const request of due.results) {
      const id=Number(request.user_id);
      if(id===1) continue;
      await env.DB.batch([
        env.DB.prepare("UPDATE users SET username='账号已注销',email=?,password='deleted-account',role='user',avatar=NULL,bio=NULL,social_media=NULL,equipment=NULL,favorite_airlines=NULL,favorite_airports=NULL,deleted_at=CURRENT_TIMESTAMP WHERE id=? AND deleted_at IS NULL").bind(`deleted-${id}@bpmuseum.invalid`,id),
        env.DB.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(id),
        env.DB.prepare('DELETE FROM auth_codes WHERE user_id=?').bind(id),
        env.DB.prepare("UPDATE account_deletion_requests SET finalized_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending' AND finalized_at IS NULL AND execute_at<=datetime('now') AND EXISTS(SELECT 1 FROM users WHERE id=? AND deleted_at IS NOT NULL)").bind(Number(request.id),id)
      ]);
    }
  }

};
