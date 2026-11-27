import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const widths = [320, 360, 375, 390, 430, 767, 768, 769, 1024, 1200, 1380];
const outDir = process.env.V3_CAPTURE_DIR || path.resolve('experiments/ref001-v3/qa/runtime');
const previewUrl = process.env.V3_PREVIEW_URL || 'http://127.0.0.1:8766/experiments/ref001-v3/implementation/preview.php';
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const runtimeErrors = [];
  page.on('pageerror', (e) => runtimeErrors.push(`pageerror:${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
      runtimeErrors.push(`console:${m.text()}`);
    }
  });
  await page.goto(previewUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(400, Math.floor(innerHeight * 0.75));
    for (let y = 0; y < height; y += step) {
      scrollTo(0, y);
      await sleep(35);
    }
    scrollTo(0, Math.max(0, height - innerHeight));
    await sleep(80);
    await Promise.all(
      [...document.images].map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, 3000);
        });
      }),
    );
    scrollTo(0, 0);
    await sleep(80);
  });

  const metrics = await page.evaluate(() => {
    const body = document.body;
    const de = document.documentElement;
    const sw = () => Math.round(Math.max(body.scrollWidth, de.scrollWidth));
    const sections = [...document.querySelectorAll('[data-section]')].map((el, index) => {
      const r = el.getBoundingClientRect();
      return {
        name: el.dataset.section,
        figmaPc: el.dataset.figmaPc || null,
        figmaSp: el.dataset.figmaSp || null,
        index,
        top: Math.round(r.top + scrollY),
        height: Math.round(r.height),
      };
    });
    const imageFailures = [...document.images]
      .filter((img) => !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0)
      .map((img) => ({
        slot: img.closest('[data-asset-slot]')?.dataset.assetSlot || null,
        src: img.currentSrc || img.src || '',
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      }));
    const portraits = [...document.querySelectorAll('[data-asset-slot^="cta-person"]')].map((el) => {
      const img = el.querySelector('img');
      const r = el.getBoundingClientRect();
      return {
        slot: el.dataset.assetSlot,
        renderedWidth: Math.round(r.width),
        renderedHeight: Math.round(r.height),
        naturalWidth: img?.naturalWidth || 0,
        naturalHeight: img?.naturalHeight || 0,
        bg: getComputedStyle(el).backgroundColor,
      };
    });
    return {
      bodyHeight: Math.round(Math.max(body.scrollHeight, de.scrollHeight)),
      scrollWidth: sw(),
      pageOverflowPx: Math.max(0, sw() - innerWidth),
      imageFailures,
      portraits,
      sections,
      sectionNames: sections.map((s) => s.name),
    };
  });
  metrics.width = width;
  metrics.runtimeErrors = runtimeErrors;
  results.push(metrics);
  if ([320, 375, 1380].includes(width)) {
    await page.screenshot({ path: path.join(outDir, `v3-${width}.png`), fullPage: true });
  }
  await page.close();
}

await browser.close();
await fs.writeFile(path.join(outDir, 'runtime-probes.json'), JSON.stringify(results, null, 2) + '\n');
const summary = results.map((x) => ({
  width: x.width,
  bodyHeight: x.bodyHeight,
  pageOverflowPx: x.pageOverflowPx,
  imageFailures: x.imageFailures.length,
  runtimeErrors: x.runtimeErrors.length,
  sections: x.sectionNames,
}));
console.log(JSON.stringify(summary, null, 2));
const expected = [
  'header',
  'main-visual',
  'reason',
  'education',
  'shared-cta',
  'student-voice',
  'messages',
  'shared-cta',
  'courses',
  'links',
  'cta-value',
  'footer',
];
const hardFailures = results.flatMap((x) => {
  const f = [];
  if (x.pageOverflowPx > 0) f.push(`${x.width}:overflow=${x.pageOverflowPx}`);
  if (x.imageFailures.length) f.push(`${x.width}:imageFailures=${x.imageFailures.length}`);
  if (x.runtimeErrors.length) f.push(`${x.width}:runtimeErrors=${x.runtimeErrors.length}`);
  if (JSON.stringify(x.sectionNames) !== JSON.stringify(expected)) f.push(`${x.width}:sections`);
  return f;
});
if (hardFailures.length) {
  console.error('V3 runtime probe hard failures:', hardFailures.join(', '));
  process.exitCode = 1;
}
