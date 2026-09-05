import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-local-nav-pointer-browser-qa.mjs <url>');
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

const buttonSelector = '.lnl_item-02 > .lnl_title-02 > .lnl_button-02';
const itemSelector = '.lnl_item-02';
const wrapperSelector = '.lnl_item-02 > .lnl_wrapper-02';

const snapshot = () => page.evaluate(({ buttonSelector, itemSelector, wrapperSelector }) => {
  const button = document.querySelector(buttonSelector);
  const item = document.querySelector(itemSelector);
  const wrapper = document.querySelector(wrapperSelector);
  if (!button || !item || !wrapper) return null;

  const rect = button.getBoundingClientRect();
  const x = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
  const y = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
  const hit = document.elementFromPoint(x, y);

  return {
    scrollY: window.scrollY,
    itemOpen: item.getAttribute('data-open'),
    buttonTop: rect.top,
    buttonLeft: rect.left,
    buttonWidth: rect.width,
    buttonHeight: rect.height,
    wrapperHeight: wrapper.getBoundingClientRect().height,
    pointerOwnedByButton: Boolean(hit && (hit === button || button.contains(hit))),
    hitTag: hit?.tagName || null,
    hitClass: hit?.className || null,
    documentScrollWidth: document.documentElement.scrollWidth,
    documentClientWidth: document.documentElement.clientWidth,
  };
}, { buttonSelector, itemSelector, wrapperSelector });

try {
  await page.goto(url, { waitUntil: 'networkidle' });

  // The production template can legitimately place Local Navigation inside the
  // first viewport when the page body is short. Add QA-only content before the
  // component so this test deterministically exercises the same control at a
  // deep, non-zero page position without changing production markup or CSS.
  await page.evaluate(() => {
    const nav = document.querySelector('.local_navigation');
    if (!nav) return;
    const spacer = document.createElement('div');
    spacer.setAttribute('data-qa-deep-scroll-spacer', 'true');
    spacer.style.height = '1400px';
    spacer.style.pointerEvents = 'none';
    nav.before(spacer);
  });

  const button = page.locator(buttonSelector).first();
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);

  const initial = await snapshot();
  assert(initial, 'SP local navigation pointer fixture is missing.');
  assert(initial.scrollY > 0, `SP local navigation pointer fixture must be scrolled, got ${initial.scrollY}.`);
  assert(initial.pointerOwnedByButton, `SP local navigation control is visually present but pointer hit-test resolves to ${initial.hitTag}.${initial.hitClass}.`);
  assert(initial.documentScrollWidth <= initial.documentClientWidth + 1, `SP local navigation initial state has horizontal overflow ${initial.documentScrollWidth}px > ${initial.documentClientWidth}px.`);

  await button.click();
  await page.waitForTimeout(400);
  const opened = await snapshot();
  assert(opened?.itemOpen === 'true', 'SP local navigation did not open on real pointer click.');
  assert(opened.wrapperHeight > 40, `SP local navigation open wrapper is not visible, got ${opened.wrapperHeight}px.`);
  assert(opened.pointerOwnedByButton, `SP local navigation open-state control is intercepted by ${opened.hitTag}.${opened.hitClass}.`);
  assert(close(opened.scrollY, initial.scrollY), `SP local navigation open changed scroll ${initial.scrollY} -> ${opened.scrollY}.`);
  assert(close(opened.buttonTop, initial.buttonTop), `SP local navigation open moved control ${initial.buttonTop} -> ${opened.buttonTop}.`);
  assert(close(opened.buttonLeft, initial.buttonLeft), `SP local navigation open shifted control horizontally ${initial.buttonLeft} -> ${opened.buttonLeft}.`);
  assert(close(opened.buttonWidth, initial.buttonWidth), `SP local navigation open resized control width ${initial.buttonWidth} -> ${opened.buttonWidth}.`);
  assert(close(opened.buttonHeight, initial.buttonHeight), `SP local navigation open resized control height ${initial.buttonHeight} -> ${opened.buttonHeight}.`);
  assert(opened.documentScrollWidth <= opened.documentClientWidth + 1, `SP local navigation open introduced horizontal overflow ${opened.documentScrollWidth}px > ${opened.documentClientWidth}px.`);

  await button.click();
  await page.waitForTimeout(400);
  const closed = await snapshot();
  assert(closed?.itemOpen === 'false', 'SP local navigation did not close on real pointer click.');
  assert(closed.wrapperHeight <= 1, `SP local navigation close did not collapse, got ${closed.wrapperHeight}px.`);
  assert(closed.pointerOwnedByButton, `SP local navigation closed-state control is intercepted by ${closed.hitTag}.${closed.hitClass}.`);
  assert(close(closed.scrollY, initial.scrollY), `SP local navigation close changed scroll ${initial.scrollY} -> ${closed.scrollY}.`);
  assert(close(closed.buttonTop, initial.buttonTop), `SP local navigation close did not restore control position ${initial.buttonTop} -> ${closed.buttonTop}.`);

  await button.click();
  await page.waitForTimeout(400);
  const reopened = await snapshot();
  assert(reopened?.itemOpen === 'true', 'SP local navigation did not reopen after close.');
  assert(reopened.wrapperHeight > 40, `SP local navigation reopen wrapper is not visible, got ${reopened.wrapperHeight}px.`);
  assert(reopened.pointerOwnedByButton, `SP local navigation reopened control is intercepted by ${reopened.hitTag}.${reopened.hitClass}.`);
  assert(close(reopened.scrollY, initial.scrollY), `SP local navigation reopen changed scroll ${initial.scrollY} -> ${reopened.scrollY}.`);
  assert(close(reopened.buttonTop, initial.buttonTop), `SP local navigation reopen moved control ${initial.buttonTop} -> ${reopened.buttonTop}.`);
  assert(reopened.documentScrollWidth <= reopened.documentClientWidth + 1, `SP local navigation reopen introduced horizontal overflow ${reopened.documentScrollWidth}px > ${reopened.documentClientWidth}px.`);

  await button.click();
  await page.waitForTimeout(400);
  const finalClosed = await snapshot();
  assert(finalClosed?.itemOpen === 'false', 'SP local navigation final close failed.');
  assert(close(finalClosed.scrollY, initial.scrollY), `SP local navigation final close changed scroll ${initial.scrollY} -> ${finalClosed.scrollY}.`);
  assert(finalClosed.pointerOwnedByButton, `SP local navigation final closed control is intercepted by ${finalClosed.hitTag}.${finalClosed.hitClass}.`);

  console.log('PASS Budokan SP local navigation pointer ownership is stable through open/close/reopen at a deep scrolled page position.');
} finally {
  await context.close();
  await browser.close();
}
