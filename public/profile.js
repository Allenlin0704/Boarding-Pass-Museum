const params =
new URLSearchParams(
window.location.search
);


const profileId =
params.get("id");


async function loadProfile(){


if(!profileId){

document.getElementById(
"profileUsername"
).innerText =
"用户不存在";

return;

}



try{


const res =
await fetch(
`https://api.bpmuseum.org.cn/api/account/profile?id=${profileId}`
);



const user =
await res.json();



if(!res.ok){

throw new Error(
user.error || "加载失败"
);

}



document.getElementById(
"profileAvatar"
).src =
user.avatar ||
"logo.png";



document.getElementById(
"profileUsername"
).innerText =
user.username || "未知用户";



document.getElementById(
"profileBio"
).innerText =
user.bio ||
"这个用户还没有填写简介";



document.getElementById(
"profileSocial"
).innerText =
user.social_media ||
"未填写";



document.getElementById(
"profileEquipment"
).innerText =
user.equipment ||
"未填写";



document.getElementById(
"profileAirlines"
).innerText =
user.favorite_airlines ||
"未填写";



document.getElementById(
"profileAirports"
).innerText =
user.favorite_airports ||
"未填写";



loadUserFlights(
profileId
);



}catch(e){

console.error(e);

document.getElementById(
"profileUsername"
).innerText =
"加载失败";

}

}




async function loadUserFlights(id){


const box =
document.getElementById(
"profileFlights"
);


try{


const res =
await fetch(
"https://api.bpmuseum.org.cn/api/flights"
);


const flights =
await res.json();



const list =
flights.filter(
x=>
String(x.user_id)
===
String(id)
);



if(list.length===0){

box.innerHTML =
"<p>暂无展品</p>";

return;

}



box.innerHTML="";



list.forEach(
flight=>{


box.innerHTML += `

<div class="card"
onclick="
location.href='detail.html?id=${flight.id}'
">


<img
src="${flight.image || ''}"
class="ticket-image"
>


<h3>
${flight.airline || ""}
${flight.flight || ""}
</h3>


<p>
📅 ${flight.date || ""}
</p>


</div>

`;

});


}catch(e){

box.innerHTML =
"展品加载失败";

}


}



loadProfile();
