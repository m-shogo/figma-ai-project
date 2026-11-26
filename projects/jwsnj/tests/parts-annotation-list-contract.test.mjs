// Figma PC 344:937 and SP 442:2796; annotation list is copy, not an icon asset.
// Run: node --test projects/jwsnj/tests/parts-annotation-list-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-list-style.css', import.meta.url), 'utf8');
const start = css.indexOf('  ul.annotation-list {');
const stop = css.indexOf('  /* //---------- anchor-box, border-list ---------- */', start);
assert.ok(start >= 0 && stop > start, 'Annotation-list rule exists');
const annotation = css.slice(start, stop);

test('Figma caution mark is red and content maintains the approved line rhythm', () => {
  assert.match(annotation, /content:\s*'※'/);
  assert.match(annotation, /color:\s*#d50b0b/);
  assert.match(annotation, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(annotation, /font-size:\s*calc\(14 \* var\(--to-rem-func\)\)/);
  assert.match(annotation, /line-height:\s*1\.5/);
  assert.match(annotation, /line-height:\s*1\.75/);
  assert.match(annotation, /letter-spacing:\s*0\.05em/);
  assert.match(annotation, /overflow-wrap:\s*anywhere/);
});

test('annotation blocks keep 10px internal gap and 20px external clearance', () => {
  assert.match(annotation, /gap:\s*calc\(10 \* var\(--to-rem-func\)\)/);
  assert.match(annotation, /margin-top:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(annotation, /margin-bottom:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(annotation, /padding-left:\s*calc\(31 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(annotation, /figma\.com\/api\/mcp\/asset|white-space:\s*nowrap/);
});

test('annotation clearance wins against the generic adjacent list selector in either order', () => {
  assert.match(annotation, /\.wp-block-list \+ ul\.wp-block-list\.annotation-list,\s*ul\.wp-block-list\.annotation-list \+ \.wp-block-list\s*\{\s*margin-top:\s*calc\(20 \* var\(--to-rem-func\)\)/);
});

test('ordinary content neighbors have one 20px margin owner without changing section headings', () => {
  const groups = [...annotation.matchAll(/:is\((p, \.wp-block-list,[\s\S]*?\.wp-block-acf-navigation-large)\)/g)];
  assert.equal(groups.length, 2);
  assert.equal(groups[0][1], groups[1][1], 'the before/after neighbor sets must match');
  for (const block of ['.wp-block-image', '.wp-block-gallery', '.wp-block-group', '.wp-block-buttons', '.wp-block-details', '.wp-block-table', '.wp-block-media-text']) {
    assert.ok(groups[0][1].includes(block), block);
  }
  assert.doesNotMatch(groups[0][1], /\bh[1-6]\b|\.wp-block-separator/);
  assert.match(annotation, /&:has\(\+ ul\.wp-block-list\.annotation-list\)\s*\{\s*margin-bottom:\s*0;/);
  assert.match(annotation, /& \+ ul\.wp-block-list\.annotation-list,\s*ul\.wp-block-list\.annotation-list \+ &\s*\{\s*margin-top:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(annotation, /ul\.wp-block-list\.annotation-list:has\(\+ :is\([\s\S]*?\)\)\s*\{\s*margin-bottom:\s*0;/);
});
