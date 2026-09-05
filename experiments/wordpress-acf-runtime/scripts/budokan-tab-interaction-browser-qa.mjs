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
      const x = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
      const y = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
      const hit = document.elementFromPoint(x, y);
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        pointerOwnedByButton: Boolean(hit && (hit === button || button.contains(hit))),
        hitTag: hit?.tagName || null,
        hitClass: typeof hit?.className === 'string' ? hit.className : null,
      };
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

  const assertControlStable = (state, baseline, index, phase) => {
    const current = state.buttonRects[index];
    const initial = baseline.buttonRects[index];
    assert(current.pointerOwnedByButton, `${label}: ${phase} tab ${index + 1} is visually present but pointer hit-test resolves to ${current.hitTag}.${current.hitClass}.`);
    assert(close(current.top, initial.top), `${label}: ${phase} moved tab ${index + 1} vertically ${initial.top} -> ${current.top}.`);
    assert(close(current.left, initial.left), `${label}: ${phase} shifted tab ${index + 1} horizontally ${initial.left} -> ${current.left}.`);
    assert(close(current.width, initial.width), `${label}: ${phase} resized tab ${index + 1} width ${initial.width} -> ${current.width}.`);
    assert(close(current.height, initial.height), `${label}: ${phase} resized tab ${index + 1} height ${initial.height} -> ${current.height}.`);
    assert(close(state.scrollY, baseline.scrollY), `${label}: ${phase} changed page scroll ${baseline.scrollY} -> ${state.scrollY}.`);
    assert(state.documentScrollWidth <= state.documentClientWidth + 1, `${label}: ${phase} introduced horizontal overflow ${state.documentScrollWidth}px > ${state.documentClientWidth}px.`);
  };

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Short fixture pages can place the tabs near the initial viewport. Add
    // QA-only content before the component so every viewport exercises pointer
    // and focus behavior at a deterministic, non-zero page position without
    // changing production markup or CSS.
    await page.evaluate(() => {
      const wrapper = document.querySelector('[data-qa-tab="primary"]');
      if (!wrapper) return;
      const spacer = document.createElement('div');
      spacer.setAttribute('data-qa-deep-scroll-spacer', 'tab');
      spacer.style.height = '1400px';
      spacer.style.pointerEvents = 'none';
      wrapper.before(spacer);
    });

    const wrapper = page.locator('[data-qa-tab="primary"]');
    await wrapper.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);

    const before = await snapshot();
    assert(before, `${label}: tab fixture is missing.`);
    assert(before.scrollY > 0, `${label}: tab fixture must be tested at a non-zero scroll position, got ${before.scrollY}.`);
    assert(before.buttonCount === 3, `${label}: expected 3 generated tab buttons, got ${before.buttonCount}.`);
    assert(before.activeIndex === 0, `${label}: first tab must begin active, got active index ${before.activeIndex}.`);
    assert(JSON.stringify(before.visiblePanels) === JSON.stringify([true, false, false]), `${label}: unexpected initial panel visibility ${JSON.stringify(before.visiblePanels)}.`);
    assert(before.documentScrollWidth <= before.documentClientWidth + 1, `${label}: initial tab fixture has horizontal overflow ${before.documentScrollWidth}px > ${before.documentClientWidth}px.`);
    before.buttonRects.forEach((rect, index) => {
      assert(rect.pointerOwnedByButton, `${label}: initial tab ${index + 1} is intercepted by ${rect.hitTag}.${rect.hitClass}.`);
    });

    const second = page.locator('[data-qa-tab="primary"] .tab-button').nth(1);
    await second.click();
    await page.waitForTimeout(150);
    const clicked = await snapshot();
    assert(clicked.activeIndex === 1, `${label}: pointer click did not activate second tab, got ${clicked.activeIndex}.`);
    assert(JSON.stringify(clicked.visiblePanels) === JSON.stringify([false, true, false]), `${label}: pointer click panel visibility mismatch ${JSON.stringify(clicked.visiblePanels)}.`);
    assert(clicked.activeElementIndex === 1, `${label}: pointer tab switch lost focus from second button, active index ${clicked.activeElementIndex}.`);
    assertControlStable(clicked, before, 1, 'pointer switch');

    const third = page.locator('[data-qa-tab="primary"] .tab-button').nth(2);
    await third.focus();
    await third.press('Enter');
    await page.waitForTimeout(150);
    const enter = await snapshot();
    assert(enter.activeIndex === 2, `${label}: keyboard Enter did not activate third tab, got ${enter.activeIndex}.`);
    assert(JSON.stringify(enter.visiblePanels) === JSON.stringify([false, false, true]), `${label}: keyboard Enter panel visibility mismatch ${JSON.stringify(enter.visiblePanels)}.`);
    assert(enter.activeElementIndex === 2, `${label}: keyboard Enter lost focus from third button, active index ${enter.activeElementIndex}.`);
    assertControlStable(enter, before, 2, 'keyboard Enter switch');

    const first = page.locator('[data-qa-tab="primary"] .tab-button').nth(0);
    await first.focus();
    await first.press('Space');
    await page.waitForTimeout(150);
    const space = await snapshot();
    assert(space.activeIndex === 0, `${label}: keyboard Space did not reactivate first tab, got ${space.activeIndex}.`);
    assert(JSON.stringify(space.visiblePanels) === JSON.stringify([true, false, false]), `${label}: keyboard Space panel visibility mismatch ${JSON.stringify(space.visiblePanels)}.`);
    assert(space.activeElementIndex === 0, `${label}: keyboard Space lost focus from first button, active index ${space.activeElementIndex}.`);
    assertControlStable(space, before, 0, 'keyboard Space switch');

    // Re-open a previously visited panel to catch state that only appears after
    // a complete interaction cycle rather than a one-way first activation.
    await second.click();
    await page.waitForTimeout(150);
    const reopened = await snapshot();
    assert(reopened.activeIndex === 1, `${label}: repeated pointer activation did not reopen second tab, got ${reopened.activeIndex}.`);
    assert(JSON.stringify(reopened.visiblePanels) === JSON.stringify([false, true, false]), `${label}: repeated pointer activation panel visibility mismatch ${JSON.stringify(reopened.visiblePanels)}.`);
    assert(reopened.activeElementIndex === 1, `${label}: repeated pointer activation lost focus from second button, active index ${reopened.activeElementIndex}.`);
    assertControlStable(reopened, before, 1, 'repeated pointer switch');

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
  console.log('PASS Budokan tab pointer/focus stability browser QA at deep scroll (SP + PC)');
} finally {
  await browser.close();
}
