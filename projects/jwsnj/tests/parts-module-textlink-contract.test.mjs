// Figma parts PC text link 344:1027 / SP 442:2880.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../theme/css/module/module_textLink.css',import.meta.url),'utf8');
test('legacy text-link module uses approved coral accent instead of CODIA blue',()=>{
 assert.match(css,/\.module_textLink\s*\{/);
 assert.match(css,/color:\s*var\(--color-accent\)/);
 assert.match(css,/text-decoration-line:\s*none/);
 assert.match(css,/overflow-wrap:\s*anywhere/);
 assert.match(css,/word-break:\s*normal/);
 assert.doesNotMatch(css,/color:\s*var\(--color-link\)|white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});
test('hover and keyboard focus underline, existing external/pdf/file icon variants survive',()=>{
 assert.match(css,/&:focus-visible/);
 assert.match(css,/@media \(any-hover: hover\)/);
 assert.match(css,/text-decoration-line:\s*underline/);
 assert.match(css,/\&\[target='_blank'\]/);
 assert.match(css,/\&\[href\$='\.pdf'\]/);
 assert.match(css,/content:\s*var\(--icon-file\)/);
});
