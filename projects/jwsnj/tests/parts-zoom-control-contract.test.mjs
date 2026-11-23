// Figma PC 344:1079 / SP 442:2973: native lightbox icon geometry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../theme/css/module/module_zoom-button.css',import.meta.url),'utf8');
test('zoom control preserves native link/lightbox wrapper and 3:2 image',()=>{
 assert.match(css,/\.wp-block-image:has\(> a\) > a/);
 assert.match(css,/\.wp-lightbox-container \.lightbox_wrap/);
 assert.match(css,/aspect-ratio:\s*3\s*\/\s*2/);
 assert.match(css,/width:\s*calc\(44 \* var\(--to-rem-func\)\)/);
 assert.match(css,/height:\s*calc\(44 \* var\(--to-rem-func\)\)/);
 assert.match(css,/border-radius:\s*50%/);
 assert.match(css,/font-size:\s*calc\(20 \* var\(--to-rem-func\)\)/);
 assert.match(css,/content:\s*var\(--icon-zoom\)/);
 assert.match(css,/pointer-events:\s*none/);
 assert.match(css,/&:focus-visible/);
 assert.doesNotMatch(css,/white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});
test('existing download, external, and hover variants remain',()=>{
 assert.match(css,/\&\[target='_blank'\]/);
 assert.match(css,/\&\[href\$='\.pdf'\]/);
 assert.match(css,/@media \(any-hover: hover\)/);
});
