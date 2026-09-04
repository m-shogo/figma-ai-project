import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-local-nav-interaction-browser-qa.mjs <url>');
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

try {
  await page.goto(url, { waitUntil: 'networkidle' });

  const selector = page.locator('.lnl_item-02 > .lnl_title-02 > .lnl_button-02');
  await selector.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);

  const snapshot = () => page.evaluate(() => {
    const item = document.querySelector('.lnl_item-02');
    const button = document.querySelector('.lnl_item-02 > .lnl_title-02 > .lnl_button-02');
    const wrapper = document.querySelector('.lnl_item-02 > .lnl_wrapper-02');
    if (!item || !button || !wrapper) return null;
    const buttonRect = button.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      itemOpen: item.getAttribute('data-open'),
      buttonTop: buttonRect.top,
      buttonHeight: buttonRect.height,
      wrapperHeight: wrapperRect.height,
      activeIsButton: document.activeElement === button,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
    };
  });

  const before = await snapshot();
  assert(before, 'SP local navigation interaction fixture is missing.');
  assert(before.wrapperHeight <= 1, `SP local navigation must begin collapsed, got ${before.wrapperHeight}px.`);

  await selector.click();
  await page.waitForTimeout(400);
  const opened = await snapshot();
  assert(opened, 'SP local navigation open-state fixture is missing.');
  assert(opened.itemOpen === 'true', `SP local navigation data-open expected true, got ${opened.itemOpen}.`);
  assert(opened.wrapperHeight > 40, `SP local navigation wrapper did not visibly expand, got ${opened.wrapperHeight}px.`);
  assert(close(opened.scrollY, before.scrollY), `SP local navigation open unexpectedly changed scroll position ${before.scrollY} -> ${opened.scrollY}.`);
  assert(close(opened.buttonTop, before.buttonTop), `SP local navigation control jumped vertically on open ${before.buttonTop} -> ${opened.buttonTop}.`);
  assert(opened.activeIsButton, 'SP local navigation control lost keyboard focus after pointer open.');
  assert(opened.documentScrollWidth <= opened.documentClientWidth + 1, `SP local navigation open introduced horizontal page overflow ${opened.documentScrollWidth}px > ${opened.documentClientWidth}px.`);

  await selector.click();
  await page.waitForTimeout(400);
  const closed = await snapshot();
  assert(closed, 'SP local navigation close-state fixture is missing.');
  assert(closed.itemOpen === 'false', `SP local navigation data-open expected false, got ${closed.itemOpen}.`);
  assert(closed.wrapperHeight <= 1, `SP local navigation wrapper did not collapse after close, got ${closed.wrapperHeight}px.`);
  assert(close(closed.scrollY, before.scrollY), `SP local navigation close did not preserve scroll position ${before.scrollY} -> ${closed.scrollY}.`);
  assert(close(closed.buttonTop, before.buttonTop), `SP local navigation control did not return to its original viewport position ${before.buttonTop} -> ${closed.buttonTop}.`);
  assert(closed.activeIsButton, 'SP local navigation control lost keyboard focus after pointer close.');

  await selector.press('Enter');
  await page.waitForTimeout(400);
  const keyboardOpened = await snapshot();
  assert(keyboardOpened?.itemOpen === 'true', 'SP local navigation did not open from keyboard Enter.');
  assert(keyboardOpened.wrapperHeight > 40, `SP local navigation keyboard open did not expand wrapper, got ${keyboardOpened.wrapperHeight}px.`);
  assert(close(keyboardOpened.scrollY, before.scrollY), `SP local navigation keyboard open changed scroll position ${before.scrollY} -> ${keyboardOpened.scrollY}.`);
  assert(keyboardOpened.activeIsButton, 'SP local navigation control lost focus after keyboard open.');

  await selector.press('Space');
  await page.waitForTimeout(400);
  const keyboardClosed = await snapshot();
  assert(keyboardClosed?.itemOpen === 'false', 'SP local navigation did not close from keyboard Space.');
  assert(keyboardClosed.wrapperHeight <= 1, `SP local navigation keyboard close did not collapse wrapper, got ${keyboardClosed.wrapperHeight}px.`);
  assert(close(keyboardClosed.scrollY, before.scrollY), `SP local navigation keyboard close changed scroll position ${before.scrollY} -> ${keyboardClosed.scrollY}.`);
  assert(keyboardClosed.activeIsButton, 'SP local navigation control lost focus after keyboard close.');

  console.log('PASS Budokan SP local navigation opens/closes without scroll jump, control displacement, focus loss, or horizontal overflow.');
  console.log('PASS Budokan SP local navigation preserves native keyboard activation for Enter and Space.');
} finally {
  await context.close();
  await browser.close();
}
