(() => {
  const lang=()=>window.BPM_LANGUAGE||'zh-CN';
  const t={
    'zh-CN':{button:'生成分享卡',title:'分享这件展品',note:'已授权公开的展品信息会用于生成分享卡。卡片不包含原始票面照片。',download:'下载 PNG',share:'分享…',copy:'复制展品链接',close:'关闭',collection:'登机牌博物馆 · 旅程收藏',date:'日期',departure:'出发地点',rail:'铁路旅程',metro:'地铁旅程',air:'航空旅程',copied:'展品链接已复制',copyFail:'复制失败，请手动复制链接。',noConsent:'这件展品没有开启社交媒体分享授权。',shareText:'在 BoardingPassMuseum 发现一段旅程。'},
    'zh-TW':{button:'製作分享卡',title:'分享這件展品',note:'已授權公開的展品資訊會用於製作分享卡。卡片不含原始票面照片。',download:'下載 PNG',share:'分享…',copy:'複製展品連結',close:'關閉',collection:'登機牌博物館 · 旅程收藏',date:'日期',departure:'出發地點',rail:'鐵路旅程',metro:'地鐵旅程',air:'航空旅程',copied:'展品連結已複製',copyFail:'複製失敗，請手動複製連結。',noConsent:'此展品未開啟社群媒體分享授權。',shareText:'在 BoardingPassMuseum 發現一段旅程。'},
    en:{button:'Create share card',title:'Share this exhibit',note:'This card uses only exhibit details approved for social sharing. It does not include the original ticket image.',download:'Download PNG',share:'Share…',copy:'Copy exhibit link',close:'Close',collection:'BOARDING PASS MUSEUM · JOURNEY COLLECTION',date:'DATE',departure:'DEPARTURE',rail:'RAIL JOURNEY',metro:'METRO JOURNEY',air:'AIR JOURNEY',copied:'Exhibit link copied',copyFail:'Could not copy. Copy the link manually.',noConsent:'Social sharing is not enabled for this exhibit.',shareText:'Discover a journey at BoardingPassMuseum.'}
  };
  const words=()=>t[lang()]||t['zh-CN'];
  let dialog,canvas,activeFlight;
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function ensureDialog(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.className='bpm-share-dialog';dialog.innerHTML=`<form method="dialog" class="bpm-share-dialog-head"><div><span class="bpm-share-kicker">BOARDINGPASSMUSEUM</span><h2 data-share-title></h2></div><button type="submit" aria-label="close" data-share-close>×</button></form><p class="bpm-share-note" data-share-note></p><div class="bpm-share-preview"><canvas width="1080" height="1350" aria-label="share card preview"></canvas></div><div class="bpm-share-actions"><button type="button" data-share-native></button><button type="button" data-share-download></button><button type="button" data-share-copy></button></div><p class="bpm-share-status" role="status" aria-live="polite"></p>`;
    document.body.append(dialog);canvas=dialog.querySelector('canvas');
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.querySelector('[data-share-download]').addEventListener('click',downloadCard);
    dialog.querySelector('[data-share-native]').addEventListener('click',shareCard);
    dialog.querySelector('[data-share-copy]').addEventListener('click',copyLink);
  }
  function rounded(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect){ctx.roundRect(x,y,w,h,r);return;}ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function draw(f){
    const c=canvas,ctx=c.getContext('2d'),w=c.width,h=c.height,word=words();
    const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#071e35');gradient.addColorStop(.58,'#0c3b5b');gradient.addColorStop(1,'#17628a');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.strokeStyle='#b9e9ff18';ctx.lineWidth=2;for(let r=170;r<620;r+=90){ctx.beginPath();ctx.arc(970,160,r,0,Math.PI*2);ctx.stroke();}ctx.restore();
    ctx.fillStyle='#9bd5f3';ctx.font='600 25px system-ui,-apple-system,sans-serif';ctx.fillText(word.collection,76,105);
    ctx.fillStyle='#ffffff';ctx.font='700 23px system-ui,-apple-system,sans-serif';ctx.fillText(f.submission_type==='rail_ticket'?word.rail:f.submission_type==='metro_ticket'?word.metro:word.air,80,250);
    ctx.font='700 90px system-ui,-apple-system,sans-serif';const flight=String(f.flight||`#${f.id||''}`);ctx.fillText(flight.slice(0,18),75,374,925);
    ctx.fillStyle='#d5e9f4';ctx.font='500 36px system-ui,-apple-system,sans-serif';ctx.fillText(String(f.airline||'').slice(0,40),80,440,900);
    rounded(ctx,68,520,944,520,34);ctx.fillStyle='#f6f8fa';ctx.fill();ctx.save();ctx.clip();
    ctx.fillStyle='#0d3552';ctx.font='700 19px system-ui,-apple-system,sans-serif';ctx.fillText(word.date,112,595);ctx.fillText(word.departure,112,778);
    ctx.font='600 51px system-ui,-apple-system,sans-serif';ctx.fillText(String(f.date||'—'),112,675,840);ctx.fillText(String(f.airport||'—').slice(0,45),112,865,840);
    ctx.strokeStyle='#a7b9c5';ctx.setLineDash([8,10]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(112,930);ctx.lineTo(968,930);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#526b7c';ctx.font='500 24px system-ui,-apple-system,sans-serif';ctx.fillText(`EXHIBIT  #${Number(f.id)||''}`,112,990);ctx.restore();
    ctx.fillStyle='#d4e6f0';ctx.font='500 24px system-ui,-apple-system,sans-serif';ctx.fillText('BoardingPassMuseum',80,1180);ctx.fillStyle='#9bc5de';ctx.font='400 21px system-ui,-apple-system,sans-serif';ctx.fillText('bpmuseum.org.cn',80,1222);
    ctx.fillStyle='#e6f5ff';ctx.font='500 17px system-ui,-apple-system,sans-serif';ctx.fillText('COLLECTED JOURNEYS · PRESERVED WITH CARE',80,1290);
  }
  function setText(){const word=words();dialog.querySelector('[data-share-title]').textContent=word.title;dialog.querySelector('[data-share-note]').textContent=word.note;dialog.querySelector('[data-share-native]').textContent=word.share;dialog.querySelector('[data-share-download]').textContent=word.download;dialog.querySelector('[data-share-copy]').textContent=word.copy;dialog.querySelector('[data-share-close]').setAttribute('aria-label',word.close);}
  function open(flight){
    if(!flight||Number(flight.social_share_consent)!==1){window.alert(words().noConsent);return;}
    activeFlight=flight;ensureDialog();setText();draw(flight);dialog.querySelector('.bpm-share-status').textContent='';
    const share=dialog.querySelector('[data-share-native]');share.hidden=!(navigator.share&&typeof File==='function');
    dialog.showModal();
  }
  function filename(){return `BoardingPassMuseum-exhibit-${Number(activeFlight?.id)||'share'}.png`;}
  function canvasBlob(){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG export failed')),'image/png'));}
  async function downloadCard(){try{const blob=await canvasBlob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename();a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch{dialog.querySelector('.bpm-share-status').textContent='PNG 生成失败，请重试。';}}
  async function shareCard(){try{const blob=await canvasBlob(),file=new File([blob],filename(),{type:'image/png'}),payload={files:[file],title:words().title,text:words().shareText,url:`${location.origin}/detail.html?id=${Number(activeFlight.id)}`};if(!navigator.canShare?.({files:[file]})){await downloadCard();return;}await navigator.share(payload);}catch(error){if(error.name!=='AbortError')await downloadCard();}}
  async function copyLink(){try{await navigator.clipboard.writeText(`${location.origin}/detail.html?id=${Number(activeFlight.id)}`);dialog.querySelector('.bpm-share-status').textContent=words().copied;}catch{dialog.querySelector('.bpm-share-status').textContent=words().copyFail;}}
  window.BPMShareCard={open};
  document.addEventListener('click',event=>{const button=event.target.closest('[data-share-flight]');if(!button)return;event.preventDefault();event.stopPropagation();const flight=window.BPM_EXHIBITS?.find(item=>Number(item.id)===Number(button.dataset.shareFlight));if(flight)open(flight);},true);
})();
