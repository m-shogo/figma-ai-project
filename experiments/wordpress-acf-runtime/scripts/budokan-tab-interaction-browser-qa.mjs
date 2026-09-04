import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-tab-interaction-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;
const browser = await chromium.launch({ headless: true });

const auditViewport = async ({ label, viewport, isMobile = false, hasTouch = false }) => {
  const context = await browser.newContext({ viewport, isMobile, hasTouch });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const snapshot = async () => page.evaluate(() => {
    const wrapper = document.querySelector('[data-qa-tab="primary"]');
    if (!wrapper) return null;
    const buttons = [...wrapper.querySelectorAll('.tab-button')];
    const panels = [...wrapper.querySelectorAll('.tab-panel')];
    const buttonRects = buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    });
    return {
      scrollY: window.scrollY,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      buttonCount: buttons.length,
      activeIndex: buttons.findIndex((button) => button.classList.contains('active')),
      visiblePanels: panels.map((panel) => getComputedStyle(panel).display !== 'none'),
      buttonRects,
      activeElementIndex: buttons.indexOf(document.activeElement),
    };
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    const wrapper = page.locator('[data-qa-tab="primary"]');
    await wrapper.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);

    const before = await snapshot();
    assert(before, `${label}: tab fixture is missing.`);
    assert(before.buttonCount === 3, `${label}: expected 3 generated tab buttons, got ${before.buttonCount}.`);
    assert(before.activeIndex === 0, `${label}: first tab must begin active, got active index ${before.activeIndex}.`);
    assert(JSON.stringify(before.visiblePanels) === JSON.stringify([true, false, false]), `${label}: unexpected initial panel visibility ${JSON.stringify(before.visiblePanels)}.`);
    assert(before.documentScrollWidth <= before.documentClientWidth + 1, `${label}: initial tab fixture has horizontal overflow ${before.documentScrollWidth}px > ${before.documentClientWidth}px.`);

    const second = page.locator('[data-qa-tab="primary"] .tab-button').nth(1);
    await second.click();
    await page.waitForTimeout(150);
    const clicked = await snapshot();
    assert(clicked.activeIndex === 1, `${label}: pointer click did not activate second tab, got ${clicked.activeIndex}.`);
    assert(JSON.stringify(clicked.visiblePanels) === JSON.stringify([false, true, false]), `${label}: pointer click panel visibility mismatch ${JSON.stringify(clicked.visiblePanels)}.`);
    assert(close(clicked.scrollY, before.scrollY), `${label}: pointer tab switch changed scroll position ${before.scrollY} -> ${clicked.scrollY}.`);
    assert(clicked.activeElementIndex === 1, `${label}: pointer tab switch lost focus from second button, active index ${clicked.activeElementIndex}.`);
    assert(close(clicked.buttonRects[1].top, before.buttonRects[1].top), `${label}: pointer tab switch moved second control vertically ${before.buttonRects[1].top} -> ${clicked.buttonRects[1].top}.`);
    assert(close(clicked.buttonRects[1].left, before.buttonRects[1].left), `${label}: pointer tab switch moved second control horizontally ${before.buttonRects[1].left} -> ${clicked.buttonRects[1].left}.`);
    assert(close(clicked.buttonRects[1].width, before.buttonRects[1].width), `${label}: pointer tab switch resized second control ${before.buttonRects[1].width} -> ${clicked.buttonRects[1].width}.`);
    assert(clicked.documentScrollWidth <= clicked.documentClientWidth + 1, `${label}: pointer tab switch introduced horizontal overflow ${clicked.documentScrollWidth}px > ${clicked.documentClientWidth}px.`);

    const third = page.locator('[data-qa-tab="primary"] .tab-button').nth(2);
    await third.focus();
    await third.press('Enter');
    await page.waitForTimeout(150);
    const enter = await snapshot();
    assert(enter.activeIndex === 2, `${label}: keyboard Enter did not activate third tab, got ${enter.activeIndex}.`);
    assert(JSON.stringify(enter.visiblePanels) === JSON.stringify([false, false, true]), `${label}: keyboard Enter panel visibility mismatch ${JSON.stringify(enter.visiblePanels)}.`);
    assert(close(enter.scrollY, before.scrollY), `${label}: keyboard Enter changed scroll position ${before.scrollY} -> ${enter.scrollY}.`);
    assert(enter.activeElementIndex === 2, `${label}: keyboard Enter lost focus from third button, active index ${enter.activeElementIndex}.`);

    const first = page.locator('[data-qa-tab="primary"] .tab-button').nth(0);
    await first.focus();
    await first.press('Space');
    await page.waitForTimeout(150);
    const space = await snapshot();
    assert(space.activeIndex === 0, `${label}: keyboard Space did not reactivate first tab, got ${space.activeIndex}.`);
    assert(JSON.stringify(space.visiblePanels) === JSON.stringify([true, false, false]), `${label}: keyboard Space panel visibility mismatch ${JSON.stringify(space.visiblePanels)}.`);
    assert(close(space.scrollY, before.scrollY), `${label}: keyboard Space changed scroll position ${before.scrollY} -> ${space.scrollY}.`);
    assert(space.activeElementIndex === 0, `${label}: keyboard Space lost focus from first button, active index ${space.activeElementIndex}.`);

    assert(pageErrors.length === 0, `${label}: tab interaction produced page errors: ${pageErrors.join(' | ')}`);
  } finally {
    await context.close();
  }
};

try {
  await auditViewport({
    label: 'SP 375',
    viewport: { width: 375, height: 900 },
    isMobile: true,
    hasTouch: true,
  });
  await auditViewport({
    label: 'PC 1380',
    viewport: { width: 1380, height: 900 },
  });
  console.log('PASS Budokan tab interaction stability browser QA (SP + PC)');
} finally {
  await browser.close();
}
