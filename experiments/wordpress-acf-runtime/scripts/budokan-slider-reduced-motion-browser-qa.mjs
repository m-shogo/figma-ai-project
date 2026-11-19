'use strict';

import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-slider-reduced-motion-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;
const browser = await chromium.launch({ headless: true });

const audit = async ({ label, reducedMotion, expectedSpeed }) => {
  const context = await browser.newContext({
    viewport: { width: 1380, height: 900 },
    reducedMotion,
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const root = document.querySelector('.module_slider-01');
      if (!root) return;
      const spacer = document.createElement('div');
      spacer.style.height = '1400px';
      spacer.style.pointerEvents = 'none';
      root.before(spacer);
    });

    const slider = page.locator('.module_slider-01').first();
    await slider.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    const snapshot = async () => page.evaluate(() => {
      const root = document.querySelector('.module_slider-01');
      const stage = root?.querySelector('.slider-stage');
      const rect = root?.getBoundingClientRect();
      return root && stage && rect ? {
        speed: stage.swiper?.params?.speed ?? null,
        realIndex: stage.swiper?.realIndex ?? null,
        scrollY: window.scrollY,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
      } : null;
    });

    const before = await snapshot();
    assert(before, `${label}: slider fixture is missing.`);
    assert(before.speed === expectedSpeed, `${label}: expected Swiper speed ${expectedSpeed}, got ${before.speed}.`);
    assert(before.scrollY > 0, `${label}: reduced-motion QA must run at deep scroll, got ${before.scrollY}.`);
    assert(before.docScrollWidth <= before.docClientWidth + 1, `${label}: initial horizontal overflow ${before.docScrollWidth}px > ${before.docClientWidth}px.`);

    await page.locator('.module_slider-01 .swiper-button-next').first().click();
    await page.waitForTimeout(expectedSpeed === 0 ? 50 : expectedSpeed + 100);
    const after = await snapshot();
    assert(after, `${label}: slider disappeared after navigation.`);
    assert(after.realIndex !== before.realIndex, `${label}: slider did not advance ${before.realIndex} -> ${after.realIndex}.`);
    assert(after.speed === expectedSpeed, `${label}: Swiper speed changed ${expectedSpeed} -> ${after.speed}.`);
    assert(close(after.scrollY, before.scrollY), `${label}: navigation changed scroll ${before.scrollY} -> ${after.scrollY}.`);
    assert(close(after.top, before.top), `${label}: navigation moved slider top ${before.top} -> ${after.top}.`);
    assert(close(after.left, before.left), `${label}: navigation moved slider left ${before.left} -> ${after.left}.`);
    assert(close(after.width, before.width), `${label}: navigation resized slider width ${before.width} -> ${after.width}.`);
    assert(close(after.height, before.height), `${label}: navigation resized slider height ${before.height} -> ${after.height}.`);
    assert(after.docScrollWidth <= after.docClientWidth + 1, `${label}: navigation introduced horizontal overflow ${after.docScrollWidth}px > ${after.docClientWidth}px.`);
    assert(pageErrors.length === 0, `${label}: page errors: ${pageErrors.join(' | ')}`);
  } finally {
    await context.close();
  }
};

try {
  await audit({ label: 'PC no-preference', reducedMotion: 'no-preference', expectedSpeed: 400 });
  await audit({ label: 'PC reduced-motion', reducedMotion: 'reduce', expectedSpeed: 0 });
  console.log('PASS Budokan ACF slider Reduced Motion browser QA');
} finally {
  await browser.close();
}
