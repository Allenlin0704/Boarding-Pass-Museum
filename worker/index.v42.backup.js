// =====================================
// BoardingPassMuseum API V4.1
// User System
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



const url=
new URL(request.url);




// TEST

if(url.pathname==="/api/test"){

return Response.json(
{
message:
"BoardingPassMuseum API V4.1 online"
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
(email,code)
VALUES
(?,?)
`
)
.bind(
email,
code
)
.run();



return Response.json(
{
success:true,
code:code
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


const body=
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


const body=
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


await env.DB.prepare(
`
const admins =
await env.DB.prepare(
`
SELECT id
FROM users
WHERE role='administrator'
`
)
.all();


let reviewer_id=null;


let min=999999;


for(
const admin of admins.results
){


const count =
await env.DB.prepare(
`
SELECT COUNT(*) as total
FROM flights
WHERE reviewer_id=?
AND status='pending'
`
)
.bind(admin.id)
.first();


if(
count.total < min
){

min=count.total;

reviewer_id=admin.id;

}


}

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

body.story || ""

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
// ADMIN PENDING
// =====================================

if(
url.pathname==="/api/admin/pending"
&&
request.method==="GET"
){

const admin_id =
url.searchParams.get("admin_id");



const admin =
await env.DB.prepare(
`
SELECT role
FROM users
WHERE id=?
`
)
.bind(admin_id)
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
else{


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
.bind(admin_id)
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