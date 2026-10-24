import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('update and problem-feedback controls sit in the main navigation, outside the profile dropdown',()=>{
  const auth=readFileSync(new URL('../public/auth.js',import.meta.url),'utf8');
  const security=readFileSync(new URL('../public/security.js',import.meta.url),'utf8');
  const check=auth.indexOf('<button type="button" id="checkUpdate">检查新版本</button>');
  const menu=auth.indexOf('<div class="user-menu">',check);
  assert.ok(check>=0&&menu>check,'check updates must appear before the account dropdown');
  assert.match(auth,/function bindCheckUpdates\(\)/);
  assert.match(security,/bpmErrorReportMenuItem/);
  assert.match(security,/addEventListener\('error'/);
  assert.match(security,/addEventListener\('unhandledrejection'/);
  assert.doesNotMatch(security,/bpmErrorReportLauncher|position:fixed/);
});

test('service worker refreshes the shell and pre-caches annual report and EXIF tools',()=>{
  const source=readFileSync(new URL('../public/service-worker.js',import.meta.url),'utf8');
  assert.match(source,/bpmuseum-shell-v45/);
  for(const path of ['/annual-report.html','/annual-report.js','/exif-metadata.js','/about.html','/privacy.html'])assert.ok(source.includes(path),`${path} is precached`);
});
