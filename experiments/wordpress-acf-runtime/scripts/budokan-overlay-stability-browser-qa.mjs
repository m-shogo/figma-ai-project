import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-overlay-stability-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const close = (actual, expected, tolerance = 1.5) => Math.abs(actual - expected) <= tolerance;

async function snapshot(page) {
  return page.evaluate(() => {
    const header = document.querySelector('#global_header');
    const wrapper = document.querySelector('.global_wrapper');
    const fv = document.querySelector('.top_mainVisual');
    if (!header || !wrapper || !fv) return null;
    const headerRect = header.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const fvRect = fv.getBoundingClientRect();
    return {
      bodyClass: document.body.className,
      clientWidth: document.documentElement.clientWidth,
      scrollY: window.scrollY,
      headerTop: headerRect.top,
      headerHeight: headerRect.height,
      wrapperTop: wrapperRect.top,
      fvTop: fvRect.top,
      fvLeft: fvRect.left,
      fvWidth: fvRect.width,
    };
  });
}

async function pointerClick(page, selector) {
  const target = page.locator(selector);
  const box = await target.boundingBox();
  assert(box, `${selector} has no pointer box.`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const ownsHit = await page.evaluate(({ selector, x, y }) => {
    const target = document.querySelector(selector);
    const hit = document.elementFromPoint(x, y);
    return Boolean(target && hit && (hit === target || target.contains(hit)));
  }, { selector, x, y });
  assert(ownsHit, `${selector} does not own its pointer hit target at ${x},${y}.`);
  await page.mouse.click(x, y);
}

function assertStable(before, opened, label) {
  assert(before && opened, `${label}: required geometry missing.`);
  assert(opened.bodyClass.includes('_contentFixed'), `${label}: body did not enter scroll lock.`);
  assert(close(opened.clientWidth, before.clientWidth, 0.5), `${label}: document width shifted ${before.clientWidth} -> ${opened.clientWidth}.`);
  assert(close(opened.headerTop, before.headerTop), `${label}: header top shifted ${before.headerTop} -> ${opened.headerTop}.`);
  assert(close(opened.headerHeight, before.headerHeight, 0.5), `${label}: header height shifted ${before.headerHeight} -> ${opened.headerHeight}.`);
  assert(close(opened.fvTop, before.fvTop), `${label}: TOP main visual jumped vertically ${before.fvTop} -> ${opened.fvTop}.`);
  assert(close(opened.fvLeft, before.fvLeft), `${label}: TOP main visual shifted horizontally ${before.fvLeft} -> ${opened.fvLeft}.`);
  assert(close(opened.fvWidth, before.fvWidth), `${label}: TOP main visual width changed ${before.fvWidth} -> ${opened.fvWidth}.`);
}

async function exerciseOverlay(page, selector, openClass, label, cycles = 1) {
  for (let cycle = 1; cycle <= cycles; cycle += 1) {
    const before = await snapshot(page);
    assert(before, `${label}: initial geometry missing.`);
    const storedScroll = before.scrollY;

    await pointerClick(page, selector);
    await page.waitForTimeout(450);
    const opened = await snapshot(page);
    assert(opened.bodyClass.includes(openClass), `${label}: expected ${openClass} after open.`);
    assertStable(before, opened, `${label} cycle ${cycle}`);

    await pointerClick(page, selector);
    await page.waitForTimeout(450);
    const closed = await snapshot(page);
    assert(!closed.bodyClass.includes(openClass), `${label}: ${openClass} remained after close.`);
    assert(!closed.bodyClass.includes('_contentFixed'), `${label}: scroll lock remained after close.`);
    assert(close(closed.scrollY, storedScroll, 2), `${label}: scroll position was not restored ${storedScroll} -> ${closed.scrollY}.`);
    assert(close(closed.fvTop, before.fvTop, 2), `${label}: FV did not return to the pre-open viewport position ${before.fvTop} -> ${closed.fvTop}.`);
    assert(close(closed.clientWidth, before.clientWidth, 0.5), `${label}: document width did not restore ${before.clientWidth} -> ${closed.clientWidth}.`);
  }
}

async function runViewport(browser, viewport, contextOptions, label) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 350));
  await page.waitForTimeout(100);

  const scrolled = await snapshot(page);
  assert(scrolled && scrolled.scrollY > 0, `${label}: fixture did not reach a scrolled state.`);

  await exerciseOverlay(page, '#gh_menu', '_open-menu', `${label} menu`, 2);
  await exerciseOverlay(page, '#gh_search', '_open-search', `${label} search`, 1);

  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runViewport(browser, { width: 375, height: 900 }, { isMobile: true, hasTouch: true }, 'SP');
  await runViewport(browser, { width: 1380, height: 900 }, {}, 'PC');
  console.log('PASS Budokan menu/search overlays preserve background/FV geometry on SP and PC.');
  console.log('PASS Budokan overlay scroll lock restores position across menu open-close-reopen and search open-close.');
} finally {
  await browser.close();
}
