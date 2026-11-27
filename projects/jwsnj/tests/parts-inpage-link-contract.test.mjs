// Figma PC parts 357:1022 and SP parts 442:2948; do not hardcode destinations.
// Run: node --test projects/jwsnj/tests/parts-inpage-link-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-inPageLink-style.css', import.meta.url), 'utf8');
const php = readFileSync(new URL('../theme/acf/blocks/inPageLink.php', import.meta.url), 'utf8');

test('page links match Figma sizes, backgrounds, icon, and text rhythm', () => {
  assert.match(css, /gap:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(css, /min-height:\s*calc\(48 \* var\(--to-rem-func\)\)/);
  assert.match(css, /padding:\s*calc\(12 \* var\(--to-rem-func\)\) calc\(16 \* var\(--to-rem-func\)\)/);
  assert.match(css, /background-color:\s*var\(--jwsnj-color-base-lightblue\)/);
  assert.match(css, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(css, /font-size:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(css, /line-height:\s*1\.4/);
  assert.match(css, /content:\s*'\\f063'/);
  assert.match(css, /background-color:\s*var\(--jwsnj-color-sec\)/);
  assert.match(css, /font-weight:\s*900/);
  assert.match(css, /&:focus-visible/);
});

test('page links flow and wrap across SP and PC while keeping ACF destinations', () => {
  assert.match(css, /flex-direction:\s*column/);
  assert.match(css, /width:\s*100%/);
  assert.match(css, /flex-direction:\s*row/);
  assert.match(css, /flex-wrap:\s*wrap/);
  assert.match(css, /min-width:\s*min\(100%,\s*calc\(304 \* var\(--to-rem-func\)\)\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(css, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
  assert.match(php, /get_sub_field\('inPageLink_id'\)/);
  assert.match(php, /esc_attr\(rawurlencode\(\$item\['id'\]\)\)/);
  assert.match(php, /esc_html\(\$item\['title'\]\)/);
});

test('Figma mobile page links honor 304px minimum without exceeding narrower screens',()=>{
  assert.match(css,/@media \(width < calc\(768 \* \(1 \/ 16 \* 1rem\)\)\)/);
  assert.match(css,/\.inPageLink\s*\{[^{}]*@media \(width < calc\(768 \* \(1 \/ 16 \* 1rem\)\)\)\s*\{\s*min-width:\s*min\(100%,\s*calc\(304 \* var\(--to-rem-func\)\)\)/);
});

test('page links omit incomplete repeater rows without inventing an anchor', () => {
  assert.match(php, /if \(\$title === '' \|\| \$id === '' \|\| preg_match/);
  assert.match(php, /substr\(\$id, 0, 1\) === '#'/);
  assert.match(php, /\$count = count\(\$items\)/);
  assert.match(php, /if \(\$count > 0\) :/);
  assert.doesNotMatch(php, /href="#"|sanitize_title\(/);
});

test('literal and encoded anchors scroll safely; missing or malformed fragments do not move', () => {
  const js = readFileSync(new URL('../theme/js/common.js', import.meta.url), 'utf8');
  const source = js.slice(js.indexOf('function scrollToAnker(hash) {'), js.indexOf('  // SP用メニュー＆PCメガメニュー設定'));
  const fn = source.slice(0, source.indexOf('\n    });'));
  const calls = [];
  const root = { top: 0 };
  const element = { top: 500 };
  const document = { documentElement: root, getElementById(id) {
    calls.push(['id', id]);
    return id === '学校:案内.1' ? element : null;
  }};
  const window = { matchMedia: () => ({ matches: true }) };
  const $ = value => {
    if (value === '#global_header') return {length: 1, innerHeight: () => 80};
    if (value === 'body,html') return {stop: () => ({scrollTop: position => calls.push(['scroll', position])})};
    return {length: value ? 1 : 0, offset: () => ({top: value.top})};
  };
  const scroll = new Function('document','window','$',fn + '\nreturn scrollToAnker;')(document,window,$);
  scroll('#'+encodeURIComponent('学校:案内.1'));
  assert.deepEqual(calls, [['id','学校:案内.1'],['scroll',390]]);
  calls.length = 0;
  scroll('#missing'); scroll('#%ZZ');
  assert.deepEqual(calls, [['id','missing']]);
  calls.length = 0;
  scroll('html');
  assert.deepEqual(calls,[['scroll',0]]);
  const pageScroll = js.slice(js.indexOf('const pageScroll ='), js.indexOf('function scrollToAnker(hash)'));
  assert.doesNotMatch(pageScroll,/scrollTop\(1\)/);
});

test('page-link icon isolates the FA glyph from inherited text tracking', () => {
  const icon = css.match(/&::after\s*\{([^}]+)\}/)?.[1];
  assert.ok(icon);
  assert.match(icon,/box-sizing:\s*border-box/);
  assert.match(icon,/letter-spacing:\s*0/);
  assert.match(icon,/font-style:\s*normal/);
  assert.match(icon,/text-box-trim:\s*none/);
  assert.match(icon,/line-height:\s*1;/);
});

test('page-link transition follows the shared 0.3s token and reduced motion', () => {
  assert.match(css, /transition:\s*background-color var\(--transition-duration\);\s*@media \(prefers-reduced-motion: reduce\)\s*\{\s*transition:\s*none/);
});
