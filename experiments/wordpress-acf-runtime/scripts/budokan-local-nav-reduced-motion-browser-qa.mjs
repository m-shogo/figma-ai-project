import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-local-nav-reduced-motion-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;
const allDurationsZero = (value) => value
  .split(',')
  .map((part) => part.trim())
  .every((part) => part === '0s' || part === '0ms');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 375, height: 900 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
});
const page = await context.newPage();

const itemSelector = '.lnl_item-03._hasChild';
const buttonSelector = '.lnl_item-03._hasChild > .lnl_title-03 > .lnl_button-03';
const wrapperSelector = '.lnl_item-03._hasChild > .lnl_wrapper-03';

const snapshot = async () => page.evaluate(({ itemSelector, buttonSelector, wrapperSelector }) => {
  const item = document.querySelector(itemSelector);
  const button = document.querySelector(buttonSelector);
  const wrapper = document.querySelector(wrapperSelector);
  if (!item || !button || !wrapper) return null;

  const buttonRect = button.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  const buttonStyle = getComputedStyle(button, '::after');
  const wrapperStyle = getComputedStyle(wrapper);
  const pointX = buttonRect.left + buttonRect.width / 2;
  const pointY = buttonRect.top + buttonRect.height / 2;
  const hit = document.elementFromPoint(pointX, pointY);

  return {
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    itemOpen: item.getAttribute('data-open'),
    ariaExpanded: button.getAttribute('aria-expanded'),
    scrollY: window.scrollY,
    buttonTop: buttonRect.top,
    buttonLeft: buttonRect.left,
    buttonWidth: buttonRect.width,
    wrapperHeight: wrapperRect.height,
    wrapperTransitionDuration: wrapperStyle.transitionDuration,
    buttonAfterTransitionDuration: buttonStyle.transitionDuration,
    hitOwnsButton: hit === button || button.contains(hit),
    activeIsButton: document.activeElement === button,
    documentScrollWidth: document.documentElement.scrollWidth,
    documentClientWidth: document.documentElement.clientWidth,
  };
}, { itemSelector, buttonSelector, wrapperSelector });

try {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(url, { waitUntil: 'networkidle' });

  const button = page.locator(buttonSelector).first();
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);

  const before = await snapshot();
  assert(before, 'Reduced Motion local navigation fixture is missing.');
  assert(before.reducedMotion, 'Browser did not activate prefers-reduced-motion: reduce.');
  assert(before.itemOpen === null || before.itemOpen === 'false', `Disclosure must begin closed, got ${before.itemOpen}.`);
  assert(before.ariaExpanded === 'false', `Disclosure must begin aria-expanded=false, got ${before.ariaExpanded}.`);
  assert(before.wrapperHeight <= 1, `Disclosure must begin collapsed, got ${before.wrapperHeight}px.`);
  assert(allDurationsZero(before.wrapperTransitionDuration), `Reduced Motion wrapper must not animate grid rows, got ${before.wrapperTransitionDuration}.`);
  assert(allDurationsZero(before.buttonAfterTransitionDuration), `Reduced Motion disclosure icon must not rotate with a transition, got ${before.buttonAfterTransitionDuration}.`);
  assert(before.hitOwnsButton, 'Reduced Motion disclosure button does not own its pointer hit area before open.');

  const cycle = async (expectedOpen, label) => {
    const baseline = await snapshot();
    assert(baseline, `${label}: baseline fixture missing.`);
    await button.click();
    await page.waitForTimeout(50);
    const next = await snapshot();
    assert(next, `${label}: post-click fixture missing.`);
    assert(next.itemOpen === (expectedOpen ? 'true' : 'false'), `${label}: data-open mismatch ${next.itemOpen}.`);
    assert(next.ariaExpanded === (expectedOpen ? 'true' : 'false'), `${label}: aria-expanded mismatch ${next.ariaExpanded}.`);
    assert(expectedOpen ? next.wrapperHeight > 30 : next.wrapperHeight <= 1, `${label}: wrapper height ${next.wrapperHeight}px is inconsistent with state.`);
    assert(allDurationsZero(next.wrapperTransitionDuration), `${label}: wrapper transition returned under Reduced Motion: ${next.wrapperTransitionDuration}.`);
    assert(allDurationsZero(next.buttonAfterTransitionDuration), `${label}: icon transition returned under Reduced Motion: ${next.buttonAfterTransitionDuration}.`);
    assert(close(next.scrollY, baseline.scrollY), `${label}: scroll moved ${baseline.scrollY} -> ${next.scrollY}.`);
    assert(close(next.buttonTop, baseline.buttonTop), `${label}: control moved vertically ${baseline.buttonTop} -> ${next.buttonTop}.`);
    assert(close(next.buttonLeft, baseline.buttonLeft), `${label}: control moved horizontally ${baseline.buttonLeft} -> ${next.buttonLeft}.`);
    assert(close(next.buttonWidth, baseline.buttonWidth), `${label}: control width changed ${baseline.buttonWidth} -> ${next.buttonWidth}.`);
    assert(next.activeIsButton, `${label}: disclosure button lost focus.`);
    assert(next.documentScrollWidth <= next.documentClientWidth + 1, `${label}: introduced horizontal overflow ${next.documentScrollWidth}px > ${next.documentClientWidth}px.`);
  };

  await cycle(true, 'Reduced Motion pointer open');
  await cycle(false, 'Reduced Motion pointer close');
  await cycle(true, 'Reduced Motion pointer reopen');
  await cycle(false, 'Reduced Motion pointer reclose');

  assert(pageErrors.length === 0, `Reduced Motion local navigation produced page errors: ${pageErrors.join(' | ')}`);
  console.log('PASS Budokan module menu removes disclosure geometry/icon motion under prefers-reduced-motion while preserving pointer, focus, scroll, and width stability.');
} finally {
  await context.close();
  await browser.close();
}
