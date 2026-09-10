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
    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;
    const hit = document.elementFromPoint(centerX, centerY);
    return {
      scrollY: window.scrollY,
      itemOpen: item.getAttribute('data-open'),
      ariaExpanded: button.getAttribute('aria-expanded'),
      buttonTop: buttonRect.top,
      buttonLeft: buttonRect.left,
      buttonWidth: buttonRect.width,
      buttonHeight: buttonRect.height,
      buttonCenterX: centerX,
      buttonCenterY: centerY,
      wrapperHeight: wrapperRect.height,
      activeIsButton: document.activeElement === button,
      hitOwnsButton: hit === button || button.contains(hit),
      hitTag: hit?.tagName || null,
      hitClass: hit?.className || null,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
    };
  },
  { itemSelector, buttonSelector, wrapperSelector },
);

const pointerClick = async (state, label) => {
  assert(state?.hitOwnsButton, `${label} pointer center is intercepted by ${state?.hitTag}.${state?.hitClass}.`);
  assert(state.buttonCenterX >= 0 && state.buttonCenterX <= 390, `${label} pointer center x=${state.buttonCenterX} is outside viewport.`);
  assert(state.buttonCenterY >= 0 && state.buttonCenterY <= 844, `${label} pointer center y=${state.buttonCenterY} is outside viewport.`);
  await page.mouse.click(state.buttonCenterX, state.buttonCenterY);
};

const auditDisclosure = async ({ label, itemSelector, buttonSelector, wrapperSelector }) => {
  const button = page.locator(buttonSelector).first();
  assert(await button.isVisible(), `${label} disclosure button must be visible before interaction audit.`);
  await page.waitForTimeout(100);

  const before = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(before, `${label} fixture is missing.`);
  assert(before.itemOpen === null || before.itemOpen === 'false', `${label} must begin closed, got data-open=${before.itemOpen}.`);
  assert(before.ariaExpanded === 'false', `${label} must begin aria-expanded=false, got ${before.ariaExpanded}.`);
  assert(before.wrapperHeight <= 1, `${label} must begin collapsed, got ${before.wrapperHeight}px.`);

  await pointerClick(before, `${label} before open`);
  await page.waitForTimeout(400);
  const opened = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(opened?.itemOpen === 'true', `${label} pointer open did not set data-open=true.`);
  assert(opened?.ariaExpanded === 'true', `${label} pointer open did not set aria-expanded=true, got ${opened?.ariaExpanded}.`);
  assert(opened.wrapperHeight > 20, `${label} pointer open did not visibly expand, got ${opened.wrapperHeight}px.`);
  assert(close(opened.scrollY, before.scrollY), `${label} pointer open changed scroll position ${before.scrollY} -> ${opened.scrollY}.`);
  assert(close(opened.buttonTop, before.buttonTop), `${label} pointer open moved control vertically ${before.buttonTop} -> ${opened.buttonTop}.`);
  assert(close(opened.buttonLeft, before.buttonLeft), `${label} pointer open moved control horizontally ${before.buttonLeft} -> ${opened.buttonLeft}.`);
  assert(close(opened.buttonWidth, before.buttonWidth), `${label} pointer open resized control width ${before.buttonWidth} -> ${opened.buttonWidth}.`);
  assert(close(opened.documentClientWidth, before.documentClientWidth), `${label} pointer open changed document client width ${before.documentClientWidth} -> ${opened.documentClientWidth}.`);
  assert(opened.hitOwnsButton, `${label} pointer hit-test is intercepted after open by ${opened.hitTag}.${opened.hitClass}.`);
  assert(opened.documentScrollWidth <= opened.documentClientWidth + 1, `${label} pointer open introduced horizontal overflow ${opened.documentScrollWidth}px > ${opened.documentClientWidth}px.`);

  await pointerClick(opened, `${label} before close`);
  await page.waitForTimeout(400);
  const closed = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(closed?.itemOpen === 'false', `${label} pointer close did not set data-open=false.`);
  assert(closed?.ariaExpanded === 'false', `${label} pointer close did not set aria-expanded=false, got ${closed?.ariaExpanded}.`);
  assert(closed.wrapperHeight <= 1, `${label} pointer close did not collapse, got ${closed.wrapperHeight}px.`);
  assert(close(closed.scrollY, before.scrollY), `${label} pointer close changed scroll position ${before.scrollY} -> ${closed.scrollY}.`);
  assert(close(closed.documentClientWidth, before.documentClientWidth), `${label} pointer close changed document client width ${before.documentClientWidth} -> ${closed.documentClientWidth}.`);

  await pointerClick(closed, `${label} before reopen`);
  await page.waitForTimeout(400);
  const reopened = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(reopened?.itemOpen === 'true', `${label} pointer reopen did not set data-open=true.`);
  assert(reopened?.ariaExpanded === 'true', `${label} pointer reopen did not set aria-expanded=true, got ${reopened?.ariaExpanded}.`);
  assert(reopened.wrapperHeight > 20, `${label} pointer reopen did not visibly expand, got ${reopened.wrapperHeight}px.`);
  assert(close(reopened.scrollY, before.scrollY), `${label} pointer reopen changed scroll position ${before.scrollY} -> ${reopened.scrollY}.`);
  assert(close(reopened.buttonTop, before.buttonTop), `${label} pointer reopen moved control vertically ${before.buttonTop} -> ${reopened.buttonTop}.`);
  assert(close(reopened.buttonLeft, before.buttonLeft), `${label} pointer reopen moved control horizontally ${before.buttonLeft} -> ${reopened.buttonLeft}.`);
  assert(close(reopened.buttonWidth, before.buttonWidth), `${label} pointer reopen resized control width ${before.buttonWidth} -> ${reopened.buttonWidth}.`);
  assert(close(reopened.documentClientWidth, before.documentClientWidth), `${label} pointer reopen changed document client width ${before.documentClientWidth} -> ${reopened.documentClientWidth}.`);
  assert(reopened.hitOwnsButton, `${label} pointer hit-test is intercepted after reopen by ${reopened.hitTag}.${reopened.hitClass}.`);
  assert(reopened.documentScrollWidth <= reopened.documentClientWidth + 1, `${label} pointer reopen introduced horizontal overflow ${reopened.documentScrollWidth}px > ${reopened.documentClientWidth}px.`);

  await pointerClick(reopened, `${label} after reopen`);
  await page.waitForTimeout(400);
  const reclosed = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(reclosed?.itemOpen === 'false', `${label} pointer reclose did not set data-open=false.`);
  assert(reclosed?.ariaExpanded === 'false', `${label} pointer reclose did not set aria-expanded=false, got ${reclosed?.ariaExpanded}.`);
  assert(reclosed.wrapperHeight <= 1, `${label} pointer reclose did not collapse, got ${reclosed.wrapperHeight}px.`);
  assert(close(reclosed.scrollY, before.scrollY), `${label} pointer reclose changed scroll position ${before.scrollY} -> ${reclosed.scrollY}.`);
  assert(close(reclosed.documentClientWidth, before.documentClientWidth), `${label} pointer reclose changed document client width ${before.documentClientWidth} -> ${reclosed.documentClientWidth}.`);

  await button.focus();
  assert(await button.evaluate((el) => document.activeElement === el), `${label} could not receive keyboard focus.`);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const keyboardOpened = await snapshot({ itemSelector, buttonSelector, wrapperSelector });
  assert(keyboardOpened?.itemOpen === 'true', `${label} did not open from keyboard Enter.`);
  assert(keyboardOpened?.ariaExpanded === 'true', `${label} keyboard open did not set aria-expanded=true, got ${keyboardOpened?.ariaExpanded}.`);
  assert(keyboardOpened.activeIsButton, `${label} keyboard open lost focus.`);

  await page.keyboard.press('Space');
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
  const menuButton = page.locator('#gh_menu');
  await menuButton.click();
  await page.waitForTimeout(400);
  assert(await page.locator('body').evaluate((body) => body.classList.contains('_open-menu')), 'SP global menu did not open before disclosure audit.');
  const globalBaseline = await snapshot(globalDisclosure);
  assert(globalBaseline, 'SP global navigation child disclosure fixture is missing.');

  // SP uses the visible hamburger control as the real close owner; #gn_close
  // is not visible in this layout and must not be force-clicked in QA.
  await menuButton.click();
  await page.waitForTimeout(200);
  assert(await page.locator('body').evaluate((body) => !body.classList.contains('_open-menu')), 'SP global menu did not close from the visible hamburger control.');
  await page.locator('#global_footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const footerBaseline = await snapshot(footerDisclosure);
  assert(footerBaseline, 'SP footer navigation child disclosure fixture is missing.');

  const footerButton = page.locator(footerDisclosure.buttonSelector).first();
  const footerLinksWrap = page.locator('#global_footer .gf_links-wrap').first();
  assert(!(await footerButton.isVisible()), 'SP footer nested-menu button unexpectedly became pointer-visible.');
  assert(!(await footerLinksWrap.isVisible()), 'SP footer WordPress links wrapper unexpectedly became visible.');
  assert(footerBaseline.wrapperHeight <= 1, `SP footer hidden nested wrapper must remain collapsed, got ${footerBaseline.wrapperHeight}px.`);

  const semanticFailures = [];
  if (globalBaseline.ariaExpanded !== 'false') semanticFailures.push(`global aria-expanded=${globalBaseline.ariaExpanded}`);
  if (footerBaseline.ariaExpanded !== 'false') semanticFailures.push(`footer aria-expanded=${footerBaseline.ariaExpanded}`);
  assert(semanticFailures.length === 0, `Global/Footer disclosure semantic baseline mismatch: ${semanticFailures.join(' | ')}`);

  await menuButton.click();
  await page.waitForTimeout(400);
  await auditDisclosure(globalDisclosure);

  await menuButton.click();
  await page.waitForTimeout(200);
  assert(await page.locator('body').evaluate((body) => !body.classList.contains('_open-menu')), 'SP global menu did not close after disclosure interaction cycle.');
  await page.locator('#global_footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const footerAfterGlobalCycle = await snapshot(footerDisclosure);
  assert(footerAfterGlobalCycle?.itemOpen === null || footerAfterGlobalCycle?.itemOpen === 'false', `SP footer hidden item changed state after global interaction, got data-open=${footerAfterGlobalCycle?.itemOpen}.`);
  assert(footerAfterGlobalCycle?.ariaExpanded === 'false', `SP footer hidden button changed aria-expanded after global interaction, got ${footerAfterGlobalCycle?.ariaExpanded}.`);
  assert(footerAfterGlobalCycle?.wrapperHeight <= 1, `SP footer hidden wrapper expanded after global interaction, got ${footerAfterGlobalCycle.wrapperHeight}px.`);
  assert(!(await footerButton.isVisible()), 'SP footer nested-menu button became pointer-visible after global interaction cycle.');
  assert(footerAfterGlobalCycle.documentScrollWidth <= footerAfterGlobalCycle.documentClientWidth + 1, `SP footer state introduced horizontal overflow ${footerAfterGlobalCycle.documentScrollWidth}px > ${footerAfterGlobalCycle.documentClientWidth}px.`);

  assert(pageErrors.length === 0, `Global/Footer disclosure interaction produced page errors: ${pageErrors.join(' | ')}`);
  console.log('PASS Budokan SP Global WordPress Menu disclosure open-close-reopen geometry, pointer ownership, keyboard stability, document-width stability, plus non-interactive Footer menu visibility contract QA');
} finally {
  await browser.close();
}
