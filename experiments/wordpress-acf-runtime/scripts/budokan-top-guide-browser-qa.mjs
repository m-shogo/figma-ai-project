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
    const lead = section?.querySelector('.tg_lead');
    const firstTitle = cards[0]?.querySelector('.tg_card_title');
    if (!section || !intro || cards.length !== 3 || !firstImage || !heading || !lead || !firstTitle) return null;

    const sectionRect = section.getBoundingClientRect();
    const introRect = intro.getBoundingClientRect();
    const cardRects = cards.map((card) => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    const headingStyle = getComputedStyle(heading);
    const leadStyle = getComputedStyle(lead);
    const titleStyle = getComputedStyle(firstTitle);

    return {
      sectionWidth: sectionRect.width,
      introHeight: introRect.height,
      firstCardLeft: cardRects[0].left - sectionRect.left,
      firstCardTop: cardRects[0].top - sectionRect.top,
      firstCardWidth: cardRects[0].width,
      firstImageHeight: imageRect.height,
      cardGap01: cardRects[1].top - cardRects[0].bottom,
      cardGap12: cardRects[2].top - cardRects[1].bottom,
      headingSize: parseFloat(headingStyle.fontSize),
      leadSize: parseFloat(leadStyle.fontSize),
      titleSize: parseFloat(titleStyle.fontSize),
    };
  });

  assert(sp, 'SP TOP Guide elements were not found.');
  assert(close(sp.sectionWidth, 375), `SP mobile layout viewport expected 375px section, got ${sp.sectionWidth}.`);
  assert(close(sp.introHeight, 514), `SP intro expected 514px, got ${sp.introHeight}.`);
  assert(close(sp.firstCardLeft, 32), `SP first card x expected 32px, got ${sp.firstCardLeft}.`);
  assert(close(sp.firstCardTop, 401), `SP first card y expected 401px, got ${sp.firstCardTop}.`);
  assert(close(sp.firstCardWidth, 311), `SP card width expected 311px, got ${sp.firstCardWidth}.`);
  assert(close(sp.firstImageHeight, 189), `SP image height expected 189px, got ${sp.firstImageHeight}.`);
  assert(Math.abs(sp.cardGap01) <= 1 && Math.abs(sp.cardGap12) <= 1, `SP cards should be contiguous; gaps=${sp.cardGap01},${sp.cardGap12}.`);
  assert(close(sp.headingSize, 30, 0.5), `SP heading expected 30px, got ${sp.headingSize}.`);
  assert(close(sp.leadSize, 16, 0.5), `SP lead expected 16px, got ${sp.leadSize}.`);
  assert(close(sp.titleSize, 18, 0.5), `SP card title expected 18px, got ${sp.titleSize}.`);

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
    const lead = section?.querySelector('.tg_lead');
    if (!section || !intro || cards.length !== 3 || !firstImage || !firstBody || !firstTitle || !lead) return null;

    const sectionRect = section.getBoundingClientRect();
    const introRect = intro.getBoundingClientRect();
    const cardRects = cards.map((card) => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    const bodyStyle = getComputedStyle(firstBody);
    const titleStyle = getComputedStyle(firstTitle);
    const leadStyle = getComputedStyle(lead);

    return {
      introHeight: introRect.height,
      cardsTop: cardRects[0].top - sectionRect.top,
      cardsLeft: cardRects[0].left - sectionRect.left,
      widths: cardRects.map((rect) => rect.width),
      xStarts: cardRects.map((rect) => rect.left - sectionRect.left),
      imageHeight: imageRect.height,
      bodyAlign: bodyStyle.alignItems,
      titleDirection: titleStyle.flexDirection,
      titleSize: parseFloat(titleStyle.fontSize),
      leadSize: parseFloat(leadStyle.fontSize),
    };
  });

  assert(pc, 'PC TOP Guide elements were not found.');
  assert(close(pc.introHeight, 320), `PC intro expected 320px, got ${pc.introHeight}.`);
  assert(close(pc.cardsTop, 218), `PC card rail y expected 218px, got ${pc.cardsTop}.`);
  assert(close(pc.cardsLeft, 210), `PC card rail x expected 210px, got ${pc.cardsLeft}.`);
  assert(pc.widths.every((width) => close(width, 320)), `PC cards expected 320px each, got ${pc.widths.join(',')}.`);
  assert(close(pc.xStarts[1] - pc.xStarts[0], 320) && close(pc.xStarts[2] - pc.xStarts[1], 320), `PC cards are not contiguous 320px columns: ${pc.xStarts.join(',')}.`);
  assert(close(pc.imageHeight, 194), `PC image height expected 194px, got ${pc.imageHeight}.`);
  assert(pc.bodyAlign === 'flex-start', `PC card body expected flex-start, got ${pc.bodyAlign}.`);
  assert(pc.titleDirection === 'row', `PC card title expected row, got ${pc.titleDirection}.`);
  assert(close(pc.titleSize, 20, 0.5), `PC card title expected 20px, got ${pc.titleSize}.`);
  assert(close(pc.leadSize, 16, 0.5), `PC lead expected 16px, got ${pc.leadSize}.`);

  await desktopContext.close();

  console.log('PASS Budokan TOP Guide SP geometry QA.');
  console.log('PASS Budokan TOP Guide PC geometry QA.');
} finally {
  await browser.close();
}
