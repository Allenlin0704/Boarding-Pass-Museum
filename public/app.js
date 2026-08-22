let flights = [];
let displayFlights = [];
let favoriteIds = [];

// =====================
// 从 API 读取审核通过的展品
// =====================

async function loadFlights() {

  try {

    const res = await fetch(
      "https://api.bpmuseum.org.cn/api/flights"
    );

    if (!res.ok) {
      throw new Error(
        `API request failed: ${res.status}`
      );
    }

    const data = await res.json();

    flights =
      Array.isArray(data)
        ? data
        : [];


    const user =
    JSON.parse(
      localStorage.getItem("currentUser")
    );


    if(user){

      const favRes =
      await fetch(
        `https://api.bpmuseum.org.cn/api/favorites?user_id=${user.id}`
      );


      const favData =
      await favRes.json();


      if(Array.isArray(favData)){

        favoriteIds =
        favData.map(
          x=>x.flight_id
        );

      }

    }


    applyMuseumFilter();

  } catch (error) {

    console.error(
      "加载展品失败：",
      error
    );

    flights = [];

    applyMuseumFilter();

  }

}



// =====================
// 展厅搜索与排序
// =====================

function applyMuseumFilter(){

  const input =
  document.getElementById("museumSearch");


  const keyword =
  input
  ?
  input.value.trim().toLowerCase()
  :
  "";


  displayFlights =
  flights.filter(f=>{

    const text =
    `
    ${f.airline || ""}
    ${f.flight || ""}
    ${f.airport || ""}
    `
    .toLowerCase();


    return text.includes(keyword);

  });


  const sort =
  document.getElementById("museumSort")?.value;


  if(sort==="latest"){

    displayFlights.sort(
      (a,b)=>
      new Date(b.created_at || 0)
      -
      new Date(a.created_at || 0)
    );

  }


  if(sort==="favorite"){

    displayFlights.sort(
      (a,b)=>
      (b.favorite_count || 0)
      -
      (a.favorite_count || 0)
    );

  }


  if(sort==="hot"){

    displayFlights.sort(
      (a,b)=>{

        const scoreA =
        (a.favorite_count || 0) * 10
        +
        new Date(a.created_at || 0).getTime()
        /100000000;


        const scoreB =
        (b.favorite_count || 0) * 10
        +
        new Date(b.created_at || 0).getTime()
        /100000000;


        return scoreB-scoreA;

      }
    );

  }


  renderMuseum();

}



document.addEventListener(
"DOMContentLoaded",
()=>{

  document
  .getElementById("museumSearch")
  ?.addEventListener(
    "input",
    applyMuseumFilter
  );


  document
  .getElementById("museumSort")
  ?.addEventListener(
    "change",
    applyMuseumFilter
  );

});



// =====================
// 展厅渲染
// =====================

function renderMuseum() {

  const museum =
    document.getElementById("museum");

  if (!museum)
    return;

  museum.innerHTML = "";

  if (
    !Array.isArray(flights) ||
    flights.length === 0
  ) {

    museum.innerHTML = `
      <p class="museum-empty">
        暂无展品
      </p>
    `;

    return;

  }


  displayFlights.forEach(
    (flight, index) => {

      let card =
        document.createElement("div");

      card.className = "card";

      card.onclick = function() {

        location.href =
          `detail.html?id=${flight.id}`;

      };


      card.innerHTML = `

        <img
          src="${flight.image || ''}"
          class="ticket-image"
          alt="登机牌"
          data-preview="${flight.image || ''}"
        >

        <span class="tag">
          ${flight.airline || "Unknown Airline"}
        </span>

        <h3>
          ${flight.flight || ""}
        </h3>

        <p>
          📍 ${flight.airport || ""}
        </p>

        <p>
          📅 ${flight.date || ""}
        </p>

        <div
class="creator-box"
onclick="event.stopPropagation();location.href='profile.html?id=${flight.user_id}'"
>

<img
src="${flight.avatar || 'logo.png'}"
class="creator-avatar"
>

<span>
${flight.username || "匿名用户"}
</span>

</div>

        <p class="story">
          ${flight.story || ""}
        </p>


        <button
        class="favorite-btn"
        data-id="${flight.id}">
        ${favoriteIds.includes(flight.id)
        ? "❤️ 已收藏"
        : "🤍 收藏"}
        </button>

      `;

      museum.appendChild(card);

    }
  );

}


// =====================
// 启动
// =====================

loadFlights();


// =====================================
// GALLERY IMAGE PREVIEW
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

        e.stopPropagation();

        openImagePreview(
            img.dataset.preview
        );

    }

});



// 收藏按钮

document.addEventListener(
"click",
async e=>{


const btn =
e.target.closest(".favorite-btn");


if(!btn)
return;


e.stopPropagation();


const user =
JSON.parse(
localStorage.getItem("currentUser")
);


if(!user){

alert("请先登录");
return;

}


const flightId =
Number(btn.dataset.id);


const liked =
favoriteIds.includes(flightId);


const url =
liked
?
"https://api.bpmuseum.org.cn/api/favorites/remove"
:
"https://api.bpmuseum.org.cn/api/favorites/add";


try{

const res =
await fetch(
url,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

user_id:user.id,

flight_id:flightId

})

}
);


const data =
await res.json();


if(res.ok){

if(liked){

favoriteIds =
favoriteIds.filter(
id=>id!==flightId
);

alert("已取消收藏");

}else{

favoriteIds.push(
flightId
);

alert("收藏成功 ❤️");

}


applyMuseumFilter();


}else{

alert(
data.error ||
"操作失败"
);

}


}catch(err){

alert("网络错误");

}


});
