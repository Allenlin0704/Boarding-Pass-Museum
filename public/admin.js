// =====================================
// BoardingPassMuseum
// Admin Console V5.1
// =====================================

const API =
"https://api.bpmuseum.org.cn";


let adminUser = null;

let pendingFlights = [];

let approvedFlights = [];

let editingId = null;


// =====================================
// INIT
// =====================================

document.addEventListener(
"DOMContentLoaded",
()=>{
init();
}
);


async function init(){

loadUser();

checkSA();


if(!currentUser){

location.href="login.html";

return;

}


if(
currentUser.role!=="administrator"
&&
currentUser.role!=="superadministrator"
){

document.body.innerHTML=`

<h1 style="text-align:center;margin-top:100px">
无权限访问
</h1>

`;

return;

}


const welcome =
document.getElementById(
"adminWelcome"
);


if(welcome){

welcome.innerText =
`
欢迎回来，${currentUser.username}
`;

}


bindEvents();


await loadDashboard();

await loadPending();

await loadApproved();


}


// =====================================
// USER
// =====================================




function loadUser(){

try{

currentUser =
JSON.parse(
localStorage.getItem(
"currentUser"
)
);

}catch(e){

currentUser=null;

}


checkSA();

}

function checkSA(){

const saLink =
document.getElementById("saLink");

if(
saLink &&
currentUser &&
currentUser.role==="superadministrator"
){

saLink.style.display="block";

}

}

// =====================================
// EVENTS
// =====================================


function bindEvents(){


document.addEventListener(
"click",
async(e)=>{


const target=e.target;



if(
target.classList.contains(
"edit-btn"
)
){

openEditModal(
Number(
target.dataset.id
)
);

}



if(
target.classList.contains(
"approve-btn"
)
){

approveItem(
Number(
target.dataset.id
)
);

}



if(
target.classList.contains(
"reject-btn"
)
){

rejectItem(
Number(
target.dataset.id
)
);

}


}
);



const cancel =
document.getElementById(
"cancelEdit"
);


if(cancel){

cancel.onclick =
closeEditModal;

}



const save =
document.getElementById(
"saveEdit"
);


if(save){

save.onclick =
saveEdit;

}



}


// =====================================
// DASHBOARD
// =====================================


async function loadDashboard(){


try{


const res =
await fetch(
`${API}/api/admin/pending?admin_id=${currentUser.id}`
);


const data =
await res.json();


const count =
document.getElementById(
"pendingCount"
);


if(count){

count.innerText =
Array.isArray(data)
?
data.length
:
0;

}


}catch(e){

console.error(e);

}


}


// =====================================
// PENDING
// =====================================


async function loadPending(){


const res =
await fetch(
`${API}/api/admin/pending?admin_id=${currentUser.id}`
);


const data =
await res.json();


if(
Array.isArray(data)
){

pendingFlights=data;

}else{

pendingFlights=[];

console.error(
"Pending error",
data
);

}


renderPending();


}



function renderPending(){


const box =
document.getElementById(
"pendingList"
);


if(!box)return;


box.innerHTML="";


pendingFlights.forEach(
item=>{

box.innerHTML +=
createCard(
item,
"pending"
);

}
);


}


// =====================================
// APPROVED
// =====================================


async function loadApproved(){


const res =
await fetch(
`${API}/api/admin/approved?admin_id=${currentUser.id}`
);


const data =
await res.json();


if(
Array.isArray(data)
){

approvedFlights=data;

}else{

approvedFlights=[];

console.error(
"Approved error",
data
);

}


renderApproved();


}



function renderApproved(){


const box =
document.getElementById(
"approvedList"
);


if(!box)return;


box.innerHTML="";


approvedFlights.forEach(
item=>{

box.innerHTML +=
createCard(
item,
"approved"
);

}
);


}


// CONTINUE_NEXT_PART
// =====================================
// CARD
// =====================================


function createCard(
item,
status
){


return `

<div class="admin-card">


<img
class="admin-card-image"
src="${item.image || ''}"
>


<h3>
${item.airline || ""}
</h3>


<p>
${item.flight || ""}
</p>


<p>
${item.airport || ""}
</p>


<p>
${item.date || ""}
</p>


<p>
${item.story || ""}
</p>


<div class="status ${status}">
${status}
</div>


<div class="card-actions">


<button
class="edit-btn"
data-id="${item.id}">
编辑
</button>



${
status==="pending"

?

`

<button
class="approve-btn"
data-id="${item.id}">
通过
</button>


<button
class="reject-btn"
data-id="${item.id}">
拒绝
</button>

`

:

""

}



</div>


</div>

`;

}



// =====================================
// APPROVE
// =====================================


async function approveItem(id){


if(
!confirm(
"确认通过该投稿？"
)
){

return;

}


const res =
await fetch(
`${API}/api/admin/approve`,
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:
JSON.stringify({

admin_id:
currentUser.id,

flight_id:
id

})

}

);



const data =
await res.json();



if(
data.success
||
data.message
){

alert(
"审核通过"
);


await loadPending();

await loadApproved();


}else{


alert(
data.error ||
"操作失败"
);


}


}



// =====================================
// REJECT
// =====================================


async function rejectItem(id){


const reason =
prompt(
"请输入拒绝原因"
);



const res =
await fetch(
`${API}/api/admin/reject`,
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:
JSON.stringify({

admin_id:
currentUser.id,

flight_id:
id,

reason:
reason || ""

})

}

);



const data =
await res.json();



if(
data.success
||
data.message
){

alert(
"已拒绝"
);


await loadPending();


}else{


alert(
data.error ||
"操作失败"
);


}


}




// =====================================
// EDIT
// =====================================


function openEditModal(id){


const item =
[
...pendingFlights,
...approvedFlights
]
.find(
x=>x.id===id
);



if(!item){

console.error(
"not found",
id
);

return;

}



editingId=id;



document.getElementById(
"editAirline"
).value =
item.airline || "";



document.getElementById(
"editFlight"
).value =
item.flight || "";



document.getElementById(
"editAirport"
).value =
item.airport || "";



document.getElementById(
"editDate"
).value =
item.date || "";



document.getElementById(
"editStory"
).value =
item.story || "";



document.getElementById(
"editImage"
).value =
item.image || "";



document.getElementById(
"editOverlay"
).style.display=
"flex";


}



function closeEditModal(){


const box =
document.getElementById(
"editOverlay"
);


if(box){

box.style.display=
"none";

}


}




async function saveEdit(){


const body={


admin_id:
currentUser.id,


flight_id:
editingId,


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
).value,


image:
document.getElementById(
"editImage"
).value


};



const res =
await fetch(
`${API}/api/admin/edit`,
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:
JSON.stringify(body)

}

);



const data =
await res.json();



if(
data.success
){

alert(
"修改完成"
);


closeEditModal();


await loadPending();

await loadApproved();


}else{


alert(
data.error ||
"修改失败"
);


}


}


// =====================================
// END
// =====================================