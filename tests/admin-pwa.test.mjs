import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=path=>readFileSync(new URL(`../public/${path}`,import.meta.url),'utf8');

test('admin host has an independently installable, non-caching PWA shell',()=>{
  const page=file('admin-login.html');
  const manifest=JSON.parse(file('admin-manifest.webmanifest'));
  const worker=file('admin-service-worker.js');
  assert.match(page,/href="admin-manifest\.webmanifest"/);
  assert.match(page,/src="admin-pwa\.js/);
  assert.doesNotMatch(page,/href="manifest\.webmanifest"/);
  assert.equal(manifest.name,'BoardingPassMuseum 管理中心');
  assert.equal(manifest.start_url,'/admin-login.html?source=installed-app');
  assert.equal(manifest.scope,'/');
  assert.equal(manifest.icons[0].src,'/favicon.png');
  assert.match(worker,/event\.respondWith\(fetch\(request\)\)/);
  assert.doesNotMatch(worker,/caches\.(open|match|put)/);
  assert.match(file('admin-pwa.js'),/register\('\/admin-service-worker\.js'/);
});

test('extensionless Pages routes stay on the dedicated admin host and email is fallback-only',()=>{
  const page=file('admin-login.html');
  const identities=file('admin-identities.js');
  const theme=file('theme.js');
  assert.match(theme,/adminHtmlPaths\.map\(path=>path\.replace\(\/\\\.html\$\//);
  assert.match(theme,/"\/console","\/admin\.html","\/admin","\/sa\.html","\/sa","\/moderation\.html","\/moderation"/);
  assert.match(page,/id="adminIdentityFallback"[^>]*hidden/);
  assert.match(identities,/fallback\.hidden=false/);
  assert.match(file('login.js'),/identity\.disabled\?\{email:fallbackEmail,password\}/);
});
