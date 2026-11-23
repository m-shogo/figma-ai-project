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
  assert.match(small,/&\[target='_blank'\]::before/);
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
