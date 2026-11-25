// Figma PC 344:969 / SP 442:2833 — small Gutenberg button contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../theme/css/blocks/wp-block-buttonLink-style.css',import.meta.url),'utf8');
const start=css.indexOf('        &.small {');
const end=css.indexOf('        @media (calc(768',start);
const small=css.slice(start,end);
test('small variant uses 30px mint leading icon, 8px gap, 16px labels',()=>{
  assert.ok(start!==-1&&end>start);
  assert.match(small,/min-height:\s*calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(small,/flex:\s*0 0 calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(small,/gap:\s*calc\(8 \* var\(--to-rem-func\)\)/);
  assert.match(small,/font-size:\s*calc\(16 \* var\(--to-rem-func\)\)/);
  assert.match(small,/line-height:\s*1\.5/);
  assert.match(small,/background-color:\s*var\(--jwsnj-color-sec\)/);
  assert.match(small,/content:\s*'\\f061'/);
  assert.match(small,/overflow-wrap:\s*anywhere/);
});
test('small icons distinguish file kinds and preserve focus handling in shared link',()=>{
  assert.match(small,/&\[target='_blank'\]:where\(:not\(/);
  assert.match(small,/&\[href\$='\.pdf'\]::before/);
  assert.match(small,/content:\s*var\(--icon-file\)/);
  assert.match(small,/&::after\s*\{\s*content:\s*none/);
  assert.match(css,/&:focus-visible/);
  assert.doesNotMatch(small,/white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});

test('small button hover retains dark label on transparent background after generic hover rules',()=>{
  const hover=css.slice(css.indexOf('    /* ホバー時のスタイル */'));
  assert.match(hover,/\.wp-block-buttons\.small \.wp-block-button/);
  assert.match(hover,/\.wp-block-button__link:hover\s*\{\s*background:\s*none;\s*color:\s*var\(--color-text\)/);
  assert.match(hover,/&\.is-style-outline \.wp-block-button__link:hover\s*\{\s*background:\s*none;\s*color:\s*var\(--color-text\)/);
  assert.ok(hover.lastIndexOf('.wp-block-buttons.small')>hover.indexOf('&:has(.wp-block-button__link:hover)'), 'specific small hover rule follows generic hover rule');
});

test('small external link retains the circle and recolors only the official SVG on hover', () => {
  const external = small.slice(small.indexOf("&[target='_blank']"), small.indexOf("&[href$='.pdf']::before"));
  for (const ext of ['pdf','doc','docx','docm','xls','xlsx','xlsm','png','jpg','jpeg','gif','webp']) {
    assert.ok(external.includes("[href$='." + ext + "']"), ext + ' retains its file icon');
  }
  assert.match(external, /&::before\s*\{\s*content:\s*''/);
  assert.match(external, /left:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(external, /width:\s*calc\(13 \* var\(--to-rem-func\)\)/);
  assert.match(external, /height:\s*calc\(12 \* var\(--to-rem-func\)\)/);
  assert.match(external, /mask:\s*url\('\.\.\/\.\.\/images\/common\/ico-blank\.svg'\) center \/ contain no-repeat/);
  assert.match(external, /background-color:\s*var\(--color-secondary\)/);
  assert.match(external, /&:hover::after\s*\{\s*background-color:\s*var\(--jwsnj-color-sec\)/);
});
test('desktop gap media rule does not reapply large button minimum width to small buttons', () => {
  assert.match(small, /min-width:\s*0/);
  const desktop = css.slice(end, css.indexOf('    /* ホバー時のスタイル */'));
  assert.doesNotMatch(desktop, /min-width\s*:/);
});
