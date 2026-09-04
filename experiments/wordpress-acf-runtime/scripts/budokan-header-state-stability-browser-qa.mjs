import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-header-state-stability-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const close = (actual, expected, tolerance = 1.5) => Math.abs(actual - expected) <= tolerance;

async function snapshot(page, selector) {
  return page.evaluate((targetSelector) => {
    const target = document.querySelector(targetSelector);
    const header = document.querySelector('#global_header');
    const fv = document.querySelector('.top_mainVisual');
    if (!target || !header || !fv) return null;
    const targetRect = target.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const fvRect = fv.getBoundingClientRect();
    const style = getComputedStyle(target);
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollY: window.scrollY,
      targetLeft: targetRect.left,
      targetTop: targetRect.top,
      targetWidth: targetRect.width,
      targetHeight: targetRect.height,
      targetOpacity: Number.parseFloat(style.opacity || '1'),
      headerLeft: headerRect.left,
      headerTop: headerRect.top,
      headerWidth: headerRect.width,
      headerHeight: headerRect.height,
      fvLeft: fvRect.left,
      fvTop: fvRect.top,
      fvWidth: fvRect.width,
    };
  }, selector);
}

function assertGeometryStable(before, after, label) {
  assert(before && after, `${label}: required geometry missing.`);
  assert(close(after.scrollY, before.scrollY, 1), `${label}: scroll position shifted ${before.scrollY} -> ${after.scrollY}.`);
  assert(close(after.clientWidth, before.clientWidth, 0.5), `${label}: document client width shifted ${before.clientWidth} -> ${after.clientWidth}.`);
  assert(after.scrollWidth <= before.scrollWidth + 1, `${label}: document scroll width increased ${before.scrollWidth} -> ${after.scrollWidth}.`);
  assert(close(after.targetLeft, before.targetLeft, 0.5), `${label}: target left shifted ${before.targetLeft} -> ${after.targetLeft}.`);
  assert(close(after.targetTop, before.targetTop, 0.5), `${label}: target top shifted ${before.targetTop} -> ${after.targetTop}.`);
  assert(close(after.targetWidth, before.targetWidth, 0.5), `${label}: target width shifted ${before.targetWidth} -> ${after.targetWidth}.`);
  assert(close(after.targetHeight, before.targetHeight, 0.5), `${label}: target height shifted ${before.targetHeight} -> ${after.targetHeight}.`);
  assert(close(after.headerLeft, before.headerLeft, 0.5), `${label}: header left shifted ${before.headerLeft} -> ${after.headerLeft}.`);
  assert(close(after.headerTop, before.headerTop, 0.5), `${label}: header top shifted ${before.headerTop} -> ${after.headerTop}.`);
  assert(close(after.headerWidth, before.headerWidth, 0.5), `${label}: header width shifted ${before.headerWidth} -> ${after.headerWidth}.`);
  assert(close(after.headerHeight, before.headerHeight, 0.5), `${label}: header height shifted ${before.headerHeight} -> ${after.headerHeight}.`);
  assert(close(after.fvLeft, before.fvLeft, 0.5), `${label}: FV left shifted ${before.fvLeft} -> ${after.fvLeft}.`);
  assert(close(after.fvTop, before.fvTop, 1), `${label}: FV top shifted ${before.fvTop} -> ${after.fvTop}.`);
  assert(close(after.fvWidth, before.fvWidth, 0.5), `${label}: FV width shifted ${before.fvWidth} -> ${after.fvWidth}.`);
}

async function scrollDeep(page) {
  const maxScrollY = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
  const targetY = maxScrollY > 800 ? Math.floor(maxScrollY * 0.65) : Math.min(350, maxScrollY);
  await page.evaluate((y) => window.scrollTo(0, y), targetY);
  await page.waitForTimeout(120);
  return page.evaluate(() => window.scrollY);
}

async function pointerBox(page, selector, label) {
  const box = await page.locator(selector).boundingBox();
  assert(box, `${label}: target has no pointer box.`);
  const viewport = page.viewportSize();
  assert(viewport, `${label}: viewport unavailable.`);
  assert(box.x + box.width / 2 >= 0 && box.x + box.width / 2 <= viewport.width, `${label}: target pointer center is outside viewport horizontally.`);
  assert(box.y + box.height / 2 >= 0 && box.y + box.height / 2 <= viewport.height, `${label}: target pointer center is outside viewport vertically.`);
  return box;
}

async function exerciseKeyboardEntryFocus(page, selector, label) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  const before = await snapshot(page, selector);
  let reached = false;
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
    reached = await page.locator(selector).evaluate((element) => document.activeElement === element);
    if (reached) break;
  }
  assert(reached, `${label}: keyboard Tab sequence did not reach the intended control.`);
  await page.waitForTimeout(80);
  const focused = await snapshot(page, selector);
  assertGeometryStable(before, focused, `${label} keyboard focus`);
}

async function exerciseFocusStyle(page, selector, label) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible' });
  const before = await snapshot(page, selector);
  // Focus-style geometry is measured without browser focus scrolling here. The
  // real user keyboard-entry scroll behavior is verified separately above.
  await page.evaluate((targetSelector) => {
    const target = document.querySelector(targetSelector);
    if (!(target instanceof HTMLElement)) {
      throw new Error(`Focus target not found: ${targetSelector}`);
    }
    target.focus({ preventScroll: true });
  }, selector);
  await page.waitForTimeout(80);
  const focused = await snapshot(page, selector);
  assertGeometryStable(before, focused, `${label} focus style`);
  const ownsFocus = await locator.evaluate((element) => document.activeElement === element);
  assert(ownsFocus, `${label}: focus did not remain on the intended control.`);
}

async function exerciseHover(page, selector, label) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible' });
  const box = await pointerBox(page, selector, label);
  const before = await snapshot(page, selector);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(80);
  const hovered = await snapshot(page, selector);
  assertGeometryStable(before, hovered, `${label} hover`);
  assert(hovered.targetOpacity <= before.targetOpacity + 0.001, `${label}: hover unexpectedly increased opacity ${before.targetOpacity} -> ${hovered.targetOpacity}.`);
}

async function exerciseActive(page, selector, label) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible' });
  const box = await pointerBox(page, selector, label);
  const before = await snapshot(page, selector);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(40);
  const active = await snapshot(page, selector);
  assertGeometryStable(before, active, `${label} active`);
  const viewport = page.viewportSize();
  await page.mouse.move(1, Math.max(1, viewport.height - 2));
  await page.mouse.up();
}

async function runDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  const scrollY = await scrollDeep(page);
  assert(scrollY > 0, 'PC: fixture did not reach a scrolled state.');

  // First prove the user-real keyboard path. If this moves the page, that is a
  // product UX defect rather than a Playwright actionability artifact.
  await exerciseKeyboardEntryFocus(page, '.gh_logo a', 'PC logo');

  const controls = [
    ['.gh_logo a', 'PC logo'],
    ['.gh_lang', 'PC EN'],
    ['#gh_search', 'PC search'],
    ['#gh_menu', 'PC menu'],
  ];

  for (const [selector, label] of controls) {
    await exerciseHover(page, selector, label);
    await exerciseFocusStyle(page, selector, label);
    await exerciseActive(page, selector, label);
  }

  assert(errors.length === 0, `PC: browser errors during header state QA: ${errors.join(' | ')}`);
  await context.close();
}

async function runMobile(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 900 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  const scrollY = await scrollDeep(page);
  assert(scrollY > 0, 'SP: fixture did not reach a scrolled state.');

  await exerciseKeyboardEntryFocus(page, '.gh_logo a', 'SP logo');

  const controls = [
    ['.gh_logo a', 'SP logo'],
    ['.gh_lang', 'SP EN'],
    ['#gh_search', 'SP search'],
    ['#gh_menu', 'SP menu'],
  ];

  for (const [selector, label] of controls) {
    await exerciseFocusStyle(page, selector, label);
  }

  assert(errors.length === 0, `SP: browser errors during header focus QA: ${errors.join(' | ')}`);
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runDesktop(browser);
  await runMobile(browser);
  console.log('PASS Budokan PC keyboard focus + hover/focus/active states do not shift the control, sticky header, TOP main visual, scroll position, or document width.');
  console.log('PASS Budokan SP keyboard focus + focus states preserve control/header/FV geometry, scroll position, and horizontal overflow state.');
} finally {
  await browser.close();
}
