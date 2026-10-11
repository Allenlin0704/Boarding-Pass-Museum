import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('collection explorer renders approved departure-point, time, and shared-flight connections', async () => {
  const ids = ['exploreMetrics', 'atlasStage', 'atlasDetail', 'timeYear', 'timeSearch', 'timeCount', 'timeRuler', 'timeList', 'relatedSearch', 'relatedAirport', 'relatedGroups'];
  const elements = Object.fromEntries(ids.map(id => [id, {
    value: '', innerHTML: '', textContent: '', dataset: {}, children: [],
    addEventListener() {}, append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; }, setAttribute() {}
  }]));
  const listeners = {};
  const document = {
    querySelector(selector) { return selector.startsWith('#') ? elements[selector.slice(1)] : null; },
    querySelectorAll() { return []; },
    addEventListener(type, callback) { listeners[type] = callback; },
    createElement(tag) { return { tagName: tag, children: [], append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; }, setAttribute() {} }; }
  };
  const rows = [
    { id: 11, flight: 'MU5309', airline: '中国东方航空', airline_iata: 'MU', airport: '北京首都国际机场', airport_iata: 'PEK', date: '2024-04-12', image: '/ticket-11.jpg' },
    { id: 12, flight: 'MU5309', airline: '中国东方航空', airline_iata: 'MU', airport: '北京首都国际机场', airport_iata: 'PEK', date: '2025-06-08', image: '/ticket-12.jpg' },
    { id: 13, flight: 'CA1234', airline: '中国国际航空', airline_iata: 'CA', airport: '上海虹桥国际机场', airport_iata: 'SHA', date: '2025-09-01', image: '/ticket-13.jpg' },
    { id: 14, flight: 'CA998', airline: 'Air China (CA)', airline_iata: '', airport: 'Shanghai Hongqiao International Airport (SHA)', airport_iata: '', date: '2025-09-02', image: '/ticket-14.jpg' },
    { id: 15, flight: 'MU001', airline: 'China Eastern Airlines (MU)', airline_iata: '', airport: '上海虹桥国际机场 (SHA)', airport_iata: '', date: '2025-09-03', image: '/ticket-15.jpg' }
  ];
  const aliases = {
    airlines: [['CA', '中国国际航空', 'Air China', 'CCA'], ['MU', '中国东方航空', 'China Eastern Airlines', 'CES']],
    airports: [['PEK', '北京首都国际机场', 'Beijing Capital International Airport', 'ZBAA'], ['SHA', '上海虹桥国际机场', 'Shanghai Hongqiao International Airport', 'ZSSS']]
  };
  const context = {
    window: { BPM_LANGUAGE: 'zh-CN' }, document,
    fetch: async url => ({ ok: true, json: async () => String(url).includes('entity-aliases') ? aliases : rows }),
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
  assert.match(elements.atlasStage.innerHTML, /data-node-kind="flight"/);
  assert.match(elements.atlasStage.innerHTML, /PEK/);
  assert.equal([...elements.atlasStage.innerHTML.matchAll(/data-node-kind="airport"/g)].length, 2, 'SHA aliases form one airport node');
  assert.equal([...elements.atlasStage.innerHTML.matchAll(/data-node-kind="operator"/g)].length, 2, 'CA and MU aliases form one node each');
  assert.equal([...elements.atlasStage.innerHTML.matchAll(/data-node-kind="flight"/g)].length, 4, 'the repeated MU5309 exhibits share one flight-number node');
  assert.match(elements.atlasStage.innerHTML, /MU5309 · 2 件公开展品/);
  assert.match(elements.atlasStage.innerHTML, /上海虹桥国际机场 \(SHA\)/);
  assert.match(elements.timeList.innerHTML, /detail\.html\?id=12/);
  assert.match(elements.relatedGroups.innerHTML, /同航班号 · MU5309/);
  assert.match(elements.relatedGroups.innerHTML, /detail\.html\?id=11/);
  assert.match(elements.exploreMetrics.innerHTML, /<strong>5<\/strong><small>件公开展品<\/small>/);
  assert.doesNotMatch(elements.atlasStage.innerHTML, /destination|arrival_airport/i);

  const flightNode = { dataset: { nodeKind: 'flight', nodeKey: 'mu5309' } };
  listeners.click({ target: { closest: selector => selector === '[data-node-kind]' ? flightNode : null } });
  assert.equal(elements.atlasDetail.children[1].textContent, 'MU5309');
  assert.equal(elements.atlasDetail.children[2].textContent, '2 件公开展品', 'selecting a flight node lists every matching public exhibit');
});
