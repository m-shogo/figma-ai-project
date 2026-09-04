import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-top-guide-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

function isMinchoFamily(family) {
  const value = String(family || '').toLowerCase();
  if (value.includes('sans-serif')) return false;
  return value.includes('mincho') || value.includes('zen old');
}
function isKakuFamily(family) {
  return String(family || '').toLowerCase().includes('kaku');
}
function isRobotoFamily(family) {
  return String(family || '').toLowerCase().includes('roboto');
}

const browser = await chromium.launch({ headless: true });
const mobileContext = await browser.newContext({
  viewport: { width: 375, height: 2200 },
  isMobile: true,
  hasTouch: true,
});
const mobilePage = await mobileContext.newPage();

try {
  await mobilePage.goto(url, { waitUntil: 'networkidle' });

  const sp = await mobilePage.evaluate(() => {
    const section = document.querySelector('#top_guide-01');
    const intro = section?.querySelector('.tg_intro');
    const cards = section ? [...section.querySelectorAll('.tg_card')] : [];
    const firstImage = cards[0]?.querySelector('.tg_card_image img');
    const heading = section?.querySelector('.tg_heading_ja');
    const headingEn = section?.querySelector('.tg_heading_en');
    const lead = section?.querySelector('.tg_lead');
    const firstTitle = cards[0]?.querySelector('.tg_card_title');
    const firstText = cards[0]?.querySelector('.tg_card_text');
    if (!section || !intro || cards.length !== 3 || !firstImage || !heading || !headingEn || !lead || !firstTitle || !firstText) return null;

    const sectionRect = section.getBoundingClientRect();
    const introRect = intro.getBoundingClientRect();
    const cardRects = cards.map((card) => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    const headingStyle = getComputedStyle(heading);
    const headingEnStyle = getComputedStyle(headingEn);
    const leadStyle = getComputedStyle(lead);
    const titleStyle = getComputedStyle(firstTitle);
    const textStyle = getComputedStyle(firstText);

    return {
      sectionWidth: sectionRect.width,
      sectionHeight: sectionRect.height,
      introHeight: introRect.height,
      firstCardLeft: cardRects[0].left - sectionRect.left,
      firstCardTop: cardRects[0].top - sectionRect.top,
      firstCardWidth: cardRects[0].width,
      firstImageHeight: imageRect.height,
      cardGap01: cardRects[1].top - cardRects[0].bottom,
      cardGap12: cardRects[2].top - cardRects[1].bottom,
      lastCardBottomGap: sectionRect.bottom - cardRects[2].bottom,
      headingSize: parseFloat(headingStyle.fontSize),
      headingFamily: headingStyle.fontFamily,
      headingEnText: headingEn.textContent.trim(),
      headingEnSize: parseFloat(headingEnStyle.fontSize),
      headingEnFamily: headingEnStyle.fontFamily,
      leadSize: parseFloat(leadStyle.fontSize),
      leadFamily: leadStyle.fontFamily,
      titleSize: parseFloat(titleStyle.fontSize),
      titleFamily: titleStyle.fontFamily,
      textFamily: textStyle.fontFamily,
    };
  });

  assert(sp, 'SP TOP Guide elements were not found.');
  assert(close(sp.sectionWidth, 375), `SP mobile layout viewport expected 375px section, got ${sp.sectionWidth}.`);
  assert(close(sp.sectionHeight, 1668), `SP section height expected 1668px, got ${sp.sectionHeight}.`);
  assert(close(sp.introHeight, 514), `SP intro expected 514px, got ${sp.introHeight}.`);
  assert(close(sp.firstCardLeft, 32), `SP first card x expected 32px, got ${sp.firstCardLeft}.`);
  assert(close(sp.firstCardTop, 401), `SP first card y expected 401px, got ${sp.firstCardTop}.`);
  assert(close(sp.firstCardWidth, 311), `SP card width expected 311px, got ${sp.firstCardWidth}.`);
  assert(close(sp.firstImageHeight, 189), `SP image height expected 189px, got ${sp.firstImageHeight}.`);
  assert(Math.abs(sp.cardGap01) <= 1 && Math.abs(sp.cardGap12) <= 1, `SP cards should be contiguous; gaps=${sp.cardGap01},${sp.cardGap12}.`);
  assert(close(sp.lastCardBottomGap, 64), `SP final card bottom gap expected 64px, got ${sp.lastCardBottomGap}.`);
  assert(close(sp.headingSize, 30, 0.5), `SP heading expected 30px, got ${sp.headingSize}.`);
  assert(isKakuFamily(sp.headingFamily), `SP heading JA must resolve to Zen Kaku Gothic New, got ${sp.headingFamily}.`);
  assert(sp.headingEnText === 'User guide', `SP heading EN text expected User guide, got ${sp.headingEnText}.`);
  assert(close(sp.headingEnSize, 14, 0.5), `SP heading EN expected 14px, got ${sp.headingEnSize}.`);
  assert(isRobotoFamily(sp.headingEnFamily), `SP heading EN must resolve to Roboto, got ${sp.headingEnFamily}.`);
  assert(close(sp.leadSize, 16, 0.5), `SP lead expected 16px, got ${sp.leadSize}.`);
  assert(isKakuFamily(sp.leadFamily), `SP lead must resolve to Zen Kaku Gothic New, got ${sp.leadFamily}.`);
  assert(close(sp.titleSize, 18, 0.5), `SP card title expected 18px, got ${sp.titleSize}.`);
  assert(isKakuFamily(sp.titleFamily), `SP card title must resolve to Zen Kaku Gothic New, got ${sp.titleFamily}.`);
  assert(isKakuFamily(sp.textFamily), `SP card text must resolve to Zen Kaku Gothic New, got ${sp.textFamily}.`);

  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 1200 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });

  const pc = await desktopPage.evaluate(() => {
    const section = document.querySelector('#top_guide-01');
    const intro = section?.querySelector('.tg_intro');
    const cards = section ? [...section.querySelectorAll('.tg_card')] : [];
    const firstImage = cards[0]?.querySelector('.tg_card_image img');
    const firstBody = cards[0]?.querySelector('.tg_card_body');
    const firstTitle = cards[0]?.querySelector('.tg_card_title');
    const firstText = cards[0]?.querySelector('.tg_card_text');
    const heading = section?.querySelector('.tg_heading_ja');
    const headingEn = section?.querySelector('.tg_heading_en');
    const lead = section?.querySelector('.tg_lead');
    if (!section || !intro || cards.length !== 3 || !firstImage || !firstBody || !firstTitle || !firstText || !heading || !headingEn || !lead) return null;

    const sectionRect = section.getBoundingClientRect();
    const introRect = intro.getBoundingClientRect();
    const cardRects = cards.map((card) => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    const bodyStyle = getComputedStyle(firstBody);
    const titleStyle = getComputedStyle(firstTitle);
    const textStyle = getComputedStyle(firstText);
    const headingStyle = getComputedStyle(heading);
    const headingEnStyle = getComputedStyle(headingEn);
    const leadStyle = getComputedStyle(lead);

    return {
      sectionWidth: sectionRect.width,
      sectionHeight: sectionRect.height,
      introHeight: introRect.height,
      cardsTop: cardRects[0].top - sectionRect.top,
      cardsLeft: cardRects[0].left - sectionRect.left,
      widths: cardRects.map((rect) => rect.width),
      xStarts: cardRects.map((rect) => rect.left - sectionRect.left),
      imageHeight: imageRect.height,
      lastCardBottomGap: sectionRect.bottom - cardRects[2].bottom,
      bodyAlign: bodyStyle.alignItems,
      titleDirection: titleStyle.flexDirection,
      titleSize: parseFloat(titleStyle.fontSize),
      titleFamily: titleStyle.fontFamily,
      textFamily: textStyle.fontFamily,
      headingSize: parseFloat(headingStyle.fontSize),
      headingFamily: headingStyle.fontFamily,
      headingEnText: headingEn.textContent.trim(),
      headingEnSize: parseFloat(headingEnStyle.fontSize),
      headingEnFamily: headingEnStyle.fontFamily,
      leadSize: parseFloat(leadStyle.fontSize),
      leadFamily: leadStyle.fontFamily,
    };
  });

  assert(pc, 'PC TOP Guide elements were not found.');
  assert(close(pc.sectionHeight, 689), `PC section height expected 689px, got ${pc.sectionHeight}.`);
  assert(close(pc.introHeight, 320), `PC intro expected 320px, got ${pc.introHeight}.`);
  assert(close(pc.cardsTop, 218), `PC card rail y expected 218px, got ${pc.cardsTop}.`);
  const expectedCenteredLeft = (pc.sectionWidth - 960) / 2;
  assert(close(pc.cardsLeft, expectedCenteredLeft), `PC 960px card rail should be centered; section=${pc.sectionWidth}, left=${pc.cardsLeft}, expected=${expectedCenteredLeft}.`);
  assert(pc.widths.every((width) => close(width, 320)), `PC cards expected 320px each, got ${pc.widths.join(',')}.`);
  assert(close(pc.xStarts[1] - pc.xStarts[0], 320) && close(pc.xStarts[2] - pc.xStarts[1], 320), `PC cards are not contiguous 320px columns: ${pc.xStarts.join(',')}.`);
  assert(close(pc.imageHeight, 194), `PC image height expected 194px, got ${pc.imageHeight}.`);
  assert(close(pc.lastCardBottomGap, 0), `PC card rail should end with the section; gap=${pc.lastCardBottomGap}.`);
  assert(pc.bodyAlign === 'flex-start', `PC card body expected flex-start, got ${pc.bodyAlign}.`);
  assert(pc.titleDirection === 'row', `PC card title expected row, got ${pc.titleDirection}.`);
  assert(close(pc.titleSize, 20, 0.5), `PC card title expected 20px, got ${pc.titleSize}.`);
  assert(isMinchoFamily(pc.titleFamily), `PC card title must resolve to Zen Old Mincho, got ${pc.titleFamily}.`);
  assert(isKakuFamily(pc.textFamily), `PC card text must resolve to Zen Kaku Gothic New, got ${pc.textFamily}.`);
  assert(close(pc.headingSize, 32, 0.5), `PC heading expected 32px, got ${pc.headingSize}.`);
  assert(isMinchoFamily(pc.headingFamily), `PC heading JA must resolve to Zen Old Mincho, got ${pc.headingFamily}.`);
  assert(pc.headingEnText === 'User guide', `PC heading EN text expected User guide, got ${pc.headingEnText}.`);
  assert(close(pc.headingEnSize, 22, 0.5), `PC heading EN expected 22px, got ${pc.headingEnSize}.`);
  assert(isMinchoFamily(pc.headingEnFamily), `PC heading EN must resolve to Zen Old Mincho, got ${pc.headingEnFamily}.`);
  assert(close(pc.leadSize, 16, 0.5), `PC lead expected 16px, got ${pc.leadSize}.`);
  assert(isKakuFamily(pc.leadFamily), `PC lead must resolve to Zen Kaku Gothic New, got ${pc.leadFamily}.`);

  await desktopContext.close();

  console.log('PASS Budokan TOP Guide SP geometry and type family QA.');
  console.log('PASS Budokan TOP Guide PC geometry and type family QA.');
} finally {
  await browser.close();
}
