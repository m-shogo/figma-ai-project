'use strict';

import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-page-top-focus-browser-qa.mjs <url>');
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

    const pageTop = page.locator('#js_gf_pageTop a').first();
    assert(await pageTop.count(), `${label}: Page Top link is missing.`);
    await pageTop.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);

    const before = await page.evaluate(() => {
      const link = document.querySelector('#js_gf_pageTop a');
      const rect = link?.getBoundingClientRect();
      if (!link || !rect) return null;
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        scrollY: window.scrollY,
        linkTop: rect.top,
        linkLeft: rect.left,
        linkWidth: rect.width,
        linkHeight: rect.height,
        pointerOwnedByLink: Boolean(hit && (hit === link || link.contains(hit))),
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
      };
    });

    assert(before, `${label}: Page Top baseline could not be measured.`);
    assert(before.scrollY > 0, `${label}: Page Top must be tested from a non-zero scroll position, got ${before.scrollY}.`);
    assert(before.pointerOwnedByLink, `${label}: Page Top is visible but does not own its pointer hit area.`);
    assert(before.docScrollWidth <= before.docClientWidth + 1, `${label}: baseline has horizontal overflow ${before.docScrollWidth}px > ${before.docClientWidth}px.`);

    await pageTop.focus();
    assert(await pageTop.evaluate((el) => document.activeElement === el), `${label}: Page Top did not receive keyboard focus.`);
    await pageTop.press('Enter');
    await page.waitForTimeout(450);

    const afterKeyboard = await page.evaluate(() => {
      const header = document.querySelector('#global_header');
      const active = document.activeElement;
      return {
        scrollY: window.scrollY,
        activeTag: active?.tagName || null,
        activeId: active?.id || null,
        activeClass: typeof active?.className === 'string' ? active.className : null,
        activeInHeader: Boolean(header && active && header.contains(active)),
        pageTopStillFocused: Boolean(active && active.closest?.('#js_gf_pageTop')),
        docScrollWidth: document.documentElement.scrollWidth,
        docClientWidth: document.documentElement.clientWidth,
      };
    });

    assert(close(afterKeyboard.scrollY, 0), `${label}: keyboard Page Top did not settle at document top; scrollY=${afterKeyboard.scrollY}.`);
    assert(!afterKeyboard.pageTopStillFocused, `${label}: keyboard Page Top left focus in the off-screen footer after scrolling to the top.`);
    assert(afterKeyboard.activeInHeader, `${label}: keyboard Page Top did not move focus to a visible control in the global header; active=${afterKeyboard.activeTag}#${afterKeyboard.activeId}.${afterKeyboard.activeClass}.`);
    assert(afterKeyboard.docScrollWidth <= afterKeyboard.docClientWidth + 1, `${label}: keyboard Page Top introduced horizontal overflow.`);

    // Pointer activation must still scroll to the top without requiring a forced click.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(100);
    await pageTop.scrollIntoViewIfNeeded();
    await pageTop.click();
    await page.waitForTimeout(450);
    const afterPointer = await page.evaluate(() => ({
      scrollY: window.scrollY,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
    }));
    assert(close(afterPointer.scrollY, 0), `${label}: pointer Page Top did not settle at document top; scrollY=${afterPointer.scrollY}.`);
    assert(afterPointer.docScrollWidth <= afterPointer.docClientWidth + 1, `${label}: pointer Page Top introduced horizontal overflow.`);
    assert(pageErrors.length === 0, `${label}: Page Top interaction produced page errors: ${pageErrors.join(' | ')}`);
  } finally {
    await context.close();
  }
};

try {
  await auditViewport({ label: 'SP 390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await auditViewport({ label: 'PC 1395', viewport: { width: 1395, height: 900 } });
  console.log('PASS Budokan Page Top keyboard focus continuity and pointer scroll QA (SP + PC)');
} finally {
  await browser.close();
}
