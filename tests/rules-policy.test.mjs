import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const submit = readFileSync(new URL('../public/submit.html', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../public/rules.html', import.meta.url), 'utf8');
const translations = readFileSync(new URL('../public/rules-i18n.js', import.meta.url), 'utf8');

test('boarding-pass route scope and marker choices stay aligned with published rules', () => {
  const markers = [...submit.matchAll(/name="specialTag" value="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(markers, ['business', 'premium_economy', 'first_class', 'silver', 'gold', 'platinum', 'special_assistance', 'transfer', 'other']);

  const boardingFields = submit.split('<div id="railSubmissionFields"')[0];
  assert.match(boardingFields, /id="routeScope"/);
  assert.doesNotMatch(boardingFields, /arrivalAirport|到达机场|到達機場/);
  for (const scope of ['domestic', 'international', 'regional']) assert.match(boardingFields, new RegExp(`value="${scope}"`));

  for (const label of ['公务舱', '超级经济舱', '头等舱', '银卡', '金卡', '白金卡', '特殊保障', '转机', '其他']) assert.ok(rules.includes(label));
  assert.match(rules, /行李提取凭证属于票面内容，不是行李标记/);
  assert.match(translations, /business class, premium economy, first class, silver, gold, platinum, special assistance, transfer, or other/);
  assert.match(translations, /商務艙、超級經濟艙、頭等艙、銀卡、金卡、白金卡、特殊保障、轉機或其他/);
  assert.match(translations, /baggage-claim receipt attached to a boarding pass is part of the ticket image, not a baggage marker/);
  assert.match(translations, /行李提領憑證屬於票面內容，不是行李標記/);
});
