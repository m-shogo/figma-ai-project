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
      scrollWidth: document.documentElement.scrollWidth,
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

function assertOverlayDoesNotIncreaseOverflow(before, state, label) {
  assert(
    state.scrollWidth <= before.scrollWidth + 1,
    `${label}: overlay increased document scroll width ${before.scrollWidth} -> ${state.scrollWidth}.`,
  );
}

function assertStable(before, opened, label) {
  assert(before && opened, `${label}: required geometry missing.`);
  assert(opened.bodyClass.includes('_contentFixed'), `${label}: body did not enter scroll lock.`);
  assert(close(opened.clientWidth, before.clientWidth, 0.5), `${label}: document width shifted ${before.clientWidth} -> ${opened.clientWidth}.`);
  assert(close(opened.headerTop, before.headerTop), `${label}: header top shifted ${before.headerTop} -> ${opened.headerTop}.`);
  assert(close(opened.headerHeight, before.headerHeight, 0.5), `${label}: header height shifted ${before.headerHeight} -> ${opened.headerHeight}.`);
  assert(close(opened.wrapperTop, before.wrapperTop), `${label}: wrapper top shifted ${before.wrapperTop} -> ${opened.wrapperTop}.`);
  assert(close(opened.fvTop, before.fvTop), `${label}: TOP main visual jumped vertically ${before.fvTop} -> ${opened.fvTop}.`);
  assert(close(opened.fvLeft, before.fvLeft), `${label}: TOP main visual shifted horizontally ${before.fvLeft} -> ${opened.fvLeft}.`);
  assert(close(opened.fvWidth, before.fvWidth), `${label}: TOP main visual width changed ${before.fvWidth} -> ${opened.fvWidth}.`);
  assertOverlayDoesNotIncreaseOverflow(before, opened, `${label} open`);
}

function assertClosedStable(before, closed, openClass, label) {
  assert(!closed.bodyClass.includes(openClass), `${label}: ${openClass} remained after close.`);
  assert(!closed.bodyClass.includes('_contentFixed'), `${label}: scroll lock remained after close.`);
  assert(close(closed.scrollY, before.scrollY, 2), `${label}: scroll position was not restored ${before.scrollY} -> ${closed.scrollY}.`);
  assert(close(closed.wrapperTop, before.wrapperTop, 2), `${label}: wrapper did not return to the pre-open viewport position ${before.wrapperTop} -> ${closed.wrapperTop}.`);
  assert(close(closed.fvTop, before.fvTop, 2), `${label}: FV did not return to the pre-open viewport position ${before.fvTop} -> ${closed.fvTop}.`);
  assert(close(closed.clientWidth, before.clientWidth, 0.5), `${label}: document width did not restore ${before.clientWidth} -> ${closed.clientWidth}.`);
  assertOverlayDoesNotIncreaseOverflow(before, closed, `${label} closed`);
}

async function exerciseOverlay(page, selector, openClass, label, cycles = 1) {
  for (let cycle = 1; cycle <= cycles; cycle += 1) {
    const before = await snapshot(page);
    assert(before, `${label}: initial geometry missing.`);

    await pointerClick(page, selector);
    await page.waitForTimeout(450);
    const opened = await snapshot(page);
    assert(opened.bodyClass.includes(openClass), `${label}: expected ${openClass} after open.`);
    assertStable(before, opened, `${label} cycle ${cycle}`);

    await pointerClick(page, selector);
    await page.waitForTimeout(450);
    const closed = await snapshot(page);
    assertClosedStable(before, closed, openClass, `${label} cycle ${cycle}`);
  }
}

async function exerciseEscapeClose(page, selector, openClass, label) {
  const before = await snapshot(page);
  assert(before, `${label}: initial geometry missing.`);

  await pointerClick(page, selector);
  await page.waitForTimeout(450);
  const opened = await snapshot(page);
  assert(opened.bodyClass.includes(openClass), `${label}: expected ${openClass} after open.`);
  assertStable(before, opened, `${label} escape open`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  const closed = await snapshot(page);
  assertClosedStable(before, closed, openClass, `${label} escape close`);
}

async function runViewport(browser, viewport, contextOptions, label) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 350));
  await page.waitForTimeout(100);

  const scrolled = await snapshot(page);
  assert(scrolled && scrolled.scrollY > 0, `${label}: fixture did not reach a scrolled state.`);
  if (scrolled.scrollWidth > scrolled.clientWidth + 1) {
    console.log(`NOTE ${label}: baseline document scroll width is ${scrolled.scrollWidth}px for ${scrolled.clientWidth}px viewport; overlay QA only fails if open/close increases it.`);
  }

  await exerciseOverlay(page, '#gh_menu', '_open-menu', `${label} menu`, 2);
  await exerciseEscapeClose(page, '#gh_menu', '_open-menu', `${label} menu`);
  await exerciseOverlay(page, '#gh_search', '_open-search', `${label} search`, 1);
  await exerciseEscapeClose(page, '#gh_search', '_open-search', `${label} search`);

  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runViewport(browser, { width: 375, height: 900 }, { isMobile: true, hasTouch: true }, 'SP 375');
  await runViewport(browser, { width: 767, height: 900 }, {}, 'SP edge 767');
  await runViewport(browser, { width: 768, height: 900 }, {}, 'breakpoint 768');
  await runViewport(browser, { width: 769, height: 900 }, {}, 'PC edge 769');
  await runViewport(browser, { width: 1380, height: 900 }, {}, 'PC 1380');
  console.log('PASS Budokan menu/search overlays preserve header/wrapper/FV geometry across SP, breakpoint, and PC widths.');
  console.log('PASS Budokan overlay scroll lock restores position across toggle-close, Escape-close, menu reopen, and search reopen.');
  console.log('PASS Budokan overlays do not increase existing document horizontal overflow.');
} finally {
  await browser.close();
}
