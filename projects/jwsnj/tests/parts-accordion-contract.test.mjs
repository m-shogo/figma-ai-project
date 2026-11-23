// Figma parts PC 357:938 / SP 442:2908: Gutenberg details accordion
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-details-style.css', import.meta.url), 'utf8');

test('accordion title has Figma 18px medium typography with natural wrapping and 75px min hit area', () => {
  assert.match(css, /border-radius:\s*calc\(3 \* var\(--to-rem-func\)\)/);
  assert.match(css, /min-height:\s*calc\(75 \* var\(--to-rem-func\)\)/);
  assert.match(css, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(css, /font-weight:\s*500/);
  assert.match(css, /font-size:\s*calc\(18 \* var\(--to-rem-func\)\)/);
  assert.match(css, /letter-spacing:\s*0\.05em/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /&:focus-visible/);
});

test('open accordion body uses 32px inset, grey separator and Q/A accent', () => {
  assert.match(css, /padding:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.match(css, /border-top:\s*calc\(1 \* var\(--to-rem-func\)\) solid var\(--jwsnj-color-separator\)/);
  assert.match(css, /line-height:\s*1\.6/);
  assert.match(css, /content:\s*'Q';\s*color:\s*var\(--color-accent\)/);
  assert.match(css, /content:\s*'A';\s*color:\s*var\(--color-accent\)/);
  assert.match(css, /\&\[open\]\s*\{/);
  assert.match(css, /rotate:\s*0deg/);
  assert.doesNotMatch(css, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});
