import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) process.exit(2);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;

const browser = await chromium.launch({ headless: true });
try {
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 2200 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  const sp = await mobilePage.evaluate(() => {
    const section = document.querySelector('#top_about-01');
    const heading = section?.querySelector('.ta_heading_ja');
    const panel = section?.querySelector('.ta_panel');
    const lead = section?.querySelector('.ta_lead');
    const buttons = section ? [...section.querySelectorAll('.ta_btn')] : [];
    const cards = section ? [...section.querySelectorAll('.ta_card')] : [];
    const firstImage = cards[0]?.querySelector('.ta_card_image img');
    if (!section || !heading || !panel || !lead || buttons.length !== 2 || cards.length !== 4 || !firstImage) return null;
    const sectionRect = section.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const cardRects = cards.map(card => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    return {
      sectionWidth: sectionRect.width,
      headingSize: parseFloat(getComputedStyle(heading).fontSize),
      panelWidth: panelRect.width,
      leadAlign: getComputedStyle(lead).textAlign,
      buttonHeights: buttons.map(button => button.getBoundingClientRect().height),
      cardWidths: cardRects.map(rect => rect.width),
      firstImageWidth: imageRect.width,
      firstImageHeight: imageRect.height,
      cardsDisplay: getComputedStyle(section.querySelector('.ta_cards')).display,
    };
  });
  assert(sp, 'SP TOP About elements missing');
  assert(close(sp.sectionWidth, 375), `SP width ${sp.sectionWidth}`);
  assert(close(sp.headingSize, 30, 0.5), `SP heading ${sp.headingSize}`);
  assert(close(sp.panelWidth, 335), `SP panel ${sp.panelWidth}`);
  assert(sp.leadAlign === 'left' || sp.leadAlign === 'start', `SP lead align ${sp.leadAlign}`);
  assert(sp.buttonHeights.every(height => height >= 51 && height <= 54), `SP CTA heights ${sp.buttonHeights.join(',')}`);
  assert(sp.cardsDisplay === 'flex', `SP cards display ${sp.cardsDisplay}`);
  assert(sp.cardWidths.every(width => close(width, 240)), `SP card widths ${sp.cardWidths.join(',')}`);
  assert(close(sp.firstImageWidth, 240) && close(sp.firstImageHeight, 320), `SP image ${sp.firstImageWidth}x${sp.firstImageHeight}`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 1500 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await desktopPage.evaluate(() => {
    const section = document.querySelector('#top_about-01');
    const heading = section?.querySelector('.ta_heading_ja');
    const panel = section?.querySelector('.ta_panel');
    const actions = section?.querySelector('.ta_actions');
    const cardsWrapInner = section?.querySelector('.ta_cards_wrap .global_inner');
    const cards = section ? [...section.querySelectorAll('.ta_card')] : [];
    const firstImage = cards[0]?.querySelector('.ta_card_image img');
    if (!section || !heading || !panel || !actions || !cardsWrapInner || cards.length !== 4 || !firstImage) return null;
    const headingRect = heading.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const cardRects = cards.map(card => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    return {
      writingMode: getComputedStyle(heading).writingMode,
      panelDisplay: getComputedStyle(panel).display,
      actionsWidth: actionsRect.width,
      headingRight: headingRect.right,
      innerPaddingLeft: parseFloat(getComputedStyle(cardsWrapInner).paddingLeft),
      cardsDisplay: getComputedStyle(section.querySelector('.ta_cards')).display,
      cardTopSpread: Math.max(...cardRects.map(rect => rect.top)) - Math.min(...cardRects.map(rect => rect.top)),
      cardLefts: cardRects.map(rect => rect.left),
      firstCardLeft: cardRects[0].left,
      imageRatio: imageRect.width / imageRect.height,
    };
  });
  assert(pc, 'PC TOP About elements missing');
  assert(pc.writingMode.includes('vertical'), `PC writing mode ${pc.writingMode}`);
  assert(pc.panelDisplay === 'contents', `PC panel display ${pc.panelDisplay}`);
  assert(close(pc.actionsWidth, 220), `PC actions width ${pc.actionsWidth}`);
  assert(close(pc.innerPaddingLeft, 280), `PC card rail inset ${pc.innerPaddingLeft}`);
  assert(pc.cardsDisplay === 'grid', `PC cards display ${pc.cardsDisplay}`);
  assert(pc.cardTopSpread <= 2, `PC row spread ${pc.cardTopSpread}`);
  assert(new Set(pc.cardLefts.map(left => Math.round(left))).size === 4, `PC columns ${pc.cardLefts.join(',')}`);
  assert(pc.firstCardLeft > pc.headingRight + 40, `PC rail relation card=${pc.firstCardLeft} heading=${pc.headingRight}`);
  assert(close(pc.imageRatio, 0.75, 0.02), `PC image ratio ${pc.imageRatio}`);
  await desktopContext.close();
  console.log('PASS Budokan TOP About SP responsive geometry QA.');
  console.log('PASS Budokan TOP About PC right-rail four-card geometry QA.');
} finally {
  await browser.close();
}
