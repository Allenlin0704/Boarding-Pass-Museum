const FAVORITES_API="https://api.bpmuseum.org.cn";
const favoriteList=document.getElementById("favoriteList");
const favoriteSelection=new Set();
let savedExhibits=[];
const favoriteText=value=>window.bpmLocaleText?.(value)||value;
const favoriteEscape=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));

async function loadFavorites(){
  favoriteList.innerHTML=`<p class="favorite-message">${favoriteText("正在读取收藏…")}</p>`;
  try{
    const response=await fetch(`${FAVORITES_API}/api/favorites`,{credentials:"include",cache:"no-store"});
    if(response.status===401){location.href="login.html";return;}
    const data=await response.json();
    if(!response.ok||!Array.isArray(data))throw new Error(data.error||favoriteText("收藏暂时无法读取，请稍后重试。"));
    savedExhibits=data.map(item=>window.bpmSafeRecord?.(item)||item);
    favoriteSelection.clear();
    const years=[...new Set(savedExhibits.map(item=>String(item.date||"").match(/^\d{4}/)?.[0]).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
    const yearSelect=document.getElementById("favoriteYear");
    if(yearSelect)yearSelect.innerHTML=`<option value="">${favoriteText("全部年份")}</option>${years.map(year=>`<option value="${year}">${year}</option>`).join("")}`;
    renderFavorites();
  }catch(error){
    favoriteList.innerHTML=`<p class="favorite-message">${favoriteEscape(error.message||favoriteText("收藏暂时无法读取，请稍后重试。"))}</p>`;
  }
}

function filteredFavorites(){
  const query=(document.getElementById("favoriteSearch")?.value||"").trim().toLocaleLowerCase();
  const type=document.getElementById("favoriteType")?.value||"";
  const year=document.getElementById("favoriteYear")?.value||"";
  const sort=document.getElementById("favoriteSort")?.value||"flight_desc";
  const list=savedExhibits.filter(item=>{
    const haystack=[item.airline,item.flight,item.airport,item.route,item.date,item.submission_type].join(" ").toLocaleLowerCase();
    return (!query||haystack.includes(query))&&(!type||(item.submission_type||"boarding_pass")===type)&&(!year||String(item.date||"").startsWith(year));
  });
  list.sort((a,b)=>sort==="saved_desc"
    ?String(b.favorited_at||"").localeCompare(String(a.favorited_at||""))
    :sort==="flight_asc"
      ?String(a.date||"").localeCompare(String(b.date||""))
      :String(b.date||"").localeCompare(String(a.date||"")));
  return list;
}

function renderFavorites(){
  const visible=filteredFavorites();
  const status=document.getElementById("favoriteStatus");
  if(status)status.textContent=savedExhibits.length?`${favoriteText("显示")} ${visible.length} / ${savedExhibits.length}`:"";
  if(!visible.length){
    favoriteList.innerHTML=`<div class="card favorite-empty"><h3>${favoriteText(savedExhibits.length?"没有符合条件的收藏":"还没有收藏")}</h3><p>${favoriteText(savedExhibits.length?"调整筛选条件试试看。":"在展厅点亮心形，即可把展品放进这里。")}</p><a href="index.html">${favoriteText("前往展厅")}</a></div>`;
    updateFavoriteToolbar(visible);
    return;
  }
  favoriteList.innerHTML="";
  for(const exhibit of visible){
    const id=Number(exhibit.id??exhibit.favorite_flight_id);
    if(!Number.isSafeInteger(id)||id<1)continue;
    const card=document.createElement("article");
    card.className="card favorite-card";
    const image=String(exhibit.image||"");
    const type=exhibit.submission_type||"boarding_pass";
    const typeLabel=type==="rail_ticket"?"火车票":type==="metro_ticket"?"地铁票":"登机牌";
    card.innerHTML=`
      <label class="favorite-select"><input type="checkbox" data-favorite-select value="${id}" ${favoriteSelection.has(id)?"checked":""}> ${favoriteText("选择")}</label>
      <a class="favorite-card-link" href="detail.html?id=${id}">
        ${image?`<img src="${favoriteEscape(image)}" class="ticket-image" alt="${favoriteText("票据图片")}" loading="lazy">`:`<div class="favorite-image-empty">${favoriteText("暂无图片")}</div>`}
        <span class="tag">${favoriteText(typeLabel)}</span>
        <h2>${favoriteEscape([exhibit.airline,exhibit.flight].filter(Boolean).join(" ")||favoriteText("未填写航班信息"))}</h2>
        <p>${window.bpmIcon?.("pin")||""} ${favoriteEscape(exhibit.route||exhibit.airport||favoriteText("未填写路线"))}</p>
        <p>${window.bpmIcon?.("calendar")||""} ${favoriteEscape(exhibit.date||favoriteText("日期未填写"))}</p>
      </a>
      <button type="button" class="favorite-remove" data-remove-favorite="${id}">${favoriteText("移出收藏")}</button>`;
    favoriteList.appendChild(card);
  }
  updateFavoriteToolbar(visible);
}

function updateFavoriteToolbar(visible=filteredFavorites()){
  const ids=visible.map(item=>Number(item.id??item.favorite_flight_id)).filter(id=>Number.isSafeInteger(id)&&id>0);
  const selected=[...favoriteSelection].filter(id=>ids.includes(id));
  const count=document.getElementById("favoriteSelectionCount");
  const remove=document.getElementById("favoriteBulkRemove");
  const selectAll=document.getElementById("favoriteSelectAll");
  if(count)count.textContent=`${favoriteText("已选择")} ${selected.length} ${favoriteText("件")}`;
  if(remove)remove.disabled=!selected.length;
  if(selectAll){selectAll.checked=ids.length>0&&selected.length===ids.length;selectAll.indeterminate=selected.length>0&&selected.length<ids.length;}
}

async function removeFavorites(ids){
  const selected=[...new Set(ids.map(Number).filter(id=>Number.isSafeInteger(id)&&id>0))];
  if(!selected.length)return;
  if(selected.length>50){if(window.showToast)showToast(favoriteText("每次最多选择 50 件收藏"));return;}
  if(!confirm(favoriteText("确定把选中的收藏移出吗？")))return;
  const button=document.getElementById("favoriteBulkRemove");if(button)button.disabled=true;
  try{
    const response=await fetch(`${FAVORITES_API}/api/favorites/bulk-remove`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({flight_ids:selected})});
    const data=await response.json();
    if(!response.ok||!data.success)throw new Error(data.error||favoriteText("移除失败，请稍后重试。"));
    savedExhibits=savedExhibits.filter(item=>!selected.includes(Number(item.id??item.favorite_flight_id)));
    favoriteSelection.clear();renderFavorites();
    if(window.showToast)showToast(`${favoriteText("已移出收藏")} ${data.removed||0} ${favoriteText("件")}`);
  }catch(error){
    if(window.showToast)showToast(error.message||favoriteText("网络连接失败，请稍后重试。"));
    if(button)button.disabled=false;
  }
}

for(const id of ["favoriteSearch","favoriteType","favoriteYear","favoriteSort"]){
  document.getElementById(id)?.addEventListener(id==="favoriteSearch"?"input":"change",()=>{favoriteSelection.clear();renderFavorites();});
}
document.getElementById("favoriteSelectAll")?.addEventListener("change",event=>{
  const visible=filteredFavorites();
  if(event.target.checked)for(const item of visible.slice(0,50))favoriteSelection.add(Number(item.id??item.favorite_flight_id));
  else for(const item of visible)favoriteSelection.delete(Number(item.id??item.favorite_flight_id));
  if(event.target.checked&&visible.length>50&&window.showToast)showToast(favoriteText("每次最多选择 50 件收藏"));
  renderFavorites();
});
favoriteList.addEventListener("change",event=>{
  const checkbox=event.target.closest?.("[data-favorite-select]");if(!checkbox)return;
  const id=Number(checkbox.value);if(checkbox.checked&&favoriteSelection.size>=50){checkbox.checked=false;if(window.showToast)showToast(favoriteText("每次最多选择 50 件收藏"));return;}if(checkbox.checked)favoriteSelection.add(id);else favoriteSelection.delete(id);updateFavoriteToolbar();
});
favoriteList.addEventListener("click",async event=>{
  const button=event.target.closest?.("[data-remove-favorite]");if(!button)return;
  event.preventDefault();event.stopPropagation();await removeFavorites([Number(button.dataset.removeFavorite)]);
});
document.getElementById("favoriteBulkRemove")?.addEventListener("click",()=>removeFavorites([...favoriteSelection]));
loadFavorites();
