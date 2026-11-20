import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-news-archive-interaction-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 1) {
  return Math.abs(actual - expected) <= tolerance;
}

async function installDeepScrollFixture(page) {
  await page.evaluate(() => {
    const archive = document.querySelector('.news_archive');
    if (!archive || document.querySelector('[data-news-interaction-spacer]')) return;
    const spacer = document.createElement('div');
    spacer.dataset.newsInteractionSpacer = 'true';
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.cssText = 'height:1000px;width:1px;pointer-events:none;';
    archive.before(spacer);
  });
}

async function snapshot(page, selector) {
  return page.locator(selector).first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      scrollY: window.scrollY,
      scrollX: window.scrollX,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      ownsPointer: Boolean(hit && (hit === element || element.contains(hit))),
      hitClass: hit?.className || hit?.tagName || null,
    };
  });
}

function assertStable(before, after, label) {
  assert(close(after.scrollY, before.scrollY), `${label} changed scrollY: ${before.scrollY} -> ${after.scrollY}.`);
  assert(close(after.scrollX, before.scrollX), `${label} changed scrollX: ${before.scrollX} -> ${after.scrollX}.`);
  assert(after.clientWidth === before.clientWidth, `${label} changed document client width: ${before.clientWidth} -> ${after.clientWidth}.`);
  assert(after.scrollWidth === before.scrollWidth, `${label} changed document scroll width: ${before.scrollWidth} -> ${after.scrollWidth}.`);
  for (const key of ['left', 'top', 'width', 'height']) {
    assert(close(after.rect[key], before.rect[key]), `${label} changed ${key}: ${before.rect[key]} -> ${after.rect[key]}.`);
  }
  assert(after.ownsPointer, `${label} lost pointer ownership; hit=${after.hitClass}.`);
}

async function centerControl(page, selector, label) {
  const locator = page.locator(selector).first();
  assert(await locator.count(), `${label} was not found.`);
  await locator.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await page.waitForTimeout(50);
  assert(windowIsDeep(await page.evaluate(() => window.scrollY)), `${label} did not reach a deep-scroll state.`);
  return locator;
}

function windowIsDeep(scrollY) {
  return scrollY > 300;
}

async function auditHoverFocus(page, selector, label) {
  const locator = await centerControl(page, selector, label);
  const before = await snapshot(page, selector);
  assert(before.ownsPointer, `${label} pointer is intercepted before interaction; hit=${before.hitClass}.`);
  assert(before.scrollWidth <= before.clientWidth + 1, `${label} begins with horizontal overflow: ${before.scrollWidth} > ${before.clientWidth}.`);

  await locator.hover();
  await page.waitForTimeout(50);
  const hovered = await snapshot(page, selector);
  assertStable(before, hovered, `${label} hover`);

  await locator.evaluate((element) => element.focus({ preventScroll: true }));
  await page.waitForTimeout(50);
  const focused = await snapshot(page, selector);
  const isFocused = await locator.evaluate((element) => document.activeElement === element);
  assert(isFocused, `${label} did not retain focus.`);
  assertStable(before, focused, `${label} focus`);

  return { locator, baseline: focused };
}

async function auditViewport(browser, viewport, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await installDeepScrollFixture(page);

  const tabSelector = '.news_tabs_archive .news_tabs_link';
  const tabResult = await auditHoverFocus(page, tabSelector, `${viewport.width}px News category tab`);

  const tabs = page.locator(tabSelector);
  assert((await tabs.count()) >= 2, `${viewport.width}px News archive needs at least two category links for keyboard traversal QA.`);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(50);
  const secondFocused = await tabs.nth(1).evaluate((element) => document.activeElement === element);
  assert(secondFocused, `${viewport.width}px keyboard Tab did not move to the next News category link.`);
  const afterTab = await snapshot(page, '.news_tabs_archive .news_tabs_link:nth-of-type(1)').catch(() => null);
  const tabScrollY = await page.evaluate(() => window.scrollY);
  assert(close(tabScrollY, tabResult.baseline.scrollY), `${viewport.width}px keyboard Tab changed scrollY: ${tabResult.baseline.scrollY} -> ${tabScrollY}.`);
  if (afterTab) {
    assert(afterTab.scrollWidth <= afterTab.clientWidth + 1, `${viewport.width}px keyboard Tab introduced horizontal overflow.`);
  }
  await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(50);
  const firstFocusedAgain = await tabs.first().evaluate((element) => document.activeElement === element);
  assert(firstFocusedAgain, `${viewport.width}px Shift+Tab did not return focus to the first News category link.`);
  const returnScrollY = await page.evaluate(() => window.scrollY);
  assert(close(returnScrollY, tabResult.baseline.scrollY), `${viewport.width}px Shift+Tab changed scrollY: ${tabResult.baseline.scrollY} -> ${returnScrollY}.`);

  await auditHoverFocus(page, '.news_item_archive .news_item_link', `${viewport.width}px News article link`);
  await auditHoverFocus(page, '.news_pager_next a', `${viewport.width}px News pager next link`);

  const disabledPrev = page.locator('.news_pager_prev [aria-disabled="true"]').first();
  assert(await disabledPrev.count(), `${viewport.width}px first-page previous pager must remain a disabled non-link control.`);
  const prevTag = await disabledPrev.evaluate((element) => element.tagName.toLowerCase());
  assert(prevTag !== 'a' && prevTag !== 'button', `${viewport.width}px disabled previous pager unexpectedly became interactive (${prevTag}).`);

  const finalMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollX: window.scrollX,
  }));
  assert(finalMetrics.scrollWidth <= finalMetrics.clientWidth + 1, `${viewport.width}px News interactions introduced horizontal overflow: ${finalMetrics.scrollWidth} > ${finalMetrics.clientWidth}.`);
  assert(close(finalMetrics.scrollX, 0), `${viewport.width}px News interactions changed horizontal scroll to ${finalMetrics.scrollX}.`);

  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await auditViewport(browser, { width: 375, height: 900 }, { isMobile: true, hasTouch: true });
  await auditViewport(browser, { width: 1380, height: 900 });
  console.log('PASS Budokan News archive category tabs, article links and pager keep pointer ownership, focus/hover geometry, deep scroll and document width stable on SP/PC.');
} finally {
  await browser.close();
}
