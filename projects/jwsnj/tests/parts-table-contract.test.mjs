// Figma PC 357:970, SP 442:2890 — table visual contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-table-style.css', import.meta.url), 'utf8');

test('table uses 15px Zen Kaku typography, pale header and visible cell borders', () => {
  assert.match(css, /\.wp-block-table,\s*\.wp-block-flexible-table-block-table/);
  assert.match(css, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(css, /font-size:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(css, /line-height:\s*1\.6/);
  assert.match(css, /letter-spacing:\s*0\.05em/);
  assert.match(css, /thead th\s*\{\s*background-color:\s*var\(--jwsnj-color-separator-light\)/);
  assert.match(css, /border:\s*calc\(1 \* var\(--to-rem-func\)\) solid var\(--jwsnj-color-separator\)/);
  assert.match(css, /font-weight:\s*400/);
  assert.match(css, /text-align:\s*center/);
  assert.doesNotMatch(css, /background-color:\s*var\(--color-primary\)\s*!important/);
});

test('table maintains 960px horizontal scroll on small viewports and wraps content', () => {
  assert.match(css, /&\.is-scroll-on-mobile\s*\{\s*overflow-x:\s*auto/);
  assert.match(css, /min-width:\s*calc\(960 \* var\(--to-rem-func\)\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /word-break:\s*normal/);
  assert.match(css, /scrollbar-color:\s*var\(--jwsnj-color-sec\)/);
  assert.doesNotMatch(css, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});
