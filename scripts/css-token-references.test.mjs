import test from 'node:test';
import assert from 'node:assert/strict';
import {inventoryCssReferences} from './css-token-references.mjs';

test('recognizes global and local declarations and registered properties', () => {
  const result = inventoryCssReferences([
    ['a.css', ':root { --global: 1rem; }\n@property --registered { syntax: "<length>"; initial-value: 1px; inherits: false; }'],
    ['b.css', '.a { --local: var(--global); width: var(--local); height: var(--registered); }']
  ]);
  assert.equal(result.definitionCount, 3);
  assert.equal(result.referenceCount, 3);
  assert.deepEqual(result.unresolved, []);
});

test('reports missing definitions separately from fallback and nested fallback use', () => {
  const result = inventoryCssReferences([['a.css', '.a {\n width: var(--missing);\n color: var(--optional, var(--nested, red));\n}']]);
  assert.deepEqual(result.unresolved.map(x => [x.token, x.withoutFallback, x.uses[0].line]), [
    ['--missing', 1, 2], ['--nested', 0, 3], ['--optional', 0, 3]
  ]);
});

test('does not confuse comments or strings with CSS definitions or uses', () => {
  const result = inventoryCssReferences([['a.css', '/* --ghost: 1; var(--ignored) */\n.a { content: "var(--ignored)"; color: var(--ghost); }']]);
  assert.equal(result.definitionCount, 0);
  assert.deepEqual(result.unresolved.map(x => [x.token, x.uses[0].line]), [['--ghost', 2]]);
});
