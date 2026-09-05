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
      headerPosition: getComputedStyle(header).position,
      headerTop: headerRect.top,
      headerLeft: headerRect.left,
      headerWidth: headerRect.width,
      headerHeight: headerRect.height,
      wrapperTop: wrapperRect.top,
      fvTop: fvRect.top,
      fvLeft: fvRect.left,
      fvWidth: fvRect.width,
    };
  });
}

async function overflowOffenders(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || '',
          className: typeof element.className === 'string' ? element.className.trim().replace(/\s+/g, '.') : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          display: style.display,
          position: style.position,
        };
      })
      .filter((entry) => entry.display !== 'none' && entry.width > 0 && (entry.right > viewportWidth + 1 || entry.left < -1))
      .sort((a, b) => (b.right - viewportWidth) - (a.right - viewportWidth))
      .slice(0, 8);
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

async function assertHeaderSnsPlaceholdersFailClosed(page, label) {
  const legacyLinks = await page.locator('.gn_sns a[href="#"]').count();
  assert(legacyLinks === 0, `${label}: unresolved header SNS destinations still render as href="#" links (${legacyLinks}).`);

  const disabledOwners = page.locator('.gn_sns .gn_sns_link[aria-disabled="true"]');
  const disabledCount = await disabledOwners.count();
  assert(disabledCount === 3, `${label}: expected 3 fail-closed header SNS visual owners, got ${disabledCount}.`);

  const labels = await disabledOwners.evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label')));
  assert(
    JSON.stringify(labels) === JSON.stringify(['YouTube', 'Instagram', 'X']),
    `${label}: header SNS placeholder labels changed unexpectedly: ${JSON.stringify(labels)}.`,
  );
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
  assert(opened.headerPosition === 'fixed', `${label}: scroll-locked header is ${opened.headerPosition}, expected fixed.`);
  assert(close(opened.clientWidth, before.clientWidth, 0.5), `${label}: document width shifted ${before.clientWidth} -> ${opened.clientWidth}.`);
  assert(close(opened.headerTop, before.headerTop), `${label}: header top shifted ${before.headerTop} -> ${opened.headerTop}.`);
  assert(close(opened.headerLeft, before.headerLeft), `${label}: header left shifted ${before.headerLeft} -> ${opened.headerLeft}.`);
  assert(close(opened.headerWidth, before.headerWidth, 0.5), `${label}: header width shifted ${before.headerWidth} -> ${opened.headerWidth}.`);
  assert(close(opened.headerHeight, before.headerHeight, 0.5), `${label}: header height shifted ${before.headerHeight} -> ${opened.headerHeight}.`);
  assert(close(opened.fvTop, before.fvTop), `${label}: TOP main visual jumped vertically ${before.fvTop} -> ${opened.fvTop}.`);
  assert(close(opened.fvLeft, before.fvLeft), `${label}: TOP main visual shifted horizontally ${before.fvLeft} -> ${opened.fvLeft}.`);
  assert(close(opened.fvWidth, before.fvWidth), `${label}: TOP main visual width changed ${before.fvWidth} -> ${opened.fvWidth}.`);
  assertOverlayDoesNotIncreaseOverflow(before, opened, `${label} open`);
}

function assertClosedStable(before, closed, openClass, label) {
  assert(!closed.bodyClass.includes(openClass), `${label}: ${openClass} remained after close.`);
  assert(!closed.bodyClass.includes('_contentFixed'), `${label}: scroll lock remained after close.`);
  assert(closed.headerPosition === 'sticky', `${label}: header did not return to sticky after close (${closed.headerPosition}).`);
  assert(close(closed.scrollY, before.scrollY, 2), `${label}: scroll position was not restored ${before.scrollY} -> ${closed.scrollY}.`);
  assert(close(closed.headerTop, before.headerTop, 1.5), `${label}: header top did not restore ${before.headerTop} -> ${closed.headerTop}.`);
  assert(close(closed.headerLeft, before.headerLeft, 1.5), `${label}: header left did not restore ${before.headerLeft} -> ${closed.headerLeft}.`);
  assert(close(closed.headerWidth, before.headerWidth, 0.5), `${label}: header width did not restore ${before.headerWidth} -> ${closed.headerWidth}.`);
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

async function scrollToSettled(page, requestedY) {
  await page.evaluate((y) => window.scrollTo(0, y), requestedY);
  await page.waitForTimeout(100);
  return snapshot(page);
}

async function exerciseStickyScrollStability(page, label) {
  const metrics = await page.evaluate(() => ({
    maxScrollY: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
  }));
  const positions = [
    0,
    1,
    60,
    350,
    Math.floor(metrics.maxScrollY * 0.5),
    Math.floor(metrics.maxScrollY * 0.8),
    Math.max(0, metrics.maxScrollY - 2),
  ].filter((value, index, values) => value <= metrics.maxScrollY && values.indexOf(value) === index);

  let baseline = null;
  for (const requestedY of positions) {
    const state = await scrollToSettled(page, requestedY);
    assert(state, `${label}: sticky geometry missing at requested scroll ${requestedY}.`);
    assert(!state.bodyClass.includes('_fixed'), `${label}: legacy body._fixed returned at scroll ${state.scrollY}.`);
    assert(!state.bodyClass.includes('_contentFixed'), `${label}: scroll lock unexpectedly active during ordinary scroll ${state.scrollY}.`);
    assert(state.headerPosition === 'sticky', `${label}: header position is ${state.headerPosition} during ordinary scroll ${state.scrollY}.`);
    assert(close(state.headerTop, 0, 1.5), `${label}: sticky header flickered away from viewport top at scroll ${state.scrollY}: ${state.headerTop}.`);

    if (!baseline) {
      baseline = state;
    } else {
      assert(close(state.headerLeft, baseline.headerLeft, 1.5), `${label}: sticky header shifted horizontally ${baseline.headerLeft} -> ${state.headerLeft} at scroll ${state.scrollY}.`);
      assert(close(state.headerWidth, baseline.headerWidth, 0.5), `${label}: sticky header width changed ${baseline.headerWidth} -> ${state.headerWidth} at scroll ${state.scrollY}.`);
      assert(close(state.headerHeight, baseline.headerHeight, 0.5), `${label}: sticky header height changed ${baseline.headerHeight} -> ${state.headerHeight} at scroll ${state.scrollY}.`);
      assert(state.scrollWidth <= baseline.scrollWidth + 1, `${label}: ordinary scrolling increased document scroll width ${baseline.scrollWidth} -> ${state.scrollWidth}.`);
    }
  }

  return metrics.maxScrollY;
}

async function exerciseOverlaysAtScroll(page, scrollY, label) {
  const scrolled = await scrollToSettled(page, scrollY);
  assert(scrolled && scrolled.scrollY > 0, `${label}: fixture did not reach a scrolled state.`);
  if (scrolled.scrollWidth > scrolled.clientWidth + 1) {
    const offenders = await overflowOffenders(page);
    console.log(`NOTE ${label}: baseline document scroll width is ${scrolled.scrollWidth}px for ${scrolled.clientWidth}px viewport; overlay QA only fails if open/close increases it.`);
    console.log(`NOTE ${label}: baseline overflow candidates ${JSON.stringify(offenders)}`);
  }

  await exerciseOverlay(page, '#gh_menu', '_open-menu', `${label} menu`, 2);
  await exerciseEscapeClose(page, '#gh_menu', '_open-menu', `${label} menu`);
  await exerciseOverlay(page, '#gh_search', '_open-search', `${label} search`, 1);
  await exerciseEscapeClose(page, '#gh_search', '_open-search', `${label} search`);
}

async function exerciseTouchMegaMenuBreakpoint(browser, width, label) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await assertHeaderSnsPlaceholdersFailClosed(page, label);

  const state = await page.evaluate(() => {
    const header = document.querySelector('#global_header');
    const item = document.querySelector('.global_header .gn_mega [class*="gnl_item"]._hasChild');
    const title = item?.querySelector(':scope > [class*="gnl_title"]');
    if (!header || !item || !title) return null;
    title.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }));
    return {
      headerHeight: header.getBoundingClientRect().height,
      htmlClass: document.documentElement.className,
      touchOpen: item.classList.contains('_touchOpen'),
      bodyOpenBg: document.body.classList.contains('_open-bg'),
    };
  });

  assert(state, `${label}: required header/mega-menu fixture missing.`);
  assert(close(state.headerHeight, 100, 1), `${label}: CSS is not using the PC header at ${width}px (height ${state.headerHeight}).`);
  assert(state.touchOpen, `${label}: PC mega menu did not enter _touchOpen on touchstart at ${width}px.`);
  assert(state.bodyOpenBg, `${label}: PC mega menu did not activate its background overlay at ${width}px.`);
  assert(!state.htmlClass.split(/\s+/).includes('_sp'), `${label}: html is classified _sp while CSS uses the PC header at ${width}px.`);

  await context.close();
}

async function runViewport(browser, viewport, contextOptions, label) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await assertHeaderSnsPlaceholdersFailClosed(page, label);

  const maxScrollY = await exerciseStickyScrollStability(page, label);
  await exerciseOverlaysAtScroll(page, Math.min(350, Math.max(1, maxScrollY)), `${label} shallow-scroll`);
  if (maxScrollY > 700) {
    await exerciseOverlaysAtScroll(page, Math.floor(maxScrollY * 0.7), `${label} deep-scroll`);
  }

  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runViewport(browser, { width: 375, height: 900 }, { isMobile: true, hasTouch: true }, 'SP 375');
  await runViewport(browser, { width: 767, height: 900 }, {}, 'SP edge 767');
  await exerciseTouchMegaMenuBreakpoint(browser, 768, 'PC CSS boundary 768 touch');
  await exerciseTouchMegaMenuBreakpoint(browser, 769, 'PC JS edge 769 touch');
  await runViewport(browser, { width: 1280, height: 900 }, {}, 'PC minimum 1280');
  await runViewport(browser, { width: 1380, height: 900 }, {}, 'PC 1380');
  console.log('PASS Budokan sticky header remains viewport-stable from page top through deep scroll without legacy _fixed behavior.');
  console.log('PASS Budokan menu/search overlays preserve visible header/FV geometry at shallow and deep scroll positions across current SP and PC owner widths.');
  console.log('PASS Budokan overlay scroll lock restores sticky header mode and scroll position across toggle-close, Escape-close, menu reopen, and search reopen.');
  console.log('PASS Budokan overlays do not increase existing document horizontal overflow.');
  console.log('PASS Budokan 768px PC CSS boundary keeps touch mega-menu behavior and html layout classification aligned with the header breakpoint.');
  console.log('PASS unresolved header SNS destinations fail closed instead of rendering page-top placeholder links.');
} finally {
  await browser.close();
}
