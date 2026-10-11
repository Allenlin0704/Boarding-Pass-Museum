let flights = [];
let displayFlights = [];
let favoriteIds = [];
let flightsLoading = true;
let flightLoadFailed = false;
let entityIndex={airlinesByCode:new Map(),airportsByCode:new Map(),airlinesByAlias:new Map(),airportsByAlias:new Map()};
const normalizeEntity=value=>String(value||"").normalize("NFKC").trim().toLocaleLowerCase("en").replace(/[\s\p{P}\p{S}]/gu,"");
const cleanEntityName=value=>String(value||"").trim().replace(/^[\s"'“”‘’《》]+|[\s"'“”‘’《》]+$/gu,"");
const railEntities=[
  {code:"CR",zhCN:"中国国家铁路",zhTW:"中國國家鐵路",en:"China Railway",aliases:["CR","中国国家铁路","中国国家铁路 CR","China Railway"]},
  {code:"DB",zhCN:"德国铁路",zhTW:"德國鐵路",en:"Deutsche Bahn",aliases:["DB","德国铁路","德国铁路 DB","Deutsche Bahn"]},
  {code:"AM",zhCN:"美国国家铁路客运公司",zhTW:"美國國家鐵路客運公司",en:"Amtrak",aliases:["AM","Amtrak"]},
  {code:"AC",zhCN:"Amtrak Acela",zhTW:"Amtrak Acela",en:"Amtrak Acela",aliases:["AC","Acela","Amtrak Acela"]},
  {code:"ES",zhCN:"欧洲之星",zhTW:"歐洲之星",en:"Eurostar",aliases:["ES","欧洲之星","欧洲之星 Eurostar","Eurostar"]},
  {code:"SN",zhCN:"法国国家铁路",zhTW:"法國國家鐵路",en:"SNCF",aliases:["SN","SNCF","法国国家铁路","法国国家铁路 SNCF"]},
  {code:"JR",zhCN:"日本铁路",zhTW:"日本鐵路",en:"Japan Railways",aliases:["JR","日本铁路","Japan Railways"]},
  {code:"SBB",zhCN:"瑞士联邦铁路",zhTW:"瑞士聯邦鐵路",en:"Swiss Federal Railways",aliases:["SBB","瑞士联邦铁路","Swiss Federal Railways"]},
];
const railEntityByCode=new Map(railEntities.map(entry=>[entry.code,entry]));
const railEntityByAlias=new Map(railEntities.flatMap(entry=>entry.aliases.map(alias=>[normalizeEntity(alias),entry])));
function railEntity(record){
  if(record?.submission_type!=="rail_ticket")return null;
  return railEntityByCode.get(String(record?.airline_iata||"").trim().toUpperCase())||railEntityByAlias.get(normalizeEntity(record?.airline));
}
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
  const rail=kind==="airline"?railEntity(record):null;if(rail)return `rail:${rail.code}`;
  const iata=String(record?.[isAirline?"airline_iata":"airport_iata"]||"").trim().toUpperCase();
  const icao=String(record?.[isAirline?"airline_icao":"airport_icao"]||"").trim().toUpperCase();
  const byCode=isAirline?entityIndex.airlinesByCode:entityIndex.airportsByCode;
  const byAlias=isAirline?entityIndex.airlinesByAlias:entityIndex.airportsByAlias;
  if(iata&&byCode.has(iata))return `${kind}:${iata}`;
  if(icao&&byCode.has(icao))return `${kind}:${icao}`;
  const alias=byAlias.get(normalizeEntity(raw));if(alias)return `${kind}:${alias.code}`;
  const codes=raw.toUpperCase().match(/\b[A-Z0-9]{2,6}\b/g)||[];
  for(const code of codes)if(byCode.has(code))return `${kind}:${byCode.get(code).code}`;
  const simplified=normalizeEntity(raw.replace(/\([^)]*\)/g,""));
  return `raw:${kind+":"+simplified}`;
}
function entityLabel(kind,record){
  const identity=entityIdentity(kind,record),code=identity.split(":").at(-1);
  const rail=identity.startsWith("rail:")?railEntityByCode.get(code):null;
  if(rail){const locale=window.BPM_LANGUAGE==="zh-CN"?rail.zhCN:window.BPM_LANGUAGE==="zh-TW"?rail.zhTW:rail.en;return `${locale} (${rail.code})`;}
  const byCode=kind==="airline"?entityIndex.airlinesByCode:entityIndex.airportsByCode;
  const entry=byCode.get(code);
  if(!entry){
    const raw=String(record?.[kind]||"").trim();
    if(!raw)return "";
    if(/^[A-Z0-9]{2,5}$/i.test(raw))return window.BPM_LANGUAGE==="en"?`Unlisted ${kind==="airline"?"airline":"airport"} (${raw.toUpperCase()})`:window.BPM_LANGUAGE==="zh-TW"?`未收錄${kind==="airline"?"航空公司":"機場"}（${raw.toUpperCase()}）`:`未收录${kind==="airline"?"航司":"机场"}（${raw.toUpperCase()}）`;
    return raw;
  }
  const localized=window.BPM_LANGUAGE==="en"?entry.nameEn:entry.nameCn;
  return `${localized||entry.nameCn||entry.nameEn||record?.[kind]||code} (${entry.code})`;
}
function entitySearchNames(kind,record){
  const identity=entityIdentity(kind,record),code=identity.split(":").at(-1);
  const rail=identity.startsWith("rail:")?railEntityByCode.get(code):null;
  if(rail)return [record?.[kind],rail.zhCN,rail.zhTW,rail.en,rail.code].filter(Boolean).join(" ");
  const byCode=kind==="airline"?entityIndex.airlinesByCode:entityIndex.airportsByCode;
  const entry=byCode.get(code);
  return [record?.[kind],entry?.nameCn,entry?.nameEn,entry?.code].filter(Boolean).join(" ");
}

// =====================
// 从 API 读取审核通过的展品
// =====================

async function loadFlights() {
  flightsLoading = true;
  flightLoadFailed = false;
  try {
    renderMuseum();
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const requestTimeout = controller ? setTimeout(() => controller.abort(), 15000) : null;
    let res;
    let data;
    try {
      res = await fetch("https://api.bpmuseum.org.cn/api/flights", { cache: "no-store", ...(controller ? { signal: controller.signal } : {}) });
      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
      }
      data = await res.json();
    } finally {
      if(requestTimeout)clearTimeout(requestTimeout);
    }

    flights =
      Array.isArray(data)
        ? data
        : [];
    window.BPM_EXHIBITS=flights;
    flightsLoading = false;

    populateMuseumFilters();
    applyMuseumFilter();
    entityIndexReady.then(()=>{if(!flightsLoading&&!flightLoadFailed){populateMuseumFilters();applyMuseumFilter();}});


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

    flightsLoading = false;
    flightLoadFailed = flights.length===0;

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

  document.getElementById("museum")?.addEventListener("click",event=>{
    if(event.target.closest("[data-gallery-retry]"))loadFlights();
  });

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

  const english=window.BPM_LANGUAGE==="en";
  const resultCount=document.getElementById("museumResultCount");
  if(typeof museum.setAttribute==="function")museum.setAttribute("aria-busy",String(flightsLoading));
  if(flightsLoading){
    const title=english?"Opening the collection":traditional?"正在開啟館藏":"正在打开线上展厅";
    const detail=english?"The exhibits are on their way. Some connections take a little longer.":traditional?"展品正在載入，部分網路連線可能需要多一點時間。":"正在连接展品目录；部分网络连接需要多一点时间。";
    museum.innerHTML=`<div class="gallery-loading-state"><div class="gallery-loading-copy"><span class="gallery-loading-mark" aria-hidden="true">✈</span><div><strong>${title}</strong><p>${detail}</p></div></div><div class="gallery-skeleton-grid" aria-hidden="true">${Array.from({length:3},()=>'<article class="gallery-skeleton-card"><span class="gallery-skeleton-image"></span><span class="gallery-skeleton-line short"></span><span class="gallery-skeleton-line"></span><span class="gallery-skeleton-line medium"></span></article>').join("")}</div></div>`;
    if(resultCount)resultCount.textContent=english?"Connecting to the collection…":traditional?"正在連線至館藏…":"正在连接馆藏…";
    return;
  }
  if(typeof museum.setAttribute==="function")museum.setAttribute("aria-busy","false");
  if(flightLoadFailed){
    const title=english?"The collection is taking longer to load":traditional?"館藏暫時載入較慢":"展品暂时连接较慢";
    const detail=english?"Your exhibits have not disappeared. Try again in a moment.":traditional?"展品並沒有消失，請稍後重試。":"展品没有消失，稍后再试就好。";
    const retry=english?"Try again":traditional?"重新載入":"重新加载";
    museum.innerHTML=`<div class="gallery-load-error"><div><strong>${title}</strong><p>${detail}</p><button type="button" data-gallery-retry>${retry}</button></div></div>`;
    if(resultCount)resultCount.textContent=english?"Waiting for a connection":traditional?"等待網路連線":"等待网络连接";
    return;
  }

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
      const translateLabels=english?["English","Traditional Chinese"]:traditional?["英文","繁體中文"]:["English","繁体中文"];
      const storyForAttribute=bpmSafeRecord({value:rawStory}).value;
      const storyTranslationLinks=rawStory.trim()?`<div class="story-translate-links" data-bpm-flight-id="${Number(flight.id)||0}" data-bpm-story="${storyForAttribute}"><span>${english?"Translate public story text with ":traditional?"使用":"使用"}<span data-bpm-ai-slot>AI</span>${english?" after you click (public story text is sent)":traditional?" 翻譯（點擊後會傳送公開故事文字）":" 翻译（点击后会发送公开故事文本）"}</span><button type="button" data-bpm-translate="en">${translateLabels[0]}</button><button type="button" data-bpm-translate="zh-TW">${translateLabels[1]}</button><p class="story-translation-output" hidden aria-live="polite"></p></div>`:"";
      flight=bpmSafeRecord(flight);
      const isRail=flight.submission_type==="rail_ticket";
      let specialTags=flight.special_tags||[];
      if(typeof specialTags==="string"){
        try{specialTags=JSON.parse(specialTags);}catch{specialTags=[];}
      }
      if(!Array.isArray(specialTags))specialTags=[];
      const labels=english
        ? {rail:"Rail ticket",boarding:"Boarding pass",digital:"Electronic boarding pass",paper:"Paper boarding pass",operator:"Unknown operator",departureStation:"Departure station",departureAirport:"Departure airport",arrivalStation:"Arrival station",domestic:"Domestic route",international:"International route",regional:"Regional route",business:"Business class",premium_economy:"Premium economy",first_class:"First class",silver:"Silver",gold:"Gold",platinum:"Platinum",special_assistance:"Special assistance",transfer:"Transfer",other:"Other",legacyTwoCabin:"Two-cabin baggage"}
        : traditional
          ? {rail:"火車票",boarding:"登機牌",digital:"電子登機牌",paper:"紙本登機牌",operator:"未知營運業者",departureStation:"出發車站",departureAirport:"出發機場",arrivalStation:"抵達車站",domestic:"國內航線",international:"國際航線",regional:"地區航線",business:"商務艙",premium_economy:"超級經濟艙",first_class:"頭等艙",silver:"銀卡",gold:"金卡",platinum:"白金卡",special_assistance:"特殊保障",transfer:"轉機",other:"其他",legacyTwoCabin:"兩艙行李"}
          : {rail:"火车票",boarding:"登机牌",digital:"电子登机牌",paper:"纸质登机牌",operator:"未知运营公司",departureStation:"出发车站",departureAirport:"出发机场",arrivalStation:"到达车站",domestic:"国内航线",international:"国际航线",regional:"地区航线",business:"公务舱",premium_economy:"超级经济舱",first_class:"头等舱",silver:"银卡",gold:"金卡",platinum:"白金卡",special_assistance:"特殊保障",transfer:"转机",other:"其他",legacyTwoCabin:"两舱行李"};
      const cabinLabels=english?{economy:"Economy",premium_economy:"Premium economy",business:"Business",first_class:"First class (Business suite)",other:"Other"}:traditional?{economy:"經濟艙",premium_economy:"超級經濟艙",business:"商務艙",first_class:"頭等艙（豪華商務艙）",other:"其他"}:{economy:"经济舱",premium_economy:"超级经济舱",business:"公务舱",first_class:"头等舱（豪华公务舱）",other:"其他"};
      const badge=(icon,label)=>`<span class="tag gallery-type-badge">${window.bpmIcon(icon)}<span>${label}</span></span>`;
      const inlineIcon=icon=>window.bpmIcon(icon);
      const tagIcons={business:"armchair",premium_economy:"armchair",first_class:"armchair",silver:"circle",gold:"circle",platinum:"circle",special_assistance:"alert",transfer:"repeat",other:"file",two_cabin:"armchair"};
      const specialBadges=specialTags.filter(tag=>tagIcons[tag]).map(tag=>badge(tagIcons[tag],labels[tag]||labels.legacyTwoCabin)).join("");
      const routeScopeBadge=!isRail&&labels[flight.route_scope]?badge("globe",labels[flight.route_scope]):"";
      const cabinBadge=!isRail&&cabinLabels[flight.cabin_class]?badge("armchair",cabinLabels[flight.cabin_class]):"";

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

        ${!isRail?`${badge((flight.ticket_format||"paper")==="digital"?"phone":"file",(flight.ticket_format||"paper")==="digital"?labels.digital:labels.paper)}${routeScopeBadge}${cabinBadge}${specialBadges}`:``}

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

        ${Number(flight.social_share_consent)===1?`<button type="button" class="bpm-share-trigger" data-share-flight="${Number(flight.id)}">${english?"Share card":traditional?"分享卡":"分享卡"}</button>`:""}

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
