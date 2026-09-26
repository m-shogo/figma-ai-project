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

async function measureTopBanner(page) {
  return page.evaluate(() => {
    const section = document.querySelector('#top_banner-01');
    const link = section?.querySelector('.tb_link');
    if (!section || !link) return null;
    return {
      family: getComputedStyle(link).fontFamily,
      size: parseFloat(getComputedStyle(link).fontSize),
    };
  });
}

async function measureTopInstagram(page) {
  return page.evaluate(() => {
    const section = document.querySelector('#top_instagram-01');
    const inner = section?.querySelector('.ti_inner');
    const head = section?.querySelector('.ti_head');
    const thumbs = section?.querySelector('.ti_thumbnails');
    const visibleThumbs = section ? [...section.querySelectorAll('.ti_thumbnail')].filter(node => getComputedStyle(node).display !== 'none') : [];
    const title = section?.querySelector('.ti_title');
    const label = section?.querySelector('.ti_label');
    const lead = section?.querySelector('.ti_lead');
    if (!section || !inner || !head || !thumbs || visibleThumbs.length === 0 || !title || !label || !lead) return null;
    const sectionRect = section.getBoundingClientRect();
    const innerRect = inner.getBoundingClientRect();
    const headRect = head.getBoundingClientRect();
    const thumbsRect = thumbs.getBoundingClientRect();
    const thumbRects = visibleThumbs.map(node => node.getBoundingClientRect());
    const sectionStyle = getComputedStyle(section);
    return {
      sectionWidth: sectionRect.width,
      sectionHeight: sectionRect.height,
      sectionPaddingTop: parseFloat(sectionStyle.paddingTop),
      sectionPaddingBottom: parseFloat(sectionStyle.paddingBottom),
      innerWidth: innerRect.width,
      headHeight: headRect.height,
      thumbsWidth: thumbsRect.width,
      thumbsHeight: thumbsRect.height,
      thumbWidths: thumbRects.map(rect => rect.width),
      thumbHeights: thumbRects.map(rect => rect.height),
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
    const layout = section?.querySelector('.tp_layout');
    const list = section?.querySelector('.tp_list');
    const items = section ? [...section.querySelectorAll('.tp_item')] : [];
    const title = section?.querySelector('.tp_title');
    const titleEn = section?.querySelector('.tp_title_en');
    const lead = section?.querySelector('.tp_lead');
    const name = section?.querySelector('.tp_name');
    const more = section ? [...section.querySelectorAll('.tp_more')].find(node => getComputedStyle(node).display !== 'none') : null;
    if (!section || !layout || !list || items.length !== 12 || !title || !titleEn || !lead || !name || !more) return null;
    const sectionRect = section.getBoundingClientRect();
    const layoutRect = layout.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const itemRects = items.map(item => item.getBoundingClientRect());
    const listStyle = getComputedStyle(list);
    return {
      sectionWidth: sectionRect.width,
      sectionHeight: sectionRect.height,
      layoutWidth: layoutRect.width,
      listWidth: listRect.width,
      listHeight: listRect.height,
      itemWidths: itemRects.map(rect => rect.width),
      itemHeights: itemRects.map(rect => rect.height),
      listColumnGap: parseFloat(listStyle.columnGap),
      listRowGap: parseFloat(listStyle.rowGap),
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
    const panel = section?.querySelector('.top_news_panel');
    const heading = section?.querySelector('.top_news_heading_ja');
    const headingEn = section?.querySelector('.top_news_heading_en');
    const more = section?.querySelector('.top_news_more_sp, .top_news_more_pc');
    const tab = section?.querySelector('.news_tabs_link');
    const firstLink = section?.querySelector('.news_item_link');
    const date = section?.querySelector('.news_item_date');
    const title = section?.querySelector('.news_item_title');
    if (!section || !panel || !heading || !headingEn || !more || !tab || !firstLink || !date || !title) return null;
    const sectionStyle = getComputedStyle(section);
    const panelStyle = getComputedStyle(panel);
    return {
      sectionPaddingTop: parseFloat(sectionStyle.paddingTop),
      sectionPaddingBottom: parseFloat(sectionStyle.paddingBottom),
      panelPaddingTop: parseFloat(panelStyle.paddingTop),
      panelPaddingLeft: parseFloat(panelStyle.paddingLeft),
      panelGap: parseFloat(panelStyle.gap),
      panelRadius: parseFloat(panelStyle.borderTopLeftRadius),
      firstLinkPaddingTop: parseFloat(getComputedStyle(firstLink).paddingTop),
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
    const buttons = section ? [...section.querySelectorAll('.ta_btn')].filter(button => getComputedStyle(button).display !== 'none') : [];
    const cards = section ? [...section.querySelectorAll('.ta_card')] : [];
    const cardsTrack = section?.querySelector('.ta_cards_swiper .swiper-wrapper');
    const firstImage = cards[0]?.querySelector('.ta_card_image img');
    const firstLabel = cards[0]?.querySelector('.ta_card_label');
    const firstOverlay = cards[0]?.querySelector('.ta_card_overlay');
    if (!section || !heading || !headingEn || !panel || !lead || buttons.length !== 1 || cards.length !== 4 || !cardsTrack || !firstImage || !firstLabel || !firstOverlay) return null;
    const sectionRect = section.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const cardRects = cards.map(card => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    return {
      sectionWidth: sectionRect.width,
      sectionHeight: sectionRect.height,
      headingSize: parseFloat(getComputedStyle(heading).fontSize),
      headingFamily: getComputedStyle(heading).fontFamily,
      headingEnSize: parseFloat(getComputedStyle(headingEn).fontSize),
      headingEnFamily: getComputedStyle(headingEn).fontFamily,
      panelWidth: panelRect.width,
      leadAlign: getComputedStyle(lead).textAlign,
      leadSize: parseFloat(getComputedStyle(lead).fontSize),
      leadFamily: getComputedStyle(lead).fontFamily,
      buttonHeights: buttons.map(button => button.getBoundingClientRect().height),
      buttonWidths: buttons.map(button => button.getBoundingClientRect().width),
      buttonSize: parseFloat(getComputedStyle(buttons[0]).fontSize),
      buttonFamily: getComputedStyle(buttons[0]).fontFamily,
      cardWidths: cardRects.map(rect => rect.width),
      cardGap01: cardRects[1].top - cardRects[0].bottom,
      cardGap12: cardRects[2].top - cardRects[1].bottom,
      cardGap23: cardRects[3].top - cardRects[2].bottom,
      firstImageWidth: imageRect.width,
      firstImageHeight: imageRect.height,
      labelSize: parseFloat(getComputedStyle(firstLabel).fontSize),
      labelFamily: getComputedStyle(firstLabel).fontFamily,
      labelWeight: getComputedStyle(firstLabel).fontWeight,
      overlaySize: parseFloat(getComputedStyle(firstOverlay).fontSize),
      overlayFamily: getComputedStyle(firstOverlay).fontFamily,
      cardsDirection: getComputedStyle(cardsTrack).flexDirection,
    };
  });
  assert(sp, 'SP TOP About elements missing');
  assert(close(sp.sectionWidth, 375), `SP width ${sp.sectionWidth}`);
  assert(close(sp.sectionHeight, 1800, 4), `SP section height ${sp.sectionHeight}`);
  assert(close(sp.headingSize, 28, 0.5), `SP heading ${sp.headingSize}`);
  assert(isMinchoFamily(sp.headingFamily), `SP heading JA must resolve to Zen Old Mincho, got ${sp.headingFamily}.`);
  assert(close(sp.headingEnSize, 22, 0.5), `SP heading EN ${sp.headingEnSize}`);
  assert(isMinchoFamily(sp.headingEnFamily), `SP heading EN must resolve to Zen Old Mincho, got ${sp.headingEnFamily}.`);
  assert(close(sp.panelWidth, 327), `SP panel ${sp.panelWidth}`);
  assert(sp.leadAlign === 'left' || sp.leadAlign === 'start', `SP lead align ${sp.leadAlign}`);
  assert(close(sp.leadSize, 16, 0.5), `SP lead ${sp.leadSize}`);
  assert(isKakuFamily(sp.leadFamily), `SP lead must resolve to Zen Kaku Gothic New, got ${sp.leadFamily}.`);
  assert(sp.buttonHeights.every(height => close(height, 50)), `SP CTA heights ${sp.buttonHeights.join(',')}`);
  assert(sp.buttonWidths.every(width => close(width, 300)), `SP CTA widths ${sp.buttonWidths.join(',')}`);
  assert(close(sp.buttonSize, 16, 0.5), `SP CTA size ${sp.buttonSize}`);
  assert(isKakuFamily(sp.buttonFamily), `SP CTA must resolve to Zen Kaku Gothic New, got ${sp.buttonFamily}.`);
  assert(close(sp.labelSize, 16, 0.5), `SP card label ${sp.labelSize}`);
  assert(isMinchoFamily(sp.labelFamily), `SP card label must resolve to Zen Old Mincho, got ${sp.labelFamily}.`);
  assert(sp.labelWeight === '600' || sp.labelWeight === 'bold', `SP card label weight ${sp.labelWeight}`);
  assert(close(sp.overlaySize, 16, 0.5), `SP card overlay size ${sp.overlaySize}`);
  assert(isKakuFamily(sp.overlayFamily), `SP card overlay must resolve to Zen Kaku Gothic New, got ${sp.overlayFamily}.`);
  assert(sp.cardsDirection === 'column', `SP cards direction ${sp.cardsDirection}`);
  assert(sp.cardWidths.every(width => close(width, 300)), `SP card widths ${sp.cardWidths.join(',')}`);
  assert(close(sp.cardGap01, 24) && close(sp.cardGap12, 24) && close(sp.cardGap23, 24), `SP card gaps ${sp.cardGap01},${sp.cardGap12},${sp.cardGap23}`);
  assert(close(sp.firstImageWidth, 300) && close(sp.firstImageHeight, 183), `SP image ${sp.firstImageWidth}x${sp.firstImageHeight}`);
  const spNews = await measureTopNews(mobilePage);
  assert(spNews, 'SP TOP News elements missing');
  assert(close(spNews.sectionPaddingTop, 64), `SP news section padding-top ${spNews.sectionPaddingTop}`);
  assert(close(spNews.sectionPaddingBottom, 0), `SP news section padding-bottom ${spNews.sectionPaddingBottom}`);
  assert(close(spNews.panelPaddingTop, 48), `SP news panel padding-top ${spNews.panelPaddingTop}`);
  assert(close(spNews.panelPaddingLeft, 24), `SP news panel padding-left ${spNews.panelPaddingLeft}`);
  assert(close(spNews.panelGap, 40), `SP news panel gap ${spNews.panelGap}`);
  assert(close(spNews.panelRadius, 10), `SP news panel radius ${spNews.panelRadius}`);
  assert(close(spNews.firstLinkPaddingTop, 0), `SP news first item padding-top ${spNews.firstLinkPaddingTop}`);
  assert(close(spNews.headingSize, 24, 0.5), `SP news heading ${spNews.headingSize}`);
  assert(isMinchoFamily(spNews.headingFamily), `SP news heading JA must resolve to Zen Old Mincho, got ${spNews.headingFamily}.`);
  assert(close(spNews.headingEnSize, 18, 0.5), `SP news heading EN ${spNews.headingEnSize}`);
  assert(isMinchoFamily(spNews.headingEnFamily), `SP news heading EN must resolve to Zen Old Mincho, got ${spNews.headingEnFamily}.`);
  assert(isKakuFamily(spNews.moreFamily), `SP news more must resolve to Zen Kaku Gothic New, got ${spNews.moreFamily}.`);
  assert(isKakuFamily(spNews.tabFamily), `SP news tab must resolve to Zen Kaku Gothic New, got ${spNews.tabFamily}.`);
  assert(close(spNews.dateSize, 14, 0.5), `SP news date ${spNews.dateSize}`);
  assert(isKakuFamily(spNews.dateFamily), `SP news date must resolve to Zen Kaku Gothic New, got ${spNews.dateFamily}.`);
  assert(close(spNews.titleSize, 16, 0.5), `SP news title ${spNews.titleSize}`);
  assert(isKakuFamily(spNews.titleFamily), `SP news title must resolve to Zen Kaku Gothic New, got ${spNews.titleFamily}.`);
  const spPartner = await measureTopPartner(mobilePage);
  assert(spPartner, 'SP TOP Partner elements missing');
  assert(close(spPartner.sectionWidth, 375), `SP partner section width ${spPartner.sectionWidth}`);
  assert(close(spPartner.sectionHeight, 774, 2), `SP partner section height ${spPartner.sectionHeight}`);
  assert(close(spPartner.layoutWidth, 335), `SP partner layout width ${spPartner.layoutWidth}`);
  assert(close(spPartner.listWidth, 335), `SP partner list width ${spPartner.listWidth}`);
  assert(close(spPartner.listHeight, 456), `SP partner list height ${spPartner.listHeight}`);
  assert(spPartner.itemWidths.every(width => close(width, 161.5)), `SP partner item widths ${spPartner.itemWidths.join(',')}`);
  assert(spPartner.itemHeights.every(height => close(height, 66)), `SP partner item heights ${spPartner.itemHeights.join(',')}`);
  assert(close(spPartner.listColumnGap, 12) && close(spPartner.listRowGap, 12), `SP partner gaps ${spPartner.listColumnGap},${spPartner.listRowGap}`);
  assert(close(spPartner.titleSize, 22, 0.5), `SP partner title ${spPartner.titleSize}`);
  assert(isMinchoFamily(spPartner.titleFamily), `SP partner title must resolve to Zen Old Mincho, got ${spPartner.titleFamily}.`);
  assert(close(spPartner.titleEnSize, 14, 0.5), `SP partner EN ${spPartner.titleEnSize}`);
  assert(isMinchoFamily(spPartner.titleEnFamily), `SP partner EN must resolve to Zen Old Mincho, got ${spPartner.titleEnFamily}.`);
  assert(isKakuFamily(spPartner.leadFamily), `SP partner lead must resolve to Zen Kaku Gothic New, got ${spPartner.leadFamily}.`);
  assert(close(spPartner.nameSize, 12, 0.5), `SP partner name ${spPartner.nameSize}`);
  assert(isKakuFamily(spPartner.nameFamily), `SP partner name must resolve to Zen Kaku Gothic New, got ${spPartner.nameFamily}.`);
  assert(isKakuFamily(spPartner.moreFamily), `SP partner more must resolve to Zen Kaku Gothic New, got ${spPartner.moreFamily}.`);
  const spInstagram = await measureTopInstagram(mobilePage);
  assert(spInstagram, 'SP TOP Instagram elements missing');
  assert(close(spInstagram.sectionWidth, 375), `SP instagram section width ${spInstagram.sectionWidth}`);
  assert(close(spInstagram.sectionHeight, 625.75, 2), `SP instagram section height ${spInstagram.sectionHeight}`);
  assert(close(spInstagram.sectionPaddingTop, 64), `SP instagram padding-top ${spInstagram.sectionPaddingTop}`);
  assert(close(spInstagram.sectionPaddingBottom, 0), `SP instagram padding-bottom ${spInstagram.sectionPaddingBottom}`);
  assert(close(spInstagram.innerWidth, 311), `SP instagram inner width ${spInstagram.innerWidth}`);
  assert(close(spInstagram.headHeight, 140, 2), `SP instagram head height ${spInstagram.headHeight}`);
  assert(close(spInstagram.thumbsWidth, 311), `SP instagram thumbnails width ${spInstagram.thumbsWidth}`);
  assert(close(spInstagram.thumbsHeight, 389.75, 2), `SP instagram thumbnails height ${spInstagram.thumbsHeight}`);
  assert(spInstagram.thumbWidths.every(width => close(width, 155.5, 1)), `SP instagram thumbnail widths ${spInstagram.thumbWidths.join(',')}`);
  assert(spInstagram.thumbHeights.every(height => close(height, 194.375, 1)), `SP instagram thumbnail heights ${spInstagram.thumbHeights.join(',')}`);
  assert(close(spInstagram.titleSize, 22, 0.5), `SP instagram title ${spInstagram.titleSize}`);
  assert(isMinchoFamily(spInstagram.titleFamily), `SP instagram title must resolve to Zen Old Mincho, got ${spInstagram.titleFamily}.`);
  assert(close(spInstagram.labelSize, 14, 0.5), `SP instagram label ${spInstagram.labelSize}`);
  assert(isMinchoFamily(spInstagram.labelFamily), `SP instagram label must resolve to Zen Old Mincho, got ${spInstagram.labelFamily}.`);
  assert(isKakuFamily(spInstagram.leadFamily), `SP instagram lead must resolve to Zen Kaku Gothic New, got ${spInstagram.leadFamily}.`);
  const spBanner = await measureTopBanner(mobilePage);
  assert(spBanner, 'SP TOP Banner elements missing');
  assert(close(spBanner.size, 15, 0.5), `SP banner size ${spBanner.size}`);
  assert(isKakuFamily(spBanner.family), `SP banner must resolve to Zen Kaku Gothic New, got ${spBanner.family}.`);
  await mobileContext.close();

  // The Theme reserves a 15px desktop scrollbar gutter. Request 1395px so the CSS layout viewport matches the 1380px Figma canvas.
  const desktopContext = await browser.newContext({ viewport: { width: 1395, height: 1500 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await desktopPage.evaluate(() => {
    const section = document.querySelector('#top_about-01');
    const heading = section?.querySelector('.ta_heading_ja');
    const headingEn = section?.querySelector('.ta_heading_en');
    const panel = section?.querySelector('.ta_panel');
    const lead = section?.querySelector('.ta_lead');
    const actions = section?.querySelector('.ta_actions');
    const buttons = section ? [...section.querySelectorAll('.ta_btn')].filter(button => getComputedStyle(button).display !== 'none') : [];
    const stageInner = section?.querySelector('.ta_stage .global_inner');
    const top = section?.querySelector('.ta_top');
    const cardsWrapInner = section?.querySelector('.ta_cards_wrap .global_inner');
    const cards = section ? [...section.querySelectorAll('.ta_card')] : [];
    const firstImage = cards[0]?.querySelector('.ta_card_image img');
    const firstLabel = cards[0]?.querySelector('.ta_card_label');
    if (!section || !heading || !headingEn || !panel || !lead || !actions || buttons.length !== 1 || !stageInner || !top || !cardsWrapInner || cards.length !== 4 || !firstImage || !firstLabel) return null;
    const sectionRect = section.getBoundingClientRect();
    const topRect = top.getBoundingClientRect();
    const headingRect = heading.getBoundingClientRect();
    const leadRect = lead.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const cardRects = cards.map(card => card.getBoundingClientRect());
    const imageRect = firstImage.getBoundingClientRect();
    return {
      sectionWidth: sectionRect.width,
      sectionHeight: sectionRect.height,
      contentLeft: topRect.left - sectionRect.left,
      contentWidth: topRect.width,
      writingMode: getComputedStyle(heading).writingMode,
      headingSize: parseFloat(getComputedStyle(heading).fontSize),
      headingFamily: getComputedStyle(heading).fontFamily,
      headingLineHeight: parseFloat(getComputedStyle(heading).lineHeight),
      headingEnSize: parseFloat(getComputedStyle(headingEn).fontSize),
      headingEnFamily: getComputedStyle(headingEn).fontFamily,
      headingEnClip: getComputedStyle(headingEn).clipPath,
      leadSize: parseFloat(getComputedStyle(lead).fontSize),
      leadFamily: getComputedStyle(lead).fontFamily,
      leadLeft: leadRect.left - sectionRect.left,
      leadTop: leadRect.top - sectionRect.top,
      leadWidth: leadRect.width,
      labelSize: parseFloat(getComputedStyle(firstLabel).fontSize),
      labelFamily: getComputedStyle(firstLabel).fontFamily,
      labelWeight: getComputedStyle(firstLabel).fontWeight,
      panelDisplay: getComputedStyle(panel).display,
      actionsWidth: actionsRect.width,
      actionsTop: actionsRect.top - sectionRect.top,
      buttonHeights: buttons.map(button => button.getBoundingClientRect().height),
      innerPaddingLeft: parseFloat(getComputedStyle(cardsWrapInner).paddingLeft),
      cardsDisplay: getComputedStyle(section.querySelector('.ta_cards')).display,
      cardTopSpread: Math.max(...cardRects.map(rect => rect.top)) - Math.min(...cardRects.map(rect => rect.top)),
      cardLefts: cardRects.map(rect => rect.left - sectionRect.left),
      cardWidths: cardRects.map(rect => rect.width),
      firstCardTop: cardRects[0].top - sectionRect.top,
      firstImageWidth: imageRect.width,
      firstImageHeight: imageRect.height,
    };
  });
  assert(pc, 'PC TOP About elements missing');
  assert(close(pc.sectionWidth, 1380), `PC section width ${pc.sectionWidth}`);
  assert(close(pc.sectionHeight, 1063), `PC section height ${pc.sectionHeight}`);
  assert(close(pc.contentLeft, 110), `PC content left ${pc.contentLeft}`);
  assert(close(pc.contentWidth, 1160), `PC content width ${pc.contentWidth}`);
  assert(pc.writingMode.includes('vertical'), `PC writing mode ${pc.writingMode}`);
  assert(close(pc.headingSize, 36, 0.5), `PC heading ${pc.headingSize}`);
  assert(isMinchoFamily(pc.headingFamily), `PC heading JA must resolve to Zen Old Mincho, got ${pc.headingFamily}.`);
  assert(close(pc.headingLineHeight, 39.6, 1), `PC heading line-height ${pc.headingLineHeight}`);
  assert(close(pc.headingEnSize, 30, 0.5), `PC heading EN ${pc.headingEnSize}`);
  assert(isMinchoFamily(pc.headingEnFamily), `PC heading EN must resolve to Zen Old Mincho, got ${pc.headingEnFamily}.`);
  assert(pc.headingEnClip === 'none' || pc.headingEnClip === '', `PC heading EN must not be clipped into the octagon, got ${pc.headingEnClip}.`);
  assert(close(pc.leadSize, 16, 0.5), `PC lead ${pc.leadSize}`);
  assert(isKakuFamily(pc.leadFamily), `PC lead must resolve to Zen Kaku Gothic New, got ${pc.leadFamily}.`);
  assert(close(pc.leadLeft, 430), `PC lead left ${pc.leadLeft}`);
  assert(close(pc.leadTop, 100), `PC lead top ${pc.leadTop}`);
  assert(close(pc.leadWidth, 840), `PC lead width ${pc.leadWidth}`);
  assert(close(pc.labelSize, 18, 0.5), `PC card label ${pc.labelSize}`);
  assert(isMinchoFamily(pc.labelFamily), `PC card label must resolve to Zen Old Mincho, got ${pc.labelFamily}.`);
  assert(pc.labelWeight === '600' || pc.labelWeight === 'bold', `PC card label weight ${pc.labelWeight}`);
  assert(pc.panelDisplay === 'contents', `PC panel display ${pc.panelDisplay}`);
  assert(close(pc.actionsWidth, 240), `PC actions width ${pc.actionsWidth}`);
  assert(close(pc.actionsTop, 465), `PC actions top ${pc.actionsTop}`);
  assert(pc.buttonHeights.every(height => close(height, 50)), `PC CTA heights ${pc.buttonHeights.join(',')}`);
  assert(close(pc.innerPaddingLeft, 380), `PC card rail inset ${pc.innerPaddingLeft}`);
  assert(pc.cardsDisplay === 'grid', `PC cards display ${pc.cardsDisplay}`);
  assert(pc.cardTopSpread <= 2, `PC row spread ${pc.cardTopSpread}`);
  assert(pc.cardWidths.every(width => close(width, 195)), `PC card widths ${pc.cardWidths.join(',')}`);
  assert(pc.cardLefts.every((left, index) => close(left, 430 + (215 * index))), `PC card lefts ${pc.cardLefts.join(',')}`);
  assert(close(pc.firstCardTop, 235), `PC first card top ${pc.firstCardTop}`);
  assert(close(pc.firstImageWidth, 195) && close(pc.firstImageHeight, 360), `PC image ${pc.firstImageWidth}x${pc.firstImageHeight}`);
  const pcNews = await measureTopNews(desktopPage);
  assert(pcNews, 'PC TOP News elements missing');
  assert(close(pcNews.sectionPaddingTop, 100), `PC news section padding-top ${pcNews.sectionPaddingTop}`);
  assert(close(pcNews.sectionPaddingBottom, 0), `PC news section padding-bottom ${pcNews.sectionPaddingBottom}`);
  assert(close(pcNews.panelPaddingTop, 80), `PC news panel padding-top ${pcNews.panelPaddingTop}`);
  assert(close(pcNews.panelPaddingLeft, 80), `PC news panel padding-left ${pcNews.panelPaddingLeft}`);
  assert(close(pcNews.panelGap, 80), `PC news panel gap ${pcNews.panelGap}`);
  assert(close(pcNews.panelRadius, 10), `PC news panel radius ${pcNews.panelRadius}`);
  assert(close(pcNews.firstLinkPaddingTop, 0), `PC news first item padding-top ${pcNews.firstLinkPaddingTop}`);
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
  assert(close(pcPartner.sectionWidth, 1380), `PC partner section width ${pcPartner.sectionWidth}`);
  assert(close(pcPartner.sectionHeight, 421, 2), `PC partner section height ${pcPartner.sectionHeight}`);
  assert(close(pcPartner.layoutWidth, 1160), `PC partner layout width ${pcPartner.layoutWidth}`);
  assert(close(pcPartner.listWidth, 860), `PC partner list width ${pcPartner.listWidth}`);
  assert(close(pcPartner.listHeight, 220), `PC partner list height ${pcPartner.listHeight}`);
  assert(pcPartner.itemWidths.every(width => close(width, 200)), `PC partner item widths ${pcPartner.itemWidths.join(',')}`);
  assert(pcPartner.itemHeights.every(height => close(height, 60)), `PC partner item heights ${pcPartner.itemHeights.join(',')}`);
  assert(close(pcPartner.listColumnGap, 20) && close(pcPartner.listRowGap, 20), `PC partner gaps ${pcPartner.listColumnGap},${pcPartner.listRowGap}`);
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
  assert(close(pcInstagram.sectionWidth, 1380), `PC instagram section width ${pcInstagram.sectionWidth}`);
  assert(close(pcInstagram.sectionHeight, 571, 2), `PC instagram section height ${pcInstagram.sectionHeight}`);
  assert(close(pcInstagram.sectionPaddingTop, 100), `PC instagram padding-top ${pcInstagram.sectionPaddingTop}`);
  assert(close(pcInstagram.sectionPaddingBottom, 80), `PC instagram padding-bottom ${pcInstagram.sectionPaddingBottom}`);
  assert(close(pcInstagram.innerWidth, 1160), `PC instagram inner width ${pcInstagram.innerWidth}`);
  assert(close(pcInstagram.headHeight, 62, 2), `PC instagram head height ${pcInstagram.headHeight}`);
  assert(close(pcInstagram.thumbsWidth, 1159, 2), `PC instagram thumbnails width ${pcInstagram.thumbsWidth}`);
  assert(close(pcInstagram.thumbsHeight, 289, 2), `PC instagram thumbnails height ${pcInstagram.thumbsHeight}`);
  assert(pcInstagram.thumbWidths.every(width => close(width, 231)), `PC instagram thumbnail widths ${pcInstagram.thumbWidths.join(',')}`);
  assert(pcInstagram.thumbHeights.every(height => close(height, 289)), `PC instagram thumbnail heights ${pcInstagram.thumbHeights.join(',')}`);
  assert(close(pcInstagram.titleSize, 24, 0.5), `PC instagram title ${pcInstagram.titleSize}`);
  assert(isMinchoFamily(pcInstagram.titleFamily), `PC instagram title must resolve to Zen Old Mincho, got ${pcInstagram.titleFamily}.`);
  assert(close(pcInstagram.labelSize, 16, 0.5), `PC instagram label ${pcInstagram.labelSize}`);
  assert(isMinchoFamily(pcInstagram.labelFamily), `PC instagram label must resolve to Zen Old Mincho, got ${pcInstagram.labelFamily}.`);
  assert(isKakuFamily(pcInstagram.leadFamily), `PC instagram lead must resolve to Zen Kaku Gothic New, got ${pcInstagram.leadFamily}.`);
  const pcBanner = await measureTopBanner(desktopPage);
  assert(pcBanner, 'PC TOP Banner elements missing');
  assert(close(pcBanner.size, 16, 0.5), `PC banner size ${pcBanner.size}`);
  assert(isKakuFamily(pcBanner.family), `PC banner must resolve to Zen Kaku Gothic New, got ${pcBanner.family}.`);
  await desktopContext.close();
  console.log('PASS Budokan TOP About current SP 327px content + 300x225 stacked cards and type family QA.');
  console.log('PASS Budokan TOP About PC current-Figma section, rail, CTA, and type geometry QA.');
  console.log('PASS Budokan TOP News SP/PC type family QA hosted on the About front-page runtime.');
  console.log('PASS Budokan TOP Partner SP/PC type family QA hosted on the About front-page runtime.');
  console.log('PASS Budokan TOP Instagram SP/PC type family QA hosted on the About front-page runtime.');
  console.log('PASS Budokan TOP Banner SP/PC type family QA hosted on the About front-page runtime.');
} finally {
  await browser.close();
}
