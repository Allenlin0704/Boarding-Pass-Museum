// =======================
// 我的收藏页面
// =======================


const museum =
document.getElementById("favoriteList");


// 检查登录

const user =

JSON.parse(
localStorage.getItem("currentUser")
);



if(!user){


alert(
"请先登录"
);


window.location.href =
"login.html";


}



// 读取用户收藏

const favorites =

JSON.parse(

localStorage.getItem(
"favorites_" + user.username
)

)

|| [];





if(favorites.length === 0){


museum.innerHTML = `

<div class="card">

<h3>
暂无已收藏
</h3>


<p>
去展厅收藏你的第一张登机牌吧 ✈️
</p>


</div>

`;



}

else{


// 加载展品数据库


fetch("/data/flights.json")


.then(response => response.json())


.then(flights => {



const likedFlights =

flights.filter(flight => {


return favorites.includes(
flight.flight
);


});



if(likedFlights.length === 0){


museum.innerHTML = `

<div class="card">

<h3>
暂无已收藏
</h3>

</div>

`;


return;


}




likedFlights.forEach(flight => {



const card =

document.createElement("div");


card.className =
"card";



card.innerHTML = `


<img

src="${flight.image}"

class="ticket-image"

>



<span class="tag">

${flight.airline}

</span>



<h3>

${flight.flight}

</h3>



<p>

✈ 航线：

${flight.route}

</p>



<p>

📅 日期：

${flight.date}

</p>



<p>

📍 机场：

${flight.airport}

</p>


`;




// 点击进入详情

card.onclick = function(){


window.location.href =

"detail.html?id="

+

encodeURIComponent(
flight.flight
);


};



museum.appendChild(card);



});



})


.catch(error => {


console.error(

"读取收藏失败:",

error

);


});


}