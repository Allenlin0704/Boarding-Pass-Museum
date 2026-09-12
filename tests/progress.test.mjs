import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levelScore,levelInfo,calculateAchievements} from '../worker/progress.mjs';
const approvals=(n,at)=>Array.from({length:n},()=>({approved_at:at}));
test('annual reset uses Beijing boundary and strict over-50 carry; gaps reset again',()=>{
  const old=approvals(51,'2025-06-01 00:00:00');
  assert.equal(levelScore(old,[],new Date('2025-12-31T15:59:59Z')),51);
  assert.equal(levelScore(old,[],new Date('2025-12-31T16:00:00Z')),50);
  assert.equal(levelScore(approvals(50,'2025-06-01 00:00:00'),[],new Date('2026-01-01')),0);
  assert.equal(levelScore(old,[],new Date('2027-01-01')),0);
});
test('level thresholds use reviewed count for administrators including rejected decisions',()=>{
  assert.equal(levelInfo({role:'user'},0,0,0).level,0);
  assert.equal(levelInfo({role:'user'},1,0,0).level,1);
  assert.equal(levelInfo({role:'user'},100,100,0).level,9);
  assert.equal(levelInfo({id:2,role:'administrator'},0,0,40).level,96);
  assert.equal(levelInfo({id:2,role:'administrator'},0,0,100).level,98);
  assert.equal(levelInfo({id:4,role:'superadministrator'},0,0,100).level,0);
  assert.equal(levelInfo({id:1,role:'superadministrator'},0,0,0).level,99);
});
test('airport gateways and distinct reviewed submissions achievements',()=>{
  const approved=['PEK','PVG','CAN'].map(airport=>({airport,airline:'CA',approved_at:'2026-09-01 00:00:00',submitted_at:'2026-09-01 00:00:00',flight_date:'2010-01-01'}));
  const earned=calculateAchievements(approved,Array.from({length:50},()=>({flight_id:10,created_at:'2026-09-01 18:00:00'})),[],true);
  assert.ok(earned.has('gateways'));assert.ok(earned.has('vintage'));assert.ok(earned.has('night'));assert.ok(!earned.has('review50'));
});
