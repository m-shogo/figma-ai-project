// Figma PC parts 344:1006 / SP parts 442:2842: shared button layout contract.
// Run: node --test projects/jwsnj/tests/parts-button-geometry-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-buttonLink-style.css', import.meta.url), 'utf8');
const button = css.slice(css.indexOf('    .wp-block-buttons {'), css.indexOf('    /* ホバー時のスタイル */'));
assert.ok(button.length > 0, 'The existing WordPress button rules must be present');

test('button minimum geometry follows approved 260px x 50px Figma PC/SP component', () => {
  assert.match(button, /min-width:\s*min\(100%,\s*calc\(260 \* var\(--to-rem-func\)\)\)/);
  assert.match(button, /min-height:\s*calc\(50 \* var\(--to-rem-func\)\)/);
  assert.match(button, /font-size:\s*calc\(16 \* var\(--to-rem-func\)\)/);
  assert.match(button, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(button, /line-height:\s*1\.5/);
  assert.match(button, /padding-inline:\s*calc\(24 \* var\(--to-rem-func\)\) calc\(52 \* var\(--to-rem-func\)\)/);
  assert.match(button, /right:\s*calc\(20 \* var\(--to-rem-func\)\)/);
});

test('long button text wraps and icon variants keep working', () => {
  assert.match(button, /width:\s*fit-content/);
  assert.match(button, /max-width:\s*100%/);
  assert.match(button, /overflow-wrap:\s*anywhere/);
  assert.match(button, /word-break:\s*normal/);
  assert.match(button, /&:focus-visible\s*\{/);
  assert.match(button, /outline-offset:\s*calc\(3 \* var\(--to-rem-func\)\)/);
  assert.match(button, /content:\s*'\\f061'/);
  assert.match(button, /target='_blank'/);
  assert.match(button, /href\$='\.pdf'/);
  assert.doesNotMatch(button, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});
