(() => {
  const language = window.BPM_LANGUAGE || 'zh-CN';
  const words = {
    'zh-CN': { loading:'正在连接馆藏…',failed:'馆藏暂时无法连接，请稍后重试。',items:'件公开展品',airports:'个出发地点',operators:'家运营公司',airportsColumn:'出发地点',ticketsColumn:'展品',operatorsColumn:'运营公司',exhibit:'展品',open:'打开展品',noMatches:'没有符合条件的展品。',noHistory:'目前没有可显示的日期记录。',sameFlight:'同航班号',sameAirport:'同一出发地点',matches:'件关联展品',allYears:'所有年份',allAirports:'所有出发地点',departure:'出发',rail:'火车票',metro:'地铁票',boarding:'登机牌',filtered:'件',legend:'票面日期',openArrow:'查看详情 →' },
    'zh-TW': { loading:'正在連線至館藏…',failed:'館藏暫時無法連線，請稍後重試。',items:'件公開展品',airports:'個出發地點',operators:'家營運業者',airportsColumn:'出發地點',ticketsColumn:'展品',operatorsColumn:'營運業者',exhibit:'展品',open:'開啟展品',noMatches:'沒有符合條件的展品。',noHistory:'目前沒有可顯示的日期紀錄。',sameFlight:'同航班號',sameAirport:'相同出發地點',matches:'件關聯展品',allYears:'所有年份',allAirports:'所有出發地點',departure:'出發',rail:'火車票',metro:'地鐵票',boarding:'登機證',filtered:'件',legend:'票面日期',openArrow:'查看詳情 →' },
    en: { loading:'Loading exhibits…',failed:'The collection could not be loaded. Try again later.',items:'public exhibits',airports:'departure points',operators:'operators',airportsColumn:'Departure points',ticketsColumn:'Exhibits',operatorsColumn:'Airlines and operators',exhibit:'Exhibit',open:'Open exhibit',noMatches:'No exhibits match these filters.',noHistory:'No dated exhibits are available yet.',sameFlight:'Same flight number',sameAirport:'Same departure point',matches:'related exhibits',allYears:'All years',allAirports:'All departure points',departure:'Departure',rail:'Rail ticket',metro:'Metro ticket',boarding:'Boarding pass',filtered:'items',legend:'Date on ticket',openArrow:'View details' }
  }[language] || {};
  const copy = {
    en:{'explore.title':'Collection index','explore.intro':'Find exhibits by departure point, airline, or the date on the ticket.','explore.atlas':'Connections','explore.atlasNote':'Nodes connect exhibits that share a departure point or airline. Destinations and actual routes are not inferred.','explore.time':'Browse by date','explore.timeNote':'Choose a year, then filter by airline or operator.','explore.related':'Same flight','explore.relatedNote':'Enter a flight number or choose a departure point.','explore.airports':'Departure points','explore.tickets':'Exhibits','explore.operators':'Airlines / operators','explore.chooseNode':'Choose an item','explore.chooseNodeHint':'Select a departure point, airline, or exhibit to see related items.','explore.year':'Year','explore.operatorFilter':'Filter by airline or operator','explore.flightSearch':'Flight number','explore.airportFilter':'Departure point','explore.privacy':'Only approved public exhibits appear here.'},
    'zh-TW':{'explore.title':'館藏索引','explore.intro':'依出發地、航空公司或票面日期查找展品。','explore.atlas':'關聯圖','explore.atlasNote':'節點依出發地、展品和航空公司相連。圖中不推測目的地或實際航線。','explore.time':'依日期查找','explore.timeNote':'選擇年份，也可再依航空公司或營運業者篩選。','explore.related':'相同航班','explore.relatedNote':'輸入航班號，或依出發地查找展品。','explore.airports':'出發地點','explore.tickets':'展品','explore.operators':'航空公司／營運業者','explore.chooseNode':'選擇一個項目','explore.chooseNodeHint':'點選出發地、航空公司或展品，查看相關館藏。','explore.year':'年份','explore.operatorFilter':'依航空公司或營運業者篩選','explore.flightSearch':'航班號','explore.airportFilter':'出發地點','explore.privacy':'此處僅顯示已審核通過的公開展品。'}
  };
  if(language!=='zh-CN')document.querySelectorAll('[data-i18n]').forEach(node=>{const translated=copy[language]?.[node.dataset.i18n];if(translated)node.textContent=translated;});
  const $ = selector => document.querySelector(selector);
  const text = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const normalized = value => String(value || '').normalize('NFKC').trim().toLocaleLowerCase('en').replace(/[\s\p{P}\p{S}]/gu,'');
  const airportKey = f => String(f.airport_iata || f.airport_icao || normalized(f.airport)).toUpperCase();
  const operatorKey = f => String(f.airline_iata || f.airline_icao || normalized(f.airline)).toUpperCase();
  const flightKey = f => normalized(f.flight);
  const byDate = (a,b) => String(a.date || '').localeCompare(String(b.date || '')) || Number(a.id)-Number(b.id);
  let exhibits = [];

  function mapGroups(rows, keyFn) {
    const groups = new Map();
    for (const row of rows) {
      const key = keyFn(row);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return groups;
  }

  function drawAtlas() {
    const host = $('#atlasStage');
    if (!host) return;
    const rows = [...exhibits].sort((a,b) => String(b.date||'').localeCompare(String(a.date||''))).slice(0,22);
    const airports = [...mapGroups(rows, airportKey)].map(([key,items])=>({key,items,label:items[0].airport||key,code:items[0].airport_iata||items[0].airport_icao||key}));
    const operators = [...mapGroups(rows, operatorKey)].map(([key,items])=>({key,items,label:items[0].airline||key,code:items[0].airline_iata||items[0].airline_icao||key}));
    const width=1080,top=68,rowGap=27,height=Math.max(420,top+rows.length*rowGap+58),leftX=155,centerX=540,rightX=925;
    const airportY=new Map(airports.map((g,i)=>[g.key,top+(i+1)*(height-top-48)/(airports.length+1)]));
    const operatorY=new Map(operators.map((g,i)=>[g.key,top+(i+1)*(height-top-48)/(operators.length+1)]));
    const edges=rows.map((f,i)=>{const y=top+i*rowGap;return `<path class="bpm-atlas-link" d="M ${leftX+10} ${airportY.get(airportKey(f))||height/2} C ${leftX+145} ${airportY.get(airportKey(f))||height/2},${centerX-125} ${y},${centerX-8} ${y}"/><path class="bpm-atlas-link" d="M ${centerX+8} ${y} C ${centerX+125} ${y},${rightX-145} ${operatorY.get(operatorKey(f))||height/2},${rightX-10} ${operatorY.get(operatorKey(f))||height/2}"/>`;}).join('');
    const airportNodes=airports.map(g=>`<g class="bpm-atlas-node airport" data-node-kind="airport" data-node-key="${text(g.key)}" tabindex="0" role="button" aria-label="${text(g.label)} · ${g.items.length} ${text(words.items)}"><circle cx="${leftX}" cy="${airportY.get(g.key)}" r="${Math.min(18,8+g.items.length)}"/><text class="bpm-atlas-label" x="${leftX-18}" y="${airportY.get(g.key)-17}" text-anchor="end">${text(g.code)}</text></g>`).join('');
    const operatorNodes=operators.map(g=>`<g class="bpm-atlas-node airline" data-node-kind="operator" data-node-key="${text(g.key)}" tabindex="0" role="button" aria-label="${text(g.label)} · ${g.items.length} ${text(words.items)}"><circle cx="${rightX}" cy="${operatorY.get(g.key)}" r="${Math.min(18,8+g.items.length)}"/><text class="bpm-atlas-label" x="${rightX+18}" y="${operatorY.get(g.key)+4}">${text(g.code)}</text></g>`).join('');
    const ticketNodes=rows.map((f,i)=>{const y=top+i*rowGap;return `<g class="bpm-atlas-node ticket" data-node-kind="ticket" data-node-key="${Number(f.id)}" tabindex="0" role="button" aria-label="${text(f.flight||words.exhibit)} · #${Number(f.id)}"><rect x="${centerX-5}" y="${y-5}" width="10" height="10"/><text class="bpm-atlas-small" x="${centerX+14}" y="${y+4}">${text(f.flight||'#'+f.id)}</text></g>`;}).join('');
    host.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="group" aria-label="${text(words.airportsColumn)} – ${text(words.ticketsColumn)} – ${text(words.operatorsColumn)}"> <text class="bpm-atlas-small" x="${leftX}" y="32" text-anchor="middle">${text(words.airportsColumn)}</text><text class="bpm-atlas-small" x="${centerX}" y="32" text-anchor="middle">${text(words.ticketsColumn)}</text><text class="bpm-atlas-small" x="${rightX}" y="32" text-anchor="middle">${text(words.operatorsColumn)}</text>${edges}${airportNodes}${ticketNodes}${operatorNodes}<text class="bpm-atlas-small" x="${width-18}" y="${height-15}" text-anchor="end">${text(language==='en'?'Most recent 22 exhibits':language==='zh-TW'?'最近 22 件展品':'最近 22 件展品')}</text></svg>`;
  }

  function showAtlasNode(kind,key) {
    const box=$('#atlasDetail'); if(!box)return;
    let rows=[],heading='';
    if(kind==='ticket'){rows=exhibits.filter(f=>Number(f.id)===Number(key));heading=rows[0]?.flight||words.exhibit;}
    else if(kind==='airport'){rows=exhibits.filter(f=>airportKey(f)===key);heading=rows[0]?.airport||key;}
    else {rows=exhibits.filter(f=>operatorKey(f)===key);heading=rows[0]?.airline||key;}
    box.replaceChildren();
    const eyebrow=document.createElement('span');eyebrow.className='bpm-explore-eyebrow';eyebrow.textContent=kind==='ticket'?`#${Number(key)}`:kind==='airport'?words.airportsColumn:words.operatorsColumn;
    const title=document.createElement('h3');title.textContent=heading;
    const count=document.createElement('p');count.textContent=`${rows.length} ${words.items}`;
    const list=document.createElement('div');list.className='bpm-atlas-results';
    for(const f of rows.sort(byDate).reverse().slice(0,12)) list.append(makeAtlasResult(f));
    box.append(eyebrow,title,count,list);
  }

  function makeAtlasResult(f) {
    const a=document.createElement('a');a.className='bpm-atlas-result';a.href=`detail.html?id=${Number(f.id)}`;
    const img=document.createElement('img');img.src=f.image||'favicon.png';img.alt='';img.loading='lazy';
    const copy=document.createElement('span');const strong=document.createElement('strong');strong.textContent=f.flight||words.exhibit;const small=document.createElement('small');small.textContent=`${f.airline||''} · ${f.date||''}`;copy.append(strong,small);a.append(img,copy);return a;
  }

  function renderTime() {
    const select=$('#timeYear'),search=$('#timeSearch'),list=$('#timeList'),count=$('#timeCount'),ruler=$('#timeRuler');if(!select||!list)return;
    const years=[...new Set(exhibits.map(f=>String(f.date||'').slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort().reverse();
    const selected=select.value;
    select.innerHTML=`<option value="">${text(words.allYears)}</option>`+years.map(y=>`<option value="${y}">${y}</option>`).join('');
    if(years.includes(selected))select.value=selected;
    ruler.innerHTML=years.map(y=>`<button type="button" class="bpm-time-year" data-time-year="${y}" aria-pressed="${select.value===y}">${y}</button>`).join('');
    const query=normalized(search?.value),year=select.value;
    const rows=exhibits.filter(f=>(!year||String(f.date||'').startsWith(year))&&(!query||normalized(`${f.airline} ${f.airline_iata} ${f.flight}`).includes(query))).sort((a,b)=>byDate(b,a));
    if(count)count.textContent=`${rows.length} ${words.filtered}`;
    list.innerHTML=rows.length?rows.map(f=>`<a class="bpm-time-item" href="detail.html?id=${Number(f.id)}"><time>${text(f.date||'—')}</time><img src="${text(f.image||'favicon.png')}" alt="" loading="lazy"><span><strong>${text(f.flight||words.exhibit)}</strong><small>${text(f.airline||'')} · ${text(f.airline_iata||'')}</small></span><small>${text(f.airport||'')}</small><span>${text(words.openArrow)}</span></a>`).join(''):`<p class="bpm-related-empty">${text(words.noHistory)}</p>`;
  }

  function renderRelated() {
    const search=$('#relatedSearch'),airportSelect=$('#relatedAirport'),host=$('#relatedGroups');if(!host)return;
    const airports=[...mapGroups(exhibits,airportKey)].map(([key,items])=>({key,label:items[0].airport||key})).sort((a,b)=>a.label.localeCompare(b.label,'zh-CN'));
    const selected=airportSelect.value;
    airportSelect.innerHTML=`<option value="">${text(words.allAirports)}</option>`+airports.map(a=>`<option value="${text(a.key)}">${text(a.label)}</option>`).join('');
    if(airports.some(a=>a.key===selected))airportSelect.value=selected;
    const query=normalized(search?.value),airport=airportSelect.value;
    const filtered=exhibits.filter(f=>(!query||normalized(f.flight).includes(query))&&(!airport||airportKey(f)===airport));
    const flightGroups=[...mapGroups(filtered,flightKey)].filter(([,items])=>items.length>1).sort((a,b)=>a[0].localeCompare(b[0]));
    const airportGroups=airport?[...mapGroups(filtered,airportKey)].filter(([,items])=>items.length>1):[];
    const sections=[];
    for(const [key,items] of flightGroups) sections.push({title:`${words.sameFlight} · ${items[0].flight||key}`,items});
    for(const [key,items] of airportGroups) sections.push({title:`${words.sameAirport} · ${items[0].airport||key}`,items});
    host.innerHTML=sections.length?sections.map(group=>`<section class="bpm-related-group"><h3>${text(group.title)} <span>${group.items.length} ${text(words.matches)}</span></h3><div class="bpm-related-group-grid">${group.items.sort((a,b)=>byDate(b,a)).map(f=>`<a class="bpm-related-card" href="detail.html?id=${Number(f.id)}"><img src="${text(f.image||'favicon.png')}" alt="" loading="lazy"><div><strong>${text(f.flight||words.exhibit)}</strong><small>${text(f.airline||'')} · ${text(f.date||'')}</small></div></a>`).join('')}</div></section>`).join(''):`<p class="bpm-related-empty">${text(words.noMatches)}</p>`;
  }

  async function init() {
    const metrics=$('#exploreMetrics');
    try {
      const response=await fetch('https://api.bpmuseum.org.cn/api/flights',{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();exhibits=Array.isArray(data)?data:[];
      const airports=mapGroups(exhibits,airportKey).size,operators=mapGroups(exhibits,operatorKey).size;
      if(metrics)metrics.innerHTML=`<span><strong>${exhibits.length}</strong><small>${text(words.items)}</small></span><span><strong>${airports}</strong><small>${text(words.airports)}</small></span><span><strong>${operators}</strong><small>${text(words.operators)}</small></span>`;
      drawAtlas();renderTime();renderRelated();
    } catch(error) {if(metrics)metrics.textContent=words.failed;const stage=$('#atlasStage');if(stage)stage.textContent=words.failed;console.error('Collection atlas failed:',error);}
  }

  document.addEventListener('click',event=>{
    const tab=event.target.closest('[data-explore-tab]');
    if(tab){document.querySelectorAll('[data-explore-tab]').forEach(button=>button.setAttribute('aria-selected',String(button===tab)));document.querySelectorAll('[data-explore-panel]').forEach(panel=>panel.hidden=panel.dataset.explorePanel!==tab.dataset.exploreTab);return;}
    const node=event.target.closest('[data-node-kind]');if(node){showAtlasNode(node.dataset.nodeKind,node.dataset.nodeKey);return;}
    const year=event.target.closest('[data-time-year]');if(year){$('#timeYear').value=year.dataset.timeYear;renderTime();}
  });
  document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-node-kind]')){event.preventDefault();showAtlasNode(event.target.dataset.nodeKind,event.target.dataset.nodeKey);}});
  $('#timeYear')?.addEventListener('change',renderTime);$('#timeSearch')?.addEventListener('input',renderTime);$('#relatedSearch')?.addEventListener('input',renderRelated);$('#relatedAirport')?.addEventListener('change',renderRelated);
  init();
})();
