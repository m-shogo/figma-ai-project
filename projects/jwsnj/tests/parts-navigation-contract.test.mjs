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
