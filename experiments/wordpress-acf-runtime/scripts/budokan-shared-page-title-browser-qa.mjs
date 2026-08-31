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

function isSerifFamily(family) {
  const value = String(family || '').toLowerCase();
  if (value.includes('sans-serif')) return false;
  return value.includes('serif') || value.includes('mincho') || value.includes('zen old');
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

    return {
      height: visualRect.height,
      overflow: visualStyle.overflow,
      visualBg: visualStyle.backgroundColor,
      backgroundDisplay: background ? getComputedStyle(background).display : null,
      titleText: title.textContent?.trim(),
      titleFontSize: titleStyle.fontSize,
      titleFontWeight: titleStyle.fontWeight,
      titleFontFamily: titleStyle.fontFamily,
      titleColor: titleStyle.color,
      titleLineHeight: titleStyle.lineHeight,
      titleLetterSpacing: titleStyle.letterSpacing,
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
  assert(sp.visualBg === 'rgb(202, 153, 87)', `SP visual background expected gold #ca9957, got ${sp.visualBg}.`);
  assert(sp.backgroundDisplay === 'none', `SP photo layer must stay hidden on the gold title, got ${sp.backgroundDisplay}.`);
  assert(sp.titleText === 'お知らせ', `SP shared title expected お知らせ, got ${sp.titleText}.`);
  assert(sp.titleFontSize === '24px', `SP title expected 24px, got ${sp.titleFontSize}.`);
  assert(sp.titleFontWeight === '700', `SP title expected weight 700, got ${sp.titleFontWeight}.`);
  assert(isSerifFamily(sp.titleFontFamily), `SP title must resolve to a Mincho/serif family, got ${sp.titleFontFamily}.`);
  assert(sp.titleColor === 'rgb(255, 255, 255)', `SP title color expected white, got ${sp.titleColor}.`);
  assert(close(parseFloat(sp.titleLineHeight), 33.6, 1), `SP title line-height expected ~33.6px, got ${sp.titleLineHeight}.`);
  assert(close(parseFloat(sp.titleLetterSpacing), 1.2, 0.2), `SP title tracking expected ~1.2px, got ${sp.titleLetterSpacing}.`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await measure(desktopPage);
  assert(pc, 'PC shared page title was not found.');
  assert(close(pc.height, 220), `PC shared visual expected 220px, got ${pc.height}.`);
  assert(pc.visualBg === 'rgb(202, 153, 87)', `PC visual background expected gold #ca9957, got ${pc.visualBg}.`);
  assert(pc.backgroundDisplay === 'none', `PC photo layer must stay hidden on the gold title, got ${pc.backgroundDisplay}.`);
  assert(pc.titleText === 'お知らせ', `PC shared title expected お知らせ, got ${pc.titleText}.`);
  assert(pc.titleFontSize === '32px', `PC title expected 32px, got ${pc.titleFontSize}.`);
  assert(pc.titleFontWeight === '700', `PC title expected weight 700, got ${pc.titleFontWeight}.`);
  assert(isSerifFamily(pc.titleFontFamily), `PC title must resolve to a Mincho/serif family, got ${pc.titleFontFamily}.`);
  assert(pc.titleColor === 'rgb(255, 255, 255)', `PC title color expected white, got ${pc.titleColor}.`);
  assert(close(parseFloat(pc.titleLineHeight), 44.8, 1), `PC title line-height expected ~44.8px, got ${pc.titleLineHeight}.`);
  assert(close(parseFloat(pc.titleLetterSpacing), 1.6, 0.2), `PC title tracking expected ~1.6px, got ${pc.titleLetterSpacing}.`);
  await desktopContext.close();

  console.log('PASS Budokan shared page-title SP 180px gold / Mincho 24px current Figma contract.');
  console.log('PASS Budokan shared page-title PC 220px gold / Mincho 32px current Figma contract.');
} finally {
  await browser.close();
}
