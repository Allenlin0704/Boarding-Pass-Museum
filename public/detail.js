const params =

new URLSearchParams(
window.location.search
);



const id =

params.get("id");



// =======================
// 获取展品数据
// =======================


let flights = [];


fetch("https://api.bpmuseum.org.cn/api/flights")

.then(res=>res.json())

.then(data=>{

flights = data;

showDetail();

})

.catch(err=>{

console.error(
"加载展品失败",
err
);

});




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

<div class="detail-header">

<h1>
✈ ${flight.airline || "Unknown"}
</h1>

<h2>
${flight.flight || ""}
</h2>

<p>
📅 ${flight.date || ""}
</p>

</div>


<img

src="${flight.image || ''}"

class="ticket-image"

data-preview="${flight.image || ''}"


>


<section class="detail-card">

<h2>
航班信息
</h2>


<p>
<strong>航空公司</strong><br>
${flight.airline || "Unknown"}
</p>


<p>
<strong>航班号</strong><br>
${flight.flight || "Unknown"}
</p>


<p>
<strong>出发机场</strong><br>
${flight.airport || "Unknown"}
</p>


<p>
<strong>日期</strong><br>
${flight.date || "Unknown"}
</p>


<p>
<strong>上传者</strong><br>
${flight.username || "匿名用户"}
</p>


</section>



<section class="detail-story">

<h2>
✈ 藏品故事
</h2>


<p>
${flight.story || "暂无故事"}
</p>


</section>



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








// =====================================
// DETAIL IMAGE PREVIEW
// =====================================

document.addEventListener(
"click",
e=>{

    const img =
        e.target.closest(
            ".ticket-image"
        );


    if(
        img &&
        img.dataset.preview
    ){

        openImagePreview(
            img.dataset.preview
        );

    }

});

