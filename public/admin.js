// =====================================
// BoardingPassMuseum Admin Panel V4.3.1
// =====================================


const API =
"https://boardingpassmuseum-api.allenlin-developer.workers.dev";




// 当前用户

const currentUser =
JSON.parse(
localStorage.getItem("currentUser")
);



if(
!currentUser
||
(
currentUser.role!=="administrator"
&&
currentUser.role!=="superadministrator"
)

){

alert(
"没有管理员权限"
);

window.location.href="index.html";

}





document.getElementById(
"adminInfo"
).innerHTML =

`
当前账号：
${currentUser.username}

<br>

权限：
${currentUser.role}

`;






const pendingList =
document.getElementById(
"pendingList"
);





// =====================================
// 获取审核列表
// =====================================


async function loadPending(){


const res =
await fetch(
`${API}/api/admin/pending?admin_id=${currentUser.id}`
);



const data =
await res.json();



render(data);


}








// =====================================
// 渲染
// =====================================


function render(items){


pendingList.innerHTML="";



if(
!items ||
items.length===0
){

pendingList.innerHTML=
`
<p>
暂无待审核投稿
</p>
`;

return;

}





items.forEach(
(item)=>{


const card =
document.createElement(
"div"
);


card.className="card";



card.innerHTML =

`

<img 
src="${item.image}"
width="300"
>



<h3>
${item.airline}
${item.flight}
</h3>


<p>
路线：
${item.route || ""}
</p>


<p>
日期：
${item.date || ""}
</p>


<p>
机型：
${item.aircraft || ""}
</p>


<p>
${item.story || ""}
</p>



<textarea
id="reason-${item.id}"
placeholder="拒绝理由（拒绝时填写）"
></textarea>



<br>


<button
onclick="approve(${item.id})"
>
通过
</button>



<button
onclick="rejectItem(${item.id})"
>
拒绝
</button>


`;


pendingList.appendChild(card);



});


}









// =====================================
// 通过
// =====================================


window.approve =
async function(id){



const res =
await fetch(
`${API}/api/admin/approve`,
{

method:"POST",

headers:
{
"Content-Type":
"application/json"
},

body:
JSON.stringify(
{
id:id
}
)

}

);



const data =
await res.json();



if(data.success){

alert(
"审核通过"
);

loadPending();

}

};









// =====================================
// 拒绝
// =====================================


window.rejectItem =
async function(id){



const reason =
document.getElementById(
`reason-${id}`
)
.value;



if(
!reason
){

alert(
"请输入拒绝理由"
);

return;

}




const res =
await fetch(
`${API}/api/admin/reject`,
{

method:"POST",

headers:
{
"Content-Type":
"application/json"
},

body:
JSON.stringify(
{
id:id,
reason:reason
}
)

}

);



const data =
await res.json();



if(data.success){

alert(
"已拒绝"
);

loadPending();

}


};







loadPending();