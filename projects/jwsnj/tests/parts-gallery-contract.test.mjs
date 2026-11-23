// Figma PC parts gallery 344:1079; 3:2 imagery and responsive cards
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gallery=readFileSync(new URL('../theme/css/blocks/wp-block-gallery-style.css',import.meta.url),'utf8');
const image=readFileSync(new URL('../theme/css/blocks/wp-block-image-style.css',import.meta.url),'utf8');

test('gallery uses responsive one/two/three columns, natural captions and 3:2 crop',()=>{
  assert.match(gallery,/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(gallery,/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(gallery,/&\.columns-3\s*\{\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(gallery,/aspect-ratio:\s*3\s*\/\s*2/);
  assert.match(gallery,/object-fit:\s*cover/);
  assert.match(gallery,/gap:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(gallery,/font-size:\s*calc\(14 \* var\(--to-rem-func\)\)/);
  assert.match(gallery,/line-height:\s*1\.5/);
  assert.match(gallery,/overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(gallery,/white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});

test('individual image captions reuse established Zen typography and 20px caption gap',()=>{
  assert.match(image,/\.wp-element-caption\.wp-element-caption/);
  assert.match(image,/margin-top:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(image,/font-size:\s*calc\(14 \* var\(--to-rem-func\)\)/);
  assert.match(image,/font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(image,/color:\s*var\(--color-text\)/);
  assert.doesNotMatch(image,/figma\.com\/api\/mcp\/asset/);
});
