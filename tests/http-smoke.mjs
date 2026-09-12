import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base='http://localhost:8789';
const credentials=JSON.parse(readFileSync('/private/tmp/bpm-local-credentials.json','utf8'));
async function call(path,body,cookie){const res=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return {res,data:await res.json()};}
async function login(email){const {res}=await call('/api/login',{email,password:credentials.password});assert.equal(res.status,200);return res.headers.get('set-cookie').split(';')[0];}
const user=await login(credentials.email),sa=await login('local-sa@example.test'),admin=await login('local-admin@example.test');
await call('/api/my/withdraw',{user_id:3,flight_id:2},user);
assert.equal((await call('/api/my/restore',{user_id:3,flight_id:2},admin)).res.status,403);
assert.equal((await call('/api/my/restore',{user_id:3,flight_id:2},user)).res.status,200);
assert.equal((await call('/api/admin/approve',{admin_id:1,flight_id:3},sa)).res.status,200);
assert.equal((await call('/api/admin/reject',{admin_id:1,flight_id:3,reason:'【隐私守护规范】测试审核'},sa)).res.status,200);
assert.equal((await call('/api/admin/approve',{admin_id:1,flight_id:3},sa)).res.status,200);
assert.equal((await call('/api/account/progress?id=1')).data.level,99);
const post=await call('/api/community/posts',{title:'本地验收 '+Date.now(),content:'航空社区功能验收',rules_version:'2026-09-06'},user);assert.equal(post.res.status,200);
const postId=post.data.id;
assert.equal((await call('/api/admin/community/hide',{target_type:'post',target_id:postId,clause:'社区条例三、2（4）',reason:'本地验收'},admin)).res.status,200);
assert.equal((await call('/api/community/posts/'+postId)).res.status,404);
assert.equal((await call('/api/community/posts/'+postId,undefined,user)).res.status,200);
assert.equal((await call('/api/sa/community/posts/status',{post_id:postId,status:'visible'},sa)).res.status,200);
assert.equal((await call('/api/community/posts/'+postId)).res.status,200);
for(const cookie of [user,sa,admin])assert.equal((await call('/api/logout',{},cookie)).res.status,200);
console.log('Local HTTP smoke: login, ownership, SA self-review, restore, progress, moderation, logout passed.');
