import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-fallback-navigation-browser-qa.mjs <url>');
  process.exit(2);
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(url, { waitUntil: 'networkidle' });

  const fallbackLinks = page.locator('#gn_links-01 a[href="#"], #gf_links-01 a[href="#"]');
  const fallbackLinkCount = await fallbackLinks.count();
  assert(fallbackLinkCount === 0, `Unassigned WordPress menu fallback still exposes ${fallbackLinkCount} href="#" placeholder links.`);

  const disabledFallbacks = page.locator('#gn_links-01 [aria-disabled="true"], #gf_links-01 [aria-disabled="true"]');
  const disabledCount = await disabledFallbacks.count();
  assert(disabledCount >= 14, `Expected fail-closed fallback affordances for 4 header + 10 footer items; got ${disabledCount}.`);

  const deepY = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight - 320));
  await page.evaluate((y) => window.scrollTo(0, y), deepY);
  await page.waitForTimeout(120);
  const before = await page.evaluate(() => ({
    y: window.scrollY,
    rootWidth: document.documentElement.getBoundingClientRect().width,
    header: (() => {
      const r = document.querySelector('#global_header')?.getBoundingClientRect();
      return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
    })(),
  }));

  const footerFallback = page.locator('#gf_links-01 [aria-disabled="true"]').first();
  await footerFallback.scrollIntoViewIfNeeded();
  const beforeClickY = await page.evaluate(() => window.scrollY);
  await footerFallback.click();
  await page.waitForTimeout(100);
  const afterClickY = await page.evaluate(() => window.scrollY);
  assert(Math.abs(afterClickY - beforeClickY) <= 1, `Fail-closed footer fallback moved the background page: ${beforeClickY} -> ${afterClickY}.`);

  const after = await page.evaluate(() => ({
    y: window.scrollY,
    rootWidth: document.documentElement.getBoundingClientRect().width,
    header: (() => {
      const r = document.querySelector('#global_header')?.getBoundingClientRect();
      return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
    })(),
  }));
  assert(Math.abs(after.rootWidth - before.rootWidth) <= 1, `Fallback interaction changed root width: ${before.rootWidth} -> ${after.rootWidth}.`);

  console.log('PASS unassigned WordPress menu fallbacks fail closed without placeholder anchors or background movement.');
} finally {
  await context.close();
  await browser.close();
}
