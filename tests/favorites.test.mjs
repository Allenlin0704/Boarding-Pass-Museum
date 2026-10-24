import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('favorites are session-scoped, expose exhibit ids, and bulk removal stays within 50 owned ids',async()=>{
  const {db,call}=fixture();
  db.prepare('INSERT INTO favorites(user_id,flight_id) VALUES(3,13),(5,13)').run();

  const own=await call('/api/favorites',undefined,3);
  assert.equal(own.status,200);
  const rows=await own.json();
  assert.equal(rows.length,1);
  assert.equal(rows[0].flight_id,13);
  assert.equal(rows[0].status,'approved');

  const spoof=await call('/api/favorites?user_id=5',undefined,3);
  assert.equal(spoof.status,403);
  const mismatch=await call('/api/favorites/bulk-remove',{user_id:5,flight_ids:[13]},3);
  assert.equal(mismatch.status,403);

  const overLimit=Array.from({length:51},(_,index)=>index+1);
  const invalid=await call('/api/favorites/bulk-remove',{flight_ids:overLimit},3);
  assert.equal(invalid.status,400);
  const removed=await call('/api/favorites/bulk-remove',{flight_ids:[13,999]},3);
  assert.equal(removed.status,200);
  assert.deepEqual(await removed.json(),{success:true,removed:1});
  assert.equal(db.prepare('SELECT COUNT(*) n FROM favorites WHERE user_id=5').get().n,1);
});
