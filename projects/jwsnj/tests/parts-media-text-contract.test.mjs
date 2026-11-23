// Figma media with text PC 344:929 / SP 442:2788.
// Run: node --test projects/jwsnj/tests/parts-media-text-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-media-text-style.css', import.meta.url), 'utf8');
test('dynamic WordPress media/text layout follows PC/SP Figma geometry', () => {
  assert.match(css, /\.wp-block-media-text\s*\{/);
  assert.match(css, /gap:\s*calc\(40 \* var\(--to-rem-func\)\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 410fr\) minmax\(0, 510fr\)/);
  assert.match(css, /min-width:\s*0/);
});
test('media assets remain CMS-driven and use proportional Figma crop', () => {
  assert.match(css, /aspect-ratio:\s*410 \/ 273/);
  assert.match(css, /object-fit:\s*cover/);
  assert.match(css, /height:\s*auto/);
  assert.match(css, /border-radius:\s*calc\(5 \* var\(--to-rem-func\)\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(css, /figma\.com\/api\/mcp\/asset|white-space:\s*nowrap|position:\s*absolute/);
});

test('media-text figure caption matches Figma 12px SP and 14px PC', () => {
  assert.match(css, /\.wp-block-media-text__media \.wp-element-caption/);
  assert.match(css, /font-size:\s*calc\(12 \* var\(--to-rem-func\)\)/);
  assert.match(css, /line-height:\s*1\.6/);
  assert.match(css, /font-size:\s*calc\(14 \* var\(--to-rem-func\)\)/);
  assert.match(css, /line-height:\s*1\.5/);
  assert.match(css, /font-weight:\s*500/);
  assert.match(css, /margin-top:\s*calc\(20 \* var\(--to-rem-func\)\)/);
});
