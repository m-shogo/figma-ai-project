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

test('gallery zoom affordance is inset 16px SP / 20px PC and reverses colors on hover or focus',()=>{
 const gallery=css.slice(css.indexOf('/* Figma gallery PC 344:1079'));
 assert.ok(gallery.length>0);
 assert.match(gallery,/\.wp-block-image > a:not\(\[target='_blank'\]\):not\(\[href\$='\.pdf'\]\)/);
 assert.match(gallery,/\.wp-lightbox-container \.lightbox_wrap/);
 assert.match(gallery,/width:\s*100%/);
 assert.match(gallery,/right:\s*calc\(16 \* var\(--to-rem-func\)\);\s*bottom:\s*calc\(16 \* var\(--to-rem-func\)\)/);
 assert.match(gallery,/@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)\s*\{\s*&::after\s*\{\s*right:\s*calc\(20 \* var\(--to-rem-func\)\);\s*bottom:\s*calc\(20 \* var\(--to-rem-func\)\)/);
 assert.match(gallery,/&:hover::after\s*\{\s*opacity:\s*1;\s*background-color:\s*var\(--color-secondary\);\s*color:\s*var\(--color-primary\)/);
 assert.match(gallery,/&:focus-visible::after/);
 assert.match(gallery,/\.wp-lightbox-container:focus-within \.lightbox_wrap::after/);
 assert.match(css,/transition:\s*opacity var\(--transition-duration\), background-color var\(--transition-duration\), color var\(--transition-duration\);\s*@media \(prefers-reduced-motion: reduce\)\s*\{\s*transition:\s*none/);
 assert.doesNotMatch(gallery,/pointer-events:\s*auto|figma\.com\/api\/mcp\/asset/);
});


test('gallery magnifier isolates its glyph from inherited typography and keeps the 44px outer circle', () => {
  const gallery=css.slice(css.indexOf('/* Figma gallery PC 344:1079'));
  const icon=gallery.match(/&::after\s*\{([^}]+)\}/)?.[1];
  assert.ok(icon);
  assert.match(icon,/box-sizing:\s*border-box/);
  assert.match(icon,/font-style:\s*normal/);
  assert.match(icon,/letter-spacing:\s*0/);
  assert.match(icon,/text-box-trim:\s*none/);
  assert.doesNotMatch(icon,/transform:|translate:/);
});

test('gallery native zoom button is visible and replaces its decorative duplicate', () => {
  assert.match(css, /\.wp-lightbox-container:has\(> button\.lightbox-trigger\)\s*\{\s*\.lightbox_wrap::after\s*\{\s*content:\s*none/);
  assert.match(css, /> button\.lightbox-trigger\s*\{[\s\S]*?inset:\s*auto !important/);
  assert.match(css, /opacity:\s*1/);
  assert.match(css, /&::before\s*\{\s*content:\s*var\(--icon-zoom\)/);
});
