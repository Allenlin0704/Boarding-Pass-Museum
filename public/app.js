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

    populateMuseumFilters();


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

  const airline = document.getElementById("museumAirline")?.value || "";
  const category = document.getElementById("museumType")?.value || "";
  const format = document.getElementById("museumFormat")?.value || "";
  const airport = document.getElementById("museumAirport")?.value || "";
  const year = document.getElementById("museumYear")?.value || "";


  displayFlights =
  flights.filter(f=>{

    const text =
    `
    ${f.airline || ""}
    ${f.flight || ""}
    ${f.airport || ""}
    ${f.route || ""}
    `
    .toLowerCase();


    let tags = f.special_tags || [];
    if(typeof tags === "string"){
      try{ tags = JSON.parse(tags); }catch{ tags = []; }
    }
    if(!Array.isArray(tags)) tags = [];
    const categoryMatches = !category
      || (category === "boarding_pass" && (f.submission_type || "boarding_pass") === "boarding_pass")
      || (category === "rail_ticket" && f.submission_type === "rail_ticket")
      || (category === "transfer" && tags.includes("transfer"))
      || (category === "two_cabin" && tags.includes("two_cabin"));
    return text.includes(keyword)
      && (!airline || String(f.airline || "").trim() === airline)
      && categoryMatches
      && (!format || (f.submission_type !== "rail_ticket" && (f.ticket_format || "paper") === format))
      && (!airport || String(f.airport || "").trim() === airport)
      && (!year || String(f.date || "").startsWith(year));

  });

  const resultCount=document.getElementById("museumResultCount");
  if(resultCount)resultCount.textContent=keyword||airline||category||format||airport||year
    ? (window.BPM_LANGUAGE==="en"?`${displayFlights.length} matching exhibits`:`找到 ${displayFlights.length} 件匹配展品`)
    : (window.BPM_LANGUAGE==="en"?`${displayFlights.length} exhibits`:`共 ${displayFlights.length} 件展品`);


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

function populateMuseumFilters(){
  const options = [
    ["museumAirline", "airline", "全部航空公司 / 运营公司"],
    ["museumType", null, "全部投稿类别"],
    ["museumFormat", null, "全部登机牌形式"],
    ["museumAirport", "airport", "全部出发机场或车站"],
    ["museumYear", "year", "全部年份"]
  ];

  options.forEach(([id, field, fallback]) => {
    const select = document.getElementById(id);
    if(!select) return;
    const current = select.value;
    if(!field) return;
    const values = [...new Set(flights.map(f => field === "year" ? String(f.date || "").slice(0,4) : String(f[field] || "").trim()).filter(Boolean))]
      .sort((a,b) => field === "year" ? b.localeCompare(a) : a.localeCompare(b, "zh-CN"));
    select.replaceChildren(new Option(fallback, ""), ...values.map(value => new Option(value, value)));
    select.value = values.includes(current) ? current : "";
  });
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

  ["museumAirline", "museumType", "museumFormat", "museumAirport", "museumYear"].forEach(id =>
    document.getElementById(id)?.addEventListener("change", applyMuseumFilter)
  );

  document.getElementById("museumReset")?.addEventListener("click", () => {
    ["museumSearch", "museumAirline", "museumType", "museumFormat", "museumAirport", "museumYear"].forEach(id => {
      const field = document.getElementById(id);
      if(field) field.value = "";
    });
    document.getElementById("museumSort").value = "latest";
    applyMuseumFilter();
  });

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
        ${window.BPM_LANGUAGE==="en"?"No exhibits yet":"暂无展品"}
      </p>
    `;

    return;

  }

  if(displayFlights.length===0){
    museum.innerHTML=`<p class="museum-empty">${window.BPM_LANGUAGE==="en"?"No exhibits match these filters. Adjust your search or clear the filters.":"没有符合当前筛选条件的展品。请调整关键词或清除筛选后再试。"}</p>`;
    return;
  }


  displayFlights.forEach(
    (flight, index) => {
      flight=bpmSafeRecord(flight);
      const isRail=flight.submission_type==="rail_ticket";
      let specialTags=flight.special_tags||[];
      if(typeof specialTags==="string"){
        try{specialTags=JSON.parse(specialTags);}catch{specialTags=[];}
      }
      if(!Array.isArray(specialTags))specialTags=[];
      const english=window.BPM_LANGUAGE==="en";
      const labels=english
        ? {rail:"Rail ticket",boarding:"Boarding pass",transfer:"Transfer",twoCabin:"Business/first class",digital:"Electronic boarding pass",paper:"Paper boarding pass",operator:"Unknown operator",departureStation:"Departure station",departureAirport:"Departure airport",arrivalStation:"Arrival station"}
        : {rail:"火车票",boarding:"登机牌",transfer:"转机",twoCabin:"两舱",digital:"电子登机牌",paper:"纸质登机牌",operator:"未知运营公司",departureStation:"出发车站",departureAirport:"出发机场",arrivalStation:"到达车站"};
      const badge=(icon,label)=>`<span class="tag gallery-type-badge">${window.bpmIcon(icon)}<span>${label}</span></span>`;
      const inlineIcon=icon=>window.bpmIcon(icon);
      const specialBadges=specialTags.filter(tag=>["transfer","two_cabin"].includes(tag)).map(tag=>badge(tag==="transfer"?"repeat":"armchair",tag==="transfer"?labels.transfer:labels.twoCabin)).join("");

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

        ${badge(isRail?"train":"plane",isRail?labels.rail:labels.boarding)}

        <span class="tag">
          ${flight.airline || labels.operator}
        </span>

        ${!isRail?`${badge((flight.ticket_format||"paper")==="digital"?"phone":"file",(flight.ticket_format||"paper")==="digital"?labels.digital:labels.paper)}${specialBadges}`:``}

        <h3>
          ${flight.flight || ""}
        </h3>

        <p>
          ${inlineIcon("pin")} ${isRail?labels.departureStation:labels.departureAirport}：${flight.airport || ""}
        </p>

        ${isRail&&flight.route?`<p>${inlineIcon("pin")} ${labels.arrivalStation}：${flight.route}</p>`:""}

        <p>
          ${inlineIcon("calendar")} ${flight.date || ""}
        </p>

        <p>
          ${inlineIcon("heart")} ${flight.favorite_count || 0} ${english?"saves":"收藏"}
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
        ${inlineIcon("heart")} ${favoriteIds.includes(flight.id)
        ? (english?"Saved":"已收藏")
        : (english?"Save":"收藏")}
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

alert("收藏成功");

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
