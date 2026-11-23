// Figma PC parts 357:1022 and SP parts 442:2948; do not hardcode destinations.
// Run: node --test projects/jwsnj/tests/parts-inpage-link-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-inPageLink-style.css', import.meta.url), 'utf8');
const php = readFileSync(new URL('../theme/acf/blocks/inPageLink.php', import.meta.url), 'utf8');

test('page links match Figma sizes, backgrounds, icon, and text rhythm', () => {
  assert.match(css, /gap:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(css, /min-height:\s*calc\(48 \* var\(--to-rem-func\)\)/);
  assert.match(css, /padding:\s*calc\(12 \* var\(--to-rem-func\)\) calc\(16 \* var\(--to-rem-func\)\)/);
  assert.match(css, /background-color:\s*var\(--jwsnj-color-base-lightblue\)/);
  assert.match(css, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(css, /font-size:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(css, /line-height:\s*1\.4/);
  assert.match(css, /content:\s*'\\f063'/);
  assert.match(css, /background-color:\s*var\(--jwsnj-color-sec\)/);
  assert.match(css, /font-weight:\s*900/);
  assert.match(css, /&:focus-visible/);
});

test('page links flow and wrap across SP and PC while keeping ACF destinations', () => {
  assert.match(css, /flex-direction:\s*column/);
  assert.match(css, /width:\s*100%/);
  assert.match(css, /flex-direction:\s*row/);
  assert.match(css, /flex-wrap:\s*wrap/);
  assert.match(css, /min-width:\s*min\(100%,\s*calc\(304 \* var\(--to-rem-func\)\)\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(css, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
  assert.match(php, /get_sub_field\('inPageLink_id'\)/);
  assert.match(php, /esc_attr\(\$id\)/);
  assert.match(php, /esc_html\(\$title\)/);
});

test('Figma mobile page links honor 304px minimum without exceeding narrower screens',()=>{
  assert.match(css,/@media \(width < calc\(768 \* \(1 \/ 16 \* 1rem\)\)\)/);
  assert.match(css,/\.inPageLink\s*\{\s*min-width:\s*min\(100%,\s*calc\(304 \* var\(--to-rem-func\)\)\)/);
});
