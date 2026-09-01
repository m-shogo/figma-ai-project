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

async function measureTopInstagram(page) {
  return page.evaluate(() => {
    const section = document.querySelector('#top_instagram-01');
    const title = section?.querySelector('.ti_title');
    const label = section?.querySelector('.ti_label');
    const lead = section?.querySelector('.ti_lead');
    if (!section || !title || !label || !lead) return null;
    return {
      titleSize: parseFloat(getComputedStyle(title).fontSize),
      titleFamily: getComputedStyle(title).fontFamily,
      labelSize: parseFloat(getComputedStyle(label).fontSize),
      labelFamily: getComputedStyle(label).fontFamily,
      leadFamily: getComputedStyle(lead).fontFamily,
    };
  });
}

async function measureTopPartner(page) {
  return page.evaluate(() => {
    const section = document.querySelector('#top_partner-01');
    const title = section?.querySelector('.tp_title');
    const titleEn = section?.querySelector('.tp_title_en');
    const lead = section?.querySelector('.tp_lead');
    const name = section?.querySelector('.tp_name');
    const more = section?.querySelector('.tp_more');
    if (!section || !title || !titleEn || !lead || !name || !more) return null;
    return {
      titleSize: parseFloat(getComputedStyle(title).fontSize),
      titleFamily: getComputedStyle(title).fontFamily,
      titleEnSize: parseFloat(getComputedStyle(titleEn).fontSize),
      titleEnFamily: getComputedStyle(titleEn).fontFamily,
      leadFamily: getComputedStyle(lead).fontFamily,
      nameSize: parseFloat(getComputedStyle(name).fontSize),
      nameFamily: getComputedStyle(name).fontFamily,
      moreFamily: getComputedStyle(more).fontFamily,
    };
  });
}

async function measureTopNews(page) {
  return page.evaluate(() => {
    const section = document.querySelector('#top_news-01');
    const heading = section?.querySelector('.top_news_heading_ja');
    const headingEn = section?.querySelector('.top_news_heading_en');
    const more = section?.querySelector('.top_news_more_sp, .top_news_more_pc');
    const tab = section?.querySelector('.news_tabs_link');
    const date = section?.querySelector('.news_item_date');
    const title = section?.querySelector('.news_item_title');
    if (!section || !heading || !headingEn || !more || !tab || !date || !title) return null;
    return {
      headingSize: parseFloat(getComputedStyle(heading).fontSize),
      headingFamily: getComputedStyle(heading).fontFamily,
      headingEnSize: parseFloat(getComputedStyle(headingEn).fontSize),
      headingEnFamily: getComputedStyle(headingEn).fontFamily,
      moreFamily: getComputedStyle(more).fontFamily,
      tabFamily: getComputedStyle(tab).fontFamily,
      dateSize: parseFloat(getComputedStyle(date).fontSize),
      dateFamily: getComputedStyle(date).fontFamily,
      titleSize: parseFloat(getComputedStyle(title).fontSize),
      titleFamily: getComputedStyle(title).fontFamily,
    };
  });
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
  const spNews = await measureTopNews(mobilePage);
  assert(spNews, 'SP TOP News elements missing');
  assert(close(spNews.headingSize, 30, 0.5), `SP news heading ${spNews.headingSize}`);
  assert(isKakuFamily(spNews.headingFamily), `SP news heading JA must resolve to Zen Kaku Gothic New, got ${spNews.headingFamily}.`);
  assert(close(spNews.headingEnSize, 14, 0.5), `SP news heading EN ${spNews.headingEnSize}`);
  assert(isRobotoFamily(spNews.headingEnFamily), `SP news heading EN must resolve to Roboto, got ${spNews.headingEnFamily}.`);
  assert(isKakuFamily(spNews.moreFamily), `SP news more must resolve to Zen Kaku Gothic New, got ${spNews.moreFamily}.`);
  assert(isKakuFamily(spNews.tabFamily), `SP news tab must resolve to Zen Kaku Gothic New, got ${spNews.tabFamily}.`);
  assert(close(spNews.dateSize, 14, 0.5), `SP news date ${spNews.dateSize}`);
  assert(isKakuFamily(spNews.dateFamily), `SP news date must resolve to Zen Kaku Gothic New, got ${spNews.dateFamily}.`);
  assert(close(spNews.titleSize, 16, 0.5), `SP news title ${spNews.titleSize}`);
  assert(isKakuFamily(spNews.titleFamily), `SP news title must resolve to Zen Kaku Gothic New, got ${spNews.titleFamily}.`);
  const spPartner = await measureTopPartner(mobilePage);
  assert(spPartner, 'SP TOP Partner elements missing');
  assert(close(spPartner.titleSize, 22, 0.5), `SP partner title ${spPartner.titleSize}`);
  assert(isKakuFamily(spPartner.titleFamily), `SP partner title must resolve to Zen Kaku Gothic New, got ${spPartner.titleFamily}.`);
  assert(close(spPartner.titleEnSize, 14, 0.5), `SP partner EN ${spPartner.titleEnSize}`);
  assert(isRobotoFamily(spPartner.titleEnFamily), `SP partner EN must resolve to Roboto, got ${spPartner.titleEnFamily}.`);
  assert(isKakuFamily(spPartner.leadFamily), `SP partner lead must resolve to Zen Kaku Gothic New, got ${spPartner.leadFamily}.`);
  assert(close(spPartner.nameSize, 12, 0.5), `SP partner name ${spPartner.nameSize}`);
  assert(isKakuFamily(spPartner.nameFamily), `SP partner name must resolve to Zen Kaku Gothic New, got ${spPartner.nameFamily}.`);
  assert(isKakuFamily(spPartner.moreFamily), `SP partner more must resolve to Zen Kaku Gothic New, got ${spPartner.moreFamily}.`);
  const spInstagram = await measureTopInstagram(mobilePage);
  assert(spInstagram, 'SP TOP Instagram elements missing');
  assert(close(spInstagram.titleSize, 22, 0.5), `SP instagram title ${spInstagram.titleSize}`);
  assert(isKakuFamily(spInstagram.titleFamily), `SP instagram title must resolve to Zen Kaku Gothic New, got ${spInstagram.titleFamily}.`);
  assert(close(spInstagram.labelSize, 14, 0.5), `SP instagram label ${spInstagram.labelSize}`);
  assert(isRobotoFamily(spInstagram.labelFamily), `SP instagram label must resolve to Roboto, got ${spInstagram.labelFamily}.`);
  assert(isKakuFamily(spInstagram.leadFamily), `SP instagram lead must resolve to Zen Kaku Gothic New, got ${spInstagram.leadFamily}.`);
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
  const pcNews = await measureTopNews(desktopPage);
  assert(pcNews, 'PC TOP News elements missing');
  assert(close(pcNews.headingSize, 28, 0.5), `PC news heading ${pcNews.headingSize}`);
  assert(isMinchoFamily(pcNews.headingFamily), `PC news heading JA must resolve to Zen Old Mincho, got ${pcNews.headingFamily}.`);
  assert(close(pcNews.headingEnSize, 18, 0.5), `PC news heading EN ${pcNews.headingEnSize}`);
  assert(isMinchoFamily(pcNews.headingEnFamily), `PC news heading EN must resolve to Zen Old Mincho, got ${pcNews.headingEnFamily}.`);
  assert(isKakuFamily(pcNews.moreFamily), `PC news more must resolve to Zen Kaku Gothic New, got ${pcNews.moreFamily}.`);
  assert(isKakuFamily(pcNews.tabFamily), `PC news tab must resolve to Zen Kaku Gothic New, got ${pcNews.tabFamily}.`);
  assert(close(pcNews.dateSize, 14, 0.5), `PC news date ${pcNews.dateSize}`);
  assert(isKakuFamily(pcNews.dateFamily), `PC news date must resolve to Zen Kaku Gothic New, got ${pcNews.dateFamily}.`);
  assert(close(pcNews.titleSize, 16, 0.5), `PC news title ${pcNews.titleSize}`);
  assert(isKakuFamily(pcNews.titleFamily), `PC news title must resolve to Zen Kaku Gothic New, got ${pcNews.titleFamily}.`);
  const pcPartner = await measureTopPartner(desktopPage);
  assert(pcPartner, 'PC TOP Partner elements missing');
  assert(close(pcPartner.titleSize, 24, 0.5), `PC partner title ${pcPartner.titleSize}`);
  assert(isMinchoFamily(pcPartner.titleFamily), `PC partner title must resolve to Zen Old Mincho, got ${pcPartner.titleFamily}.`);
  assert(close(pcPartner.titleEnSize, 16, 0.5), `PC partner EN ${pcPartner.titleEnSize}`);
  assert(isMinchoFamily(pcPartner.titleEnFamily), `PC partner EN must resolve to Zen Old Mincho, got ${pcPartner.titleEnFamily}.`);
  assert(isKakuFamily(pcPartner.leadFamily), `PC partner lead must resolve to Zen Kaku Gothic New, got ${pcPartner.leadFamily}.`);
  assert(close(pcPartner.nameSize, 14, 0.5), `PC partner name ${pcPartner.nameSize}`);
  assert(isKakuFamily(pcPartner.nameFamily), `PC partner name must resolve to Zen Kaku Gothic New, got ${pcPartner.nameFamily}.`);
  assert(isKakuFamily(pcPartner.moreFamily), `PC partner more must resolve to Zen Kaku Gothic New, got ${pcPartner.moreFamily}.`);
  const pcInstagram = await measureTopInstagram(desktopPage);
  assert(pcInstagram, 'PC TOP Instagram elements missing');
  assert(close(pcInstagram.titleSize, 24, 0.5), `PC instagram title ${pcInstagram.titleSize}`);
  assert(isMinchoFamily(pcInstagram.titleFamily), `PC instagram title must resolve to Zen Old Mincho, got ${pcInstagram.titleFamily}.`);
  assert(close(pcInstagram.labelSize, 16, 0.5), `PC instagram label ${pcInstagram.labelSize}`);
  assert(isMinchoFamily(pcInstagram.labelFamily), `PC instagram label must resolve to Zen Old Mincho, got ${pcInstagram.labelFamily}.`);
  assert(isKakuFamily(pcInstagram.leadFamily), `PC instagram lead must resolve to Zen Kaku Gothic New, got ${pcInstagram.leadFamily}.`);
  await desktopContext.close();
  console.log('PASS Budokan TOP About SP responsive geometry and type family QA.');
  console.log('PASS Budokan TOP About PC right-rail four-card geometry and type family QA.');
  console.log('PASS Budokan TOP News SP/PC type family QA hosted on the About front-page runtime.');
  console.log('PASS Budokan TOP Partner SP/PC type family QA hosted on the About front-page runtime.');
  console.log('PASS Budokan TOP Instagram SP/PC type family QA hosted on the About front-page runtime.');
} finally {
  await browser.close();
}
