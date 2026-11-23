// Figma PC 344:1134 and SP 442:2940 green 1px separator.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../theme/css/blocks/wp-block-separator-style.css',import.meta.url),'utf8');
test('separator uses green translucent line rather than CODIA dashed sample',()=>{
  assert.match(css,/\.wp-block-separator\s*\{/);
  assert.match(css,/border:\s*0/);
  assert.match(css,/border-top:\s*calc\(1 \* var\(--to-rem-func\)\) solid color-mix\(in srgb, var\(--color-primary\) 50%, transparent\)/);
  assert.match(css,/width:\s*100%/);
  assert.doesNotMatch(css,/border-style:\s*dashed|figma\.com\/api\/mcp\/asset|white-space:\s*nowrap/);
});
