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
  assert.match(worker, /bpmuseum-shell-v26/);
  assert.match(worker, /'\/site-polish\.css'/);
  assert.match(worker, /'\/admin-login\.html'/);
});
