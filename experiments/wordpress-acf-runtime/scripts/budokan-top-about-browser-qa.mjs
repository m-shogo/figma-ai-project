import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) process.exit(2);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;
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
try {
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 2200 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  const sp = await mobilePage.evaluate(() => {
    const section = document.querySelector('#top_about-01');
    const heading = section?.querySelector('.ta_heading_ja');
    const headingEn = section?.querySelector('.ta_heading_en');
    const panel = section?.querySelector('.ta_panel');
    const lead = section?.querySelector('.ta_lead');
    const buttons = section ? [...section.querySelectorAll('.ta_btn')] : [];
    const cards = section ? [...section.querySelectorAll('.ta_card')] : [];
    const firstImage = cards[0]?.querySelector('.ta_card_image img');
    const firstLabel = cards[0]?.querySelector('.ta_card_label');
    if (!section || !heading || !headingEn || !panel || !lead || buttons.length !== 2 || cards.length !== 4 || !firstImage || !firstLabel) return null;
    const sectionRect = section.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const cardRects = cards.map(card => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    return {
      sectionWidth: sectionRect.width,
      headingSize: parseFloat(getComputedStyle(heading).fontSize),
      headingFamily: getComputedStyle(heading).fontFamily,
      headingEnSize: parseFloat(getComputedStyle(headingEn).fontSize),
      headingEnFamily: getComputedStyle(headingEn).fontFamily,
      panelWidth: panelRect.width,
      leadAlign: getComputedStyle(lead).textAlign,
      leadSize: parseFloat(getComputedStyle(lead).fontSize),
      leadFamily: getComputedStyle(lead).fontFamily,
      buttonHeights: buttons.map(button => button.getBoundingClientRect().height),
      buttonSize: parseFloat(getComputedStyle(buttons[0]).fontSize),
      buttonFamily: getComputedStyle(buttons[0]).fontFamily,
      cardWidths: cardRects.map(rect => rect.width),
      firstImageWidth: imageRect.width,
      firstImageHeight: imageRect.height,
      labelSize: parseFloat(getComputedStyle(firstLabel).fontSize),
      labelFamily: getComputedStyle(firstLabel).fontFamily,
      cardsDisplay: getComputedStyle(section.querySelector('.ta_cards')).display,
    };
  });
  assert(sp, 'SP TOP About elements missing');
  assert(close(sp.sectionWidth, 375), `SP width ${sp.sectionWidth}`);
  assert(close(sp.headingSize, 30, 0.5), `SP heading ${sp.headingSize}`);
  assert(isKakuFamily(sp.headingFamily), `SP heading JA must resolve to Zen Kaku Gothic New, got ${sp.headingFamily}.`);
  assert(close(sp.headingEnSize, 14, 0.5), `SP heading EN ${sp.headingEnSize}`);
  assert(isRobotoFamily(sp.headingEnFamily), `SP heading EN must resolve to Roboto, got ${sp.headingEnFamily}.`);
  assert(close(sp.panelWidth, 335), `SP panel ${sp.panelWidth}`);
  assert(sp.leadAlign === 'left' || sp.leadAlign === 'start', `SP lead align ${sp.leadAlign}`);
  assert(close(sp.leadSize, 16, 0.5), `SP lead ${sp.leadSize}`);
  assert(isKakuFamily(sp.leadFamily), `SP lead must resolve to Zen Kaku Gothic New, got ${sp.leadFamily}.`);
  assert(sp.buttonHeights.every(height => height >= 51 && height <= 54), `SP CTA heights ${sp.buttonHeights.join(',')}`);
  assert(close(sp.buttonSize, 16, 0.5), `SP CTA size ${sp.buttonSize}`);
  assert(isKakuFamily(sp.buttonFamily), `SP CTA must resolve to Zen Kaku Gothic New, got ${sp.buttonFamily}.`);
  assert(close(sp.labelSize, 16, 0.5), `SP card label ${sp.labelSize}`);
  assert(isKakuFamily(sp.labelFamily), `SP card label must resolve to Zen Kaku Gothic New, got ${sp.labelFamily}.`);
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
    const headingEn = section?.querySelector('.ta_heading_en');
    const panel = section?.querySelector('.ta_panel');
    const lead = section?.querySelector('.ta_lead');
    const actions = section?.querySelector('.ta_actions');
    const cardsWrapInner = section?.querySelector('.ta_cards_wrap .global_inner');
    const cards = section ? [...section.querySelectorAll('.ta_card')] : [];
    const firstImage = cards[0]?.querySelector('.ta_card_image img');
    const firstLabel = cards[0]?.querySelector('.ta_card_label');
    if (!section || !heading || !headingEn || !panel || !lead || !actions || !cardsWrapInner || cards.length !== 4 || !firstImage || !firstLabel) return null;
    const headingRect = heading.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const cardRects = cards.map(card => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    return {
      writingMode: getComputedStyle(heading).writingMode,
      headingSize: parseFloat(getComputedStyle(heading).fontSize),
      headingFamily: getComputedStyle(heading).fontFamily,
      headingEnSize: parseFloat(getComputedStyle(headingEn).fontSize),
      headingEnFamily: getComputedStyle(headingEn).fontFamily,
      headingEnClip: getComputedStyle(headingEn).clipPath,
      leadSize: parseFloat(getComputedStyle(lead).fontSize),
      leadFamily: getComputedStyle(lead).fontFamily,
      labelSize: parseFloat(getComputedStyle(firstLabel).fontSize),
      labelFamily: getComputedStyle(firstLabel).fontFamily,
      labelWeight: getComputedStyle(firstLabel).fontWeight,
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
  assert(close(pc.headingSize, 36, 0.5), `PC heading ${pc.headingSize}`);
  assert(isMinchoFamily(pc.headingFamily), `PC heading JA must resolve to Zen Old Mincho, got ${pc.headingFamily}.`);
  assert(close(pc.headingEnSize, 30, 0.5), `PC heading EN ${pc.headingEnSize}`);
  assert(isMinchoFamily(pc.headingEnFamily), `PC heading EN must resolve to Zen Old Mincho, got ${pc.headingEnFamily}.`);
  assert(pc.headingEnClip === 'none' || pc.headingEnClip === '', `PC heading EN must not be clipped into the octagon, got ${pc.headingEnClip}.`);
  assert(close(pc.leadSize, 16, 0.5), `PC lead ${pc.leadSize}`);
  assert(isKakuFamily(pc.leadFamily), `PC lead must resolve to Zen Kaku Gothic New, got ${pc.leadFamily}.`);
  assert(close(pc.labelSize, 18, 0.5), `PC card label ${pc.labelSize}`);
  assert(isMinchoFamily(pc.labelFamily), `PC card label must resolve to Zen Old Mincho, got ${pc.labelFamily}.`);
  assert(pc.labelWeight === '600' || pc.labelWeight === 'bold', `PC card label weight ${pc.labelWeight}`);
  assert(pc.panelDisplay === 'contents', `PC panel display ${pc.panelDisplay}`);
  assert(close(pc.actionsWidth, 220), `PC actions width ${pc.actionsWidth}`);
  assert(close(pc.innerPaddingLeft, 280), `PC card rail inset ${pc.innerPaddingLeft}`);
  assert(pc.cardsDisplay === 'grid', `PC cards display ${pc.cardsDisplay}`);
  assert(pc.cardTopSpread <= 2, `PC row spread ${pc.cardTopSpread}`);
  assert(new Set(pc.cardLefts.map(left => Math.round(left))).size === 4, `PC columns ${pc.cardLefts.join(',')}`);
  assert(pc.firstCardLeft > pc.headingRight + 40, `PC rail relation card=${pc.firstCardLeft} heading=${pc.headingRight}`);
  assert(close(pc.imageRatio, 0.75, 0.02), `PC image ratio ${pc.imageRatio}`);
  await desktopContext.close();
  console.log('PASS Budokan TOP About SP responsive geometry and type family QA.');
  console.log('PASS Budokan TOP About PC right-rail four-card geometry and type family QA.');
} finally {
  await browser.close();
}
