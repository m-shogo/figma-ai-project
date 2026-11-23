// Figma PC parts 344:1027 / SP parts 442:2880: inline text link color/state.
// Run: node --test projects/jwsnj/tests/parts-text-link-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-textLink-style.css', import.meta.url), 'utf8');

test('inline text links use approved coral accent and preserve surrounding text flow', () => {
  assert.match(css, /color:\s*var\(--color-accent\)/);
  assert.match(css, /text-decoration-line:\s*none/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /word-break:\s*normal/);
  assert.doesNotMatch(css, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
  assert.doesNotMatch(css, /font-size:\s*\d/);
});

test('keyboard and hover keep link distinction and existing file icon variants', () => {
  assert.match(css, /&:focus-visible\s*\{/);
  assert.match(css, /text-decoration-line:\s*underline/);
  assert.match(css, /outline-offset:\s*calc\(2 \* var\(--to-rem-func\)\)/);
  assert.match(css, /&\[target='_blank'\]/);
  assert.match(css, /&\[href\$='\.pdf'\]/);
  assert.match(css, /content:\s*var\(--icon-blank\)/);
  assert.match(css, /content:\s*var\(--icon-pdf\)/);
});
