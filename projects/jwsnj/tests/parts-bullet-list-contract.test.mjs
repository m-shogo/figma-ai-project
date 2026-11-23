// Figma parts unordered list PC 357:1004 and SP 442:2816.
// Run: node --test projects/jwsnj/tests/parts-bullet-list-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-list-style.css', import.meta.url), 'utf8');
const from = css.indexOf('ul.wp-block-list:not(.annotation-list) {');
const until = css.indexOf('    ol.wp-block-list:not(.annotation-list) {', from);
assert.ok(from >= 0 && until > from, 'Unordered list CSS block must exist');
const block = css.slice(from, until);

test('Figma bullet color, size and text rhythm are present', () => {
  assert.match(block, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(block, /font-size:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(block, /line-height:\s*1\.6/);
  assert.match(block, /letter-spacing:\s*0\.05em/);
  assert.match(block, /padding-left:\s*calc\(18 \* var\(--to-rem-func\)\)/);
  assert.match(block, /width:\s*calc\(6 \* var\(--to-rem-func\)\)/);
  assert.match(block, /height:\s*calc\(6 \* var\(--to-rem-func\)\)/);
  assert.match(block, /background-color:\s*var\(--color-accent\)/);
  assert.match(block, /overflow-wrap:\s*anywhere/);
});

test('nested Gutenberg bullets are outlined and use Figma 12/8px spacing', () => {
  assert.match(block, /> ul\.wp-block-list\s*\{/);
  assert.match(block, /margin-top:\s*calc\(12 \* var\(--to-rem-func\)\)/);
  assert.match(block, /padding-left:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(block, /gap:\s*calc\(8 \* var\(--to-rem-func\)\)/);
  assert.match(block, /> li::before\s*\{[\s\S]*?background-color:\s*transparent/);
  assert.match(block, /border:\s*calc\(1 \* var\(--to-rem-func\)\) solid var\(--color-accent\)/);
  assert.doesNotMatch(block, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});

test('ordered list and annotation selectors retain separate ownership', () => {
  assert.match(css, /ol\.wp-block-list:not\(\.annotation-list\)/);
  assert.match(css, /ul\.annotation-list/);
});
