import { IMAGE_UPLOAD_MAX_BYTES, IMAGE_UPLOAD_MAX_EDGE, reply, imageDimensions, webpDimensions } from './security.mjs';
import { aiProviderConfigured, aiProviderForRequest, aiText, aiFailureStatus, runAI } from './ai-provider.mjs';

const clean=(value,max=120)=>typeof value==='string'?value.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,max):'';
const code=value=>clean(value,8).toUpperCase().replace(/[^A-Z0-9]/g,'');

async function dailyLimit(env,userId){
  const chinaNow=Date.now()+8*60*60*1000;
  const bucket=Math.floor(chinaNow/86400000)*86400-8*3600;
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`ai-recognition:${userId}`))),byte=>byte.toString(16).padStart(2,'0')).join('');
  const row=await env.DB.prepare(`INSERT INTO auth_limits(key,bucket,count) VALUES(?,?,1)
    ON CONFLICT(key,bucket) DO UPDATE SET count=count+1 RETURNING count`).bind(hash,bucket).first();
  return Number(row?.count||0)>6;
}

function normalizedFields(value){
  const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const flightDate=clean(source.flight_date,10);
  return {
    airline_name:clean(source.airline_name),
    airline_iata:code(source.airline_iata),
    airline_icao:code(source.airline_icao),
    flight_number:clean(source.flight_number,16).toUpperCase().replace(/[^A-Z0-9 -]/g,''),
    flight_date:/^\d{4}-\d{2}-\d{2}$/.test(flightDate)&&Number.isFinite(Date.parse(`${flightDate}T00:00:00Z`))&&new Date(`${flightDate}T00:00:00Z`).toISOString().slice(0,10)===flightDate?flightDate:'',
    departure_airport_name:clean(source.departure_airport_name),
    departure_airport_iata:code(source.departure_airport_iata),
    departure_airport_icao:code(source.departure_airport_icao),
    issue_airport_name:clean(source.issue_airport_name),
    issue_airport_iata:code(source.issue_airport_iata),
    issue_airport_icao:code(source.issue_airport_icao),
    route_scope:['domestic','international','regional'].includes(source.route_scope)?source.route_scope:''
  };
}

export async function flightAssistRoute(request,env,url,user,trustedCountry){
  if(url.pathname==='/api/ai/provider'&&request.method==='GET'){
    const provider=aiProviderForRequest(request,trustedCountry);
    return reply({provider:provider.id,name:provider.name,country:provider.country,available:aiProviderConfigured(provider,env)});
  }
  if(url.pathname!=='/api/flight-assist/recognize'||request.method!=='POST')return null;
  if(!user?.id)return reply({error:'请重新登录'},401);
  const provider=aiProviderForRequest(request,trustedCountry);
  if(!aiProviderConfigured(provider,env))return reply({error:`${provider.name}识别服务尚未配置，请稍后再试`},503);
  let form;
  try{form=await request.formData();}catch{return reply({error:'图片请求格式无效'},400);}
  if(form.get('consent')!=='1')return reply({error:`请先确认图片已遮挡隐私，并同意发送给${provider.name}`},400);
  const image=form.get('image');
  if(!image||typeof image.arrayBuffer!=='function'||image.size<1||image.size>IMAGE_UPLOAD_MAX_BYTES)return reply({error:'图片须为 1280px 以内、1 MB 以下的 WebP 或 JPEG'},400);
  const bytes=new Uint8Array(await image.arrayBuffer());
  const dimensions=imageDimensions(bytes);
  if(!dimensions)return reply({error:'识别仅接受有效的 WebP 或 JPEG 图片'},415);
  if(Math.max(dimensions.width,dimensions.height)>IMAGE_UPLOAD_MAX_EDGE)return reply({error:'识别图片最长边不得超过 1280 像素'},400);
  if(await dailyLimit(env,user.id))return reply({error:'今天的 AI 识别次数已用完（每日最多 6 次）'},429);
  let binary='';
  for(let offset=0;offset<bytes.length;offset+=0x8000)binary+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000));
  const base64=btoa(binary);
  const prompt='读取这张已由用户裁剪、旋转、遮挡并压缩的登机牌。只识别填写表单所需的航司名称及 IATA/ICAO 代码、航班号、航班日期（统一 YYYY-MM-DD）、出发机场名称及 IATA/ICAO 代码、打印机场名称及代码、航线范围（domestic/international/regional）。看不清或不能确定时返回空字符串，严禁猜测。不要输出、转录或解释乘客姓名、票号、订单号、PNR、会员号、二维码、条形码或其他个人信息。只返回 JSON 对象，字段为 airline_name, airline_iata, airline_icao, flight_number, flight_date, departure_airport_name, departure_airport_iata, departure_airport_icao, issue_airport_name, issue_airport_iata, issue_airport_icao, route_scope。';
  let result;
  try{
    const imageType=webpDimensions(bytes)?'image/webp':'image/jpeg';
    result=await runAI(env,{temperature:0,max_tokens:450,chat_template_kwargs:{enable_thinking:false},messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:`data:${imageType};base64,${base64}`,detail:'high'}}]}]});
  }catch(error){const status=aiFailureStatus(error);console.error('Cloudflare Workers AI recognition failed',{name:String(error?.name||'Error'),status});return reply({error:status===429?'Cloudflare AI 今日免费额度已用完或服务暂时繁忙，请稍后再试；也可以手动填写':'AI 识别暂时不可用，请手动填写'},status);}
  const content=aiText(result);
  if(typeof content!=='string'||content.length>5000)return reply({error:'AI 未能读取票面，请手动填写'},502);
  let parsed;
  try{parsed=JSON.parse(content);}catch{return reply({error:'AI 返回结果格式无效，请手动填写'},502);}
  return reply({success:true,provider:provider.id,fields:normalizedFields(parsed)});
}
