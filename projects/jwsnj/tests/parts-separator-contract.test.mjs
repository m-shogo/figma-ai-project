// Figma PC 344:1135 and SP 442:3204 — line with official centered blossom.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-separator-style.css', import.meta.url), 'utf8');
test('native separator uses official blossom over a 1px translucent green line', () => {
  assert.match(css, /\.wp-block-separator\s*\{/);
  assert.match(css, /border:\s*0/);
  assert.match(css, /height:\s*calc\(17 \* var\(--to-rem-func\)\)/);
  assert.match(css, /width:\s*100%/);
  assert.match(css, /background-image:\s*url\('\.\.\/\.\.\/images\/common\/ico_blossom\.svg'\)/);
  assert.match(css, /linear-gradient\(var\(--jwsnj-color-white\), var\(--jwsnj-color-white\)\)/);
  assert.match(css, /color-mix\(in srgb, var\(--color-primary\) 50%, transparent\)/);
  assert.match(css, /background-size:\s*auto calc\(17 \* var\(--to-rem-func\)\),\s*calc\(8 \* var\(--to-rem-func\)\) calc\(8 \* var\(--to-rem-func\)\),\s*100% calc\(1 \* var\(--to-rem-func\)\)/);
  assert.match(css, /background-position:\s*center, center, center/);
  assert.match(css, /background-repeat:\s*no-repeat/);
  assert.match(css, /margin-top:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.match(css, /margin-bottom:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.match(css, /margin-top:\s*calc\(25 \* var\(--to-rem-func\)\)/);
  assert.match(css, /margin-bottom:\s*calc\(23 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(css, /border-style:\s*dashed|figma\.com\/api\/mcp\/asset|white-space:\s*nowrap/);
  assert.ok(readFileSync(new URL('../theme/images/common/ico_blossom.svg', import.meta.url)).length > 0);
});

