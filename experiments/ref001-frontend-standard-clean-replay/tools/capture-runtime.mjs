import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const widths = [320, 375, 390, 430, 767, 768, 769, 1024, 1200, 1380];
const screenshotWidths = new Set([375, 767, 768, 1024, 1380]);
const outDir = process.env.REF001_CAPTURE_DIR || path.resolve('experiments/ref001-frontend-standard-clean-replay/evidence/runtime');
const target = process.env.REF001_URL || 'http://127.0.0.1:8765/ref001-frontend-standard-clean-replay/implementation/index.html';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' });
  const runtimeErrors = [];
  const failedRequests = [];
  page.on('pageerror', error => runtimeErrors.push(`pageerror:${error.message}`));
  page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(`console:${message.text()}`); });
  page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'unknown'}`));
  await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(async () => { await document.fonts.ready; });

  const metrics = await page.evaluate(() => {
    const de = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(de.scrollWidth, body.scrollWidth);
    const textNodes = [...document.querySelectorAll('h1,h2,h3,p,li,dt,dd,a,strong,small')].filter(el => (el.textContent || '').trim());
    const clippedText = textNodes.map(el => {
      const rect = el.getBoundingClientRect();
      return rect.left < -0.5 || rect.right > innerWidth + 0.5 ? {
        tag: el.tagName.toLowerCase(),
        className: String(el.className || ''),
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        left: Number(rect.left.toFixed(1)),
        right: Number(rect.right.toFixed(1)),
      } : null;
    }).filter(Boolean);
    const brokenImages = [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src);
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const sections = [...document.querySelectorAll('[data-figma-pc]')].map(el => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        className: String(el.className || ''),
        pc: el.getAttribute('data-figma-pc'),
        sp: el.getAttribute('data-figma-sp'),
        top: Math.round(rect.top + scrollY),
        height: Math.round(rect.height),
      };
    });
    const pendingAssets = document.querySelectorAll('[data-asset-status="BLOCKED_BY_EXECUTION_NETWORK"]').length;
    return {
      width: innerWidth,
      bodyHeight: Math.max(de.scrollHeight, body.scrollHeight),
      scrollWidth,
      pageOverflowPx: Math.max(0, scrollWidth - innerWidth),
      clippedText,
      brokenImages,
      duplicateIds,
      h1Count: document.querySelectorAll('h1').length,
      mainCount: document.querySelectorAll('main').length,
      sectionAuthorityCount: sections.length,
      sections,
      pendingAssets,
    };
  });
  metrics.runtimeErrors = runtimeErrors;
  metrics.failedRequests = failedRequests;
  results.push(metrics);

  if (screenshotWidths.has(width)) {
    await page.screenshot({ path: path.join(outDir, `first-pass-${width}.png`), fullPage: true, animations: 'disabled', caret: 'hide' });
  }
  await page.close();
}
await browser.close();
await fs.writeFile(path.join(outDir, 'runtime-probes.json'), `${JSON.stringify(results, null, 2)}\n`);

const summary = results.map(result => ({
  width: result.width,
  bodyHeight: result.bodyHeight,
  pageOverflowPx: result.pageOverflowPx,
  clippedText: result.clippedText.length,
  brokenImages: result.brokenImages.length,
  runtimeErrors: result.runtimeErrors.length,
  failedRequests: result.failedRequests.length,
  duplicateIds: result.duplicateIds.length,
  h1Count: result.h1Count,
  mainCount: result.mainCount,
  sectionAuthorityCount: result.sectionAuthorityCount,
  pendingAssets: result.pendingAssets,
}));
console.log(JSON.stringify(summary, null, 2));

const hardFailures = results.flatMap(result => {
  const failures = [];
  if (result.pageOverflowPx > 0) failures.push(`${result.width}:overflow=${result.pageOverflowPx}`);
  if (result.runtimeErrors.length) failures.push(`${result.width}:runtimeErrors=${result.runtimeErrors.length}`);
  if (result.duplicateIds.length) failures.push(`${result.width}:duplicateIds=${result.duplicateIds.join(',')}`);
  if (result.h1Count !== 1) failures.push(`${result.width}:h1=${result.h1Count}`);
  if (result.mainCount !== 1) failures.push(`${result.width}:main=${result.mainCount}`);
  return failures;
});
if (hardFailures.length) {
  console.error(`Runtime contract failures:\n${hardFailures.join('\n')}`);
  process.exitCode = 1;
}
