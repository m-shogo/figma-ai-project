// Figma parts heading contract: PC 344:906/344:903, SP 445:3209/445:3236.
// Run: node --test projects/jwsnj/tests/parts-heading-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-heading-style.css', import.meta.url), 'utf8');

function rule(selector) {
  const start = css.indexOf(selector + ' {');
  assert.ok(start >= 0, 'Missing rule: ' + selector);
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  assert.fail('Unclosed CSS rule: ' + selector);
}

const h2 = rule('h2:is(:not([class]), .wp-block-heading)');
const h3 = rule('h3:is(:not([class]), .wp-block-heading)');

test('h2 follows Figma PC 30px and SP 24px with natural multiline flow', () => {
  assert.match(h2, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(h2, /font-weight:\s*500/);
  assert.match(h2, /font-size:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(h2, /@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)[\s\S]*?font-size:\s*calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(h2, /line-height:\s*1\.4/);
  assert.match(h2, /letter-spacing:\s*0\.05em/);
  assert.match(h2, /--_heading-stroke-width:\s*calc\(3 \* var\(--to-rem-func\)\)/);
  assert.match(h2, /border-bottom:\s*var\(--_heading-stroke-width\) solid var\(--color-primary\)/);
  assert.match(h2, /border-image:\s*linear-gradient\(to right, var\(--color-primary\) 16%, var\(--jwsnj-color-base-lightgreen-02\) 16%\) 1/);
  assert.match(h2, /padding-bottom:\s*calc\(24 \* var\(--to-rem-func\) - var\(--_heading-stroke-width\)\)/);
  assert.match(h2, /padding-bottom:\s*calc\(28 \* var\(--to-rem-func\) - var\(--_heading-stroke-width\)\)/);
  assert.match(h2, /overflow-wrap:\s*anywhere/);
});

test('h3 uses Figma cyan band and responsive text without fixed heights', () => {
  assert.match(h3, /font-size:\s*calc\(22 \* var\(--to-rem-func\)\)/);
  assert.match(h3, /font-size:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(h3, /background-color:\s*var\(--jwsnj-color-sec\)/);
  assert.match(h3, /color:\s*var\(--jwsnj-color-white\)/);
  assert.match(h3, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(h3, /line-height:\s*1\.4/);
  assert.match(h3, /padding:\s*calc\(10 \* var\(--to-rem-func\)\) calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(h3, /margin-bottom:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(h3, /margin-bottom:\s*calc\(30 \* var\(--to-rem-func\)\)/);
  assert.match(h3, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(h3, /&::after|(?:^|[;{}\n])\s*(?:min-height|max-height|height)\s*:|white-space:\s*nowrap/);
});

test('scope remains existing WordPress/editor headings', () => {
  assert.match(css, /\.block-editor_wrap,\s*\.editor-styles-wrapper\s*\{/);
  assert.match(css, /h4:is\(:not\(\[class\]\), \.wp-block-heading\)/);
  assert.doesNotMatch(h2 + h3, /figma\.com\/api\/mcp\/asset|position:\s*absolute|white-space:\s*nowrap/);
});

const h4 = rule('h4:is(:not([class]), .wp-block-heading)');
test('h4 follows PC/SP 18px typography and uses the existing official blossom', () => {
  assert.match(h4, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(h4, /font-weight:\s*500/);
  assert.match(h4, /font-size:\s*calc\(18 \* var\(--to-rem-func\)\)/);
  assert.match(h4, /line-height:\s*1\.4/);
  assert.match(h4, /letter-spacing:\s*0\.05em/);
  assert.match(h4, /margin-bottom:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(h4, /padding-left:\s*calc\(26 \* var\(--to-rem-func\)\)/);
  assert.match(h4, /background-image:\s*url\('\.\.\/\.\.\/images\/common\/ico_blossom\.svg'\)/);
  assert.match(h4, /background-size:\s*auto calc\(17 \* var\(--to-rem-func\)\)/);
  assert.match(h4, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(h4, /border-left|display:\s*flex|white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
  assert.ok(readFileSync(new URL('../theme/images/common/ico_blossom.svg', import.meta.url)).length > 0);
});


test('opt-in course section heading uses existing Gutenberg group, semantic H2 and editable English paragraph',()=>{
  const group=readFileSync(new URL('../theme/css/blocks/wp-block-group-style.css',import.meta.url),'utf8');
  const s=group.slice(group.indexOf(':is(.block-editor_wrap, .editor-styles-wrapper) .wp-block-group.is-style-jwsnj-course-heading'));
  assert.ok(s.length>100);
  assert.match(s,/flex-wrap:\s*wrap/);
  assert.match(s,/gap:\s*calc\(8 \* var\(--to-rem-func\)\) calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(s,/> h2\.wp-block-heading/);
  assert.match(s,/border-image:\s*none/);
  assert.match(s,/font-size:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.match(s,/font-weight:\s*700/);
  assert.match(s,/letter-spacing:\s*0\.1em/);
  assert.match(s,/> p,/);
  assert.match(s,/font-family:\s*var\(--font-sansSerif-en\)/);
  assert.match(s,/font-size:\s*calc\(13 \* var\(--to-rem-func\)\)/);
  assert.match(s,/color:\s*var\(--color-primary\)/);
  assert.doesNotMatch(s,/white-space:\s*nowrap|position:\s*absolute|(?:^|[;{}\n])\s*height\s*:/);
  const editor=readFileSync(new URL('../theme/inc/editor.php',import.meta.url),'utf8');
  assert.match(editor,/register_block_style\('core\/group', array\(\s*'name' => 'jwsnj-course-heading'/);
  for(const path of ['style.css','editor-style.css']){
    assert.match(readFileSync(new URL('../theme/css/'+path,import.meta.url),'utf8'),/@import '\.\/blocks\/wp-block-group-style\.css'/);
  }
});

test('course introduction typography reuses bilingual layout and has an opt-in editable lead',()=>{
  const group=readFileSync(new URL('../theme/css/blocks/wp-block-group-style.css',import.meta.url),'utf8');
  assert.match(group,/\.wp-block-group\.is-style-jwsnj-course-heading,\s*:is\(\.block-editor_wrap, \.editor-styles-wrapper\) \.wp-block-group\.is-style-jwsnj-course-intro-heading\s*\{/);
  const intro=group.slice(group.indexOf('/* Course introduction title PC 534:2369'));
  assert.match(intro,/font-size:\s*calc\(36 \* var\(--to-rem-func\)\)/);
  assert.match(intro,/font-size:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  const textCss=readFileSync(new URL('../theme/css/blocks/wp-block-text-style.css',import.meta.url),'utf8');
  const lead=textCss.slice(textCss.indexOf('/* Course introduction lead PC 534:2363'));
  assert.match(lead,/p\.is-style-jwsnj-course-lead/);
  assert.match(lead,/font-weight:\s*500/);
  assert.match(lead,/font-size:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(lead,/line-height:\s*1\.8/);
  assert.match(lead,/overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(intro+lead,/white-space:\s*nowrap|position:\s*absolute|(?:^|[;{}\n])\s*height\s*:/);
  const editor=readFileSync(new URL('../theme/inc/editor.php',import.meta.url),'utf8');
  assert.match(editor,/register_block_style\('core\/group', array\(\s*'name' => 'jwsnj-course-intro-heading'/);
  assert.match(editor,/register_block_style\('core\/paragraph', array\(\s*'name' => 'jwsnj-course-lead'/);
});

test('course grades opt-in native list preserves label and responsive wrapping without invented values',()=>{
  const group=readFileSync(new URL('../theme/css/blocks/wp-block-group-style.css',import.meta.url),'utf8');
  const s=group.slice(group.indexOf('/* Course grade row PC 539:3627'));
  assert.match(s,/\.wp-block-group\.is-style-jwsnj-course-grades/);
  assert.match(s,/flex-wrap:\s*wrap/);
  assert.match(s,/background:\s*var\(--color-accent\)/);
  assert.match(s,/content:\s*'\\f303'\s*\/\s*''/);
  assert.match(s,/font-family:\s*var\(--font-awesome\)/);
  assert.match(s,/font-weight:\s*900/);
  assert.match(s,/ul\.wp-block-list:not\(\.annotation-list\)/);
  assert.match(s,/&::before\s*\{\s*content:\s*none/);
  assert.match(s,/font-size:\s*calc\(14 \* var\(--to-rem-func\)\)/);
  assert.match(s,/border-inline-end:\s*calc\(1 \* var\(--to-rem-func\)\) solid var\(--jwsnj-color-separator\)/);
  assert.doesNotMatch(s,/white-space:\s*nowrap|position:\s*absolute|(?:^|[;{}\n])\s*height\s*:|年中組|年長組/);
  const editor=readFileSync(new URL('../theme/inc/editor.php',import.meta.url),'utf8');
  assert.match(editor,/register_block_style\('core\/group', array\(\s*'name' => 'jwsnj-course-grades'/);
});
