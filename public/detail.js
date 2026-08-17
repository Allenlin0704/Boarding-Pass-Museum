const params =

new URLSearchParams(
window.location.search
);



const id =

params.get("id");



// =======================
// 获取展品数据
// =======================


let flights =

JSON.parse(

localStorage.getItem(
"flights"
)

);



if(!flights || flights.length === 0){


fetch("/data/flights.json")

.then(res=>res.json())

.then(data=>{


flights = data;


showDetail();


});


}

else{


showDetail();


}




// =======================
// 显示详情
// =======================


function showDetail(){



const flight =
flights.find(
item => item.id == id
);


const container =

document.getElementById(
"detail"
);



if(!flight){


container.innerHTML=

`

<h2>
找不到该展品
</h2>

`;

return;

}




container.innerHTML=

`

<img

src="${flight.image || ''}"

class="ticket-image"


>



<h1>

${flight.flight}

</h1>



<p>

✈ 航空公司：

${flight.airline || "Unknown"}

</p>







<p>

日期：

${flight.date}

</p>







<p>

📍 机场：

${flight.airport || "Unknown"}

</p>



<p>

${flight.story || ""}

</p>



<button id="favoriteBtn">

☆ 收藏

</button>


`;




// 收藏按钮

const btn =

document.getElementById(
"favoriteBtn"
);



if(btn){


let favorites =

JSON.parse(

localStorage.getItem(
"favorites"
)

)
||
[];




if(

favorites.includes(
id
)

){


btn.innerHTML =
"★ 已收藏";


}




btn.onclick=function(){


if(
!favorites.includes(id)
){


favorites.push(id);


localStorage.setItem(
"favorites",
JSON.stringify(favorites)
);


btn.innerHTML =
"★ 已收藏";


}

else{


favorites =
favorites.filter(
item => item !== id
);


localStorage.setItem(
"favorites",
JSON.stringify(favorites)
);


btn.innerHTML =
"☆ 收藏";


}


};





btn.innerHTML =
"★ 已收藏";


}

else{


btn.innerHTML =
"★ 已收藏";


}


};






