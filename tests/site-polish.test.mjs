import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

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
  assert.match(worker, /bpmuseum-shell-v41/);
  assert.match(worker, /'\/site-polish\.css'/);
  assert.match(worker, /'\/admin-login\.html'/);
});

test('SA announcements support bulk operations and light-theme buttons keep dark text',()=>{
  const html=readFileSync(new URL('../public/sa.html',import.meta.url),'utf8');
  const script=readFileSync(new URL('../public/sa.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../public/site-polish.css',import.meta.url),'utf8');
  assert.match(html,/selectAllAnnouncements/);
  assert.match(html,/data-announcement-bulk-action="edit"/);
  assert.match(script,/data-announcement-select/);
  assert.match(script,/data-announcement-bulk-action/);
  assert.match(css,/html\.light-theme #submitBtn[\s\S]*?color:\s*#14272f/);
});

test('about page credits the used projects and providers and links to the public source repository', () => {
  const about = readFileSync(new URL('../public/about.html', import.meta.url), 'utf8');
  const theme = readFileSync(new URL('../public/theme.js', import.meta.url), 'utf8');
  for (const name of ['Lucide Icons', 'Feather', 'SimpleWebAuthn', 'Cloudflare Workers AI', 'Cloudflare', 'Resend']) {
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
  assert.match(html, /data-sa-catalog-input="airline"/);
  assert.match(html, /data-sa-catalog-input="airport"/);
  assert.match(html, /id="saFlightImagePreview"/);
  assert.match(html, /data-edit-flight="image"/);
  assert.match(script, /airlines-global\.json/);
  assert.match(script, /airports-global\.json/);
  assert.match(html, /到达车站/);
  assert.doesNotMatch(html, /到达机场/);
  assert.match(html,/saStepupCountdown/);
  assert.ok(html.indexOf('id="saStepupCountdown"')<html.indexOf('<nav>'), 'timer must survive auth.js rebuilding the menu contents');
  assert.match(html,/saStepupDialog/);
  assert.match(script,/bpmShowSAStepup/);
  assert.match(script,/images\.bpmuseum\.org\.cn/);
  assert.match(script,/updateSAFlightImagePreview\(\)/);
});

test('submission and SA edit forms use searchable ISO alpha-2 country pickers',()=>{
  const submit=readFileSync(new URL('../public/submit.html',import.meta.url),'utf8');
  const picker=readFileSync(new URL('../public/iso-country-picker.js',import.meta.url),'utf8');
  const countries=JSON.parse(readFileSync(new URL('../public/data/countries-iso3166.json',import.meta.url),'utf8'));
  assert.equal(countries.length,249);
  for(const [code,name] of [['FR','法兰西共和国'],['US','美利坚合众国'],['AS','美属萨摩亚'],['PF','法属波利尼西亚'],['HK','香港特别行政区']])assert.equal(countries.find(row=>row.code===code)?.name_cn,name);
  assert.match(submit,/id="departureCountry" data-iso-country/);
  assert.match(submit,/id="arrivalCountry" data-iso-country/);
  assert.match(picker,/name_cn/);assert.match(picker,/name_tw/);assert.match(picker,/name_en/);assert.match(picker,/role","listbox/);
});

test('client login keeps the public account experience separate from the management entry', () => {
  const html = readFileSync(new URL('../public/login.html', import.meta.url), 'utf8');
  const script = readFileSync(new URL('../public/login.js', import.meta.url), 'utf8');
  assert.match(html, /此站为用户客户端/);
  assert.match(html, /https:\/\/admin\.bpmuseum\.org\.cn\/admin-login\.html/);
  assert.match(script, /credentials:'include'/);
  assert.match(script, /bpmHandleClientAdminLogin/);
});

test('user dropdown application link stays on public admin-application frame and respects recruitment setting',()=>{
  const auth=readFileSync(new URL('../public/auth.js',import.meta.url),'utf8');
  const theme=readFileSync(new URL('../public/theme.js',import.meta.url),'utf8');
  const admin=readFileSync(new URL('../public/admin.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../public/admin.html',import.meta.url),'utf8');
  assert.match(auth,/admin\.html\?embed=1#admin-apply/);
  assert.match(theme,/adminApplicationFrame/);
  assert.match(admin,/api\/admin-recruitment/);
  assert.match(admin,/button\.hidden=data\.open!==true/);
  assert.match(html,/id="adminApplyStatus"/);
  assert.match(readFileSync(new URL('../public/features.css',import.meta.url),'utf8'),/admin-apply-button\[hidden\]/);
});

test('Windows browser shows separate Microsoft Store entries for public and admin clients',()=>{
  const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const admin=readFileSync(new URL('../public/admin-login.html',import.meta.url),'utf8');
  const script=readFileSync(new URL('../public/windows-store-links.js',import.meta.url),'utf8');
  const worker=readFileSync(new URL('../public/service-worker.js',import.meta.url),'utf8');
  assert.match(home,/ms-windows-store:\/\/pdp\/\?ProductId=9NJCJPTFGMG7/);
  assert.match(home,/apps\.microsoft\.com\/detail\/9NJCJPTFGMG7/);
  assert.match(admin,/ms-windows-store:\/\/pdp\/\?ProductId=9P8JMZJ5J9TR/);
  assert.match(admin,/apps\.microsoft\.com\/detail\/9P8JMZJ5J9TR/);
  assert.match(script,/\/windows\/i\.test\(platform\)/);
  assert.match(worker,/windows-store-links\.js/);
  const runFor=platform=>{
    const promo={hidden:true},adminPromo={hidden:true};
    runInNewContext(script,{navigator:{platform,userAgentData:{platform}},document:{getElementById:id=>id==='windowsStorePromo'?promo:id==='windowsAdminStorePromo'?adminPromo:null}});
    return [promo.hidden,adminPromo.hidden];
  };
  assert.deepEqual(runFor('Windows'),[false,false]);
  assert.deepEqual(runFor('MacIntel'),[true,true]);
});
