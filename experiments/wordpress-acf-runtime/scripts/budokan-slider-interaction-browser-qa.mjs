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

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    const slider = page.locator('.module_slider-01').first();
    await slider.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);

    const before = await page.evaluate(() => {
      const root = document.querySelector('.module_slider-01');
      const stage = root?.querySelector('.slider-stage');
      const next = root?.querySelector('.swiper-button-next');
      if (!root || !stage || !next) return null;
      const nextRect = next.getBoundingClientRect();
      return {
        swiperLoaded: typeof window.Swiper !== 'undefined',
        initialized: Boolean(stage.swiper),
        activeIndex: stage.swiper?.activeIndex ?? null,
        realIndex: stage.swiper?.realIndex ?? null,
        slideCount: stage.querySelectorAll('.swiper-slide').length,
        scrollY: window.scrollY,
        nextTop: nextRect.top,
        nextLeft: nextRect.left,
        nextWidth: nextRect.width,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
      };
    });

    assert(before, `${label}: slider fixture is missing.`);
    assert(before.swiperLoaded, `${label}: Swiper library was not loaded for the ACF slider block.`);
    assert(before.initialized, `${label}: ACF slider stage was not initialized by module_slider.js.`);
    assert(before.slideCount >= 3, `${label}: expected at least 3 slider slides, got ${before.slideCount}.`);
    assert(before.docScrollWidth <= before.docClientWidth + 1, `${label}: slider fixture has horizontal page overflow ${before.docScrollWidth}px > ${before.docClientWidth}px.`);

    const next = page.locator('.module_slider-01 .swiper-button-next').first();
    await next.click();
    await page.waitForTimeout(500);

    const afterPointer = await page.evaluate(() => {
      const root = document.querySelector('.module_slider-01');
      const stage = root?.querySelector('.slider-stage');
      const next = root?.querySelector('.swiper-button-next');
      if (!stage || !next) return null;
      const nextRect = next.getBoundingClientRect();
      return {
        activeIndex: stage.swiper?.activeIndex ?? null,
        realIndex: stage.swiper?.realIndex ?? null,
        scrollY: window.scrollY,
        nextTop: nextRect.top,
        nextLeft: nextRect.left,
        nextWidth: nextRect.width,
        activeIsNext: document.activeElement === next,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
      };
    });

    assert(afterPointer, `${label}: slider disappeared after pointer navigation.`);
    assert(afterPointer.realIndex !== before.realIndex, `${label}: next button did not advance the slider real index ${before.realIndex} -> ${afterPointer.realIndex}.`);
    assert(close(afterPointer.scrollY, before.scrollY), `${label}: next click changed page scroll ${before.scrollY} -> ${afterPointer.scrollY}.`);
    assert(close(afterPointer.nextTop, before.nextTop), `${label}: next click moved control vertically ${before.nextTop} -> ${afterPointer.nextTop}.`);
    assert(close(afterPointer.nextLeft, before.nextLeft), `${label}: next click moved control horizontally ${before.nextLeft} -> ${afterPointer.nextLeft}.`);
    assert(close(afterPointer.nextWidth, before.nextWidth), `${label}: next click resized control ${before.nextWidth} -> ${afterPointer.nextWidth}.`);
    assert(afterPointer.activeIsNext, `${label}: pointer navigation lost focus from the next button.`);
    assert(afterPointer.docScrollWidth <= afterPointer.docClientWidth + 1, `${label}: next click introduced horizontal page overflow ${afterPointer.docScrollWidth}px > ${afterPointer.docClientWidth}px.`);

    const prev = page.locator('.module_slider-01 .swiper-button-prev').first();
    await prev.focus();
    await prev.press('Enter');
    await page.waitForTimeout(500);

    const afterKeyboard = await page.evaluate(() => {
      const root = document.querySelector('.module_slider-01');
      const stage = root?.querySelector('.slider-stage');
      const prev = root?.querySelector('.swiper-button-prev');
      return {
        realIndex: stage?.swiper?.realIndex ?? null,
        scrollY: window.scrollY,
        activeIsPrev: document.activeElement === prev,
      };
    });

    assert(afterKeyboard.realIndex === before.realIndex, `${label}: keyboard previous did not return to initial real index ${before.realIndex} -> ${afterKeyboard.realIndex}.`);
    assert(close(afterKeyboard.scrollY, before.scrollY), `${label}: keyboard previous changed page scroll ${before.scrollY} -> ${afterKeyboard.scrollY}.`);
    assert(afterKeyboard.activeIsPrev, `${label}: keyboard previous lost focus from the previous button.`);
    assert(pageErrors.length === 0, `${label}: slider interaction produced page errors: ${pageErrors.join(' | ')}`);
  } finally {
    await context.close();
  }
};

try {
  await auditViewport({ label: 'SP 375', viewport: { width: 375, height: 900 }, isMobile: true, hasTouch: true });
  await auditViewport({ label: 'PC 1380', viewport: { width: 1380, height: 900 } });
  console.log('PASS Budokan slider interaction stability browser QA (SP + PC)');
} finally {
  await browser.close();
}
