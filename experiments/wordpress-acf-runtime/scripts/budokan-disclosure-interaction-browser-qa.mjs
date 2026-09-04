import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-disclosure-interaction-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 375, height: 900 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

const snapshot = async (itemSelector, buttonSelector, wrapperSelector) => page.evaluate(
  ({ itemSelector, buttonSelector, wrapperSelector }) => {
    const item = document.querySelector(itemSelector);
    const button = document.querySelector(buttonSelector);
    const wrapper = document.querySelector(wrapperSelector);
    if (!item || !button || !wrapper) return null;
    const buttonRect = button.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      itemOpen: item.getAttribute('data-open'),
      buttonTop: buttonRect.top,
      buttonLeft: buttonRect.left,
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      wrapperHeight: wrapperRect.height,
      activeIsButton: document.activeElement === button,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
    };
  },
  { itemSelector, buttonSelector, wrapperSelector },
);

const auditDisclosure = async ({ label, itemSelector, buttonSelector, wrapperSelector }) => {
  const button = page.locator(buttonSelector);
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);

  const before = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(before, `${label} fixture is missing.`);
  assert(before.itemOpen === 'false', `${label} must begin data-open=false, got ${before.itemOpen}.`);
  assert(before.wrapperHeight <= 1, `${label} must begin collapsed, got ${before.wrapperHeight}px.`);

  await button.click();
  await page.waitForTimeout(400);
  const opened = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(opened?.itemOpen === 'true', `${label} pointer open did not set data-open=true.`);
  assert(opened.wrapperHeight > 30, `${label} pointer open did not visibly expand, got ${opened.wrapperHeight}px.`);
  assert(close(opened.scrollY, before.scrollY), `${label} pointer open changed scroll position ${before.scrollY} -> ${opened.scrollY}.`);
  assert(close(opened.buttonTop, before.buttonTop), `${label} pointer open moved control vertically ${before.buttonTop} -> ${opened.buttonTop}.`);
  assert(close(opened.buttonLeft, before.buttonLeft), `${label} pointer open moved control horizontally ${before.buttonLeft} -> ${opened.buttonLeft}.`);
  assert(close(opened.buttonWidth, before.buttonWidth), `${label} pointer open resized control width ${before.buttonWidth} -> ${opened.buttonWidth}.`);
  assert(opened.activeIsButton, `${label} pointer open lost focus from the disclosure button.`);
  assert(opened.documentScrollWidth <= opened.documentClientWidth + 1, `${label} pointer open introduced horizontal overflow ${opened.documentScrollWidth}px > ${opened.documentClientWidth}px.`);

  await button.click();
  await page.waitForTimeout(400);
  const closed = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(closed?.itemOpen === 'false', `${label} pointer close did not set data-open=false.`);
  assert(closed.wrapperHeight <= 1, `${label} pointer close did not collapse, got ${closed.wrapperHeight}px.`);
  assert(close(closed.scrollY, before.scrollY), `${label} pointer close changed scroll position ${before.scrollY} -> ${closed.scrollY}.`);
  assert(close(closed.buttonTop, before.buttonTop), `${label} pointer close did not restore control position ${before.buttonTop} -> ${closed.buttonTop}.`);
  assert(closed.activeIsButton, `${label} pointer close lost focus from the disclosure button.`);

  await button.press('Enter');
  await page.waitForTimeout(400);
  const keyboardOpened = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(keyboardOpened?.itemOpen === 'true', `${label} did not open from keyboard Enter.`);
  assert(keyboardOpened.wrapperHeight > 30, `${label} keyboard open did not visibly expand, got ${keyboardOpened.wrapperHeight}px.`);
  assert(close(keyboardOpened.scrollY, before.scrollY), `${label} keyboard open changed scroll position ${before.scrollY} -> ${keyboardOpened.scrollY}.`);
  assert(keyboardOpened.activeIsButton, `${label} keyboard open lost focus from the disclosure button.`);

  await button.press('Space');
  await page.waitForTimeout(400);
  const keyboardClosed = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(keyboardClosed?.itemOpen === 'false', `${label} did not close from keyboard Space.`);
  assert(keyboardClosed.wrapperHeight <= 1, `${label} keyboard close did not collapse, got ${keyboardClosed.wrapperHeight}px.`);
  assert(close(keyboardClosed.scrollY, before.scrollY), `${label} keyboard close changed scroll position ${before.scrollY} -> ${keyboardClosed.scrollY}.`);
  assert(keyboardClosed.activeIsButton, `${label} keyboard close lost focus from the disclosure button.`);
};

try {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(url, { waitUntil: 'networkidle' });

  await auditDisclosure({
    label: 'SP dropdown navigation',
    itemSelector: '[data-qa-disclosure="dropdown"] .mdd_item-02._hasChild',
    buttonSelector: '[data-qa-disclosure="dropdown"] .mdd_button-02',
    wrapperSelector: '[data-qa-disclosure="dropdown"] .mdd_wrapper-02',
  });

  await auditDisclosure({
    label: 'SP module menu nested disclosure',
    itemSelector: '[data-qa-disclosure="module-menu"] .mm_item-03._hasChild',
    buttonSelector: '[data-qa-disclosure="module-menu"] .mm_button-03',
    wrapperSelector: '[data-qa-disclosure="module-menu"] .mm_wrapper-03',
  });

  assert(pageErrors.length === 0, `Disclosure interaction produced page errors: ${pageErrors.join(' | ')}`);
  console.log('PASS Budokan disclosure interaction stability browser QA');
} finally {
  await browser.close();
}
