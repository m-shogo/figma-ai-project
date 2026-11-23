// Figma parts PC 344:1134 / SP 442:2940 separator parity.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../theme/css/module/module_line-01.css',import.meta.url),'utf8');
test('legacy line module uses the same 50%-green hairline as Figma separator',()=>{
 assert.match(css,/\.module_line-01\s*\{/);
 assert.match(css,/border-width:\s*calc\(1 \* var\(--to-rem-func\)\) 0 0 0/);
 assert.match(css,/border-style:\s*solid/);
 assert.match(css,/border-color:\s*color-mix\(in srgb, var\(--color-primary\) 50%, transparent\)/);
 assert.match(css,/width:\s*100%/);
 assert.doesNotMatch(css,/border-style:\s*dashed|figma\.com\/api\/mcp\/asset|white-space:\s*nowrap/);
});
