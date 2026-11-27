// Figma PC parts 344:1027 / SP parts 442:2880: inline text link color/state.
// Run: node --test projects/jwsnj/tests/parts-text-link-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../theme/css/blocks/wp-block-textLink-style.css', import.meta.url), 'utf8');

test('inline text links use approved coral accent and preserve surrounding text flow', () => {
  assert.match(css, /color:\s*var\(--color-accent\)/);
  assert.match(css, /text-decoration-line:\s*underline/);
  assert.match(css, /text-decoration-color:\s*transparent/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /word-break:\s*normal/);
  assert.doesNotMatch(css, /white-space:\s*nowrap|figma\.com\/api\/mcp\/asset/);
  assert.doesNotMatch(css, /font-size:\s*\d/);
});

test('keyboard and hover keep link distinction and existing file icon variants', () => {
  assert.match(css, /&:focus-visible\s*\{/);
  assert.match(css, /text-decoration-line:\s*underline/);
  assert.match(css, /outline-offset:\s*calc\(2 \* var\(--to-rem-func\)\)/);
  assert.match(css, /&\[target='_blank'\]/);
  assert.match(css, /&\[href\$='\.pdf' i\]/);
  assert.match(css, /mask:\s*url\('\.\.\/\.\.\/images\/common\/ico-blank\.svg'\) center \/ contain no-repeat/);
  assert.match(css, /content:\s*var\(--icon-pdf\)/);
});

test('inline external link preserves orange Figma icon and excludes existing file types', () => {
  const external = css.match(/&\[target='_blank'\]:where\(:not\(([^)]+)\)\)[^{]+\{\s*&::after\s*\{([^}]+)\}/);
  assert.ok(external);
  for (const ext of ['pdf','doc','docx','docm','xls','xlsx','xlsm','png','jpg','jpeg','gif','webp']) {
    assert.ok(external[1].includes("[href$='." + ext + "' i]"));
  }
  const icon = external[2];
  assert.match(icon, /content:\s*''/);
  assert.match(icon, /display:\s*inline-block/);
  assert.match(icon, /width:\s*calc\(14 \* var\(--to-rem-func\)\)/);
  assert.match(icon, /height:\s*calc\(13 \* var\(--to-rem-func\)\)/);
  assert.match(icon, /background-color:\s*#f0813b/);
  assert.match(icon, /margin-left:\s*0\.25em/);
  assert.ok(readFileSync(new URL('../theme/images/common/ico-blank.svg', import.meta.url)).length > 0);
});

test('inline PDF and attachment glyphs match PC/SP size and distinct colors', () => {
  const vars = readFileSync(new URL('../theme/css/global/variables.css', import.meta.url), 'utf8');
  const pdf = css.match(/content:\s*var\(--icon-pdf\);([^}]+)/)?.[1];
  const file = css.match(/content:\s*var\(--icon-file\);([^}]+)/)?.[1];
  assert.ok(pdf && file);
  for (const glyph of [pdf, file]) {
    assert.match(glyph, /font-family:\s*var\(--font-awesome\)/);
    assert.match(glyph, /font-weight:\s*400/);
    assert.match(glyph, /font-size:\s*calc\(13 \* var\(--to-rem-func\)\)/);
  }
  assert.match(pdf, /color:\s*#f0813b/);
  assert.match(file, /color:\s*var\(--color-accent\)/);
  assert.ok(vars.includes("--icon-pdf: '\\f1c1'"));
  assert.ok(vars.includes("--icon-file: '\\f15c'"));
});


test('inline hover fades decoration color without changing geometry; focus is immediate', () => {
  assert.match(css, /transition:\s*color var\(--transition-duration\), text-decoration-color var\(--transition-duration\)/);
  assert.match(css, /&:focus-visible\s*\{\s*text-decoration-color:\s*currentColor;\s*transition:\s*none;/);
  assert.match(css, /@media \(any-hover: hover\)\s*\{\s*&:hover\s*\{\s*text-decoration-color:\s*currentColor;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*transition:\s*none;/);
});


test('query/fragment file icons use a resolved path marker and never a raw suffix alone', () => {
  assert.ok(css.includes("[data-jwsnj-file-icon='pdf']"));
  assert.ok(css.includes("[data-jwsnj-file-icon='file']"));
  assert.ok(css.includes(":where(:not([href*='?'], [href*='#']))"));
});
