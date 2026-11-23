// Figma PC 344:922 / SP 442:2782: opt-in bordered group block.
// Run: node --test projects/jwsnj/tests/parts-bordered-group-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../theme/css/blocks/wp-block-group-style.css', import.meta.url), 'utf8');
const start = css.indexOf('&.is-style-jwsnj-bordered-box {');
const end = css.indexOf('/* // ==========================================================================', start);
assert.ok(start >= 0 && end > start, 'Opt-in bordered group block must exist');
const rule = css.slice(start, end);
test('bordered group has approved Figma outline and safe wrap', () => {
  assert.match(rule, /border:\s*calc\(1 \* var\(--to-rem-func\)\) solid var\(--color-primary\)/);
  assert.match(rule, /border-radius:\s*calc\(5 \* var\(--to-rem-func\)\)/);
  assert.match(rule, /background-color:\s*var\(--jwsnj-color-white\)/);
  assert.match(rule, /min-width:\s*0/);
  assert.match(rule, /overflow-wrap:\s*anywhere/);
});
test('mobile uses 32px inset and desktop uses 40px inset', () => {
  assert.match(rule, /padding:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.match(rule, /@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)[\s\S]*?padding:\s*calc\(40 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(rule, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});
