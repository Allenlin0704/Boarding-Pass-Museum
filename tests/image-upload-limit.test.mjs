import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers.mjs';

test('exhibit image upload rejects files over 5 MB before writing to R2', async () => {
  const { worker, env } = fixture();
  let writes = 0;
  env.IMAGES = { async put() { writes++; } };

  const form = new FormData();
  const bytes = new Uint8Array(5 * 1024 * 1024 + 1);
  bytes.set([0xff, 0xd8, 0xff]);
  form.set('image', new Blob([bytes], { type: 'image/jpeg' }), 'large-ticket.jpg');
  const response = await worker.fetch(new Request('https://test.invalid/api/upload-image', {
    method: 'POST', headers: { Cookie: `bpm_session=${'3'.repeat(64)}` }, body: form
  }), env);

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /5 MB/);
  assert.equal(writes, 0);
});

test('SA homepage photo upload shares the same 5 MB R2 limit', async () => {
  const { worker, env } = fixture();
  let writes = 0;
  env.IMAGES = { async put() { writes++; } };

  const form = new FormData();
  const bytes = new Uint8Array(5 * 1024 * 1024 + 1);
  bytes.set([0xff, 0xd8, 0xff]);
  form.set('image', new Blob([bytes], { type: 'image/jpeg' }), 'large-homepage.jpg');
  form.set('credit', 'Test photographer');
  form.set('weekday', '2');
  form.set('show_home', '1');
  form.set('license_confirmed', '1');
  const response = await worker.fetch(new Request('https://test.invalid/api/sa/site-photos/upload', {
    method: 'POST', headers: { Cookie: `bpm_session=${'1'.repeat(64)}` }, body: form
  }), env);

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /5 MB/);
  assert.equal(writes, 0);
});
