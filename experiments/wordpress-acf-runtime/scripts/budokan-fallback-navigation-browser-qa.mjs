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

  const placeholderLinks = page.locator('#global_navigation a[href="#"], #global_footer a[href="#"]');
  const placeholderCount = await placeholderLinks.count();
  // The intentional Page Top control is the only allowed bare-hash anchor in these surfaces.
  assert(placeholderCount === 1, `Unassigned WordPress menu output still exposes unexpected href="#" placeholders; found ${placeholderCount}, expected only Page Top.`);
  const onlyPlaceholder = placeholderLinks.first();
  assert(await onlyPlaceholder.evaluate((el) => el.closest('#js_gf_pageTop') !== null), 'The remaining href="#" is not the intentional Page Top control.');

  // The separate PC mega-nav fallback intentionally renders non-link spans and may reuse gn_links-01.
  // Scope this assertion to the hamburger/global navigation surface only.
  assert(await page.locator('#global_navigation #gn_links-01').count() === 0, 'Unassigned global-nav should fail closed instead of rendering sample navigation.');
  assert(await page.locator('#global_footer #gf_links-01').count() === 0, 'Unassigned footer-nav should fail closed instead of rendering sample navigation.');

  const before = await page.evaluate(() => ({
    y: window.scrollY,
    rootWidth: document.documentElement.getBoundingClientRect().width,
  }));

  const pageTop = page.locator('#js_gf_pageTop a');
  await pageTop.scrollIntoViewIfNeeded();
  const beforePageTopY = await page.evaluate(() => window.scrollY);
  assert(beforePageTopY > 100, `Page Top QA needs a meaningful scroll depth; got ${beforePageTopY}.`);
  await pageTop.click();
  await page.waitForTimeout(500);
  const afterPageTopY = await page.evaluate(() => window.scrollY);
  assert(afterPageTopY <= 2, `Intentional Page Top control no longer reaches page top; final scrollY=${afterPageTopY}.`);

  const after = await page.evaluate(() => ({
    rootWidth: document.documentElement.getBoundingClientRect().width,
  }));
  assert(Math.abs(after.rootWidth - before.rootWidth) <= 1, `Fallback/Page Top interaction changed root width: ${before.rootWidth} -> ${after.rootWidth}.`);

  console.log('PASS unassigned WordPress global/footer menu locations fail closed without sample placeholder anchors.');
  console.log('PASS the intentional Footer Page Top control remains the sole bare-hash owner and still scrolls to the top.');
} finally {
  await context.close();
  await browser.close();
}
