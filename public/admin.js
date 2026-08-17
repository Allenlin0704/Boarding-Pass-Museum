// =====================================
// BoardingPassMuseum Admin System
// =====================================
// =====================================
// 权限检查
// =====================================


const currentUser =

JSON.parse(

localStorage.getItem(
"currentUser"
)

);



if(
!currentUser ||
(
currentUser.role !== "administrator" &&
currentUser.role !== "superadministrator"
)

){

alert(
"你没有管理员权限"
);


window.location.href =
"index.html";


}

let pendingFlights =
JSON.parse(
    localStorage.getItem("pendingFlights")
)
||
[];


let flights =
JSON.parse(
    localStorage.getItem("flights")
)
||
[];



let editType = "";
let editIndex = -1;




const pendingList =
document.getElementById(
    "pendingList"
);


const adminList =
document.getElementById(
    "adminList"
);




// 保存

function saveData(){


localStorage.setItem(

"pendingFlights",

JSON.stringify(
pendingFlights
)

);



localStorage.setItem(

"flights",

JSON.stringify(
flights
)

);


}






// =====================================
// 渲染待审核
// =====================================


function renderPending(){


pendingList.innerHTML="";



if(
pendingFlights.length===0
){

pendingList.innerHTML=
"<p>暂无待审核投稿</p>";

return;

}



pendingFlights.forEach(
(item,index)=>{


let card =
document.createElement(
"div"
);


card.className="card";



card.innerHTML=

`

<h3>
${item.airline}
${item.flight}
</h3>


<p>
机场：
${item.airport}
</p>


<p>
日期：
${item.date}
</p>


<p>
${item.story || ""}
</p>


<img
src="${item.image}"
width="300"
>


<br>


<button onclick="editPending(${index})">
编辑
</button>


<button onclick="approve(${index})">
通过
</button>


<button onclick="reject(${index})">
拒绝
</button>


`;



pendingList.appendChild(card);



});


}






// =====================================
// 渲染已上线
// =====================================


function renderPublished(){


adminList.innerHTML="";



if(
flights.length===0
){

adminList.innerHTML=
"<p>暂无展品</p>";

return;

}




flights.forEach(
(item,index)=>{


let card =
document.createElement(
"div"
);



card.className="card";



card.innerHTML=

`

<h3>
${item.airline}
${item.flight}
</h3>


<p>
${item.airport}
</p>


<p>
${item.date}
</p>


<button onclick="editPublished(${index})">
编辑
</button>


`;



adminList.appendChild(card);


});


}






// =====================================
// 编辑
// =====================================


function openEdit(
item,
type,
index
){


editType=type;

editIndex=index;



document.getElementById(
"editPanel"
)
.style.display="block";



document.getElementById(
"editAirline"
)
.value=item.airline || "";



document.getElementById(
"editFlight"
)
.value=item.flight || "";



document.getElementById(
"editAirport"
)
.value=item.airport || "";



document.getElementById(
"editDate"
)
.value=item.date || "";



document.getElementById(
"editStory"
)
.value=item.story || "";



}





window.editPending=function(index){

openEdit(

pendingFlights[index],

"pending",

index

);

};





window.editPublished=function(index){

openEdit(

flights[index],

"published",

index

);

};






// 保存编辑


document.getElementById(
"saveEdit"
)
.onclick=function(){



let data={


airline:
document.getElementById(
"editAirline"
).value,


flight:
document.getElementById(
"editFlight"
).value,


airport:
document.getElementById(
"editAirport"
).value,


date:
document.getElementById(
"editDate"
).value,


story:
document.getElementById(
"editStory"
).value


};




if(
editType==="pending"
){


pendingFlights[editIndex]=
{

...pendingFlights[editIndex],

...data

};


}




if(
editType==="published"
){


flights[editIndex]=
{

...flights[editIndex],

...data

};


}




saveData();


document.getElementById(
"editPanel"
)
.style.display="none";


render();


};







// =====================================
// 审核
// =====================================



window.approve=function(index){


let item = pendingFlights[index];


// 修改状态

item.status = "approved";


// 加入展厅

flights.push(item);


// 保存

saveData();


// 不删除 pendingFlights


render();


alert(
"审核通过"
);


};





window.reject=function(index){



let item =
pendingFlights[index];


window.reject=function(index){


let item =
pendingFlights[index];


item.status =
"rejected";


saveData();


render();


alert(
"已拒绝"
);


};


saveData();


render();


alert(
"已拒绝"
);


};






// =====================================
// 总渲染
// =====================================


function render(){


renderPending();


renderPublished();


}






render();