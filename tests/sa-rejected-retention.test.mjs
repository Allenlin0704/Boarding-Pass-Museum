import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('scheduled cleanup removes only expired SA rejections without pending appeals and deletes their image',async()=>{
  const {db,env,worker}=fixture(),deleted=[];let failFirstDelete=true;
  env.IMAGES={async delete(key){if(failFirstDelete){failFirstDelete=false;throw new Error('temporary R2 error');}deleted.push(key);}};
  const old="datetime('now','-15 days')",recent="datetime('now','-13 days')";
  db.prepare(`INSERT INTO flights(id,user_id,status,reviewer_id,reject_reason,image,rejected_at) VALUES
    (20,3,'rejected',1,'reason','https://images.bpmuseum.org.cn/tickets/old.webp',${old}),
    (21,3,'rejected',2,'reason','https://images.bpmuseum.org.cn/tickets/admin.webp',${old}),
    (22,3,'rejected',1,'reason','https://images.bpmuseum.org.cn/tickets/appealed.jpg',${old}),
    (23,3,'rejected',1,'reason','https://images.bpmuseum.org.cn/tickets/recent.webp',${recent})`).run();
  db.prepare("INSERT INTO appeals(user_id,flight_id,reason,status) VALUES(3,22,'please review','pending')").run();

  await worker.scheduled({},env);

  assert.equal(db.prepare('SELECT id FROM flights WHERE id=20').get(),undefined);
  assert.ok(db.prepare('SELECT id FROM flights WHERE id=21').get(),'ordinary-admin rejection is retained');
  assert.ok(db.prepare('SELECT id FROM flights WHERE id=22').get(),'pending appeal suspends deletion');
  assert.ok(db.prepare('SELECT id FROM flights WHERE id=23').get(),'rejection younger than 14 days is retained');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM r2_cleanup_queue').get().n,1,'failed R2 removal is queued for retry');
  await worker.scheduled({},env);
  assert.deepEqual(deleted,['tickets/old.webp']);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM r2_cleanup_queue').get().n,0);
});

