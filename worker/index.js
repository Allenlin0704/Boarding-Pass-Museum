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



if(
!user ||
user.role!=="superadministrator"
){

return null;

}


return user;

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

image

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
image,
story,
status
)
VALUES
(?,?,?,?,?,?,?,?,?,?)
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
SELECT *
FROM flights
WHERE status='approved'
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

status='approved',

reviewer_id=?

WHERE id=?

`
)
.bind(
admin.id,
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

status='rejected',

reject_reason=?,

reviewer_id=?

WHERE id=?

`
)
.bind(

reason || "",

admin.id,

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

