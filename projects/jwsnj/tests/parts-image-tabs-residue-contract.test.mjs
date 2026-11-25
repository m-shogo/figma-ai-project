// Source-only cleanup guard: no obsolete CODIA sample declarations in approved parts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const image = readFileSync(new URL('../theme/css/blocks/wp-block-image-style.css', import.meta.url), 'utf8');
const tabs = readFileSync(new URL('../theme/css/blocks/wp-block-tabs-style.css', import.meta.url), 'utf8');
const heading = readFileSync(new URL('../theme/css/blocks/wp-block-heading-style.css', import.meta.url), 'utf8');

test('individual image still supports editorial float and responsive caption without dead placeholders', () => {
  assert.match(image, /\.alignleft\s*\{/);
  assert.match(image, /\.alignright\s*\{/);
  assert.match(image, /\.wp-element-caption\.wp-element-caption/);
  assert.doesNotMatch(image, /\/\*\s*&\.border-none|\.wp-block\[data-align='left'\]\s*>/);
});

test('tab retains natural multi-line button and scrolling, without discarded disabled rules', () => {
  assert.match(tabs, /max-inline-size:\s*100%/);
  assert.match(tabs, /overflow-wrap:\s*anywhere/);
  assert.match(tabs, /white-space:\s*normal/);
  assert.match(tabs, /overflow:\s*auto/);
  assert.doesNotMatch(tabs, /\/\*\s*(?:margin-bottom: calc\(20|padding-inline: calc\(20|-ms-overflow-style)/);
});

test('heading spacing has one active adjacent-heading owner, no commented sample selector inventory', () => {
  assert.match(heading, /\*\s*\{\s*& \+ h1:is/);
  assert.doesNotMatch(heading, /\/\* p:is\(/);
});
