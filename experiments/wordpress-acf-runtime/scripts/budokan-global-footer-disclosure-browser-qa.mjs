import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-global-footer-disclosure-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

const snapshot = async ({ itemSelector, buttonSelector, wrapperSelector }) => page.evaluate(
  ({ itemSelector, buttonSelector, wrapperSelector }) => {
    const item = document.querySelector(itemSelector);
    const button = document.querySelector(buttonSelector);
    const wrapper = document.querySelector(wrapperSelector);
    if (!item || !button || !wrapper) return null;
    const buttonRect = button.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const hit = document.elementFromPoint(
      buttonRect.left + buttonRect.width / 2,
      buttonRect.top + buttonRect.height / 2,
    );
    return {
      scrollY: window.scrollY,
      itemOpen: item.getAttribute('data-open'),
      ariaExpanded: button.getAttribute('aria-expanded'),
      buttonTop: buttonRect.top,
      buttonLeft: buttonRect.left,
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      wrapperHeight: wrapperRect.height,
      activeIsButton: document.activeElement === button,
      hitOwnsButton: hit === button || button.contains(hit),
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
    };
  },
  { itemSelector, buttonSelector, wrapperSelector },
);

const auditDisclosure = async ({ label, itemSelector, buttonSelector, wrapperSelector }) => {
  const button = page.locator(buttonSelector).first();
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);

  const before = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(before, `${label} fixture is missing.`);
  assert(before.itemOpen === null || before.itemOpen === 'false', `${label} must begin closed, got data-open=${before.itemOpen}.`);
  assert(before.ariaExpanded === 'false', `${label} must begin aria-expanded=false, got ${before.ariaExpanded}.`);
  assert(before.wrapperHeight <= 1, `${label} must begin collapsed, got ${before.wrapperHeight}px.`);
  assert(before.hitOwnsButton, `${label} pointer hit-test is intercepted before open.`);

  await button.click();
  await page.waitForTimeout(400);
  const opened = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(opened?.itemOpen === 'true', `${label} pointer open did not set data-open=true.`);
  assert(opened?.ariaExpanded === 'true', `${label} pointer open did not set aria-expanded=true, got ${opened?.ariaExpanded}.`);
  assert(opened.wrapperHeight > 20, `${label} pointer open did not visibly expand, got ${opened.wrapperHeight}px.`);
  assert(close(opened.scrollY, before.scrollY), `${label} pointer open changed scroll position ${before.scrollY} -> ${opened.scrollY}.`);
  assert(close(opened.buttonTop, before.buttonTop), `${label} pointer open moved control vertically ${before.buttonTop} -> ${opened.buttonTop}.`);
  assert(close(opened.buttonLeft, before.buttonLeft), `${label} pointer open moved control horizontally ${before.buttonLeft} -> ${opened.buttonLeft}.`);
  assert(close(opened.buttonWidth, before.buttonWidth), `${label} pointer open resized control width ${before.buttonWidth} -> ${opened.buttonWidth}.`);
  assert(opened.activeIsButton, `${label} pointer open lost focus from disclosure button.`);
  assert(opened.hitOwnsButton, `${label} pointer hit-test is intercepted after open.`);
  assert(opened.documentScrollWidth <= opened.documentClientWidth + 1, `${label} pointer open introduced horizontal overflow ${opened.documentScrollWidth}px > ${opened.documentClientWidth}px.`);

  await button.click();
  await page.waitForTimeout(400);
  const closed = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(closed?.itemOpen === 'false', `${label} pointer close did not set data-open=false.`);
  assert(closed?.ariaExpanded === 'false', `${label} pointer close did not set aria-expanded=false, got ${closed?.ariaExpanded}.`);
  assert(closed.wrapperHeight <= 1, `${label} pointer close did not collapse, got ${closed.wrapperHeight}px.`);
  assert(close(closed.scrollY, before.scrollY), `${label} pointer close changed scroll position ${before.scrollY} -> ${closed.scrollY}.`);
  assert(closed.activeIsButton, `${label} pointer close lost focus from disclosure button.`);

  await button.press('Enter');
  await page.waitForTimeout(400);
  const keyboardOpened = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(keyboardOpened?.itemOpen === 'true', `${label} did not open from keyboard Enter.`);
  assert(keyboardOpened?.ariaExpanded === 'true', `${label} keyboard open did not set aria-expanded=true, got ${keyboardOpened?.ariaExpanded}.`);
  assert(keyboardOpened.activeIsButton, `${label} keyboard open lost focus.`);

  await button.press('Space');
  await page.waitForTimeout(400);
  const keyboardClosed = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(keyboardClosed?.itemOpen === 'false', `${label} did not close from keyboard Space.`);
  assert(keyboardClosed?.ariaExpanded === 'false', `${label} keyboard close did not set aria-expanded=false, got ${keyboardClosed?.ariaExpanded}.`);
  assert(keyboardClosed.activeIsButton, `${label} keyboard close lost focus.`);
};

const globalDisclosure = {
  label: 'SP global navigation child disclosure',
  itemSelector: '#global_navigation [class*="gnl_item"]._hasChild',
  buttonSelector: '#global_navigation [class*="gnl_item"]._hasChild > [class*="gnl_title"] > [class*="gnl_button"]',
  wrapperSelector: '#global_navigation [class*="gnl_item"]._hasChild > [class*="gnl_wrapper"]',
};
const footerDisclosure = {
  label: 'SP footer navigation child disclosure',
  itemSelector: '#global_footer [class*="gfl_item"]._hasChild',
  buttonSelector: '#global_footer [class*="gfl_item"]._hasChild [class*="gfl_button"]',
  wrapperSelector: '#global_footer [class*="gfl_item"]._hasChild > [class*="gfl_wrapper"]',
};

try {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(url, { waitUntil: 'networkidle' });

  // Preflight both independent WordPress Menu families before the first hard
  // semantic assertion so one missing aria-expanded cannot hide the other.
  const menuButton = page.locator('#gh_menu');
  await menuButton.click();
  await page.waitForTimeout(400);
  assert(await page.locator('body').evaluate((body) => body.classList.contains('_open-menu')), 'SP global menu did not open before disclosure audit.');
  const globalBaseline = await snapshot(globalDisclosure);
  assert(globalBaseline, 'SP global navigation child disclosure fixture is missing.');

  await page.locator('#gn_close').click();
  await page.waitForTimeout(200);
  await page.locator('#global_footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const footerBaseline = await snapshot(footerDisclosure);
  assert(footerBaseline, 'SP footer navigation child disclosure fixture is missing.');

  const semanticFailures = [];
  if (globalBaseline.ariaExpanded !== 'false') {
    semanticFailures.push(`global aria-expanded=${globalBaseline.ariaExpanded}`);
  }
  if (footerBaseline.ariaExpanded !== 'false') {
    semanticFailures.push(`footer aria-expanded=${footerBaseline.ariaExpanded}`);
  }
  assert(
    semanticFailures.length === 0,
    `Global/Footer disclosure semantic baseline mismatch: ${semanticFailures.join(' | ')}`,
  );

  // Re-open global menu for the full interaction cycle after both baselines pass.
  await menuButton.click();
  await page.waitForTimeout(400);
  await auditDisclosure(globalDisclosure);

  await page.locator('#gn_close').click();
  await page.waitForTimeout(200);
  await page.locator('#global_footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await auditDisclosure(footerDisclosure);

  assert(pageErrors.length === 0, `Global/Footer disclosure interaction produced page errors: ${pageErrors.join(' | ')}`);
  console.log('PASS Budokan SP Global/Footer WordPress Menu disclosure geometry, pointer ownership, keyboard stability, and aria-expanded synchronization QA');
} finally {
  await browser.close();
}
