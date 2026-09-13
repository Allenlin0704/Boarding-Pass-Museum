import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';
import {passwordHash} from '../worker/security.mjs';

test('account deletion requests need the current password, can be cancelled, and never delete user content',async()=>{
  const {call,db}=fixture();
  db.prepare('UPDATE users SET password=? WHERE id=3').run(await passwordHash('current-password'));
  assert.equal((await call('/api/account/deletion-request',{user_id:3,password:'wrong',reason:'Please remove my account'},3)).status,403);
  assert.equal((await call('/api/account/deletion-request',{user_id:3,password:'current-password',reason:'Please remove my account'},3)).status,200);
  const current=await (await call('/api/account/deletion-request',null,3)).json();
  assert.equal(current.request.status,'pending');
  assert.equal((await call('/api/account/deletion-request/cancel',{user_id:3},3)).status,200);
  assert.equal(db.prepare('SELECT status FROM account_deletion_requests WHERE user_id=3').get().status,'cancelled');
  assert.ok(db.prepare('SELECT * FROM users WHERE id=3').get());
  assert.ok(db.prepare('SELECT * FROM flights WHERE user_id=3').get());
});

test('only the database SA can review an account deletion request',async()=>{
  const {call,db}=fixture();
  db.prepare("INSERT INTO account_deletion_requests(user_id,reason,status) VALUES(3,'request','pending')").run();
  assert.equal((await call('/api/sa/account-deletion-requests/resolve',{sa_id:4,request_id:1,decision:'approved'},4)).status,403);
  assert.equal((await call('/api/sa/account-deletion-requests/resolve',{sa_id:1,request_id:1,decision:'approved'},1)).status,200);
  assert.equal(db.prepare('SELECT status FROM account_deletion_requests WHERE id=1').get().status,'approved');
  assert.ok(db.prepare('SELECT * FROM users WHERE id=3').get());
});
