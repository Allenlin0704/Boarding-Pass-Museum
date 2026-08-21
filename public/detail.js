// =====================================
// BoardingPassMuseum
// detail.js V2
// D1 API Detail
// =====================================


const API =
"https://api.bpmuseum.org.cn";


const params =
new URLSearchParams(
window.location.search
);


const id =
params.get("id");



const container =
document.getElementById(
"detail"
);



async function loadDetail(){


if(!id){

container.innerHTML =
"<p>展品编号不存在</p>";

return;

}



try{


const res =
await fetch(
`${API}/api/flight/${id}`
);



const data =
await res.json();



if(!res.ok){

throw new Error(
"not found"
);

}



container.innerHTML = `

<div class="detail-card">


<h1>
${data.airline || ""}
${data.flight || ""}
</h1>


<div class="detail-image">

<img 
src="${data.image || ""}"
alt="boarding pass">

</div>



<div class="detail-info">


<p>
<strong>航司：</strong>
${data.airline || ""}
</p>


<p>
<strong>航班：</strong>
${data.flight || ""}
</p>


<p>
<strong>机场：</strong>
${data.airport || ""}
</p>


<p>
<strong>问题机场：</strong>
${data.issue_airport || "无"}
</p>


<p>
<strong>日期：</strong>
${data.date || ""}
</p>


<p>
<strong>投稿人：</strong>
${data.username || ""}
</p>


</div>



<div class="story">

<h2>
展品故事
</h2>

<p>
${data.story || ""}
</p>


</div>


</div>

`;


}
catch(err){


console.error(
err
);


container.innerHTML =
`
<p>
展品加载失败
</p>
`;


}


}



loadDetail();