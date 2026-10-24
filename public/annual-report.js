(() => {
  const API='https://api.bpmuseum.org.cn',yearSelect=document.getElementById('reportYear'),canvas=document.getElementById('annualReportCanvas'),ctx=canvas.getContext('2d'),status=document.getElementById('reportStatus'),download=document.getElementById('downloadReport'),share=document.getElementById('shareReport');
  const now=new Date(),year=Number(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric'}).format(now));
  for(let y=year;y>=Math.max(2000,year-20);y--){const option=document.createElement('option');option.value=String(y);option.textContent=`${y} 年`;yearSelect.append(option);}
  const rounded=(x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
  const text=(value,x,y,size,color='#f3f5f6',weight='400')=>{ctx.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif`;ctx.fillStyle=color;ctx.fillText(String(value||''),x,y);};
  function draw(data){
    const gradient=ctx.createLinearGradient(0,0,1200,1600);gradient.addColorStop(0,'#091b2a');gradient.addColorStop(.58,'#154764');gradient.addColorStop(1,'#87bdd0');ctx.fillStyle=gradient;ctx.fillRect(0,0,1200,1600);
    ctx.fillStyle='#ffffff10';for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(1030-i*42,190+i*30,190-i*10,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#fff';rounded(72,70,1056,1460,38);ctx.fill();ctx.save();ctx.globalAlpha=.07;ctx.fillStyle='#0b3150';for(let x=110;x<1100;x+=58){ctx.fillRect(x,105,1,1410);}ctx.restore();
    const ink='#102c3c',muted='#59717d',blue='#286b8b';
    text('BOARDINGPASSMUSEUM',120,150,24,blue,'700');text('年度旅程报告',120,238,57,ink,'700');text(`${data.year}  ·  把走过的路留作纪念`,120,292,25,muted);
    ctx.strokeStyle='#d9e5e9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(120,330);ctx.lineTo(1080,330);ctx.stroke();
    text(data.username||'旅程收藏者',120,402,30,ink,'600');text('这一年，你把旅程收进了收藏。',120,448,22,muted);
    const cards=[['投稿记录',data.submitted,'件'],['审核通过',data.approved,'件'],['火车票',data.rail_tickets,'张'],['地铁票',data.metro_tickets,'张']];
    cards.forEach((card,i)=>{const x=120+(i%2)*488,y=505+Math.floor(i/2)*208;ctx.fillStyle=i===0?'#e6f1f4':'#f1f5f6';rounded(x,y,448,174,22);ctx.fill();text(card[0],x+28,y+52,22,muted);text(card[1],x+28,y+126,52,ink,'700');text(card[2],x+140,y+124,20,muted);});
    text('年度印记',120,1008,24,blue,'700');text(data.top_airline?`最常记录的承运方：${data.top_airline}  ·  ${data.top_airline_count} 件`:'继续收藏下一段旅程',120,1062,24,ink,'600');
    if(data.first_trip){const trip=data.first_trip;text('记得最早的一段',120,1150,21,muted);text(`${trip.airport||'出发地'}${trip.route?` → ${trip.route}`:''}`,120,1204,30,ink,'600');text(`${trip.flight||''}   ${trip.date||''}`,120,1248,20,muted);}
    text('记录过的出发地',120,1340,21,muted);const airportLine=data.airports?.length?data.airports.slice(0,5).join('   ·   '):'新的旅程，等你来记录';text(airportLine,120,1388,21,ink,'600');
    ctx.strokeStyle='#d9e5e9';ctx.beginPath();ctx.moveTo(120,1432);ctx.lineTo(1080,1432);ctx.stroke();text('收藏每一次出发，保存每一段旅程。',120,1478,18,muted);
    download.disabled=false;share.disabled=false;
  }
  async function load(){status.textContent='正在整理这一年的记录…';download.disabled=true;share.disabled=true;try{const response=await fetch(`${API}/api/my/annual-report?year=${encodeURIComponent(yearSelect.value)}`,{credentials:'include',cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'报告生成失败');draw(data);status.textContent='报告已生成。未公开的稿件只计入个人统计，不会显示具体信息。';}catch(error){status.textContent=window.bpmFriendlyError?.(error.message)||error.message||'报告生成失败，请重新登录后再试。';}}
  document.getElementById('loadReport').addEventListener('click',load);
  download.addEventListener('click',()=>{canvas.toBlob(blob=>{if(!blob)return;const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`BoardingPassMuseum-${yearSelect.value}-旅程报告.png`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);},'image/png');});
  share.addEventListener('click',async()=>{canvas.toBlob(async blob=>{if(!blob)return;const file=new File([blob],`BoardingPassMuseum-${yearSelect.value}-旅程报告.png`,{type:'image/png'});try{if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:`${yearSelect.value} 年度旅程报告`});else{download.click();status.textContent='当前浏览器不支持直接分享，已开始导出图片。';}}catch(error){if(error.name!=='AbortError')status.textContent='分享失败，可使用“导出图片”保存后手动分享。';}},'image/png');});
  if(!localStorage.getItem('currentUser'))status.textContent='请先登录后查看自己的年度旅程。';else load();
})();
