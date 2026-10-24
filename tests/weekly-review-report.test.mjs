import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('Friday UTC cron writes one weekly audit summary notification for active administrators',async()=>{
  const {db,env,worker}=fixture();
  db.prepare(`INSERT INTO flight_reviews(flight_id,user_id,reviewer_id,previous_status,status,reason,created_at) VALUES
    (90,3,2,'screening','approved','',datetime('now','-1 day')),
    (91,3,1,'screening','rejected','【隐私守护规范】需遮挡',datetime('now','-2 day')),
    (92,3,2,'screening','rejected','【隐私守护规范】重复原因',datetime('now','-3 day')),
    (93,3,2,'screening','rejected','【审核流程】旧记录',datetime('now','-10 day'))`).run();
  await worker.scheduled({cron:'0 16 * * 5'},env);
  const report=db.prepare('SELECT * FROM weekly_review_reports').get();
  assert.equal(report.reviewed_count,3);assert.equal(report.approved_count,1);assert.equal(report.rejected_count,2);assert.equal(report.top_rejection_category,'【隐私守护规范】');
  const notices=db.prepare("SELECT user_id,content FROM notifications WHERE content LIKE '每周审核统计%' ORDER BY user_id").all();
  assert.deepEqual(notices.map(row=>row.user_id),[1,2,5]);
  assert.match(notices[0].content,/总审核 3 件，通过 1 件，拒绝 2 件/);
  await worker.scheduled({cron:'0 16 * * 5'},env);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM weekly_review_reports').get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM notifications WHERE content LIKE '每周审核统计%'").get().n,3);
});
