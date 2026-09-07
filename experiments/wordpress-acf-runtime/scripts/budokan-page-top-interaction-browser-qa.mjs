import { chromium } from 'playwright';

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('FAIL usage: node budokan-page-top-interaction-browser-qa.mjs <url>');
  process.exit(2);
}

const EPS = 2;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;

async function pageState(page) {
  return page.evaluate(() => ({
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyLeft: document.body.getBoundingClientRect().left,
    bodyWidth: document.body.getBoundingClientRect().width,
  }));
}

async function pointerState(locator) {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      x,
      y,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      hitOwns: Boolean(hit && (hit === el || el.contains(hit))),
      focused: document.activeElement === el,
    };
  });
}

function assertHorizontalStability(before, after, label) {
  assert(near(before.scrollX, after.scrollX), `${label}: scrollX shifted ${before.scrollX} -> ${after.scrollX}`);
  assert(near(before.clientWidth, after.clientWidth), `${label}: document clientWidth shifted ${before.clientWidth} -> ${after.clientWidth}`);
  assert(near(before.bodyLeft, after.bodyLeft), `${label}: body left shifted ${before.bodyLeft} -> ${after.bodyLeft}`);
  assert(near(before.bodyWidth, after.bodyWidth), `${label}: body width shifted ${before.bodyWidth} -> ${after.bodyWidth}`);
  assert(after.scrollWidth <= after.clientWidth + EPS, `${label}: horizontal overflow ${after.scrollWidth} > ${after.clientWidth}`);
}

async function runCycle(page, label, cycle) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(100);

  const link = page.locator('#js_gf_pageTop > a');
  await link.waitFor({ state: 'visible' });

  const baseline = await pageState(page);
  const pointer = await pointerState(link);
  assert(baseline.scrollY > 300, `${label}/cycle-${cycle}: deep-scroll precondition missing; scrollY=${baseline.scrollY}`);
  assert(baseline.scrollWidth <= baseline.clientWidth + EPS, `${label}/cycle-${cycle}: horizontal overflow at baseline`);
  assert(pointer.width > 0 && pointer.height > 0, `${label}/cycle-${cycle}: Page Top has no clickable geometry`);
  assert(pointer.hitOwns, `${label}/cycle-${cycle}: Page Top pointer center is intercepted`);

  await page.evaluate(() => {
    window.__budokanPageTopSamples = [];
    const collect = () => {
      window.__budokanPageTopSamples.push({
        x: window.scrollX,
        y: window.scrollY,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        t: performance.now(),
      });
    };
    window.addEventListener('scroll', collect, { passive: true, once: false });
  });

  await page.mouse.click(pointer.x, pointer.y);
  await page.waitForTimeout(450);

  const after = await pageState(page);
  const samples = await page.evaluate(() => window.__budokanPageTopSamples || []);
  const focused = await link.evaluate((el) => document.activeElement === el);

  assert(after.scrollY <= EPS, `${label}/cycle-${cycle}: Page Top did not finish at document top; scrollY=${after.scrollY}`);
  assertHorizontalStability(baseline, after, `${label}/cycle-${cycle}`);
  assert(focused, `${label}/cycle-${cycle}: pointer activation lost focus ownership from Page Top link`);
  assert(samples.length > 0, `${label}/cycle-${cycle}: no scroll samples captured during Page Top transition`);

  let previousY = baseline.scrollY + EPS;
  for (const sample of samples) {
    assert(sample.y <= previousY + EPS, `${label}/cycle-${cycle}: Page Top scroll reversed direction ${previousY} -> ${sample.y}`);
    assert(Math.abs(sample.x - baseline.scrollX) <= EPS, `${label}/cycle-${cycle}: horizontal scroll changed during transition ${baseline.scrollX} -> ${sample.x}`);
    assert(Math.abs(sample.clientWidth - baseline.clientWidth) <= EPS, `${label}/cycle-${cycle}: clientWidth changed during transition ${baseline.clientWidth} -> ${sample.clientWidth}`);
    assert(sample.scrollWidth <= sample.clientWidth + EPS, `${label}/cycle-${cycle}: horizontal overflow appeared during transition`);
    previousY = sample.y;
  }
}

async function runViewport(label, viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(String(error)));

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    assert(await page.locator('#global_footer').count(), `${label}: global footer missing`);
    assert(await page.locator('#js_gf_pageTop > a').count(), `${label}: Page Top link missing`);

    await runCycle(page, label, 1);
    await runCycle(page, label, 2);

    assert(browserErrors.length === 0, `${label}: browser errors: ${browserErrors.join(' | ')}`);
    console.log(`PASS ${label}: Page Top real-pointer, repeat activation, scroll-direction, focus, and horizontal geometry are stable.`);
  } finally {
    await context.close();
    await browser.close();
  }
}

await runViewport('PC 1395', { width: 1395, height: 900 });
await runViewport('SP 390', { width: 390, height: 844 });
