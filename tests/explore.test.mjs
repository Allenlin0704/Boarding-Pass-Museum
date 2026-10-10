import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('collection explorer renders approved departure-point, time, and shared-flight connections', async () => {
  const ids = ['exploreMetrics', 'atlasStage', 'atlasDetail', 'timeYear', 'timeSearch', 'timeCount', 'timeRuler', 'timeList', 'relatedSearch', 'relatedAirport', 'relatedGroups'];
  const elements = Object.fromEntries(ids.map(id => [id, {
    value: '', innerHTML: '', textContent: '', dataset: {},
    addEventListener() {}, append() {}, replaceChildren() {}, setAttribute() {}
  }]));
  const document = {
    querySelector(selector) { return selector.startsWith('#') ? elements[selector.slice(1)] : null; },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  const rows = [
    { id: 11, flight: 'MU5309', airline: '中国东方航空', airline_iata: 'MU', airport: '北京首都国际机场', airport_iata: 'PEK', date: '2024-04-12', image: '/ticket-11.jpg' },
    { id: 12, flight: 'MU5309', airline: '中国东方航空', airline_iata: 'MU', airport: '北京首都国际机场', airport_iata: 'PEK', date: '2025-06-08', image: '/ticket-12.jpg' },
    { id: 13, flight: 'CA1234', airline: '中国国际航空', airline_iata: 'CA', airport: '上海虹桥国际机场', airport_iata: 'SHA', date: '2025-09-01', image: '/ticket-13.jpg' }
  ];
  const context = {
    window: { BPM_LANGUAGE: 'zh-CN' }, document,
    fetch: async () => ({ ok: true, json: async () => rows }),
    console,
    setTimeout,
    Map,
    String,
    Number,
    Array,
    Math
  };
  vm.runInNewContext(readFileSync(new URL('../public/explore.js', import.meta.url), 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));

  assert.match(elements.atlasStage.innerHTML, /data-node-kind="airport"/);
  assert.match(elements.atlasStage.innerHTML, /data-node-kind="operator"/);
  assert.match(elements.atlasStage.innerHTML, /PEK/);
  assert.match(elements.timeList.innerHTML, /detail\.html\?id=12/);
  assert.match(elements.relatedGroups.innerHTML, /同航班号 · MU5309/);
  assert.match(elements.relatedGroups.innerHTML, /detail\.html\?id=11/);
  assert.match(elements.exploreMetrics.innerHTML, /<strong>3<\/strong><small>件公开展品<\/small>/);
  assert.doesNotMatch(elements.atlasStage.innerHTML, /destination|arrival_airport/i);
});
