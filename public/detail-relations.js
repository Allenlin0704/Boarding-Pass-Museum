(() => {
  const lang=()=>window.BPM_LANGUAGE||'zh-CN';
  const labels={en:{related:'Related exhibits',sameFlight:'Same flight number',sameAirport:'Same departure point',notFound:'No other public exhibits share this flight or departure point yet. New submissions may connect here later.',loading:'Finding exhibits with this flight or departure point…',failed:'Could not load related exhibits. Please try again.'},'zh-TW':{related:'相關展品',sameFlight:'相同航班號',sameAirport:'相同出發地點',notFound:'目前沒有其他公開展品使用此航班號或出發地點；日後新增收藏可能在此相遇。',loading:'正在尋找相同航班號或出發地點的收藏…',failed:'暫時無法載入相關展品，請稍後再試。'},'zh-CN':{related:'相关展品',sameFlight:'同航班号',sameAirport:'同出发地点',notFound:'目前还没有同航班号或同出发地点的其他公开展品；新收藏加入后会在这里相遇。',loading:'正在寻找相同航班号或出发地点的收藏…',failed:'暂时无法加载相关展品，请稍后再试。'}};
  const host=()=>document.getElementById('relatedExhibits');
  const normal=value=>String(value||'').normalize('NFKC').trim().toLocaleLowerCase('en').replace(/[\s\p{P}\p{S}]/gu,'');
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  window.BPMRelatedExhibits={async render(current){
    const box=host();if(!box)return;
    try{
      const response=await fetch('https://api.bpmuseum.org.cn/api/flights',{cache:'no-store'});if(!response.ok)throw Error('related exhibits unavailable');
      const rows=await response.json(),others=Array.isArray(rows)?rows.filter(row=>Number(row.id)!==Number(current.id)):[];
      const flight=normal(current.flight),airport=String(current.airport_iata||current.airport_icao||normal(current.airport)).toUpperCase();
      const sameFlight=others.filter(row=>flight&&normal(row.flight)===flight).slice(0,8);
      const sameAirport=others.filter(row=>airport&&String(row.airport_iata||row.airport_icao||normal(row.airport)).toUpperCase()===airport).slice(0,8);
      const word=labels[lang()]||labels['zh-CN'];
      const group=(title,items)=>items.length?`<section><h3>${title}<span>${items.length}</span></h3><div class="bpm-related-exhibits-grid">${items.map(row=>`<a href="detail.html?id=${Number(row.id)}"><img src="${esc(row.image||'favicon.png')}" alt="" loading="lazy"><span><strong>${esc(row.flight||word.related)}</strong><small>${esc(row.airline||'')} · ${esc(row.date||'')}</small></span></a>`).join('')}</div></section>`:'';
      const content=group(word.sameFlight,sameFlight)+group(word.sameAirport,sameAirport);
      box.innerHTML=`<h2>${word.related}</h2>${content||`<p>${word.notFound}</p>`}`;box.setAttribute('aria-busy','false');
    }catch{box.innerHTML=`<h2>${(labels[lang()]||labels['zh-CN']).related}</h2><p>${(labels[lang()]||labels['zh-CN']).failed}</p>`;box.setAttribute('aria-busy','false');}
  }};
})();
