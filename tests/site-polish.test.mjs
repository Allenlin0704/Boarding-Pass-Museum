import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

test('the shared visual system loads after page styles on every styled public page', () => {
  const pages = readdirSync(new URL('../public/', import.meta.url))
    .filter(file => file.endsWith('.html'));
  const styledPages = pages.filter(file => readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8').includes('style.css'));

  assert.ok(styledPages.length >= 20);
  for (const file of styledPages) {
    const html = readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8');
    const sharedStyles = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g)];
    const polishIndex = sharedStyles.findIndex(([tag]) => tag.includes('site-polish.css'));
    assert.notEqual(polishIndex, -1, `${file} must load site-polish.css`);
    assert.equal(sharedStyles.filter(([tag]) => tag.includes('site-polish.css')).length, 1, `${file} should load it once`);
    assert.equal(polishIndex, sharedStyles.length - 1, `${file} must load it after page-specific styles`);
  }
});

test('the service worker precaches the shared design stylesheet in a fresh shell cache', () => {
  const worker = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8');
  assert.match(worker, /bpmuseum-shell-v27/);
  assert.match(worker, /'\/site-polish\.css'/);
  assert.match(worker, /'\/admin-login\.html'/);
});

test('about page credits the used projects and providers and links to the public source repository', () => {
  const about = readFileSync(new URL('../public/about.html', import.meta.url), 'utf8');
  const theme = readFileSync(new URL('../public/theme.js', import.meta.url), 'utf8');
  for (const name of ['Lucide Icons', 'Feather', 'SimpleWebAuthn', '火山引擎豆包', 'Cloudflare', 'Resend']) {
    assert.ok(about.includes(name), `about page should credit ${name}`);
  }
  assert.match(about, /https:\/\/github\.com\/lucide-icons\/lucide/);
  assert.match(about, /https:\/\/github\.com\/MasterKale\/SimpleWebAuthn/);
  assert.match(theme, /https:\/\/github\.com\/Allenlin0704\/Boarding-Pass-Museum/);
  assert.match(theme, /bpm-github-source/);
});

test('SA exhibit search comes before the repair queue and both correction flows open the editor', () => {
  const html = readFileSync(new URL('../public/sa.html', import.meta.url), 'utf8');
  const script = readFileSync(new URL('../public/sa.js', import.meta.url), 'utf8');
  assert.ok(html.indexOf('<h3>搜索展品</h3>') < html.indexOf('<h3>需要补全信息</h3>'));
  assert.match(html, /id="saFlightEditDialog"/);
  assert.match(script, /data-correction-edit/);
  assert.match(script, /data-sa-incomplete-id/);
  assert.match(script, /api\/admin\/edit/);
  assert.match(script, /flight_updates:flightUpdates/);
});

test('client login keeps the public account experience separate from the management entry', () => {
  const html = readFileSync(new URL('../public/login.html', import.meta.url), 'utf8');
  const script = readFileSync(new URL('../public/login.js', import.meta.url), 'utf8');
  assert.match(html, /此站为用户客户端/);
  assert.match(html, /https:\/\/admin\.bpmuseum\.org\.cn\/admin-login\.html/);
  assert.match(script, /credentials:'include'/);
  assert.match(script, /bpmHandleClientAdminLogin/);
});
