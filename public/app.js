let flights = [];
let displayFlights = [];
let favoriteIds = [];
let entityIndex={airlinesByCode:new Map(),airportsByCode:new Map(),airlinesByAlias:new Map(),airportsByAlias:new Map()};
const normalizeEntity=value=>String(value||"").normalize("NFKC").trim().toLocaleLowerCase("en").replace(/[\s\p{P}\p{S}]/gu,"");
const cleanEntityName=value=>String(value||"").trim().replace(/^[\s"'“”‘’《》]+|[\s"'“”‘’《》]+$/gu,"");
function addEntityRows(kind,rows){
  const byCode=kind==="airline"?entityIndex.airlinesByCode:entityIndex.airportsByCode;
  const byAlias=kind==="airline"?entityIndex.airlinesByAlias:entityIndex.airportsByAlias;
  for(const [rawCode,nameCn,nameEn,rawIcao] of rows||[]){
    const code=String(rawCode||"").trim().toUpperCase(),icao=String(rawIcao||"").trim().toUpperCase();
    if(!code)continue;
    const entry={code,nameCn:cleanEntityName(nameCn),nameEn:cleanEntityName(nameEn)};
    byCode.set(code,entry);if(icao)byCode.set(icao,entry);
    for(const alias of [code,icao,nameCn,nameEn]){const key=normalizeEntity(alias);if(key&&!byAlias.has(key))byAlias.set(key,entry);}
  }
}
const entityIndexReady=fetch("/data/entity-aliases.json",{cache:"force-cache"}).then(response=>response.ok?response.json():null).then(data=>{
  if(data){addEntityRows("airline",data.airlines);addEntityRows("airport",data.airports);}
  return data;
}).catch(()=>null);
function entityIdentity(kind,record){
  const isAirline=kind==="airline",raw=String(record?.[kind]||"").trim();
  const iata=String(record?.[isAirline?"airline_iata":"airport_iata"]||"").trim().toUpperCase();
  const icao=String(record?.[isAirline?"airline_icao":"airport_icao"]||"").trim().toUpperCase();
  const byCode=isAirline?entityIndex.airlinesByCode:entityIndex.airportsByCode;
  const byAlias=isAirline?entityIndex.airlinesByAlias:entityIndex.airportsByAlias;
  if(iata&&byCode.has(iata))return `${kind}:${iata}`;
  if(icao&&byCode.has(icao))return `${kind}:${icao}`;
  const alias=byAlias.get(normalizeEntity(raw));if(alias)return `${kind}:${alias.code}`;
  const codes=raw.toUpperCase().match(/\b[A-Z0-9]{2,6}\b/g)||[];
  for(const code of codes)if(byCode.has(code))return `${kind}:${byCode.get(code).code}`;
  const special={"china railway cr":"rail:CR","中国国家铁路cr":"rail:CR","deutsche bahn":"rail:DB","德国铁路db":"rail:DB","amtrak":"rail:AM","acela":"rail:AC","eurostar":"rail:ES","欧洲之星eurostar":"rail:ES","sncf":"rail:SN","法国国家铁路sncf":"rail:SN","japan railways":"rail:JR","日本铁路jr":"rail:JR","swiss federal railways":"rail:SBB","瑞士联邦铁路sbb":"rail:SBB"};
  const simplified=normalizeEntity(raw.replace(/\([^)]*\)/g,""));
  return `raw:${special[simplified]||kind+":"+simplified}`;
}
function entityLabel(kind,record){
  const identity=entityIdentity(kind,record),code=identity.split(":").at(-1);
  const byCode=kind==="airline"?entityIndex.airlinesByCode:entityIndex.airportsByCode;
  const entry=byCode.get(code);
  if(!entry)return String(record?.[kind]||"").trim();
  const localized=window.BPM_LANGUAGE==="zh-CN"?entry.nameCn:entry.nameEn;
  return `${localized||entry.nameCn||entry.nameEn||record?.[kind]||code} (${entry.code})`;
}
function entitySearchNames(kind,record){
  const identity=entityIdentity(kind,record),code=identity.split(":").at(-1);
  const byCode=kind==="airline"?entityIndex.airlinesByCode:entityIndex.airportsByCode;
  const entry=byCode.get(code);
  return [record?.[kind],entry?.nameCn,entry?.nameEn,entry?.code].filter(Boolean).join(" ");
}

// =====================
// 从 API 读取审核通过的展品
// =====================

async function loadFlights() {

  try {

    const [res] = await Promise.all([
      fetch("https://api.bpmuseum.org.cn/api/flights"),
      entityIndexReady
    ]);

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
  const baggageTag = document.getElementById("museumBaggageTag")?.value || "";
  const format = document.getElementById("museumFormat")?.value || "";
  const airport = document.getElementById("museumAirport")?.value || "";
  const year = document.getElementById("museumYear")?.value || "";


  displayFlights =
  flights.filter(f=>{

    const text =
    `
    ${entitySearchNames("airline",f)}
    ${f.flight || ""}
    ${entitySearchNames("airport",f)}
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
      || (category === "rail_ticket" && f.submission_type === "rail_ticket");
    return text.includes(keyword)
      && (!airline || entityIdentity("airline",f) === airline)
      && categoryMatches
      && (!baggageTag || tags.includes(baggageTag))
      && (!format || (f.submission_type !== "rail_ticket" && (f.ticket_format || "paper") === format))
      && (!airport || entityIdentity("airport",f) === airport)
      && (!year || String(f.date || "").startsWith(year));

  });

  const resultCount=document.getElementById("museumResultCount");
  const english=window.BPM_LANGUAGE==="en",traditional=window.BPM_LANGUAGE==="zh-TW";
  const filtered=Boolean(keyword||airline||category||baggageTag||format||airport||year);
  if(resultCount)resultCount.textContent=english
    ? `${displayFlights.length} ${filtered?"matching ":""}exhibits`
    : traditional
      ? `${displayFlights.length} 件${filtered?"符合條件的":""}展品`
      : filtered?`找到 ${displayFlights.length} 件匹配展品`:`共 ${displayFlights.length} 件展品`;


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
    ["museumBaggageTag", null, "全部行李标记"],
    ["museumFormat", null, "全部登机牌形式"],
    ["museumAirport", "airport", "全部出发机场或车站"],
    ["museumYear", "year", "全部年份"]
  ];

  options.forEach(([id, field, fallback]) => {
    const select = document.getElementById(id);
    if(!select) return;
    const current = select.value;
    if(!field) return;
    const values = field === "year"
      ? [...new Set(flights.map(f=>String(f.date||"").slice(0,4)).filter(Boolean))].map(value=>[value,value])
      : [...new Map(flights.map(f=>[entityIdentity(field,f),entityLabel(field,f)])).entries()];
    const locale=window.BPM_LANGUAGE==="en"?"en":window.BPM_LANGUAGE==="zh-TW"?"zh-TW":"zh-CN";
    values.sort((a,b)=>field==="year"?b[0].localeCompare(a[0]):a[1].localeCompare(b[1],locale));
    select.replaceChildren(new Option(fallback, ""), ...values.map(([value,label])=>new Option(label,value)));
    select.value = values.some(([value])=>value===current) ? current : "";
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

  ["museumAirline", "museumType", "museumBaggageTag", "museumFormat", "museumAirport", "museumYear"].forEach(id =>
    document.getElementById(id)?.addEventListener("change", applyMuseumFilter)
  );

  document.getElementById("museumReset")?.addEventListener("click", () => {
    ["museumSearch", "museumAirline", "museumType", "museumBaggageTag", "museumFormat", "museumAirport", "museumYear"].forEach(id => {
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

  const traditional = window.BPM_LANGUAGE === "zh-TW";

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
        ${window.BPM_LANGUAGE==="en"?"No exhibits yet":window.BPM_LANGUAGE==="zh-TW"?"目前沒有展品":"暂无展品"}
      </p>
    `;

    return;

  }

  if(displayFlights.length===0){
    museum.innerHTML=`<p class="museum-empty">${window.BPM_LANGUAGE==="en"?"No exhibits match these filters. Adjust your search or clear the filters.":window.BPM_LANGUAGE==="zh-TW"?"找不到符合目前篩選條件的展品。請調整關鍵字或清除篩選後再試。":"没有符合当前筛选条件的展品。请调整关键词或清除筛选后再试。"}</p>`;
    return;
  }


  displayFlights.forEach(
    (flight, index) => {
      const rawStory=String(flight.story||"");
      const english=window.BPM_LANGUAGE==="en";
      const airlineLabel=bpmSafeRecord({value:entityLabel("airline",flight)}).value;
      const airportLabel=bpmSafeRecord({value:entityLabel("airport",flight)}).value;
      const translateUrl=(target)=>window.bpmGoogleTranslateUrl?.(rawStory,target)||"https://translate.google.com/";
      const translateLabels=english?["English","Traditional Chinese"]:traditional?["英文","繁體中文"]:["English","繁体中文"];
      const storyTranslationLinks=rawStory.trim()?`<div class="story-translate-links"><span>${english?"Google Translate (story text is sent to Google)":traditional?"Google 翻譯（故事文字將傳送至 Google）":"Google 翻译（故事文本将发送至 Google）"}</span><a href="${translateUrl("en").replace(/&/g,"&amp;")}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${translateLabels[0]}</a><a href="${translateUrl("zh-TW").replace(/&/g,"&amp;")}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${translateLabels[1]}</a></div>`:"";
      flight=bpmSafeRecord(flight);
      const isRail=flight.submission_type==="rail_ticket";
      let specialTags=flight.special_tags||[];
      if(typeof specialTags==="string"){
        try{specialTags=JSON.parse(specialTags);}catch{specialTags=[];}
      }
      if(!Array.isArray(specialTags))specialTags=[];
      const labels=english
        ? {rail:"Rail ticket",boarding:"Boarding pass",transfer:"Transfer",twoCabin:"Business/first class",other:"Other marker",digital:"Electronic boarding pass",paper:"Paper boarding pass",operator:"Unknown operator",departureStation:"Departure station",departureAirport:"Departure airport",arrivalStation:"Arrival station"}
        : traditional
          ? {rail:"火車票",boarding:"登機牌",transfer:"轉機",twoCabin:"兩艙",other:"其他標記",digital:"電子登機牌",paper:"紙本登機牌",operator:"未知營運業者",departureStation:"出發車站",departureAirport:"出發機場",arrivalStation:"抵達車站"}
          : {rail:"火车票",boarding:"登机牌",transfer:"转机",twoCabin:"两舱",other:"其他标记",digital:"电子登机牌",paper:"纸质登机牌",operator:"未知运营公司",departureStation:"出发车站",departureAirport:"出发机场",arrivalStation:"到达车站"};
      const badge=(icon,label)=>`<span class="tag gallery-type-badge">${window.bpmIcon(icon)}<span>${label}</span></span>`;
      const inlineIcon=icon=>window.bpmIcon(icon);
      const specialBadges=specialTags.filter(tag=>["transfer","two_cabin","other"].includes(tag)).map(tag=>badge(tag==="transfer"?"repeat":tag==="two_cabin"?"armchair":"tag",tag==="transfer"?labels.transfer:tag==="two_cabin"?labels.twoCabin:labels.other)).join("");

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

          <span class="tag" data-user-content>
          ${airlineLabel || labels.operator}
        </span>

        ${!isRail?`${badge((flight.ticket_format||"paper")==="digital"?"phone":"file",(flight.ticket_format||"paper")==="digital"?labels.digital:labels.paper)}${specialBadges}`:``}

        <h3>
          ${flight.flight || ""}
        </h3>

        <p>
          ${inlineIcon("pin")} <span>${isRail?labels.departureStation:labels.departureAirport}：</span><span data-user-content>${airportLabel || ""}</span>
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

<span data-user-content>
${flight.username || "匿名用户"}
</span>

</div>

        <p class="story" data-user-content>
          ${flight.story || ""}
        </p>
        ${storyTranslationLinks}


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
