// =================================
// BoardingPassMuseum
// My Submissions V5.2
// =================================


const API =
"https://api.bpmuseum.org.cn";





try{

currentUser =
JSON.parse(
localStorage.getItem("currentUser")
);

}catch(e){

currentUser=null;

}



const submissions =
document.getElementById(
"mySubmissions"
);



const welcome =
document.getElementById(
"welcome"
);



if(!currentUser){

alert(
"请登录后查看"
);

location.href="login.html";

throw new Error(
"not login"
);

}



if(welcome){

welcome.innerHTML=
`
你好，${currentUser.username}
`;

}



async function loadMySubmissions(){


try{


const res =
await fetch(
`${API}/api/my-flights?user_id=${currentUser.id}`
);


const flights =
await res.json();


renderSubmissions(
flights
);



}catch(e){


console.error(
e
);


submissions.innerHTML=
`
<p>
加载失败
</p>
`;

}


}




function renderSubmissions(
flights
){


if(
!Array.isArray(flights)
||
flights.length===0
){

submissions.innerHTML=
`
<p>
暂无投稿
</p>
`;

return;

}



submissions.innerHTML="";



flights.forEach(
flight=>{


let statusText="";


if(
flight.status==="pending"
){

statusText="🟡 审核中";

}


if(
flight.status==="approved"
){

statusText="🟢 已通过";

}


if(
flight.status==="rejected"
){

statusText="🔴 未通过";

}



let appeal="";



if(
flight.status==="rejected"
){

appeal=

`

<button

class="appeal-btn"

data-id="${flight.id}"

>

提交申诉

</button>

`;

}



const card =
document.createElement(
"div"
);



card.className=
"card";



card.innerHTML=
`

<img

src="${flight.image || ""}"

class="ticket-image"

>



<h3>

${flight.airline || ""}

</h3>


<p>

${flight.flight || ""}

</p>


<p>

${flight.airport || ""}

</p>


<p>

${flight.date || ""}

</p>



<p>

状态：

${statusText}

</p>


${
flight.reject_reason

?

`

<p>

拒绝原因：

${flight.reject_reason}

</p>

`

:

""

}



${appeal}


`;



submissions.appendChild(
card
);



}

);


}




document.addEventListener(
"click",
async(e)=>{


if(
!e.target.classList.contains(
"appeal-btn"
)
){

return;

}



const flight_id =
Number(
e.target.dataset.id
);



const reason =
prompt(
"请输入申诉理由"
);



if(!reason){

return;

}



const res =
await fetch(
`${API}/api/appeal`,
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:
JSON.stringify({

user_id:
currentUser.id,

flight_id,

reason

})

}

);



const data =
await res.json();



if(
data.success
){

alert(
"申诉提交成功"
);

}else{

alert(
data.error ||
"提交失败"
);

}



}
);



loadMySubmissions();
