// Figma PC 344:922 / SP 442:2782: opt-in bordered group block.
// Run: node --test projects/jwsnj/tests/parts-bordered-group-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const css = readFileSync(new URL('../theme/css/blocks/wp-block-group-style.css', import.meta.url), 'utf8');
const start = css.indexOf('&.is-style-jwsnj-bordered-box {');
const end = css.indexOf('/* // ==========================================================================', start);
assert.ok(start >= 0 && end > start, 'Opt-in bordered group block must exist');
const rule = css.slice(start, end);
test('bordered group has approved Figma outline and safe wrap', () => {
  assert.match(rule, /border:\s*calc\(1 \* var\(--to-rem-func\)\) solid var\(--color-primary\)/);
  assert.match(rule, /border-radius:\s*calc\(5 \* var\(--to-rem-func\)\)/);
  assert.match(rule, /background-color:\s*var\(--jwsnj-color-white\)/);
  assert.match(rule, /min-width:\s*0/);
  assert.match(rule, /overflow-wrap:\s*anywhere/);
});
test('mobile uses 32px inset and desktop uses 40px inset', () => {
  assert.match(rule, /padding:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.match(rule, /@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)[\s\S]*?padding:\s*calc\(40 \* var\(--to-rem-func\)\)/);
  assert.doesNotMatch(rule, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
});

test('Figma background box is opt-in with 32/40px padding and shared heading rhythm', () => {
  const box = css.slice(css.indexOf('&.is-style-jwsnj-background-box {'), end);
  assert.ok(box.length > 0);
  assert.match(box, /background-color:\s*var\(--jwsnj-color-base-lightgreen\)/);
  assert.match(box, /border-radius:\s*calc\(5 \* var\(--to-rem-func\)\)/);
  assert.match(box, /padding:\s*calc\(32 \* var\(--to-rem-func\)\)/);
  assert.match(box, /@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)\s*\{\s*padding:\s*calc\(40 \* var\(--to-rem-func\)\)/);
  assert.match(box, /> h4 \+ p,\s*> \.wp-block-group__inner-container > h4 \+ p\s*\{\s*margin-top:\s*0/);
  assert.doesNotMatch(box, /white-space:\s*nowrap|background-image:/);
  const editor = readFileSync(new URL('../theme/inc/editor.php', import.meta.url), 'utf8');
  assert.match(editor, /register_block_style\('core\/group', array\(\s*'name' => 'jwsnj-background-box'/);
  assert.match(editor, /register_block_style\('core\/columns', array\(\s*'name' => 'jwsnj-background-boxes'/);
});
test('background box columns use Figma 24/40px gaps without overriding core widths or stacking', () => {
  const columns = readFileSync(new URL('../theme/css/blocks/wp-block-columns-style.css', import.meta.url), 'utf8');
  const box = columns.slice(columns.indexOf('&.is-layout-flex.is-style-jwsnj-background-boxes {'));
  assert.match(box, /gap:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(box, /@media \(calc\(768 \* \(1 \/ 16 \* 1rem\)\) <= width\)\s*\{\s*gap:\s*calc\(40 \* var\(--to-rem-func\)\)/);
  assert.match(box, /> \.wp-block-column:has\(> \.wp-block-group\.is-style-jwsnj-background-box:only-child\)/);
  assert.match(box, /> \.wp-block-group\.is-style-jwsnj-background-box:only-child\s*\{\s*flex:\s*1 1 auto/);
  assert.doesNotMatch(box, /!important|flex-basis:|white-space:\s*nowrap/);
});

test('preschool features uses opt-in editable groups, exact copy and optional artwork', () => {
  const file = new URL('../theme/patterns/preschool-features.php', import.meta.url);
  const pattern = readFileSync(file, 'utf8');
  execFileSync('php', ['-l', file.pathname]);
  assert.equal((pattern.match(/<!-- wp:group /g) || []).length, (pattern.match(/<!-- \/wp:group -->/g) || []).length);
  const editor = readFileSync(new URL('../theme/inc/editor.php', import.meta.url), 'utf8');
  const features = css.slice(css.indexOf('/* Course features PC'));
  assert.match(editor, /register_block_style\('core\/group', array\(\s*'name' => 'jwsnj-course-features'/);
  assert.match(pattern, /幼児部の特長/);
  assert.match(pattern, /FEATURES/);
  assert.equal((pattern.match(/<!-- wp:heading \{"level":3\} -->/g) || []).length, 3);
  assert.match(pattern, /遊びを通して、日本語に親しむ/);
  assert.match(pattern, /日本の文化や行事を体験できる/);
  assert.match(pattern, /友達と関わり、心豊かに成長する/);
  assert.doesNotMatch(pattern, /<img|<!-- wp:image|https?:\/\/|get_field\(/);
  assert.match(features, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(features, /aspect-ratio: 4 \/ 3/);
  assert.match(features, /object-fit: contain/);
  assert.match(features, /font-size: calc\(18 \* var\(--to-rem-func\)\)/);
  assert.match(features, /line-height: 1\.6/);
  assert.doesNotMatch(features, /white-space:\s*nowrap|background-image:|position:\s*absolute/);
});
