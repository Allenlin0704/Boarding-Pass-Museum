import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('social media sharing is optional, checked by default, and privacy settings are discoverable',()=>{
  const submit=readFileSync(new URL('../public/submit.html',import.meta.url),'utf8');
  const checkbox=submit.match(/<input id="socialShareConsent"[^>]*>/)?.[0]||'';
  assert.match(checkbox,/type="checkbox"/);
  assert.match(checkbox,/\bchecked\b/);
  assert.doesNotMatch(checkbox,/\brequired\b/);
  const theme=readFileSync(new URL('../public/theme.js',import.meta.url),'utf8');
  assert.match(theme,/預設勾選/);
  assert.match(theme,/enabled by default/);
  const my=readFileSync(new URL('../public/my.js',import.meta.url),'utf8');
  assert.match(my,/撤回社交媒体分享授权/);
  assert.match(my,/api\/my\/social-share/);
  const privacy=readFileSync(new URL('../public/privacy.html',import.meta.url),'utf8');
  for(const key of ['privacy.ai.body','privacy.share.body','privacy.rights.body'])assert.match(privacy,new RegExp(`data-i18n="${key}"`));
});
