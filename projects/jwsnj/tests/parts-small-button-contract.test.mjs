// Figma PC 344:969 / SP 442:2833 — small Gutenberg button contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../theme/css/blocks/wp-block-buttonLink-style.css',import.meta.url),'utf8');
const start=css.indexOf('        &.small {');
const end=css.indexOf('\n    }\n}\n\n.block-editor_wrap',start);
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
  assert.match(small,/&\[href\$='\.pdf'\]::after/);
  assert.match(small,/content:\s*'\\f15b'/);
  assert.match(small,/&::before\s*\{\s*content:\s*''/);
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

test('small circle and glyph are independently centered for every icon and wrap state', () => {
  const before = small.match(/&::before\s*\{([^}]+)\}/)?.[1];
  const after = small.match(/&::after\s*\{([^}]+)\}/)?.[1];
  assert.ok(before && after);
  assert.match(before, /content:\s*''/);
  assert.match(before, /box-sizing:\s*border-box/);
  assert.match(before, /width:\s*calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(after, /content:\s*'\\f061'/);
  assert.match(after, /left:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(after, /top:\s*50%/);
  assert.match(after, /transform:\s*translate\(-50%, -50%\)/);
  assert.match(after, /letter-spacing:\s*0/);
  assert.match(after, /text-box-trim:\s*trim-both/);
  assert.match(after, /text-box-edge:\s*cap alphabetic/);
  assert.match(small, /\.wp-block-button \.wp-block-button__link\s*\{/);
  assert.match(small, /--_small-icon-color:\s*var\(--jwsnj-color-sec\)/);
});
test('small external link retains the circle and uses the same glyph center and hover color', () => {
  const external = small.slice(small.indexOf("&[target='_blank']"), small.indexOf("&[href$='.pdf']::after"));
  for (const ext of ['pdf','doc','docx','docm','xls','xlsx','xlsm','png','jpg','jpeg','gif','webp']) {
    assert.ok(external.includes("[href$='." + ext + "']"), ext + ' retains its file icon');
  }
  assert.match(external, /&::after\s*\{\s*content:\s*''/);
  assert.match(external, /width:\s*calc\(13 \* var\(--to-rem-func\)\)/);
  assert.match(external, /height:\s*calc\(12 \* var\(--to-rem-func\)\)/);
  assert.match(external, /mask:\s*url\('\.\.\/\.\.\/images\/common\/ico-blank\.svg'\) center \/ contain no-repeat/);
  assert.match(external, /background-color:\s*currentColor/);
  assert.doesNotMatch(external, /left:|right:|transform:|&::before/);
  assert.match(small, /color:\s*var\(--_small-icon-color\)/);
});
test('desktop gap media rule does not reapply large button minimum width to small buttons', () => {
  assert.match(small, /min-width:\s*0/);
  const desktop = css.slice(end, css.indexOf('    /* ホバー時のスタイル */'));
  assert.doesNotMatch(desktop, /min-width\s*:/);
});

test('small buttons wrap into rows on PC and flow vertically on SP', () => {
  assert.match(small, /gap:\s*calc\(20 \* var\(--to-rem-func\)\) calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(small, /@media \(width < calc\(768 \* \(1 \/ 16 \* 1rem\)\)\)\s*\{\s*flex-direction:\s*column;\s*align-items:\s*flex-start/);
  assert.doesNotMatch(small, /flex-direction:\s*row/);
});
