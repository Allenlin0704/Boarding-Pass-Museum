// =================================
// BoardingPassMuseum
// my.js
// 我的投稿状态
// =================================



const submissions =
document.getElementById(
    "mySubmissions"
);



const welcome =
document.getElementById(
    "welcome"
);




// 检查登录

if(!currentUser){


alert(
"请登录后查看"
);


window.location.href =
"login.html";


}




// 显示用户名

if(welcome && currentUser){


welcome.innerHTML =

`
你好，${currentUser.username}
`

;

}





// 获取投稿

const pendingFlights =

JSON.parse(

localStorage.getItem(
"pendingFlights"
)

)

||
[];





const myFlights =

pendingFlights.filter(

item =>

item.author === currentUser.username

);







// 没有投稿

if(myFlights.length===0){


submissions.innerHTML =

`
<p>
暂无投稿
</p>
`;



}





// 渲染

myFlights.forEach(

flight=>{


const card =

document.createElement(
"div"
);



card.className =
"card";





let statusText = "";



if(
flight.status==="pending"
){

statusText =
"🟡 审核中";

}


else if(
flight.status==="approved"
){

statusText =
"🟢 已通过";

}


else if(
flight.status==="rejected"
){

statusText =
"🔴 未通过";

}




card.innerHTML =

`

<img

src="${flight.image || ""}"

class="ticket-image"

>


<h3>

${flight.flight}

</h3>


<p>

${flight.airline}

</p>


<p>

📅 ${flight.date}

</p>


<p>

状态：

${statusText}

</p>


`;




submissions.appendChild(card);



}

);