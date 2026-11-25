// Figma parts body-copy baseline: PC 357:999, SP 442:2770.
// Run: node --test projects/jwsnj/tests/parts-paragraph-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../theme/css/blocks/wp-block-text-style.css', import.meta.url), 'utf8');
const start = source.indexOf('p:is(:not([class]), .wp-block-paragraph,');
const end = source.indexOf('    .wp-block-columns {', start);
assert.ok(start >= 0 && end > start, 'Existing WordPress Gutenberg paragraph rule is required');
const paragraph = source.slice(start, end);

test('approved Japanese and English paragraph flow matches Figma on PC and SP', () => {
  assert.match(paragraph, /font-family:\s*var\(--font-jwsnj-ja\)/);
  assert.match(paragraph, /font-size:\s*1rem/);
  assert.match(paragraph, /font-weight:\s*400/);
  assert.match(paragraph, /letter-spacing:\s*0\.05em/);
  assert.match(paragraph, /line-height:\s*1\.6/);
  assert.match(paragraph, /color:\s*var\(--color-text\)/);
  assert.match(paragraph, /overflow-wrap:\s*anywhere/);
  assert.match(paragraph, /word-break:\s*normal/);
  assert.doesNotMatch(paragraph, /white-space:\s*nowrap|height:\s*\d+px|figma\.com\/api\/mcp\/asset/);
});

test('WordPress paragraph font presets and authored markup remain intact', () => {
  assert.match(source, /p\.has-small-font-size/);
  assert.match(source, /p\.has-medium-font-size/);
  assert.match(source, /p\.has-large-font-size/);
  assert.match(source, /p\.has-x-large-font-size/);
  assert.match(source, /span\[style\*='text-decoration: underline'\]/);
});

test('paragraph marker uses Figma 5px yellow paint and preserves multiline inline flow', () => {
  const marker = source.slice(source.indexOf("p span[style*='text-decoration: underline']:not([style*='background'])"), source.indexOf('    p.has-small-font-size'));
  assert.ok(marker.startsWith("p span[style*='text-decoration: underline']:not([style*='background'])"));
  assert.match(marker, /text-decoration-line:\s*none !important/);
  assert.match(marker, /background-image:\s*linear-gradient\(#ffebb3, #ffebb3\)/);
  assert.match(marker, /background-position:\s*left bottom/);
  assert.match(marker, /background-size:\s*100% calc\(5 \* var\(--to-rem-func\)\)/);
  assert.match(marker, /-webkit-box-decoration-break:\s*clone/);
  assert.match(marker, /\n\s*box-decoration-break:\s*clone/);
  assert.doesNotMatch(marker, /display:\s*inline-block|white-space:\s*nowrap|position:\s*absolute/);
  assert.match(source, /p strong\s*\{\s*font-weight:\s*500/);
  assert.match(source, /span\[style\*='text-decoration: underline'\]\s*\{\s*text-decoration-line:\s*underline !important/);
});
