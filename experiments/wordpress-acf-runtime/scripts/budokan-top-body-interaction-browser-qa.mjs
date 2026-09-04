import { chromium } from 'playwright';

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Usage: node budokan-top-body-interaction-browser-qa.mjs <url>');
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
const failures = [];

const near = (a, b, tolerance = 1) => Math.abs(a - b) <= tolerance;
const rectStable = (before, after, label, tolerance = 1) => {
  for (const key of ['x', 'y', 'width', 'height']) {
    if (!near(before[key], after[key], tolerance)) {
      failures.push(`${label} ${key} moved: ${before[key]} -> ${after[key]}`);
    }
  }
};

async function openPage(viewport) {
  const page = await browser.newPage({ viewportSize: viewport });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  return { page, pageErrors };
}

async function geometry(page, selector) {
  return page.locator(selector).first().evaluate(el => {
    const r = el.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      scrollY: window.scrollY,
      rootWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
}

async function assertPointerOwnsCenter(page, selector, label) {
  const result = await page.locator(selector).first().evaluate(el => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      ok: !!hit && (hit === el || el.contains(hit)),
      hit: hit ? `${hit.tagName.toLowerCase()}.${hit.className || ''}` : 'null',
    };
  });
  if (!result.ok) failures.push(`${label} pointer center intercepted by ${result.hit}`);
}

async function auditHoverAndFocus(page, selector, label) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);
  const before = await geometry(page, selector);
  await assertPointerOwnsCenter(page, selector, label);
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.waitForTimeout(350);
  const hovered = await geometry(page, selector);
  rectStable(before, hovered, `${label} hover`);
  if (!near(before.scrollY, hovered.scrollY, 1)) {
    failures.push(`${label} hover changed scrollY: ${before.scrollY} -> ${hovered.scrollY}`);
  }
  if (hovered.rootWidth > hovered.clientWidth) {
    failures.push(`${label} hover introduced horizontal overflow: ${hovered.rootWidth} > ${hovered.clientWidth}`);
  }

  await target.evaluate(el => el.focus({ preventScroll: true }));
  await page.waitForTimeout(80);
  const focused = await geometry(page, selector);
  rectStable(before, focused, `${label} focus`);
  if (!near(before.scrollY, focused.scrollY, 1)) {
    failures.push(`${label} focus changed scrollY: ${before.scrollY} -> ${focused.scrollY}`);
  }
  const active = await target.evaluate(el => document.activeElement === el);
  if (!active) failures.push(`${label} did not retain focus`);
}

// PC: prove unresolved TOP FV fallback destinations fail closed instead of acting as page-top links.
{
  const { page, pageErrors } = await openPage({ width: 1380, height: 900 });
  const placeholderLinks = page.locator('.tm_guide a[href="#"], .top_notice-01 a[href="#"]');
  const placeholderCount = await placeholderLinks.count();

  if (placeholderCount > 0) {
    // Reproduce the harmful legacy behavior with a real pointer while a # link is still visible.
    const candidates = page.locator('.tm_guide a[href="#"]');
    let clicked = false;
    for (let i = (await candidates.count()) - 1; i >= 0; i -= 1) {
      const link = candidates.nth(i);
      await page.evaluate(() => window.scrollTo(0, 260));
      await page.waitForTimeout(80);
      const box = await link.boundingBox();
      if (!box) continue;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      if (cy <= 110 || cy >= 880) continue;
      const owns = await link.evaluate(el => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!hit && (hit === el || el.contains(hit));
      });
      if (!owns) continue;
      const beforeY = await page.evaluate(() => window.scrollY);
      await page.mouse.click(cx, cy);
      await page.waitForTimeout(450);
      const afterY = await page.evaluate(() => window.scrollY);
      if (afterY < beforeY - 100) {
        failures.push(`TOP FV unresolved href="#" moved background page upward: ${beforeY} -> ${afterY}`);
      } else {
        failures.push('TOP FV unresolved destinations still render as interactive href="#" links instead of failing closed');
      }
      clicked = true;
      break;
    }
    if (!clicked) failures.push('TOP FV unresolved href="#" links remain interactive but could not be pointer-tested safely');
  } else {
    const disabledGuideCount = await page.locator('.tm_guide_link[aria-disabled="true"]').count();
    if (disabledGuideCount !== 8) {
      failures.push(`TOP FV unresolved guide destinations should render 8 disabled visual rows; got ${disabledGuideCount}`);
    }
    const disabledNoticeCount = await page.locator('.tn_placeholder[aria-disabled="true"]').count();
    if (disabledNoticeCount !== 1) {
      failures.push(`TOP FV fallback notice should render one disabled visual text owner; got ${disabledNoticeCount}`);
    }
  }

  await auditHoverAndFocus(page, '.top_news_more_pc', 'PC TOP News more CTA');
  await auditHoverAndFocus(page, '.top_news_articles .news_item_link', 'PC TOP News item');

  if (pageErrors.length) failures.push(`PC page errors: ${pageErrors.join(' | ')}`);
  await page.close();
}

// SP: same body CTA stability plus the fixed purpose shortcut must scroll only to its authored Guide target.
{
  const { page, pageErrors } = await openPage({ width: 375, height: 812 });
  await auditHoverAndFocus(page, '.top_news_more_sp', 'SP TOP News more CTA');
  await auditHoverAndFocus(page, '.top_news_articles .news_item_link', 'SP TOP News item');

  const purpose = page.locator('.top_purposeMenu .tpm_link');
  await page.evaluate(() => window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight - innerHeight - 120)));
  await page.waitForTimeout(80);
  await assertPointerOwnsCenter(page, '.top_purposeMenu .tpm_link', 'SP purpose fixed CTA');
  const purposeBox = await purpose.boundingBox();
  if (!purposeBox) {
    failures.push('SP purpose fixed CTA is not visible');
  } else {
    await page.mouse.click(purposeBox.x + purposeBox.width / 2, purposeBox.y + purposeBox.height / 2);
    await page.waitForTimeout(450);
    const result = await page.evaluate(() => {
      const guide = document.querySelector('#top_guide-01');
      const header = document.querySelector('#global_header');
      const guideRect = guide?.getBoundingClientRect();
      const headerRect = header?.getBoundingClientRect();
      return {
        hash: location.hash,
        guideTop: guideRect?.top ?? null,
        headerHeight: headerRect?.height ?? 0,
        scrollY: window.scrollY,
        rootWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      };
    });
    if (result.hash !== '#top_guide-01') failures.push(`SP purpose CTA hash mismatch: ${result.hash}`);
    if (result.guideTop === null || result.guideTop < result.headerHeight - 2 || result.guideTop > result.headerHeight + 40) {
      failures.push(`SP purpose CTA landed at unstable Guide geometry: guideTop=${result.guideTop}, headerHeight=${result.headerHeight}`);
    }
    if (result.rootWidth > result.clientWidth) {
      failures.push(`SP purpose CTA left horizontal overflow: ${result.rootWidth} > ${result.clientWidth}`);
    }
  }

  if (pageErrors.length) failures.push(`SP page errors: ${pageErrors.join(' | ')}`);
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error('FAIL Budokan TOP body interaction stability QA');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('PASS TOP body hover/focus states preserve geometry, scroll position, focus and root width.');
console.log('PASS unresolved TOP FV fallback destinations fail closed instead of behaving like page-top links.');
console.log('PASS SP fixed purpose CTA owns its pointer target and lands at the authored Guide anchor without horizontal overflow.');
