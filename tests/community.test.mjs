import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';
function seed(db){db.exec("INSERT INTO community_posts(id,user_id,title,content) VALUES(1,3,'Aviation','flight'),(2,3,'Second','flight'),(3,3,'Third','flight');");}
test('community consent, duplicate posting and hidden content privacy',async()=>{
  const {call,db}=fixture();seed(db);
  assert.equal((await call('/api/community/posts',{title:'Plane',content:'Plane'},3)).status,400);
  const body={title:'Plane',content:'Plane',rules_version:'2026-09-06'};
  assert.equal((await call('/api/community/posts',body,3)).status,429); // Existing three posts within the minute.
  db.exec("UPDATE community_posts SET created_at=datetime('now','-1 hour')");
  for(let i=0;i<2;i++)assert.equal((await call('/api/community/posts',body,3)).status,200);
  assert.equal((await call('/api/community/posts',body,3)).status,429);
  assert.equal((await call('/api/admin/community/hide',{target_type:'post',target_id:1,reason:'spam',clause:'社区三、2（4）'},2)).status,200);
  assert.equal((await call('/api/community/comments',{post_id:1,content:'hidden reply'},3)).status,404);
  const visible=await (await call('/api/community/user-posts?id=3&viewer_id=3',undefined,2)).json();assert.ok(!visible.posts.some(p=>p.id===1));
  const own=await (await call('/api/community/user-posts?id=3',undefined,3)).json();assert.ok(own.posts.some(p=>p.id===1));
});
test('three warnings suspend posting; repeat handling does not add punishment',async()=>{
  const {call,db}=fixture();seed(db);
  for(const id of [1,2,3])assert.equal((await call('/api/sa/community/moderate',{target_type:'post',target_id:id,severity:'moderate',reason:'spam',clause:'社区三、2（4）'},1)).status,200);
  assert.equal(db.prepare('SELECT warning_count FROM users WHERE id=3').get().warning_count,3);
  assert.ok(db.prepare('SELECT posting_until FROM users WHERE id=3').get().posting_until);
  assert.equal((await call('/api/sa/community/moderate',{target_type:'post',target_id:1,severity:'moderate',reason:'spam',clause:'test'},1)).status,409);
  assert.equal((await call('/api/community/posts',{title:'test',content:'test',rules_version:'2026-09-06'},3)).status,403);
});
test('malicious reports require SA determination and suspend reporting on third',async()=>{
  const {call,db}=fixture();seed(db);
  for(const id of [1,2,3]) {
    assert.equal((await call('/api/community/report',{target_type:'post',target_id:id,category:'虚假误导',reason:'test'},2)).status,200);
    assert.equal((await call('/api/sa/community/reports/resolve',{report_id:id,decision:'malicious',reason:'查实故意诬陷'},1)).status,200);
  }
  assert.ok(db.prepare('SELECT reporting_until FROM users WHERE id=2').get().reporting_until);
  assert.equal((await call('/api/community/report',{target_type:'post',target_id:1,category:'虚假误导',reason:'again'},2)).status,403);
});
test('banned author can appeal; SA approval restores access and publication',async()=>{
  const {call,db}=fixture();seed(db);
  assert.equal((await call('/api/sa/community/moderate',{target_type:'post',target_id:1,severity:'heavy',days:7,reason:'test',clause:'社区三、5（3）'},1)).status,200);
  assert.equal((await call('/api/community/comments',{post_id:2,content:'test'},3)).status,403);
  assert.equal((await call('/api/notifications',undefined,3)).status,200);
  assert.equal((await call('/api/community/moderation-appeal',{action_id:1,reason:'提出复核'},3)).status,200);
  assert.equal((await call('/api/sa/community/appeals/resolve',{appeal_id:1,status:'approved',decision:'撤销误判'},1)).status,200);
  assert.equal(db.prepare('SELECT banned_until FROM users WHERE id=3').get().banned_until,null);
  assert.equal(db.prepare('SELECT status FROM community_posts WHERE id=1').get().status,'visible');
});
