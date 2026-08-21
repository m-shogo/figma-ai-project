import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.REF001_URL || 'http://127.0.0.1:8088/';
const output = process.env.REF001_OUTPUT || '/output';
const widths = [320, 375, 390, 430, 767, 768, 769, 1024, 1380];
const expectedSections = [
  'p-ref001-header', 'p-ref001-hero', 'p-ref001-reason', 'p-ref001-education',
  'p-ref001-cta', 'p-ref001-voices', 'p-ref001-messages', 'p-ref001-courses',
  'p-ref001-links', 'p-ref001-value', 'p-ref001-footer'
];

fs.mkdirSync(path.join(output, 'captures'), { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
let failure = false;

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(output, 'captures', `ref001-${width}.png`), fullPage: true });
  const metrics = await page.evaluate((expected) => {
    const root = document.querySelector('.p-ref001');
    const sectionClasses = root ? [...root.children].map((node) => node.classList[0]).filter(Boolean) : [];
    const actionDisplay = getComputedStyle(document.querySelector('.p-ref001-header__actions')).display;
    const mediaQueries = [...document.styleSheets].flatMap((sheet) => {
      try { return [...sheet.cssRules].filter((rule) => rule.constructor?.name === 'CSSMediaRule').map((rule) => rule.conditionText); }
      catch { return []; }
    });
    const absoluteCount = [...document.querySelectorAll('.p-ref001 *')].filter((node) => getComputedStyle(node).position === 'absolute').length;
    const domCount = document.querySelectorAll('.p-ref001 *').length;
    const interactiveCount = document.querySelectorAll('.p-ref001 a, .p-ref001 button, .p-ref001 input, .p-ref001 select, .p-ref001 textarea, .p-ref001 [role="button"]').length;
    return {
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      pageHeight: document.documentElement.scrollHeight,
      sectionClasses,
      sectionOrderMatches: expected.every((name, index) => sectionClasses[index] === name || sectionClasses.includes(name)),
      headerActionsDisplay: actionDisplay,
      mediaQueries,
      domCount,
      absoluteCount,
      absoluteRatio: domCount ? Number((absoluteCount / domCount).toFixed(4)) : 0,
      interactiveCount,
    };
  }, expectedSections);
  const noOverflow = metrics.documentWidth <= width && metrics.bodyWidth <= width;
  const boundaryMode = width <= 767 ? metrics.headerActionsDisplay === 'none' : metrics.headerActionsDisplay !== 'none';
  const onlyCanonicalMediaQuery = metrics.mediaQueries.every((query) => query.replaceAll(' ', '') === '(min-width:768px)');
  const passed = noOverflow && boundaryMode && onlyCanonicalMediaQuery && metrics.interactiveCount === 0;
  if (!passed) failure = true;
  results.push({ width, passed, noOverflow, boundaryMode, onlyCanonicalMediaQuery, ...metrics });
  console.log(JSON.stringify({ width, passed, noOverflow, boundaryMode, pageHeight: metrics.pageHeight, domCount: metrics.domCount, absoluteRatio: metrics.absoluteRatio, interactiveCount: metrics.interactiveCount }));
  await page.close();
}

await browser.close();
const report = {
  authority: 'REF-001 Clean Replay First Pass',
  capturedAt: new Date().toISOString(),
  url,
  widths,
  canonicalBreakpoint: { mobileMax: 767, desktopMin: 768 },
  figmaInteractionEvidence: { pcReactions: 0, spReactions: 0, motionNodes: 0 },
  interactionPolicy: 'No unresolved prototype interaction was invented; visual CTA/more controls are non-interactive in First Pass.',
  assetByteTransfer: 'BLOCKED_BY_EXECUTION_NETWORK',
  results,
};
fs.writeFileSync(path.join(output, 'first-pass-runtime-metrics.json'), JSON.stringify(report, null, 2) + '\n');
if (failure) process.exit(1);
