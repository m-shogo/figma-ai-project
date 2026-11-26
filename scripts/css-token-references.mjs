// Source-only audit: definitions may still be unavailable at a particular element.
// Plugins, DB, generated inline CSS and dynamic JS writes require runtime verification.
export function inventoryCssReferences(files) {
  const definitions = new Map();
  const references = new Map();
  const add = (map, token, item) => {
    if (!map.has(token)) map.set(token, []);
    map.get(token).push(item);
  };
  for (const [file, source] of files) {
    // Mask comments and strings while retaining offsets and line numbers.
    const css = source.replace(/\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/g,
      value => value.replace(/[^\n]/g, ' '));
    const lineAt = offset => css.slice(0, offset).split('\n').length;
    for (const match of css.matchAll(/(?:^|[;{}])\s*(--[\w-]+)\s*:/g)) {
      add(definitions, match[1], {file, line: lineAt(match.index + match[0].indexOf(match[1])), kind: 'declaration'});
    }
    for (const match of css.matchAll(/@property\s+(--[\w-]+)\s*\{/g)) {
      add(definitions, match[1], {file, line: lineAt(match.index), kind: 'registration'});
    }
    for (const match of css.matchAll(/\bvar\(\s*(--[\w-]+)\s*([,)])/g)) {
      add(references, match[1], {file, line: lineAt(match.index), hasFallback: match[2] === ','});
    }
  }
  const unresolved = [...references].filter(([token]) => !definitions.has(token))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([token, uses]) => ({token, uses, withoutFallback: uses.filter(use => !use.hasFallback).length}));
  return {definitionCount: definitions.size, referenceCount: references.size, unresolved};
}
