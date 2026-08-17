async function hashPassword(password) {

  const encoder = new TextEncoder();

  const data = encoder.encode(password);

  const hash = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(
    new Uint8Array(hash)
  )
  .map(
    b => b.toString(16).padStart(2, "0")
  )
  .join("");

}



export default {

async fetch(request, env) {


const url = new URL(request.url);



//
// Test API
//
if (
url.pathname === "/api/test"
){

return Response.json({
message:"BoardingPassMuseum V2 API online"
});

}





//
// Send verification code
//
if (
url.pathname === "/api/send-code" &&
request.method === "POST"
){

const body =
await request.json();


const email =
body.email;



if(!email){

return Response.json(
{
error:"Email required"
},
{
status:400
}
);

}



const code =
Math.floor(
100000 +
Math.random()*900000
)
.toString();



const expires =
new Date(
Date.now()+10*60*1000
)
.toISOString();



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
expires
)
.run();





const mailResponse =
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
"Your BoardingPassMuseum verification code",

html:
`
<h2>BoardingPassMuseum</h2>

<p>Your verification code is:</p>

<h1>${code}</h1>

<p>This code expires in 10 minutes.</p>

<p>
If you cannot find this email,
please check your spam or junk folder.
</p>
`

})

}
);



return Response.json({

success:true,

emailSent:
mailResponse.ok

});


}





//
// Verify code
//
if(
url.pathname === "/api/verify-code" &&
request.method === "POST"
){


const body =
await request.json();


const email =
body.email;


const code =
body.code;



const record =
await env.DB.prepare(
`
SELECT *
FROM email_codes
WHERE email=?
AND code=?
AND used=0
ORDER BY id DESC
LIMIT 1
`
)
.bind(
email,
code
)
.first();



if(!record){

return Response.json(
{
success:false,
message:"Invalid code"
},
{
status:400
}
);

}



if(
new Date(record.expires_at)
<
new Date()
){

return Response.json(
{
success:false,
message:"Code expired"
},
{
status:400
}
);

}



return Response.json({

success:true,

message:"Code verified"

});


}







//
// Register
//
if(
url.pathname === "/api/register" &&
request.method === "POST"
){


const body =
await request.json();


const username =
body.username;


const email =
body.email;


const password =
body.password;


const code =
body.code;



if(
!username ||
!email ||
!password ||
!code
){

return Response.json(
{
error:"Missing fields"
},
{
status:400
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
AND used=0
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
status:400
}
);

}





const exists =
await env.DB.prepare(
`
SELECT id
FROM users
WHERE email=?
`
)
.bind(email)
.first();



if(exists){

return Response.json(
{
error:"Email already registered"
},
{
status:400
}
);

}





const passwordHash =
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
(?,?,?,'user')
`
)
.bind(
username,
email,
passwordHash
)
.run();





await env.DB.prepare(
`
UPDATE email_codes
SET used=1
WHERE id=?
`
)
.bind(
verify.id
)
.run();





return Response.json({

success:true,

message:"Account created"

});


}






return Response.json(
{
error:"Not Found"
},
{
status:404
}
);



}

};