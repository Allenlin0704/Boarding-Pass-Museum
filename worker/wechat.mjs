const sha1=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',new TextEncoder().encode(value))),byte=>byte.toString(16).padStart(2,'0')).join('');
const escapeXml=value=>String(value??'').replace(/[<>&]/g,char=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[char]));
const tag=(xml,name)=>{const matched=xml.match(new RegExp(`<${name}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${name}>`))||xml.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`));return matched?matched[1].trim():'';};
const textReply=(to,from,content)=>new Response(`<xml><ToUserName><![CDATA[${escapeXml(to)}]]></ToUserName><FromUserName><![CDATA[${escapeXml(from)}]]></FromUserName><CreateTime>${Math.floor(Date.now()/1000)}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[${escapeXml(content)}]]></Content></xml>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
const help=`欢迎使用 BoardingPassMuseum 查询助手 ✈️\n\n可回复：\n查询 123\n航班 MU5309\n航司 中国东方航空\n\n网站：https://bpmuseum.org.cn`;
const wildcard=value=>`%${String(value).replace(/[\\%_]/g,'\\$&')}%`;
const lines=rows=>rows.length?rows.map(row=>`#${row.id} ${row.airline||''} ${row.flight||''}\n${row.route||row.airport||'航空收藏'}\nhttps://bpmuseum.org.cn/detail.html?id=${row.id}`).join('\n\n'):'没有找到已公开的展品。可尝试“查询 展品编号”“航班 MU5309”或“航司 航空公司名称”。';
export async function wechatRoute(request,env,url){
  if(url.pathname!=='/wechat')return null;
  const token=env.WECHAT_TOKEN;if(!token)return new Response('WeChat reply is not configured',{status:503});
  const signature=url.searchParams.get('signature')||'',timestamp=url.searchParams.get('timestamp')||'',nonce=url.searchParams.get('nonce')||'';
  if(!/^[a-f0-9]{40}$/i.test(signature)||!/^\d{1,12}$/.test(timestamp)||nonce.length>128||await sha1([token,timestamp,nonce].sort().join(''))!==signature)return new Response('invalid signature',{status:403});
  if(request.method==='GET')return new Response(url.searchParams.get('echostr')||'',{headers:{'Content-Type':'text/plain; charset=utf-8'}});
  if(request.method!=='POST')return new Response('method not allowed',{status:405});
  const xml=await request.text();if(xml.length>32*1024)return new Response('request too large',{status:413});
  const to=tag(xml,'ToUserName'),from=tag(xml,'FromUserName'),kind=tag(xml,'MsgType'),content=tag(xml,'Content').replace(/\s+/g,' ').trim();
  if(!to||!from||kind!=='text')return textReply(from,to,'请发送文字消息。'+help);
  let result;const id=content.match(/^(?:查询\s*)?(\d{1,12})$/),flight=content.match(/^(?:航班\s*)?([a-z]{2}\d{1,4})$/i),airline=content.match(/^航司\s+(.{1,80})$/);
  if(/^(帮助|help|菜单)$/i.test(content))result=help;
  else if(/^(网站|官网)$/i.test(content))result='BoardingPassMuseum 线上展厅：\nhttps://bpmuseum.org.cn';
  else if(/^(投稿)$/i.test(content))result='投稿入口：\nhttps://bpmuseum.org.cn/submit.html\n\n请先遮挡姓名、票号、二维码和条形码等隐私信息。';
  else if(id){const row=await env.DB.prepare("SELECT id,airline,flight,route,airport FROM flights WHERE id=? AND status='approved'").bind(Number(id[1])).first();result=lines(row?[row]:[]);}
  else if(flight){const rows=await env.DB.prepare("SELECT id,airline,flight,route,airport FROM flights WHERE status='approved' AND upper(flight)=? ORDER BY id DESC LIMIT 5").bind(flight[1].toUpperCase()).all();result=lines(rows.results);}
  else if(airline){const rows=await env.DB.prepare("SELECT id,airline,flight,route,airport FROM flights WHERE status='approved' AND airline LIKE ? ESCAPE '\\' ORDER BY id DESC LIMIT 5").bind(wildcard(airline[1])).all();result=lines(rows.results);}
  else result='没有识别到查询格式。\n\n'+help;
  return textReply(from,to,result);
}
