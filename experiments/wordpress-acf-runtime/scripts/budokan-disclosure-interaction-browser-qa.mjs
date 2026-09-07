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
    const hit = document.elementFromPoint(
      buttonRect.left + Math.min(buttonRect.width / 2, 18),
      buttonRect.top + Math.min(buttonRect.height / 2, 18),
    );
    return {
      scrollY: window.scrollY,
      itemOpen: item.getAttribute('data-open'),
      ariaExpanded: button.getAttribute('aria-expanded'),
      buttonTop: buttonRect.top,
      buttonLeft: buttonRect.left,
      buttonWidth: buttonRect.width,
      wrapperHeight: wrapperRect.height,
      activeIsButton: document.activeElement === button,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      hitOwnsButton: hit === button || button.contains(hit),
      hitTag: hit?.tagName || '',
      hitClass: typeof hit?.className === 'string' ? hit.className : '',
    };
  },
  { itemSelector, buttonSelector, wrapperSelector },
);

const pointerClick = async (state, label) => {
  assert(state, `${label} state is missing.`);
  assert(state.hitOwnsButton, `${label} pointer hit-test is intercepted by ${state.hitTag}.${state.hitClass}.`);
  await page.mouse.click(
    state.buttonLeft + Math.min(state.buttonWidth / 2, 18),
    state.buttonTop + 18,
  );
};

const auditDisclosure = async ({ label, itemSelector, buttonSelector, wrapperSelector }) => {
  const button = page.locator(buttonSelector);
  assert(await button.isVisible(), `${label} disclosure button must be visible before interaction audit.`);
  await page.waitForTimeout(100);

  const before = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(before, `${label} fixture is missing.`);
  assert(before.itemOpen === 'false', `${label} must begin data-open=false, got ${before.itemOpen}.`);
  assert(before.ariaExpanded === 'false', `${label} must begin aria-expanded=false, got ${before.ariaExpanded}.`);
  assert(before.wrapperHeight <= 1, `${label} must begin collapsed, got ${before.wrapperHeight}px.`);
  assert(before.hitOwnsButton, `${label} initial pointer hit-test is intercepted by ${before.hitTag}.${before.hitClass}.`);

  await pointerClick(before, `${label} before open`);
  await page.waitForTimeout(400);
  const opened = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(opened?.itemOpen === 'true', `${label} pointer open did not set data-open=true.`);
  assert(opened?.ariaExpanded === 'true', `${label} pointer open did not set aria-expanded=true, got ${opened?.ariaExpanded}.`);
  assert(opened.wrapperHeight > 30, `${label} pointer open did not visibly expand, got ${opened.wrapperHeight}px.`);
  assert(close(opened.scrollY, before.scrollY), `${label} pointer open changed scroll position ${before.scrollY} -> ${opened.scrollY}.`);
  assert(close(opened.buttonTop, before.buttonTop), `${label} pointer open moved control vertically ${before.buttonTop} -> ${opened.buttonTop}.`);
  assert(close(opened.buttonLeft, before.buttonLeft), `${label} pointer open moved control horizontally ${before.buttonLeft} -> ${opened.buttonLeft}.`);
  assert(close(opened.buttonWidth, before.buttonWidth), `${label} pointer open resized control width ${before.buttonWidth} -> ${opened.buttonWidth}.`);
  assert(close(opened.documentClientWidth, before.documentClientWidth), `${label} pointer open changed document client width ${before.documentClientWidth} -> ${opened.documentClientWidth}.`);
  assert(opened.hitOwnsButton, `${label} pointer hit-test is intercepted after open by ${opened.hitTag}.${opened.hitClass}.`);
  assert(opened.documentScrollWidth <= opened.documentClientWidth + 1, `${label} pointer open introduced horizontal overflow ${opened.documentScrollWidth}px > ${opened.documentClientWidth}px.`);

  await pointerClick(opened, `${label} after open`);
  await page.waitForTimeout(400);
  const closed = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(closed?.itemOpen === 'false', `${label} pointer close did not set data-open=false.`);
  assert(closed?.ariaExpanded === 'false', `${label} pointer close did not set aria-expanded=false, got ${closed?.ariaExpanded}.`);
  assert(closed.wrapperHeight <= 1, `${label} pointer close did not collapse, got ${closed.wrapperHeight}px.`);
  assert(close(closed.scrollY, before.scrollY), `${label} pointer close changed scroll position ${before.scrollY} -> ${closed.scrollY}.`);
  assert(close(closed.buttonTop, before.buttonTop), `${label} pointer close did not restore control position ${before.buttonTop} -> ${closed.buttonTop}.`);
  assert(close(closed.documentClientWidth, before.documentClientWidth), `${label} pointer close changed document client width ${before.documentClientWidth} -> ${closed.documentClientWidth}.`);

  await pointerClick(closed, `${label} before reopen`);
  await page.waitForTimeout(400);
  const reopened = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(reopened?.itemOpen === 'true', `${label} pointer reopen did not set data-open=true.`);
  assert(reopened?.ariaExpanded === 'true', `${label} pointer reopen did not set aria-expanded=true, got ${reopened?.ariaExpanded}.`);
  assert(reopened.wrapperHeight > 30, `${label} pointer reopen did not visibly expand, got ${reopened.wrapperHeight}px.`);
  assert(close(reopened.scrollY, before.scrollY), `${label} pointer reopen changed scroll position ${before.scrollY} -> ${reopened.scrollY}.`);
  assert(close(reopened.buttonTop, before.buttonTop), `${label} pointer reopen moved control vertically ${before.buttonTop} -> ${reopened.buttonTop}.`);
  assert(close(reopened.buttonLeft, before.buttonLeft), `${label} pointer reopen moved control horizontally ${before.buttonLeft} -> ${reopened.buttonLeft}.`);
  assert(close(reopened.buttonWidth, before.buttonWidth), `${label} pointer reopen resized control width ${before.buttonWidth} -> ${reopened.buttonWidth}.`);
  assert(close(reopened.documentClientWidth, before.documentClientWidth), `${label} pointer reopen changed document client width ${before.documentClientWidth} -> ${reopened.documentClientWidth}.`);
  assert(reopened.hitOwnsButton, `${label} pointer hit-test is intercepted after reopen by ${reopened.hitTag}.${reopened.hitClass}.`);
  assert(reopened.documentScrollWidth <= reopened.documentClientWidth + 1, `${label} pointer reopen introduced horizontal overflow ${reopened.documentScrollWidth}px > ${reopened.documentClientWidth}px.`);

  await pointerClick(reopened, `${label} after reopen`);
  await page.waitForTimeout(400);
  const reclosed = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(reclosed?.itemOpen === 'false', `${label} pointer reclose did not set data-open=false.`);
  assert(reclosed?.ariaExpanded === 'false', `${label} pointer reclose did not set aria-expanded=false, got ${reclosed?.ariaExpanded}.`);
  assert(reclosed.wrapperHeight <= 1, `${label} pointer reclose did not collapse, got ${reclosed.wrapperHeight}px.`);
  assert(close(reclosed.scrollY, before.scrollY), `${label} pointer reclose changed scroll position ${before.scrollY} -> ${reclosed.scrollY}.`);
  assert(close(reclosed.documentClientWidth, before.documentClientWidth), `${label} pointer reclose changed document client width ${before.documentClientWidth} -> ${reclosed.documentClientWidth}.`);

  await button.focus();
  assert(await button.evaluate((el) => document.activeElement === el), `${label} could not receive keyboard focus.`);
  await button.press('Enter');
  await page.waitForTimeout(400);
  const keyboardOpened = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(keyboardOpened?.itemOpen === 'true', `${label} did not open from keyboard Enter.`);
  assert(keyboardOpened?.ariaExpanded === 'true', `${label} keyboard open did not set aria-expanded=true, got ${keyboardOpened?.ariaExpanded}.`);
  assert(keyboardOpened.wrapperHeight > 30, `${label} keyboard open did not visibly expand, got ${keyboardOpened.wrapperHeight}px.`);
  assert(close(keyboardOpened.scrollY, before.scrollY), `${label} keyboard open changed scroll position ${before.scrollY} -> ${keyboardOpened.scrollY}.`);
  assert(close(keyboardOpened.documentClientWidth, before.documentClientWidth), `${label} keyboard open changed document client width ${before.documentClientWidth} -> ${keyboardOpened.documentClientWidth}.`);
  assert(keyboardOpened.activeIsButton, `${label} keyboard open lost focus from the disclosure button.`);

  await button.press('Space');
  await page.waitForTimeout(400);
  const keyboardClosed = await snapshot(itemSelector, buttonSelector, wrapperSelector);
  assert(keyboardClosed?.itemOpen === 'false', `${label} did not close from keyboard Space.`);
  assert(keyboardClosed?.ariaExpanded === 'false', `${label} keyboard close did not set aria-expanded=false, got ${keyboardClosed?.ariaExpanded}.`);
  assert(keyboardClosed.wrapperHeight <= 1, `${label} keyboard close did not collapse, got ${keyboardClosed.wrapperHeight}px.`);
  assert(close(keyboardClosed.scrollY, before.scrollY), `${label} keyboard close changed scroll position ${before.scrollY} -> ${keyboardClosed.scrollY}.`);
  assert(close(keyboardClosed.documentClientWidth, before.documentClientWidth), `${label} keyboard close changed document client width ${before.documentClientWidth} -> ${keyboardClosed.documentClientWidth}.`);
  assert(keyboardClosed.activeIsButton, `${label} keyboard close lost focus from the disclosure button.`);
};

try {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(url, { waitUntil: 'networkidle' });

  const dropdownRoot = page.locator('[data-qa-disclosure="dropdown"]');
  await dropdownRoot.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);

  await auditDisclosure({
    label: 'SP dropdown navigation',
    itemSelector: '[data-qa-disclosure="dropdown"] .mdd_item-02._hasChild',
    buttonSelector: '[data-qa-disclosure="dropdown"] .mdd_button-02',
    wrapperSelector: '[data-qa-disclosure="dropdown"] .mdd_wrapper-02',
  });

  assert(pageErrors.length === 0, `Dropdown interaction produced page errors: ${pageErrors.join(' | ')}`);
  console.log('PASS Budokan dropdown disclosure open-close-reopen geometry, real pointer ownership, keyboard stability, document-width stability, and aria-expanded synchronization browser QA');
} finally {
  await browser.close();
}
