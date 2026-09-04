import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-anchor-interaction-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  const targetTop = await page.locator('#local_navigation').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  assert(targetTop > 300, `Anchor QA target must be meaningfully below the header, got ${targetTop}px.`);

  await page.addInitScript(() => {
    window.__budokanScrollSamples = [];
    window.addEventListener('scroll', () => {
      window.__budokanScrollSamples.push({ y: window.scrollY, t: performance.now() });
    }, { passive: true });
  });

  const targetUrl = new URL(url);
  targetUrl.hash = 'local_navigation';
  await page.goto(targetUrl.href, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(450);

  const targetState = await page.evaluate(() => ({
    y: window.scrollY,
    samples: window.__budokanScrollSamples || [],
    headerHeight: document.querySelector('#global_header')?.getBoundingClientRect().height || 0,
    targetTop: document.querySelector('#local_navigation')?.getBoundingClientRect().top ?? null,
  }));
  assert(targetState.targetTop !== null, 'Anchor QA target disappeared after hash navigation.');
  assert(targetState.y > 20, `Hash navigation did not reach the lower-page target after header compensation; final scrollY=${targetState.y}.`);

  const samples = targetState.samples;
  const meaningfulDepth = Math.max(20, targetState.y * 0.5);
  const firstDeepIndex = samples.findIndex((sample) => sample.y > meaningfulDepth);
  const resetAfterDeep = firstDeepIndex >= 0 && samples.slice(firstDeepIndex + 1).some((sample) => sample.y <= 2);
  assert(!resetAfterDeep, `Initial hash navigation visibly reset toward page top before settling: ${JSON.stringify(samples)}.`);

  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const missingUrl = new URL(url);
  missingUrl.hash = 'budokan-anchor-that-does-not-exist';
  await page.goto(missingUrl.href, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(450);
  assert(pageErrors.length === 0, `Missing hash target raised a runtime error: ${pageErrors.join(' | ')}`);

  console.log('PASS Budokan initial hash navigation does not reset the page toward the top before settling.');
  console.log('PASS Budokan missing hash targets fail closed without JavaScript runtime errors.');
} finally {
  await context.close();
  await browser.close();
}
