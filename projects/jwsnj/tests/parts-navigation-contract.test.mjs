// Large ACF navigation: PC 384:817 / SP 442:3079; small variant is unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../theme/css/blocks/wp-block-navigation-style.css', import.meta.url), 'utf8');
const large = css.slice(css.indexOf('/* MARK: 大'), css.indexOf('/* MARK: 小'));
test('large navigation uses fluid Figma card proportions and text rhythm', () => {
  for (const value of ['gap: calc(40 * var(--to-rem-func))', 'gap: calc(24 * var(--to-rem-func))', 'aspect-ratio: 3 / 2', 'border-radius: calc(5 * var(--to-rem-func))', 'font-size: calc(18 * var(--to-rem-func))', 'line-height: 1.4', 'overflow-wrap: anywhere', 'min-width: 0']) assert.ok(large.includes(value), value);
  assert.match(css, /&\.--large\s*\{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(large, /white-space:\s*nowrap|figma\.com\/api/);
});
test('large navigation keeps keyboard focus visible and reduced-motion available', () => {
  assert.match(large, /&:focus-visible/);
  assert.match(large, /prefers-reduced-motion: reduce/);
  assert.match(large, /transition: none/);
});

test('large navigation renders the approved decorative corner and arrow only for enabled links', () => {
  assert.match(large, /\.image\s*\{\s*position:\s*relative;\s*isolation:\s*isolate/);
  const arrow = large.slice(large.indexOf('&:not(.is-disabled) .image'), large.indexOf('                    .content {'));
  assert.ok(arrow.length > 0);
  for (const value of [
    'right: 0', 'bottom: 0', 'pointer-events: none',
    'width: calc(48 * var(--to-rem-func))', 'height: calc(48 * var(--to-rem-func))',
    'border-top-left-radius: calc(20 * var(--to-rem-func))',
    'background-color: var(--jwsnj-color-white)',
    'width: calc(32 * var(--to-rem-func))', 'height: calc(32 * var(--to-rem-func))',
    'border-radius: 50%', 'background-color: var(--color-primary)',
    'font-family: var(--font-awesome)', 'font-size: calc(10 * var(--to-rem-func))',
    'z-index: 1', 'z-index: 2'
  ]) assert.ok(arrow.includes(value), value);
  assert.match(arrow, /content:\s*'\\f061'/);
  assert.match(arrow, /place-items:\s*center/);
  assert.doesNotMatch(css.slice(css.indexOf('/* MARK: 小')), /Figma PC 384:1005/);
});

const template = readFileSync(new URL('../theme/acf/blocks/navigationLarge.php', import.meta.url), 'utf8');
test('large navigation emits href and external target only for a safe named link', () => {
  assert.match(template, /\$url = esc_url\(\(string\) get_sub_field\('url'\)\)/);
  assert.match(template, /\$has_link = \$url !== '' && \(\$has_text \|\| \$image_alt !== ''\)/);
  assert.match(template, /<a<\?php if \(\$has_link\) : \?> href="<\?php echo \$url; \?>".*target="_blank" rel="noopener".*class="is-disabled"/);
  assert.doesNotMatch(template, /href="<\?php echo \$url \?/);
});
test('large navigation skips empty rows and does not substitute sample images', () => {
  assert.match(template, /if \(!\$image_thumb && !\$has_text\) \{\s*continue;/);
  assert.match(template, /get_post_meta\(\$image, '_wp_attachment_image_alt', true\)/);
  assert.match(template, /alt="<\?php echo esc_attr\(\$image_alt\); \?>"/);
  assert.match(template, /if \(\$has_text\) : \?>\s*<div class="content">/);
  assert.doesNotMatch(template, /noimage\.webp|href="#"/);
});

test('large navigation corner glyph retains its centered 10px FA Regular ink', () => {
  const icon = large.match(/&::after\s*\{([^}]+)\}/)?.[1];
  assert.ok(icon);
  assert.match(icon,/box-sizing:\s*border-box/);
  assert.match(icon,/letter-spacing:\s*0/);
  assert.match(icon,/font-style:\s*normal/);
  assert.match(icon,/text-box-trim:\s*none/);
  assert.match(icon,/line-height:\s*1;/);
});
