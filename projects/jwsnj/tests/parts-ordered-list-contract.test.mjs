// Figma numbered-list contract PC 344:947 / SP 442:2806.
// Run: node --test projects/jwsnj/tests/parts-ordered-list-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-list-style.css', import.meta.url), 'utf8');
const start = css.indexOf('ol.wp-block-list:not(.annotation-list) {');
const end = css.indexOf('/* //---------- 注釈リスト ---------- */', start);
assert.ok(start >= 0 && end > start, 'numbered list rule exists before annotations');
const list = css.slice(start, end);

test('native ordered-list counters allow one- and two-digit numbers', () => {
  assert.match(list, /counter-reset:\s*li/);
  assert.match(list, /counter-increment:\s*li/);
  assert.match(list, /content:\s*counter\(li\) '\.'/);
  assert.match(list, /width:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(list, /text-align:\s*right/);
  assert.match(list, /padding-left:\s*calc\(34 \* var\(--to-rem-func\)\)/);
});

test('PC and SP list typography and spacing follow Figma', () => {
  assert.match(list, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(list, /font-size:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(list, /font-size:\s*calc\(16 \* var\(--to-rem-func\)\)/);
  assert.match(list, /line-height:\s*1\.5/);
  assert.match(list, /gap:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(list, /letter-spacing:\s*0\.08em/);
  assert.match(list, /color:\s*var\(--color-text\)/);
  assert.match(list, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(list, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});
