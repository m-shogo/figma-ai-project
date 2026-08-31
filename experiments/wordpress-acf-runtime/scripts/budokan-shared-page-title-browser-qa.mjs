import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-shared-page-title-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

async function measure(page) {
  return page.evaluate(() => {
    const visual = document.querySelector('.global_mainVisual:not(._fixedPage)');
    const title = visual?.querySelector('.gm_title');
    const background = visual?.querySelector('.gm_background');
    if (!visual || !title || !background) return null;

    const visualRect = visual.getBoundingClientRect();
    const visualStyle = getComputedStyle(visual);
    const titleStyle = getComputedStyle(title);
    const overlayStyle = getComputedStyle(background, '::before');

    return {
      height: visualRect.height,
      overflow: visualStyle.overflow,
      titleText: title.textContent?.trim(),
      titleFontSize: titleStyle.fontSize,
      titleFontWeight: titleStyle.fontWeight,
      titleFontFamily: titleStyle.fontFamily,
      titleLineHeight: titleStyle.lineHeight,
      titleLetterSpacing: titleStyle.letterSpacing,
      overlayColor: overlayStyle.backgroundColor,
    };
  });
}

const browser = await chromium.launch({ headless: true });

try {
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 900 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  const sp = await measure(mobilePage);
  assert(sp, 'SP shared page title was not found.');
  assert(close(sp.height, 180), `SP shared visual expected 180px, got ${sp.height}.`);
  assert(sp.titleText === 'お知らせ', `SP shared title expected お知らせ, got ${sp.titleText}.`);
  assert(sp.titleFontSize === '22px', `SP title expected 22px, got ${sp.titleFontSize}.`);
  assert(sp.titleFontWeight === '500', `SP title expected weight 500, got ${sp.titleFontWeight}.`);
  assert(!sp.titleFontFamily.toLowerCase().includes('mincho'), `SP title must use sans family, got ${sp.titleFontFamily}.`);
  assert(close(parseFloat(sp.titleLineHeight), 30.8, 1), `SP title line-height expected ~30.8px, got ${sp.titleLineHeight}.`);
  assert(close(parseFloat(sp.titleLetterSpacing), 1.1, 0.2), `SP title tracking expected ~1.1px, got ${sp.titleLetterSpacing}.`);
  assert(sp.overlayColor === 'rgba(255, 255, 255, 0.25)', `SP visual overlay expected 25% white, got ${sp.overlayColor}.`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await measure(desktopPage);
  assert(pc, 'PC shared page title was not found.');
  assert(close(pc.height, 220), `PC shared visual expected 220px, got ${pc.height}.`);
  assert(pc.titleText === 'お知らせ', `PC shared title expected お知らせ, got ${pc.titleText}.`);
  assert(pc.titleFontSize === '32px', `PC title expected 32px, got ${pc.titleFontSize}.`);
  assert(pc.titleFontWeight === '700', `PC title expected weight 700, got ${pc.titleFontWeight}.`);
  assert(pc.titleFontFamily.toLowerCase().includes('mincho'), `PC title must use serif/Mincho family, got ${pc.titleFontFamily}.`);
  assert(close(parseFloat(pc.titleLineHeight), 44.8, 1), `PC title line-height expected ~44.8px, got ${pc.titleLineHeight}.`);
  assert(close(parseFloat(pc.titleLetterSpacing), 1.6, 0.2), `PC title tracking expected ~1.6px, got ${pc.titleLetterSpacing}.`);
  assert(pc.overlayColor === 'rgba(255, 255, 255, 0.25)', `PC visual overlay expected 25% white, got ${pc.overlayColor}.`);
  await desktopContext.close();

  console.log('PASS Budokan shared News page-title SP 180px / sans 22px current Figma contract.');
  console.log('PASS Budokan shared News page-title PC 220px / Mincho 32px current Figma contract.');
} finally {
  await browser.close();
}
