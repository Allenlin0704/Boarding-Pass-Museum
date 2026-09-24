import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';

test('flight assist uses approved exhibits and normalizes flight numbers', async () => {
  const {db,call}=fixture();
  db.prepare("UPDATE flights SET flight=?,airline=?,airport=?,date=? WHERE id=13")
    .run('MU 5309','中国东方航空 (MU)','上海虹桥国际机场 (SHA)','2026-09-01');
  db.prepare("UPDATE flights SET flight=?,airline=?,airport=?,date=? WHERE id=12")
    .run('MU5309','不可公开的航司','不可公开的机场','2026-09-02');

  const response=await call('/api/flight-assist?flight=mu-5309&date=2026-09-01');
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.found,true);
  assert.equal(result.airline,'中国东方航空 (MU)');
  assert.equal(result.airport,'上海虹桥国际机场 (SHA)');
  assert.equal(result.date,'2026-09-01');
});

test('flight assist rejects malformed input and reports unknown flights', async () => {
  const {call}=fixture();
  assert.equal((await call('/api/flight-assist?flight=M')).status,400);
  assert.deepEqual(await (await call('/api/flight-assist?flight=ZZ9999')).json(),{found:false});
});
