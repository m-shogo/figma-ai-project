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
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
  return { page, pageErrors };
}

async function visibleTarget(page, selector, label) {
  const candidates = page.locator(selector);
  const count = await candidates.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = candidates.nth(i);
    if (await candidate.isVisible()) return candidate;
  }
  const diagnostics = await page.evaluate((candidateSelector) => ({
    innerWidth: window.innerWidth,
    outerWidth: window.outerWidth,
    devicePixelRatio: window.devicePixelRatio,
    min768: window.matchMedia('(min-width: 768px)').matches,
    max767: window.matchMedia('(max-width: 767px)').matches,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
    owners: Array.from(document.querySelectorAll(candidateSelector)).map((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        classes: el.className,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
      };
    }),
  }), selector);
  throw new Error(`${label}: no visible owner for ${selector}; diagnostics=${JSON.stringify(diagnostics)}`);
}

async function geometry(target) {
  return target.evaluate(el => {
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

async function assertBox(target, expected, label, tolerance = 1) {
  const box = await geometry(target);
  for (const [key, value] of Object.entries(expected)) {
    if (!near(box[key], value, tolerance)) {
      failures.push(`${label} ${key} mismatch: expected ${value}, got ${box[key]}`);
    }
  }
  return box;
}

async function assertPointerOwnsCenter(target, label) {
  const result = await target.evaluate(el => {
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
  const target = await visibleTarget(page, selector, label);
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);
  const before = await geometry(target);
  await assertPointerOwnsCenter(target, label);
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.waitForTimeout(350);
  const hovered = await geometry(target);
  rectStable(before, hovered, `${label} hover`);
  if (!near(before.scrollY, hovered.scrollY, 1)) {
    failures.push(`${label} hover changed scrollY: ${before.scrollY} -> ${hovered.scrollY}`);
  }
  if (hovered.rootWidth > hovered.clientWidth) {
    failures.push(`${label} hover introduced horizontal overflow: ${hovered.rootWidth} > ${hovered.clientWidth}`);
  }

  await target.evaluate(el => el.focus({ preventScroll: true }));
  await page.waitForTimeout(80);
  const focused = await geometry(target);
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

  // Current-Figma structural/visual contracts for the newly restored SNS strip.
  const pcSns = await visibleTarget(page, '.top_sns-01', 'PC TOP SNS');
  await assertBox(pcSns, { width: 1380, height: 240 }, 'PC TOP SNS', 1);
  const pcSnsInner = await visibleTarget(page, '.top_sns-01 .ts_inner', 'PC TOP SNS inner');
  await assertBox(pcSnsInner, { width: 954, height: 80 }, 'PC TOP SNS inner', 1);
  await assertBox(await visibleTarget(page, '.top_sns-01 .ts_group_youtube', 'PC TOP SNS YouTube'), { width: 156, height: 80 }, 'PC TOP SNS YouTube', 1);
  await assertBox(await visibleTarget(page, '.top_sns-01 .ts_group_editorial', 'PC TOP SNS editorial'), { width: 363, height: 80 }, 'PC TOP SNS editorial', 1);
  await assertBox(await visibleTarget(page, '.top_sns-01 .ts_group_official', 'PC TOP SNS official'), { width: 339, height: 80 }, 'PC TOP SNS official', 1);
  const pcSnsIcons = await page.locator('.top_sns-01 .ts_icon').count();
  if (pcSnsIcons !== 5) failures.push(`PC TOP SNS should expose five Figma brand circles; got ${pcSnsIcons}`);
  const pcSnsLinks = await page.locator('.top_sns-01 a').count();
  if (pcSnsLinks !== 0) failures.push(`PC TOP SNS unresolved destinations must fail closed; found ${pcSnsLinks} anchors`);

  const order = await page.evaluate(() => {
    const events = document.querySelector('#top_events-01');
    const sns = document.querySelector('#top_sns-01');
    const guide = document.querySelector('#top_guide-01');
    return {
      eventsBeforeSns: !!events && !!sns && !!(events.compareDocumentPosition(sns) & Node.DOCUMENT_POSITION_FOLLOWING),
      snsBeforeGuide: !!sns && !!guide && !!(sns.compareDocumentPosition(guide) & Node.DOCUMENT_POSITION_FOLLOWING),
    };
  });
  if (!order.eventsBeforeSns || !order.snsBeforeGuide) {
    failures.push(`PC TOP section order must be Events -> SNS -> Guide; got ${JSON.stringify(order)}`);
  }

  // Existing lower sections must retain their current-Figma geometry while adjacent SNS is inserted.
  const pcInstagramInner = await visibleTarget(page, '.top_instagram-01 .ti_inner', 'PC TOP Instagram inner');
  await assertBox(pcInstagramInner, { width: 1160 }, 'PC TOP Instagram inner', 1);
  const pcInstagramThumbs = page.locator('.top_instagram-01 .ti_thumbnail:visible');
  if (await pcInstagramThumbs.count() !== 5) failures.push(`PC TOP Instagram should show five thumbnails; got ${await pcInstagramThumbs.count()}`);
  if (await pcInstagramThumbs.count() > 0) {
    await assertBox(pcInstagramThumbs.first(), { width: 231, height: 289 }, 'PC TOP Instagram first thumbnail', 1);
  }

  const pcPartnerSurface = await page.locator('.top_partner-01').first().evaluate(el => {
    const style = getComputedStyle(el);
    return {
      borderBottomWidth: style.borderBottomWidth,
      borderBottomColor: style.borderBottomColor,
      backgroundColor: style.backgroundColor,
    };
  });
  if (pcPartnerSurface.borderBottomWidth !== '1px' || pcPartnerSurface.borderBottomColor !== 'rgb(191, 62, 43)') {
    failures.push(`PC TOP Partner bottom rule drifted: ${JSON.stringify(pcPartnerSurface)}`);
  }

  await auditHoverAndFocus(page, '.top_news_more_pc', 'PC TOP News more CTA');
  await auditHoverAndFocus(page, '.top_news_articles .news_item_link', 'PC TOP News item');

  if (pageErrors.length) failures.push(`PC page errors: ${pageErrors.join(' | ')}`);
  await page.close();
}

// SP: same body CTA stability plus the fixed purpose shortcut must scroll only to its authored Guide target.
{
  const { page, pageErrors } = await openPage({ width: 375, height: 812 });
  const spSns = await visibleTarget(page, '.top_sns-01', 'SP TOP SNS');
  await assertBox(spSns, { width: 375, height: 328 }, 'SP TOP SNS', 1);
  const spSnsInner = await visibleTarget(page, '.top_sns-01 .ts_inner', 'SP TOP SNS inner');
  await assertBox(spSnsInner, { width: 312 }, 'SP TOP SNS inner', 1);
  await assertBox(await visibleTarget(page, '.top_sns-01 .ts_group_youtube', 'SP TOP SNS YouTube'), { width: 312, height: 40 }, 'SP TOP SNS YouTube', 1);
  await assertBox(await visibleTarget(page, '.top_sns-01 .ts_group_editorial', 'SP TOP SNS editorial'), { width: 312, height: 80 }, 'SP TOP SNS editorial', 1);
  await assertBox(await visibleTarget(page, '.top_sns-01 .ts_group_official', 'SP TOP SNS official'), { width: 312, height: 40 }, 'SP TOP SNS official', 1);
  const spSnsDecoration = await spSns.evaluate(el => {
    const style = getComputedStyle(el, '::before');
    return {
      content: style.content,
      top: style.top,
      right: style.right,
      width: style.width,
      height: style.height,
      backgroundImage: style.backgroundImage,
    };
  });
  if (
    spSnsDecoration.content === 'none' ||
    spSnsDecoration.top !== '145px' ||
    spSnsDecoration.right !== '0px' ||
    spSnsDecoration.width !== '260px' ||
    spSnsDecoration.height !== '183px' ||
    !spSnsDecoration.backgroundImage.includes('sns-octagon-sp.svg')
  ) {
    failures.push(`SP TOP SNS octagon geometry/asset drifted: ${JSON.stringify(spSnsDecoration)}`);
  }
  const spSnsLinks = await page.locator('.top_sns-01 a').count();
  if (spSnsLinks !== 0) failures.push(`SP TOP SNS unresolved destinations must fail closed; found ${spSnsLinks} anchors`);

  const spInstagramInner = await visibleTarget(page, '.top_instagram-01 .ti_inner', 'SP TOP Instagram inner');
  await assertBox(spInstagramInner, { width: 311 }, 'SP TOP Instagram inner', 1);
  const spInstagramThumbs = page.locator('.top_instagram-01 .ti_thumbnail:visible');
  if (await spInstagramThumbs.count() !== 4) failures.push(`SP TOP Instagram should show four thumbnails; got ${await spInstagramThumbs.count()}`);
  if (await spInstagramThumbs.count() > 0) {
    await assertBox(spInstagramThumbs.first(), { width: 155.5, height: 194.375 }, 'SP TOP Instagram first thumbnail', 1);
  }

  const spPartner = await visibleTarget(page, '.top_partner-01', 'SP TOP Partner');
  const spPartnerLayout = await visibleTarget(page, '.top_partner-01 .tp_layout', 'SP TOP Partner layout');
  await assertBox(spPartnerLayout, { width: 335 }, 'SP TOP Partner layout', 1);
  const spPartnerSurface = await spPartner.evaluate(el => {
    const style = getComputedStyle(el);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderBottomWidth: style.borderBottomWidth,
      borderBottomColor: style.borderBottomColor,
    };
  });
  if (
    spPartnerSurface.backgroundColor !== 'rgb(255, 255, 255)' ||
    spPartnerSurface.backgroundImage !== 'none' ||
    spPartnerSurface.borderBottomWidth !== '1px' ||
    spPartnerSurface.borderBottomColor !== 'rgb(231, 231, 231)'
  ) {
    failures.push(`SP TOP Partner surface does not match current Figma: ${JSON.stringify(spPartnerSurface)}`);
  }

  await auditHoverAndFocus(page, '.top_news_more_sp', 'SP TOP News more CTA');
  await auditHoverAndFocus(page, '.top_news_articles .news_item_link', 'SP TOP News item');

  const purpose = await visibleTarget(page, '.top_purposeMenu .tpm_link', 'SP purpose fixed CTA');
  const purposeHref = await purpose.getAttribute('href');
  if (purposeHref !== '#top_guide-01') {
    failures.push(`SP purpose CTA authored target mismatch: ${purposeHref}`);
  }
  await page.evaluate(() => window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight - innerHeight - 120)));
  await page.waitForTimeout(80);
  await assertPointerOwnsCenter(purpose, 'SP purpose fixed CTA');
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
        guideTop: guideRect?.top ?? null,
        headerHeight: headerRect?.height ?? 0,
        scrollY: window.scrollY,
        rootWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      };
    });
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

console.log('PASS TOP SNS current-Figma PC/SP geometry, ordering, brand counts and fail-closed link ownership.');
console.log('PASS TOP Partner/Instagram adjacent lower-section geometry remains stable on PC/SP.');
console.log('PASS TOP body hover/focus states preserve geometry, scroll position, focus and root width.');
console.log('PASS unresolved TOP FV fallback destinations fail closed instead of behaving like page-top links.');
console.log('PASS SP fixed purpose CTA owns its pointer target and lands at the authored Guide anchor without horizontal overflow.');
