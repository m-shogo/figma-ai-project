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
  assert.match(h2, /border-bottom:\s*calc\(3 \* var\(--to-rem-func\)\) solid var\(--color-primary\)/);
  assert.match(h2, /padding-bottom:\s*calc\(24 \* var\(--to-rem-func\)\)/);
  assert.match(h2, /padding-bottom:\s*calc\(28 \* var\(--to-rem-func\)\)/);
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
  assert.doesNotMatch(h3, /&::after|height:\s*\d|white-space:\s*nowrap/);
});

test('scope remains existing WordPress/editor headings and leaves SVG-dependent h4 unresolved', () => {
  assert.match(css, /\.block-editor_wrap,\s*\.editor-styles-wrapper\s*\{/);
  assert.match(css, /h4:is\(:not\(\[class\]\), \.wp-block-heading\)/);
  assert.doesNotMatch(h2 + h3, /figma\.com\/api\/mcp\/asset|position:\s*absolute|white-space:\s*nowrap/);
});
