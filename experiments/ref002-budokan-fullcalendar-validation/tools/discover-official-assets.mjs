import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const outDir = path.resolve(process.argv[2] || './evidence/official-assets');
const assetDir = path.join(outDir, 'files');
await fs.mkdir(assetDir, { recursive: true });

const ORIGIN = 'https://www.nipponbudokan.or.jp';
const pages = [
  '/',
  '/about',
  '/shinkoujigyou/gyouji_01/',
  '/shodou',
];
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
  const attrs = /(?:src|href|data-src|data-original)\s*=\s*["']([^"']+)["']/gi;
  for (const match of text.matchAll(attrs)) {
    const url = abs(match[1], base);
    if (!url) continue;
    if (imageExt.test(url)) assetUrls.add(url);
    if (cssExt.test(url)) cssUrls.add(url);
  }
  const srcsets = /srcset\s*=\s*["']([^"']+)["']/gi;
  for (const match of text.matchAll(srcsets)) {
    for (const item of match[1].split(',')) {
      const raw = item.trim().split(/\s+/)[0];
      const url = abs(raw, base);
      if (url && imageExt.test(url)) assetUrls.add(url);
    }
  }
  const cssRefs = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
  for (const match of text.matchAll(cssRefs)) {
    const url = abs(match[1], base);
    if (url && imageExt.test(url)) assetUrls.add(url);
  }
}

async function get(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'REF002-visual-qa/1.0 (+https://github.com/m-shogo/figma-ai-project)' },
    redirect: 'follow',
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

// Follow the site's own stylesheets because many Budokan images are CSS backgrounds.
for (const url of [...cssUrls].slice(0, 80)) {
  try {
    const response = await get(url);
    const text = await response.text();
    sources.push({ type: 'css', url, bytes: Buffer.byteLength(text) });
    collect(text, url);
  } catch (error) {
    sources.push({ type: 'css', url, error: String(error) });
  }
}

const inventory = [];
for (const url of [...assetUrls].sort()) {
  try {
    const response = await get(url);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    if (bytes.length > 8 * 1024 * 1024) {
      inventory.push({ url, skipped: 'TOO_LARGE', bytes: bytes.length });
      continue;
    }
    const parsed = new URL(url);
    const rawBase = decodeURIComponent(path.basename(parsed.pathname)) || 'asset';
    const safeBase = rawBase.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-120);
    const short = crypto.createHash('sha1').update(url).digest('hex').slice(0, 10);
    const filename = `${short}-${safeBase}`;
    await fs.writeFile(path.join(assetDir, filename), bytes);
    inventory.push({
      url,
      filename,
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      contentType: response.headers.get('content-type'),
    });
  } catch (error) {
    inventory.push({ url, error: String(error) });
  }
}

const likely = inventory.filter(item => item.filename && /(?:mainvisual|about|top|bnr|banner|event|gyouji|insta|access|map|logo|purpose|menu|img_)/i.test(item.url));
const summary = {
  generatedAt: new Date().toISOString(),
  origin: ORIGIN,
  pages,
  sourceCount: sources.length,
  cssCount: cssUrls.size,
  discoveredAssetCount: assetUrls.size,
  downloadedAssetCount: inventory.filter(item => item.filename).length,
  likelyCount: likely.length,
  sources,
  likely,
  inventory,
};
await fs.writeFile(path.join(outDir, 'inventory.json'), JSON.stringify(summary, null, 2));
await fs.writeFile(path.join(outDir, 'urls.txt'), inventory.filter(x => x.filename).map(x => `${x.filename}\t${x.url}`).join('\n') + '\n');
console.log(JSON.stringify({ discovered: summary.discoveredAssetCount, downloaded: summary.downloadedAssetCount, likely: summary.likelyCount }, null, 2));
