const API =
"https://api.bpmuseum.org.cn";


const user =
JSON.parse(
localStorage.getItem("currentUser")
);



if(
!user ||
user.role!=="superadministrator"
){

document.body.innerHTML=
"<h1>无权限</h1>";

throw new Error("No SA");

}



document.getElementById("welcome").innerHTML=
`
欢迎 ${user.username}
`;



async function loadAppeals(){


const res =
await fetch(
`${API}/api/sa/appeals?sa_id=${user.id}`
);


const data =
await res.json();



const box =
document.getElementById("appeals");


box.innerHTML="";



data.forEach(
item=>{


box.innerHTML +=

`

<div class="card">

<h3>
申诉 #${item.id}
</h3>

<p>
投稿ID:
${item.flight_id}
</p>

<p>
用户ID:
${item.user_id}
</p>

<p>
原因:
${item.reason}
</p>

<p>
状态:
${item.status}
</p>

<button
onclick="approveAppeal(${item.id},${item.flight_id})">

恢复审核

</button>


<button
onclick="rejectAppeal(${item.id})">

驳回申诉

</button>
</div>

`;


});


}



async function approveAppeal(
appeal_id,
flight_id
){


const res =
await fetch(
`${API}/api/sa/appeal/approve`,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

sa_id:user.id,

appeal_id,

flight_id

})

}

);


const data =
await res.json();


if(data.success){

alert(
"已恢复审核"
);

loadAppeals();

}else{

alert(
data.error || "失败"
);

}


}



async function rejectAppeal(
appeal_id
){


const res =
await fetch(
`${API}/api/sa/appeal/reject`,
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

sa_id:user.id,

appeal_id

})

}

);


const data =
await res.json();


if(data.success){

alert(
"申诉已驳回"
);

loadAppeals();

}else{

alert(
data.error || "失败"
);

}


}


loadAppeals();