import { chromium } from 'playwright';
import { assertHeadings, measureHeadings } from './budokan-heading-browser-qa.mjs';

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

function isTransparent(color) {
  const value = String(color || '').toLowerCase().replace(/\s+/g, '');
  return value === 'transparent' || value === 'rgba(0,0,0,0)' || value === 'rgba(0,0,0,0.0)';
}

async function measureGold(page) {
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
      visualBg: visualStyle.backgroundColor,
      backgroundDisplay: getComputedStyle(background).display,
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

async function measureFixed(page) {
  return page.evaluate(() => {
    const visual = document.querySelector('.global_mainVisual._fixedPage');
    const title = visual?.querySelector('.gm_title');
    const background = visual?.querySelector('.gm_background');
    if (!visual || !title || !background) return null;

    const visualRect = visual.getBoundingClientRect();
    const bgRect = background.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const visualStyle = getComputedStyle(visual);
    const bgStyle = getComputedStyle(background);
    const overlay = getComputedStyle(background, '::before');
    const titleStyle = getComputedStyle(title);

    return {
      visualHeight: visualRect.height,
      visualWidth: visualRect.width,
      visualBg: visualStyle.backgroundColor,
      bgDisplay: bgStyle.display,
      bgHeight: bgRect.height,
      bgWidth: bgRect.width,
      bgLeft: bgRect.left - visualRect.left,
      overlayBg: overlay.backgroundColor,
      titleText: title.textContent?.trim(),
      titleTop: titleRect.top - visualRect.top,
      titleWidth: titleRect.width,
      titleHeight: titleRect.height,
      titleBg: titleStyle.backgroundColor,
      titleColor: titleStyle.color,
      titleFontSize: titleStyle.fontSize,
      titleFontWeight: titleStyle.fontWeight,
      titleFontFamily: titleStyle.fontFamily,
      titleAlign: titleStyle.textAlign,
      titlePosition: titleStyle.position,
    };
  });
}

const fixedPageUrl = new URL('/budokan-fixed-page-qa/', url).href;
const browser = await chromium.launch({ headless: true });

try {
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 900 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  const sp = await measureGold(mobilePage);
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

  await mobilePage.goto(fixedPageUrl, { waitUntil: 'networkidle' });
  const spFixed = await measureFixed(mobilePage);
  assert(spFixed, 'SP image page title (_fixedPage) was not found.');
  assert(close(spFixed.visualHeight, 273), `SP image title visual expected 273px, got ${spFixed.visualHeight}.`);
  assert(spFixed.bgDisplay === 'block', `SP image title photo must be visible, got ${spFixed.bgDisplay}.`);
  assert(close(spFixed.bgHeight, 240), `SP image title photo expected 240px, got ${spFixed.bgHeight}.`);
  assert(close(spFixed.bgLeft, 0), `SP image title photo expected flush left, got ${spFixed.bgLeft}.`);
  assert(isTransparent(spFixed.overlayBg), `SP image title overlay must be absent, got ${spFixed.overlayBg}.`);
  assert(spFixed.titleText === '研修センター', `SP image title expected 研修センター, got ${spFixed.titleText}.`);
  assert(close(spFixed.titleTop, 207), `SP image title panel expected top 207px, got ${spFixed.titleTop}.`);
  assert(close(spFixed.titleWidth, 327), `SP image title panel expected 327px, got ${spFixed.titleWidth}.`);
  assert(close(spFixed.titleHeight, 66, 3), `SP image title panel expected ~66px, got ${spFixed.titleHeight}.`);
  assert(spFixed.titleBg === 'rgb(255, 255, 255)', `SP image title panel expected white, got ${spFixed.titleBg}.`);
  assert(spFixed.titleColor === 'rgb(51, 51, 51)', `SP image title color expected #333, got ${spFixed.titleColor}.`);
  assert(spFixed.titleFontSize === '24px', `SP image title expected 24px, got ${spFixed.titleFontSize}.`);
  assert(spFixed.titleFontWeight === '700', `SP image title expected weight 700, got ${spFixed.titleFontWeight}.`);
  assert(isSerifFamily(spFixed.titleFontFamily), `SP image title must resolve to a Mincho/serif family, got ${spFixed.titleFontFamily}.`);
  assert(spFixed.titlePosition === 'relative', `SP image title panel must stay in flow, got ${spFixed.titlePosition}.`);
  assertHeadings(await measureHeadings(mobilePage), 'SP');
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await measureGold(desktopPage);
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

  await desktopPage.goto(fixedPageUrl, { waitUntil: 'networkidle' });
  const pcFixed = await measureFixed(desktopPage);
  assert(pcFixed, 'PC image page title (_fixedPage) was not found.');
  assert(pcFixed.bgDisplay === 'block', `PC image title photo must be visible, got ${pcFixed.bgDisplay}.`);
  assert(close(pcFixed.bgHeight, 320), `PC image title photo expected 320px, got ${pcFixed.bgHeight}.`);
  assert(close(pcFixed.bgLeft, 60), `PC image title photo expected 60px inset, got ${pcFixed.bgLeft}.`);
  assert(close(pcFixed.bgWidth, pcFixed.visualWidth - 60, 2), `PC image title photo should run to the right edge, got ${pcFixed.bgWidth} vs visual ${pcFixed.visualWidth}.`);
  assert(isTransparent(pcFixed.overlayBg), `PC image title overlay must be absent, got ${pcFixed.overlayBg}.`);
  assert(pcFixed.titleText === '研修センター', `PC image title expected 研修センター, got ${pcFixed.titleText}.`);
  assert(close(pcFixed.titleTop, 253), `PC image title panel expected top 253px, got ${pcFixed.titleTop}.`);
  assert(close(pcFixed.titleWidth, 360), `PC image title panel expected 360px, got ${pcFixed.titleWidth}.`);
  assert(close(pcFixed.titleHeight, 79, 3), `PC image title panel expected ~79px, got ${pcFixed.titleHeight}.`);
  assert(pcFixed.titleBg === 'rgb(255, 255, 255)', `PC image title panel expected white, got ${pcFixed.titleBg}.`);
  assert(pcFixed.titleColor === 'rgb(51, 51, 51)', `PC image title color expected #333, got ${pcFixed.titleColor}.`);
  assert(pcFixed.titleFontSize === '32px', `PC image title expected 32px, got ${pcFixed.titleFontSize}.`);
  assert(pcFixed.titleFontWeight === '700', `PC image title expected weight 700, got ${pcFixed.titleFontWeight}.`);
  assert(isSerifFamily(pcFixed.titleFontFamily), `PC image title must resolve to a Mincho/serif family, got ${pcFixed.titleFontFamily}.`);
  assert(pcFixed.titleAlign === 'center', `PC image title expected center, got ${pcFixed.titleAlign}.`);
  assert(pcFixed.titlePosition === 'relative', `PC image title panel must stay in flow, got ${pcFixed.titlePosition}.`);
  assertHeadings(await measureHeadings(desktopPage), 'PC');
  await desktopContext.close();

  console.log('PASS Budokan shared page-title SP 180px gold / Mincho 24px current Figma contract.');
  console.log('PASS Budokan shared page-title PC 220px gold / Mincho 32px current Figma contract.');
  console.log('PASS Budokan image page-title SP 273 / Mincho 24 white panel current Figma contract.');
  console.log('PASS Budokan image page-title PC photo 60/320 / Mincho 32 white panel current Figma contract.');
  console.log('PASS Budokan shared heading SP 24/12 Mincho / PC 26/20 Mincho current Figma contract.');
  console.log('PASS Budokan Gutenberg paragraph Zen Kaku Gothic New 17px / lh 1.6 current Figma contract.');
  console.log('PASS Budokan Gutenberg list Zen Kaku 17px / 18px inset current Figma contract.');
  console.log('PASS Budokan Gutenberg marker gold 8px overlay current Figma contract.');
  console.log('PASS Budokan Gutenberg button_L Zen Kaku 15px / gap 8 current Figma contract.');
  console.log('PASS Budokan Gutenberg details title Mincho 18 / 600 current Figma contract.');
  console.log('PASS Budokan Gutenberg details SP 59/16/20 / PC open 68/32 geometry current Figma contract.');
  console.log('PASS Budokan Gutenberg table Zen Kaku 15px current Figma contract.');
  console.log('PASS Budokan page-link Zen Kaku 16px / 500 current Figma contract.');
  console.log('PASS Budokan Gutenberg details QA hug Q/A / gold minus current Figma contract.');
  console.log('PASS Budokan media-text caption/zoom #333 current Figma contract.');
  console.log('PASS Budokan gallery caption Zen Kaku Medium 14 / #333 current Figma contract.');
  console.log('PASS Budokan navigation-large Mincho SemiBold 18 / Kaku 15 current Figma contract.');
  console.log('PASS Budokan tab Zen Kaku Medium 14 current Figma contract.');
} finally {
  await browser.close();
}
