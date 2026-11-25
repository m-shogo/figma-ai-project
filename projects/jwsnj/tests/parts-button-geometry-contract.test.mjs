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

test('external large button uses official SVG and excludes PDF/file glyph variants', () => {
  const large = button.slice(0, button.indexOf('        &.small {'));
  const external = large.match(/&\[target='_blank'\]:where\(:not\(([^)]+)\)\)\s*\{\s*&::after\s*\{([^}]+)\}/);
  assert.ok(external);
  for (const ext of ['pdf','doc','docx','docm','xls','xlsx','xlsm','png','jpg','jpeg','gif','webp']) {
    assert.ok(external[1].includes("[href$='." + ext + "']"), ext + ' retains its file icon');
  }
  assert.match(external[2], /content:\s*''/);
  assert.match(external[2], /background-color:\s*currentColor/);
  assert.match(external[2], /width:\s*calc\(14 \* var\(--to-rem-func\)\)/);
  assert.match(external[2], /height:\s*calc\(13 \* var\(--to-rem-func\)\)/);
  assert.match(external[2], /mask:\s*url\('\.\.\/\.\.\/images\/common\/ico-blank\.svg'\) center \/ contain no-repeat/);
  assert.ok(readFileSync(new URL('../theme/images/common/ico-blank.svg', import.meta.url)).length > 0);
});

test('large button groups share 20px spacing and a 40px transition to small buttons', () => {
  assert.match(button, /flex-wrap:\s*wrap;[\s\S]*?gap:\s*calc\(20 \* var\(--to-rem-func\)\);/);
  assert.match(button, /& \+ &\s*\{\s*margin-top:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(button, /&:not\(\.small\) \+ &\.small\s*\{\s*margin-top:\s*calc\(40 \* var\(--to-rem-func\)\)/);
});
