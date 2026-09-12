import airports from './airports.json' with {type:'json'};
import { isSA,isAdmin,reply } from './security.mjs';
export const achievementNames={star:'新星',resilient:'百折不挠',fifteen:'再接再厉',thirty:'高处不胜寒',fifty:'云端常客',streak:'连击之王',admin:'中流砥柱',review50:'为站发电',review100:'审核圣手',night:'深夜加班',world:'寰宇行者',gateways:'国门常客',big3:'三航元勋',vintage:'真古收藏',polar:'极地探险家',continents:'洲际飞人',airport5:'时光荏苒',complete:'大满贯'};
const airportIndex=new Map();
for(const row of airports) for(const key of [row[0],row[1],row[4],row[5]]) if(key) airportIndex.set(key.toUpperCase(),row);
function airportData(value) {
  const text=String(value||'').trim().toUpperCase();
  return airportIndex.get(text)||airportIndex.get(text.match(/\(([A-Z]{3,4})\)/)?.[1]);
}
const bj = value => new Date(new Date(String(value).includes('T')?value:String(value).replace(' ','T')+'Z').getTime()+8*3600000);
export function levelScore(approvals,adjustments=[],now=new Date()) {
  const year=bj(now.toISOString()).getUTCFullYear();
  const events=[...approvals.map(a=>({at:a.approved_at,amount:1})),...adjustments.map(a=>({at:a.created_at,amount:a.amount}))].sort((a,b)=>a.at.localeCompare(b.at));
  let score=0, previous=events.length?bj(events[0].at).getUTCFullYear():year;
  for(const event of events) {
    const eventYear=bj(event.at).getUTCFullYear();if(eventYear>year) continue;
    while(previous<eventYear){score=score>50?50:0;previous++;}
    score=Math.max(0,score+event.amount);
  }
  while(previous<year){score=score>50?50:0;previous++;}
  return score;
}
export function levelInfo(user,total,score,reviews) {
  if(isSA(user)) return {level:99,next:null,progress:100,priority:1};
  const admin=isAdmin(user),thresholds=admin?[0,2,5,10,20,30,40,50,100]:[0,0,2,5,10,20,40,60,80,100];
  const count=admin?reviews:score;let index=admin?0:total>0?1:0;
  for(let i=admin?1:2;i<thresholds.length;i++) if(count>=thresholds[i]) index=i;
  const next=index+1<thresholds.length?thresholds[index+1]:null;
  return {level:admin?90+index:index,next,progress:next===null?100:Math.min(100,Math.floor(count/Math.max(1,next)*100)),priority:admin?Number(index>=6):Number(index>=5)};
}
export function calculateAchievements(approved,reviews,submissions,member) {
  const earned=new Set(),total=approved.length;
  for(const [n,code] of [[1,'star'],[15,'fifteen'],[30,'thirty'],[50,'fifty']]) if(total>=n) earned.add(code);
  const reviewed=new Set(reviews.map(r=>r.flight_id)).size;
  if(member) earned.add('admin');
  if(member&&reviewed>=50) earned.add('review50');if(member&&reviewed>=100) earned.add('review100');
  if(member&&reviews.some(r=>!r.historical&&bj(r.created_at).getUTCHours()<6)) earned.add('night');
  const first=approved.filter(a=>!a.historical).sort((a,b)=>a.approved_at.localeCompare(b.approved_at))[0];
  if(first && !approved.some(a=>a.historical) && new Set(submissions.filter(r=>r.status==='rejected'&&r.created_at<first.approved_at).map(r=>r.flight_id)).size>=3) earned.add('resilient');
  const countries=new Set(),continents=new Set(),codes=new Set(),airlineCodes=new Set(),counts=new Map();let foreign=0;
  for(const a of approved) {
    const airport=airportData(a.airport);
    if(airport) {
      const [iata,icao,country,continent]=airport;codes.add(iata);countries.add(country);if(continent) continents.add(continent);
      if(country&&country!=='CN') foreign++;
      const key=iata||icao;counts.set(key,(counts.get(key)||0)+1);
    }
    const airline=String(a.airline||'');
    if(/\bCA\b|中国国际|Air China/i.test(airline)) airlineCodes.add('CA');
    if(/\bMU\b|中国东方|China Eastern/i.test(airline)) airlineCodes.add('MU');
    if(/\bCZ\b|中国南方|China Southern/i.test(airline)) airlineCodes.add('CZ');
    const date=new Date(a.flight_date),submitted=new Date(a.submitted_at+'Z');
    if(Number.isFinite(date.getTime())&&Number.isFinite(submitted.getTime())) {
      date.setUTCFullYear(date.getUTCFullYear()+10);if(submitted>=date) earned.add('vintage');
    }
  }
  if(foreign>5||['US','GB','CA','AU','NZ'].every(c=>countries.has(c))) earned.add('world');
  if(['PEK','PVG','CAN'].every(c=>codes.has(c))) earned.add('gateways');
  if(airlineCodes.size===3) earned.add('big3');
  if(['US','CA','RU','NO','SE','FI','IS','DK','GL'].some(c=>countries.has(c))) earned.add('polar');
  if(continents.size>=3) earned.add('continents');if([...counts.values()].some(n=>n>=5)) earned.add('airport5');
  // Six complete consecutive Beijing calendar months; >=3 submissions each, none ever rejected.
  const months=new Map();
  for(const f of submissions.filter(f=>f.kind==='submission')) {const d=bj(f.created_at),key=d.getUTCFullYear()*12+d.getUTCMonth();months.set(key,(months.get(key)||0)+1);}
  const rejectedMonths=new Set(submissions.filter(f=>f.status==='rejected').map(f=>{const d=bj(f.submitted_at||f.created_at);return d.getUTCFullYear()*12+d.getUTCMonth();}));
  const now=bj(new Date().toISOString()),current=now.getUTCFullYear()*12+now.getUTCMonth();
  for(const start of months.keys()) if(start+5<current&&Array.from({length:6},(_,i)=>start+i).every(m=>(months.get(m)||0)>=3&&!rejectedMonths.has(m))) earned.add('streak');
  return earned;
}
export async function progressFor(env,user) {
  const [approved,reviews,allReviews,flights,adjustments,saved,member]=await Promise.all([
    env.DB.prepare('SELECT * FROM flight_approvals WHERE user_id=?').bind(user.id).all(),
    env.DB.prepare('SELECT * FROM flight_reviews WHERE reviewer_id=?').bind(user.id).all(),
    env.DB.prepare('SELECT r.*,f.submitted_at FROM flight_reviews r LEFT JOIN flight_submissions f ON f.flight_id=r.flight_id WHERE r.user_id=?').bind(user.id).all(),
    env.DB.prepare('SELECT flight_id,submitted_at AS created_at FROM flight_submissions WHERE user_id=?').bind(user.id).all(),
    env.DB.prepare('SELECT * FROM level_adjustments WHERE user_id=?').bind(user.id).all(),
    env.DB.prepare('SELECT code,awarded_at FROM user_achievements WHERE user_id=?').bind(user.id).all(),
    env.DB.prepare('SELECT user_id FROM admin_memberships WHERE user_id=?').bind(user.id).first()
  ]);
  const reviewCount=new Set(reviews.results.map(r=>r.flight_id)).size;
  const score=user.permanent_ban?0:levelScore(approved.results,adjustments.results);
  const info=user.permanent_ban?{level:0,next:null,progress:0,priority:0}:levelInfo(user,flights.results.length,score,reviewCount);
  if(!user.permanent_ban) {
    const earned=calculateAchievements(approved.results,reviews.results,[...allReviews.results,...flights.results.map(f=>({...f,kind:'submission'}))],!!member||isAdmin(user));
    for(const entry of saved.results) earned.add(entry.code);
    if(Object.keys(achievementNames).filter(k=>k!=='complete').every(k=>earned.has(k))) earned.add('complete');
    const added=[...earned].filter(code=>!saved.results.some(a=>a.code===code));
    if(added.length) {await env.DB.batch(added.map(code=>env.DB.prepare('INSERT OR IGNORE INTO user_achievements(user_id,code) VALUES(?,?)').bind(user.id,code)));for(const code of added) saved.results.push({code,awarded_at:new Date().toISOString()});}
  }
  await env.DB.prepare(`INSERT INTO progress_cache(user_id,level,priority,year) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET level=excluded.level,priority=excluded.priority,year=excluded.year`).bind(user.id,info.level,info.priority,bj(new Date().toISOString()).getUTCFullYear()).run();
  return {...info,level_count:score,total_submissions:flights.results.length,lifetime_approved:approved.results.length,review_count:isAdmin(user)?reviewCount:null,achievements:user.permanent_ban?[]:saved.results.map(a=>({...a,name:achievementNames[a.code]})),historical_note:approved.results.some(a=>a.historical)?'旧稿无审核时间，首次过审时间按投稿时间迁移；无法还原的历史成就不自动授予。':null};
}
export async function progressRoute(request,env,url) {
  if(request.method==='GET'&&url.pathname==='/api/account/progress') {
    const user=await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(Number(url.searchParams.get('id'))).first();
    return user?reply(await progressFor(env,user)):reply({error:'用户不存在'},404);
  }
  return null;
}
