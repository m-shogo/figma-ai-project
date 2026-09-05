'use strict';

import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-slider-interaction-browser-qa.mjs <url>');
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
    const root = document.querySelector('.module_slider-01');
    const stage = root?.querySelector('.slider-stage');
    const next = root?.querySelector('.swiper-button-next');
    const prev = root?.querySelector('.swiper-button-prev');
    if (!root || !stage || !next || !prev) return null;

    const controlState = (control) => {
      const rect = control.getBoundingClientRect();
      const x = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
      const y = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
      const hit = document.elementFromPoint(x, y);
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        pointerOwnedByControl: Boolean(hit && (hit === control || control.contains(hit))),
        hitTag: hit?.tagName || null,
        hitClass: typeof hit?.className === 'string' ? hit.className : null,
      };
    };

    const rootRect = root.getBoundingClientRect();
    return {
      swiperLoaded: typeof window.Swiper !== 'undefined',
      initialized: Boolean(stage.swiper),
      activeIndex: stage.swiper?.activeIndex ?? null,
      realIndex: stage.swiper?.realIndex ?? null,
      slideCount: stage.querySelectorAll('.swiper-slide').length,
      scrollY: window.scrollY,
      rootTop: rootRect.top,
      rootLeft: rootRect.left,
      rootWidth: rootRect.width,
      rootHeight: rootRect.height,
      next: controlState(next),
      prev: controlState(prev),
      activeIsNext: document.activeElement === next,
      activeIsPrev: document.activeElement === prev,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
    };
  });

  const assertStable = (state, baseline, controlName, phase) => {
    const current = state[controlName];
    const initial = baseline[controlName];
    assert(current.pointerOwnedByControl, `${label}: ${phase} ${controlName} control is visually present but pointer hit-test resolves to ${current.hitTag}.${current.hitClass}.`);
    assert(close(state.scrollY, baseline.scrollY), `${label}: ${phase} changed page scroll ${baseline.scrollY} -> ${state.scrollY}.`);
    assert(close(state.rootTop, baseline.rootTop), `${label}: ${phase} moved slider root vertically ${baseline.rootTop} -> ${state.rootTop}.`);
    assert(close(state.rootLeft, baseline.rootLeft), `${label}: ${phase} shifted slider root horizontally ${baseline.rootLeft} -> ${state.rootLeft}.`);
    assert(close(state.rootWidth, baseline.rootWidth), `${label}: ${phase} resized slider root width ${baseline.rootWidth} -> ${state.rootWidth}.`);
    assert(close(state.rootHeight, baseline.rootHeight), `${label}: ${phase} resized slider root height ${baseline.rootHeight} -> ${state.rootHeight}.`);
    assert(close(current.top, initial.top), `${label}: ${phase} moved ${controlName} control vertically ${initial.top} -> ${current.top}.`);
    assert(close(current.left, initial.left), `${label}: ${phase} shifted ${controlName} control horizontally ${initial.left} -> ${current.left}.`);
    assert(close(current.width, initial.width), `${label}: ${phase} resized ${controlName} control width ${initial.width} -> ${current.width}.`);
    assert(close(current.height, initial.height), `${label}: ${phase} resized ${controlName} control height ${initial.height} -> ${current.height}.`);
    assert(state.docScrollWidth <= state.docClientWidth + 1, `${label}: ${phase} introduced horizontal page overflow ${state.docScrollWidth}px > ${state.docClientWidth}px.`);
  };

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Make deep-scroll behavior deterministic without changing production
    // markup/CSS. A short fixture can otherwise keep the slider near page top.
    await page.evaluate(() => {
      const root = document.querySelector('.module_slider-01');
      if (!root) return;
      const spacer = document.createElement('div');
      spacer.setAttribute('data-qa-deep-scroll-spacer', 'slider');
      spacer.style.height = '1400px';
      spacer.style.pointerEvents = 'none';
      root.before(spacer);
    });

    const slider = page.locator('.module_slider-01').first();
    await slider.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);

    const before = await snapshot();
    assert(before, `${label}: slider fixture is missing.`);
    assert(before.scrollY > 0, `${label}: slider fixture must be tested at a non-zero scroll position, got ${before.scrollY}.`);
    assert(before.swiperLoaded, `${label}: Swiper library was not loaded for the ACF slider block.`);
    assert(before.initialized, `${label}: ACF slider stage was not initialized by module_slider.js.`);
    assert(before.slideCount >= 3, `${label}: expected at least 3 slider slides, got ${before.slideCount}.`);
    assert(before.next.pointerOwnedByControl, `${label}: initial next control is intercepted by ${before.next.hitTag}.${before.next.hitClass}.`);
    assert(before.prev.pointerOwnedByControl, `${label}: initial previous control is intercepted by ${before.prev.hitTag}.${before.prev.hitClass}.`);
    assert(before.docScrollWidth <= before.docClientWidth + 1, `${label}: slider fixture has horizontal page overflow ${before.docScrollWidth}px > ${before.docClientWidth}px.`);

    const next = page.locator('.module_slider-01 .swiper-button-next').first();
    await next.click();
    await page.waitForTimeout(500);
    const afterPointer = await snapshot();
    assert(afterPointer, `${label}: slider disappeared after pointer navigation.`);
    assert(afterPointer.realIndex !== before.realIndex, `${label}: next button did not advance the slider real index ${before.realIndex} -> ${afterPointer.realIndex}.`);
    assert(afterPointer.activeIsNext, `${label}: pointer navigation lost focus from the next button.`);
    assertStable(afterPointer, before, 'next', 'first next click');

    const firstAdvanceIndex = afterPointer.realIndex;
    await next.click();
    await page.waitForTimeout(500);
    const afterRepeatedPointer = await snapshot();
    assert(afterRepeatedPointer.realIndex !== firstAdvanceIndex, `${label}: repeated next click did not advance from real index ${firstAdvanceIndex}.`);
    assert(afterRepeatedPointer.activeIsNext, `${label}: repeated pointer navigation lost focus from the next button.`);
    assertStable(afterRepeatedPointer, before, 'next', 'repeated next click');

    const prev = page.locator('.module_slider-01 .swiper-button-prev').first();
    await prev.focus();
    await prev.press('Enter');
    await page.waitForTimeout(500);
    const afterKeyboard = await snapshot();
    assert(afterKeyboard.realIndex === firstAdvanceIndex, `${label}: keyboard previous did not return to prior real index ${firstAdvanceIndex}, got ${afterKeyboard.realIndex}.`);
    assert(afterKeyboard.activeIsPrev, `${label}: keyboard previous lost focus from the previous button.`);
    assertStable(afterKeyboard, before, 'prev', 'keyboard previous');

    await prev.press('Enter');
    await page.waitForTimeout(500);
    const returned = await snapshot();
    assert(returned.realIndex === before.realIndex, `${label}: repeated keyboard previous did not return to initial real index ${before.realIndex} -> ${returned.realIndex}.`);
    assert(returned.activeIsPrev, `${label}: repeated keyboard previous lost focus from the previous button.`);
    assertStable(returned, before, 'prev', 'repeated keyboard previous');

    assert(pageErrors.length === 0, `${label}: slider interaction produced page errors: ${pageErrors.join(' | ')}`);
  } finally {
    await context.close();
  }
};

try {
  await auditViewport({ label: 'SP 375', viewport: { width: 375, height: 900 }, isMobile: true, hasTouch: true });
  await auditViewport({ label: 'PC 1380', viewport: { width: 1380, height: 900 } });
  console.log('PASS Budokan slider pointer/focus stability browser QA at deep scroll (SP + PC)');
} finally {
  await browser.close();
}
