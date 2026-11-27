// Figma PC parts gallery 344:1079; 3:2 imagery and responsive cards
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gallery=readFileSync(new URL('../theme/css/blocks/wp-block-gallery-style.css',import.meta.url),'utf8');
const image=readFileSync(new URL('../theme/css/blocks/wp-block-image-style.css',import.meta.url),'utf8');

test('gallery uses responsive one/two/three columns, natural captions and 3:2 crop',()=>{
  assert.match(gallery,/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(gallery,/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(gallery,/&\.columns-3\s*\{[^{}]*@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)\s*\{\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(gallery,/aspect-ratio:\s*3\s*\/\s*2/);
  assert.match(gallery,/object-fit:\s*cover/);
  assert.match(gallery,/gap:\s*calc\(20 \* var\(--to-rem-func\)\)/);
  assert.match(gallery,/font-size:\s*calc\(12 \* var\(--to-rem-func\)\)/);
  assert.match(gallery,/line-height:\s*1\.6/);
  assert.match(gallery,/figcaption\s*\{[^{}]*@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)\s*\{\s*font-size:\s*calc\(14 \* var\(--to-rem-func\)\)/);
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

test('three-column gallery variant pairs two tiles on SP and uses three tiles on PC',()=>{
  assert.match(gallery,/&\.columns-3\s*\{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);\s*column-gap:\s*calc\(15 \* var\(--to-rem-func\)\)/);
  assert.match(gallery,/@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)/);
  assert.match(gallery,/&\.columns-3\s*\{[^{}]*@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)\s*\{\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(gallery,/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test('desktop three-column gallery restores Figma 40px track gap',()=>{
 const media=gallery.slice(gallery.indexOf('    @media (calc(768'));
 assert.match(media,/&\.columns-3\s*\{[^{}]*@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)\s*\{\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);\s*column-gap:\s*calc\(40 \* var\(--to-rem-func\)\)/);
});

test('gallery rows retain Figma 40px separation and captions grow independently of the 3:2 crop', () => {
  assert.match(gallery, /grid-template-columns:\s*minmax\(0, 1fr\);\s*align-items:\s*start;\s*gap:\s*calc\(40 \* var\(--to-rem-func\)\)/);
  assert.match(gallery, /& \+ &\s*\{[\s\S]*?margin-top:\s*calc\(40 \* var\(--to-rem-func\)\)/);
  assert.match(gallery, /aspect-ratio:\s*3 \/ 2;\s*flex:\s*0 0 auto;\s*object-fit:\s*cover/);
  assert.match(gallery, /figcaption\s*\{\s*position:\s*static;\s*flex:\s*0 0 auto;\s*max-height:\s*none;\s*overflow:\s*visible;\s*margin:\s*0;\s*padding:\s*0;/);
  assert.match(gallery, /text-shadow:\s*none/);
});

test('cropped native gallery cards do not inherit core stretch and native trigger overlays the image cell', () => {
  assert.match(gallery, /figure\.wp-block-image:not\(#individual-image\)\.wp-block-image\s*\{\s*align-self:\s*start;\s*justify-content:\s*start/);
  assert.match(gallery, /&\.wp-lightbox-container:has\(> button\.lightbox-trigger\)/);
  assert.match(gallery, /> button\.lightbox-trigger\s*\{\s*grid-area:\s*1 \/ 1/);
});
