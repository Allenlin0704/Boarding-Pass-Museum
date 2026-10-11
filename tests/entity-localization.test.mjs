import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const appSource = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');

function createElement(tagName = 'div') {
  let html = '';
  return {
    tagName,
    className: '',
    dataset: {},
    children: [],
    value: '',
    onclick: null,
    set innerHTML(value) {
      html = String(value);
      if (tagName === 'div' && html === '') this.children = [];
    },
    get innerHTML() { return html; },
    appendChild(child) { this.children.push(child); return child; },
    replaceChildren(...children) { this.children = children; },
  };
}

async function renderForLanguage(language, includeMalformed = false) {
  const selects = new Map();
  for (const id of ['museumAirline', 'museumAirport', 'museumYear', 'museumSort']) {
    selects.set(id, createElement('select'));
  }
  for (const id of ['museumSearch', 'museumType', 'museumBaggageTag', 'museumFormat']) {
    selects.set(id, createElement('input'));
  }
  selects.get('museumSort').value = 'latest';
  const museum = createElement('div');
  const resultCount = createElement('span');
  const aliases = {
    airlines: [['CA', '“中国国际航空”', '"Air China"', 'CCA'], ['AIR', '国际空运', 'International Air Freight', 'AIR']],
    airports: [['PEK', '北京首都国际机场', 'Beijing Capital International Airport', 'ZBAA']],
  };
  const flights = [
    { id: 1, airline: '中国国际航空', airline_iata: '', airport: '北京首都国际机场', airport_iata: '', flight: 'CA123', date: '2026-01-01', story: 'A flight story', status: 'approved' },
    { id: 2, airline: 'Air China', airline_iata: 'CA', airport: 'Beijing Capital International Airport', airport_iata: 'PEK', flight: 'CA456', date: '2026-01-02', story: 'Another flight story', status: 'approved' },
    ...(includeMalformed ? [{ id: 3, airline: '国际空运', airline_iata: 'AIR', airport: '北京首都国际机场', airport_iata: 'PEK', flight: 'CA789', date: '2026-01-03', story: '', status: 'approved' }] : []),
  ];
  const document = {
    getElementById(id) { return id === 'museum' ? museum : id === 'museumResultCount' ? resultCount : id === 'museumSort' ? selects.get(id) : selects.get(id); },
    createElement,
    addEventListener() {},
  };
  const fakeFetch = async url => {
    if (String(url).includes('entity-aliases.json')) return { ok: true, json: async () => aliases };
    if (String(url).includes('/api/flights')) return { ok: true, json: async () => flights };
    throw new Error(`Unexpected fetch: ${url}`);
  };
  class FakeOption {
    constructor(text, value) { this.textContent = text; this.value = value; }
  }
  const window = {
    BPM_LANGUAGE: language,
    bpmIcon: () => '',
    bpmGoogleTranslateUrl(text, target) {
      const url = new URL('https://translate.google.com/');
      url.searchParams.set('sl', 'auto');
      url.searchParams.set('tl', target);
      url.searchParams.set('text', String(text || ''));
      url.searchParams.set('op', 'translate');
      return url.href;
    },
  };
  const context = vm.createContext({
    window, document, fetch: fakeFetch, Option: FakeOption,
    localStorage: { getItem: () => null },
    console, URL, URLSearchParams, Date, Map, Set, Promise,
    bpmSafeRecord: record => Object.fromEntries(Object.entries(record).map(([key, value]) => [key, typeof value === 'string' ? value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;') : value])),
  });
  vm.runInContext(appSource, context, { filename: 'public/app.js' });
  await context.loadFlights();
  return { selects, museum };
}

test('gallery filters merge Chinese and English aliases by airline and airport code', async () => {
  for (const language of ['zh-CN', 'en', 'zh-TW']) {
    const { selects, museum } = await renderForLanguage(language, true);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(selects.get('museumAirline').children.length, 2, `${language}: one placeholder and one airline`);
    assert.equal(selects.get('museumAirport').children.length, 2, `${language}: one placeholder and one airport`);
    assert.equal(selects.get('museumAirline').children[1].value, 'airline:CA');
    assert.equal(selects.get('museumAirport').children[1].value, 'airport:PEK');
    assert.match(selects.get('museumAirline').children[1].textContent, /\(CA\)$/);
    assert.match(selects.get('museumAirport').children[1].textContent, /\(PEK\)$/);
    assert.match(selects.get('museumAirline').children[1].textContent, language === 'en' ? /Air China/ : /中国国际航空/);
    assert.match(selects.get('museumAirport').children[1].textContent, language === 'en' ? /Beijing Capital/ : /北京首都国际机场/);
    const cardsHtml=museum.children.map(card=>card.innerHTML).join('');
    assert.match(cardsHtml, language === 'en' ? /Air China \(CA\)/ : /中国国际航空 \(CA\)/, `${language}: malformed AIR label falls back to the catalog carrier prefix`);
    assert.doesNotMatch(cardsHtml, /国际空运/);
  }
});

test('gallery story offers regional AI translation targets and discloses external text sharing', async () => {
  const { museum } = await renderForLanguage('en');
  assert.equal(museum.children.length, 2);
  assert.match(museum.children[0].innerHTML, /Translate public story text with /);
  assert.match(museum.children[0].innerHTML, /data-bpm-translate="en"/);
  assert.match(museum.children[0].innerHTML, /data-bpm-translate="zh-TW"/);
});
