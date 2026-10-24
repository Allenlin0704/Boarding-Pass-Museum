import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('public statistics expose only registered and retained-record totals',async()=>{
  const {worker,env,db}=fixture();
  db.prepare("UPDATE users SET deleted_at=CURRENT_TIMESTAMP WHERE id=5").run();
  const response=await worker.fetch(new Request('https://test.invalid/api/public/stats'),env);
  const data=await response.json();
  assert.equal(response.status,200);
  assert.deepEqual(Object.keys(data).sort(),['registered_users','retained_submissions','updated_at']);
  assert.equal(data.registered_users,4);
  assert.equal(data.retained_submissions,4);
  assert.equal(response.headers.get('cache-control'),'public, max-age=300');
});
