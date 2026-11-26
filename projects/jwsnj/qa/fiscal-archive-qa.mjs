import assert from 'node:assert/strict';

const base = process.argv[2];
assert.match(base, /^http:\/\/127\.0\.0\.1:/);
for (const [query, expected, other] of [
  ['?year=2024', 'FiscalQAInsideMarch', 'FiscalQAInsideApril'],
  ['?year=2024&paged=2', 'FiscalQAInsideApril', 'FiscalQAInsideMarch'],
  ['?m=2024', 'FiscalQAInsideMarch', 'FiscalQAInsideApril'],
]) {
  const response = await fetch(base + '/' + query);
  assert.equal(response.status, 200, query);
  const html = await response.text();
  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  assert.ok(title && /^2024年度(?:\s*\|)/.test(title[1]), query + ' title without unassigned posts-page fallback');
  assert.ok(!title[1].includes('FiscalQA'), query + ' must not use a result post title');
  assert.match(html, /class="gm_title"><span>2024年度<\/span>/, query + ' visual title');
  assert.match(html, /itemprop="name"[^>]*>2024年度<\/span>/, query + ' breadcrumb');
  const entries = [...html.matchAll(/<h2 class="title">([^<]*)<\/h2>/g)].map(m => m[1]);
  assert.deepEqual(entries, [expected], query + ' fiscal result');
  assert.ok(!entries.includes(other) && !entries.some(title => title.includes('Outside')));
  console.log(JSON.stringify({ query, fiscalYearRuntime: 'PASS', expected, title: title[1] }));
}
