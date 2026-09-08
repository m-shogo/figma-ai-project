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

const parentItemSelector = '.lnl_item-02';
const parentButtonSelector = '.lnl_item-02 > .lnl_title-02 > .lnl_button-02';
const parentWrapperSelector = '.lnl_item-02 > .lnl_wrapper-02';
const itemSelector = '.lnl_item-03._hasChild';
const buttonSelector = '.lnl_item-03._hasChild > .lnl_title-03 > .lnl_button-03';
const wrapperSelector = '.lnl_item-03._hasChild > .lnl_wrapper-03';

const disclosureSnapshot = async ({ itemSelector: itemSel, buttonSelector: buttonSel, wrapperSelector: wrapperSel }) => page.evaluate(({ itemSel, buttonSel, wrapperSel }) => {
  const item = document.querySelector(itemSel);
  const button = document.querySelector(buttonSel);
  const wrapper = document.querySelector(wrapperSel);
  if (!item || !button || !wrapper) return null;

  const buttonRect = button.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  const buttonStyle = getComputedStyle(button, '::after');
  const wrapperStyle = getComputedStyle(wrapper);
  const pointX = Math.min(window.innerWidth - 1, Math.max(0, buttonRect.left + buttonRect.width / 2));
  const pointY = Math.min(window.innerHeight - 1, Math.max(0, buttonRect.top + buttonRect.height / 2));
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
    hitOwnsButton: Boolean(hit && (hit === button || button.contains(hit))),
    hitTag: hit?.tagName || null,
    hitClass: hit?.className || null,
    activeIsButton: document.activeElement === button,
    documentScrollWidth: document.documentElement.scrollWidth,
    documentClientWidth: document.documentElement.clientWidth,
  };
}, { itemSel, buttonSel, wrapperSel });

const childSnapshot = async () => disclosureSnapshot({ itemSelector, buttonSelector, wrapperSelector });
const parentSnapshot = async () => disclosureSnapshot({
  itemSelector: parentItemSelector,
  buttonSelector: parentButtonSelector,
  wrapperSelector: parentWrapperSelector,
});

try {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(url, { waitUntil: 'networkidle' });

  // Verify the user-reachable SP depth-02 disclosure itself before opening it.
  // This is the outer Local Navigation control and therefore needs the same
  // Reduced Motion guarantee as the nested depth-03 disclosure below.
  const parentButton = page.locator(parentButtonSelector).first();
  await parentButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const parentBefore = await parentSnapshot();
  assert(parentBefore, 'Reduced Motion parent Local Navigation fixture is missing.');
  assert(parentBefore.reducedMotion, 'Browser did not activate prefers-reduced-motion: reduce.');
  assert(parentBefore.itemOpen === null || parentBefore.itemOpen === 'false', `Parent disclosure must begin closed, got ${parentBefore.itemOpen}.`);
  assert(parentBefore.ariaExpanded === 'false', `Parent disclosure must begin aria-expanded=false, got ${parentBefore.ariaExpanded}.`);
  assert(parentBefore.wrapperHeight <= 1, `Parent disclosure must begin collapsed, got ${parentBefore.wrapperHeight}px.`);
  assert(allDurationsZero(parentBefore.wrapperTransitionDuration), `Reduced Motion parent wrapper must not animate grid rows, got ${parentBefore.wrapperTransitionDuration}.`);
  assert(allDurationsZero(parentBefore.buttonAfterTransitionDuration), `Reduced Motion parent icon must not rotate with a transition, got ${parentBefore.buttonAfterTransitionDuration}.`);
  assert(parentBefore.hitOwnsButton, `Reduced Motion parent disclosure hit-test resolves to ${parentBefore.hitTag}.${parentBefore.hitClass} before open.`);

  await parentButton.click();
  await page.waitForTimeout(50);
  const parentOpen = await parentSnapshot();
  assert(parentOpen, 'Reduced Motion parent Local Navigation fixture disappeared after open.');
  assert(parentOpen.itemOpen === 'true', `Reduced Motion parent Local Navigation did not open, got ${parentOpen.itemOpen}.`);
  assert(parentOpen.ariaExpanded === 'true', `Reduced Motion parent Local Navigation aria-expanded expected true, got ${parentOpen.ariaExpanded}.`);
  assert(parentOpen.wrapperHeight > 30, `Reduced Motion parent wrapper did not expand, got ${parentOpen.wrapperHeight}px.`);
  assert(allDurationsZero(parentOpen.wrapperTransitionDuration), `Reduced Motion parent wrapper transition returned after open: ${parentOpen.wrapperTransitionDuration}.`);
  assert(allDurationsZero(parentOpen.buttonAfterTransitionDuration), `Reduced Motion parent icon transition returned after open: ${parentOpen.buttonAfterTransitionDuration}.`);
  assert(close(parentOpen.scrollY, parentBefore.scrollY), `Reduced Motion parent open moved scroll ${parentBefore.scrollY} -> ${parentOpen.scrollY}.`);
  assert(close(parentOpen.buttonTop, parentBefore.buttonTop), `Reduced Motion parent control moved vertically ${parentBefore.buttonTop} -> ${parentOpen.buttonTop}.`);
  assert(close(parentOpen.buttonLeft, parentBefore.buttonLeft), `Reduced Motion parent control moved horizontally ${parentBefore.buttonLeft} -> ${parentOpen.buttonLeft}.`);
  assert(close(parentOpen.buttonWidth, parentBefore.buttonWidth), `Reduced Motion parent control width changed ${parentBefore.buttonWidth} -> ${parentOpen.buttonWidth}.`);
  assert(parentOpen.activeIsButton, 'Reduced Motion parent disclosure button lost focus after open.');
  assert(parentOpen.documentScrollWidth <= parentOpen.documentClientWidth + 1, `Reduced Motion parent open introduced horizontal overflow ${parentOpen.documentScrollWidth}px > ${parentOpen.documentClientWidth}px.`);

  // The real depth-03 disclosure lives inside the collapsed SP depth-02 Local
  // Navigation selector. Opening the parent above makes this child genuinely
  // visible and user-reachable before pointer ownership is evaluated.
  const button = page.locator(buttonSelector).first();
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);

  const before = await childSnapshot();
  assert(before, 'Reduced Motion local navigation fixture is missing.');
  assert(before.reducedMotion, 'Browser did not activate prefers-reduced-motion: reduce.');
  assert(before.itemOpen === null || before.itemOpen === 'false', `Disclosure must begin closed, got ${before.itemOpen}.`);
  assert(before.ariaExpanded === 'false', `Disclosure must begin aria-expanded=false, got ${before.ariaExpanded}.`);
  assert(before.wrapperHeight <= 1, `Disclosure must begin collapsed, got ${before.wrapperHeight}px.`);
  assert(allDurationsZero(before.wrapperTransitionDuration), `Reduced Motion wrapper must not animate grid rows, got ${before.wrapperTransitionDuration}.`);
  assert(allDurationsZero(before.buttonAfterTransitionDuration), `Reduced Motion disclosure icon must not rotate with a transition, got ${before.buttonAfterTransitionDuration}.`);
  assert(before.hitOwnsButton, `Reduced Motion disclosure button hit-test resolves to ${before.hitTag}.${before.hitClass} before open.`);

  const cycle = async (expectedOpen, label) => {
    const baseline = await childSnapshot();
    assert(baseline, `${label}: baseline fixture missing.`);
    await button.click();
    await page.waitForTimeout(50);
    const next = await childSnapshot();
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
  console.log('PASS Budokan module menu removes parent/nested disclosure geometry/icon motion under prefers-reduced-motion while preserving pointer, focus, scroll, and width stability.');
} finally {
  await context.close();
  await browser.close();
}
