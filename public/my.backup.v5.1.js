// =====================================
// BoardingPassMuseum
// My Submissions V5
// =====================================


const API =
"https://api.bpmuseum.org.cn";


const submissions =
document.getElementById(
"mySubmissions"
);


const welcome =
document.getElementById(
"welcome"
);


try{

currentUser =
JSON.parse(
localStorage.getItem(
"currentUser"
)
);

}catch(e){

currentUser = null;

}


if(!currentUser){

alert(
"请登录后查看"
);

location.href=
"login.html";

throw new Error(
"No user"
);

}



if(welcome){

welcome.innerHTML=
`
你好，${currentUser.username}
`;

}




async function loadMyFlights(){


try{


const res =
await fetch(
`${API}/api/my-flights?user_id=${currentUser.id}`
);


const flights =
await res.json();



renderFlights(
flights
);



}catch(e){


console.error(e);


submissions.innerHTML=
`

<p>
加载失败，请稍后重试
</p>

`;

}


}





function renderFlights(
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


let status="";


if(
flight.status==="pending"
){

status=
"🟡 审核中";

}

else if(
flight.status==="approved"
){

status=
"🟢 已通过";

}

else if(
flight.status==="rejected"
){

status=
"🔴 未通过";

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
class="ticket-image"
src="${flight.image || ""}"
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
${status}
</p>


${
flight.reject_reason

?

`
<p>
原因：
${flight.reject_reason}
</p>
`

:

""

}


`;



submissions.appendChild(
card
);



}

);


}



loadMyFlights();