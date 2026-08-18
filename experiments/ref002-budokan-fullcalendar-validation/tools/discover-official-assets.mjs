import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const outDir = path.resolve(process.argv[2] || './evidence/official-assets');
const assetDir = path.join(outDir, 'files');
await fs.mkdir(assetDir, { recursive: true });

const ORIGIN = 'https://www.nipponbudokan.or.jp';
const pages = ['/', '/about', '/shinkoujigyou/gyouji_01/', '/shodou'];
const imageExt = /\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i;
const cssExt = /\.css(?:[?#].*)?$/i;
const cssUrls = new Set();
const assetUrls = new Set();
const sources = [];

const abs = (raw, base) => {
  try {
    const url = new URL(raw.replace(/&amp;/g, '&'), base);
    if (url.protocol !== 'https:' || url.hostname !== 'www.nipponbudokan.or.jp') return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
};

function collect(text, base) {
  for (const match of text.matchAll(/(?:src|href|data-src|data-original)\s*=\s*["']([^"']+)["']/gi)) {
    const url = abs(match[1], base);
    if (!url) continue;
    if (imageExt.test(url)) assetUrls.add(url);
    if (cssExt.test(url)) cssUrls.add(url);
  }
  for (const match of text.matchAll(/srcset\s*=\s*["']([^"']+)["']/gi)) {
    for (const item of match[1].split(',')) {
      const url = abs(item.trim().split(/\s+/)[0], base);
      if (url && imageExt.test(url)) assetUrls.add(url);
    }
  }
  for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    const url = abs(match[1], base);
    if (url && imageExt.test(url)) assetUrls.add(url);
  }
}

async function get(url, timeoutMs = 8000) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'REF002-visual-qa/1.0 (+https://github.com/m-shogo/figma-ai-project)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}

for (const route of pages) {
  const url = new URL(route, ORIGIN).href;
  const response = await get(url);
  const text = await response.text();
  sources.push({ type: 'html', url, bytes: Buffer.byteLength(text) });
  await fs.writeFile(path.join(outDir, `page-${crypto.createHash('sha1').update(url).digest('hex').slice(0, 8)}.html`), text);
  collect(text, url);
}

// CSS is small enough to inspect concurrently. It often exposes background images
// that are not present as <img> elements in the page HTML.
const initialCss = [...cssUrls].slice(0, 80);
await Promise.all(initialCss.map(async (url) => {
  try {
    const response = await get(url);
    const text = await response.text();
    sources.push({ type: 'css', url, bytes: Buffer.byteLength(text) });
    collect(text, url);
  } catch (error) {
    sources.push({ type: 'css', url, error: String(error) });
  }
}));

const urls = [...assetUrls].sort();
const inventory = new Array(urls.length);
let cursor = 0;
const workerCount = Math.min(12, Math.max(1, urls.length));

async function downloadOne(url) {
  try {
    const response = await get(url);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 8 * 1024 * 1024) return { url, skipped: 'TOO_LARGE', bytes: bytes.length };
    const rawBase = decodeURIComponent(path.basename(new URL(url).pathname)) || 'asset';
    const safeBase = rawBase.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-120);
    const short = crypto.createHash('sha1').update(url).digest('hex').slice(0, 10);
    const filename = `${short}-${safeBase}`;
    await fs.writeFile(path.join(assetDir, filename), bytes);
    return {
      url,
      filename,
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      contentType: response.headers.get('content-type'),
    };
  } catch (error) {
    return { url, error: String(error) };
  }
}

await Promise.all(Array.from({ length: workerCount }, async () => {
  while (true) {
    const index = cursor++;
    if (index >= urls.length) return;
    inventory[index] = await downloadOne(urls[index]);
  }
}));

const likelyPattern = /(?:mainvisual|about|top|bnr|banner|event|gyouji|insta|access|map|logo|purpose|menu|img_)/i;
const likely = inventory.filter(item => item?.filename && likelyPattern.test(item.url));
const summary = {
  generatedAt: new Date().toISOString(),
  origin: ORIGIN,
  pages,
  sourceCount: sources.length,
  cssCount: cssUrls.size,
  discoveredAssetCount: assetUrls.size,
  downloadedAssetCount: inventory.filter(item => item?.filename).length,
  failedAssetCount: inventory.filter(item => item?.error).length,
  likelyCount: likely.length,
  sources,
  likely,
  inventory,
};
await fs.writeFile(path.join(outDir, 'inventory.json'), JSON.stringify(summary, null, 2));
await fs.writeFile(path.join(outDir, 'urls.txt'), inventory.filter(x => x?.filename).map(x => `${x.filename}\t${x.url}`).join('\n') + '\n');
console.log(JSON.stringify({ discovered: summary.discoveredAssetCount, downloaded: summary.downloadedAssetCount, failed: summary.failedAssetCount, likely: summary.likelyCount }, null, 2));
