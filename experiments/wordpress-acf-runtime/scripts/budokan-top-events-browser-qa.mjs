import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) process.exit(2);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;
const rgb = (value) => String(value || '').replace(/\\s+/g, '');

async function open(page, target) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  assert(errors.length === 0, `page errors: ${errors.join(' | ')}`);
}

async function readSection(page) {
  return page.evaluate(() => {
    const section = document.querySelector('#top_events-01');
    if (!section) return null;

    const q = (selector) => section.querySelector(selector);
    const qa = (selector) => [...section.querySelectorAll(selector)];
    const rect = (el) => el?.getBoundingClientRect();
    const css = (el) => el ? getComputedStyle(el) : null;
    const number = (value) => Number.parseFloat(value || '0');

    const heading = q('.te_heading_ja');
    const headingEn = q('.te_heading_en');
    const layout = q('.te_layout');
    const featured = q('.te_featured');
    const featuredHead = q('.te_featured_head');
    const featuredIcon = q('.te_featured_icon');
    const featuredTitle = q('.te_featured_head .te_section_title');
    const cards = qa('.te_card');
    const firstImage = cards[0]?.querySelector('.te_card_image img');
    const firstLabel = cards[0]?.querySelector('.te_label');
    const firstTitle = cards[0]?.querySelector('.te_card_title');
    const firstDate = cards[0]?.querySelector('.te_card_date');
    const upcoming = q('.te_upcoming');
    const upcomingHead = q('.te_upcoming_head');
    const upcomingIcon = q('.te_upcoming_icon');
    const upcomingTitle = q('.te_upcoming_head .te_section_title');
    const filter = q('.te_filter');
    const select = q('.te_filter select');
    const rows = qa('.te_upcoming_item');
    const firstRow = rows[0];
    const firstDay = firstRow?.querySelector('.te_upcoming_day');
    const firstWhen = firstRow?.querySelector('.te_upcoming_when');
    const firstUpcomingTitle = firstRow?.querySelector('.te_upcoming_title');
    const firstHost = firstRow?.querySelector('.te_upcoming_host');
    const urls = qa('.te_upcoming_url');
    const more = q('.te_more');
    const moreIcon = q('.te_more_icon');

    if (!heading || !headingEn || !layout || !featured || !featuredHead || !featuredIcon ||
        !featuredTitle || cards.length !== 4 || !firstImage || !firstLabel || !firstTitle || !firstDate ||
        !upcoming || !upcomingHead || !upcomingIcon || !upcomingTitle || !filter || !select ||
        rows.length !== 5 || !firstRow || !firstDay || !firstWhen || !firstUpcomingTitle || !firstHost ||
        !more || !moreIcon) return null;

    const sectionRect = rect(section);
    const layoutRect = rect(layout);
    const featuredRect = rect(featured);
    const featuredHeadRect = rect(featuredHead);
    const featuredIconStyle = css(featuredIcon);
    const imageRect = rect(firstImage);
    const cardRects = cards.map(card => rect(card));
    const labelRect = rect(firstLabel);
    const upcomingRect = rect(upcoming);
    const upcomingHeadRect = rect(upcomingHead);
    const upcomingIconStyle = css(upcomingIcon);
    const filterRect = rect(filter);
    const selectRect = rect(select);
    const firstRowRect = rect(firstRow);
    const firstRowStyle = css(firstRow);
    const secondRowStyle = css(rows[1]);
    const firstWhenStyle = css(firstWhen);
    const moreRect = rect(more);
    const moreIconRect = rect(moreIcon);

    return {
      legacyCalendar: Boolean(q('#top_calendar') || q('.te_cal_view') || q('.te_calendar')),
      legacySns: Boolean(q('.te_sns')),
      section: { width: sectionRect.width },
      heading: {
        size: number(css(heading).fontSize),
        family: css(heading).fontFamily,
        enSize: number(css(headingEn).fontSize),
        enFamily: css(headingEn).fontFamily,
      },
      layout: {
        display: css(layout).display,
        direction: css(layout).flexDirection,
        rowGap: number(css(layout).rowGap),
        columnGap: number(css(layout).columnGap),
        width: layoutRect.width,
      },
      featured: {
        width: featuredRect.width,
        headWidth: featuredHeadRect.width,
        headHeight: featuredHeadRect.height,
        sectionTitleSize: number(css(featuredTitle).fontSize),
        iconWidth: rect(featuredIcon).width,
        iconHeight: rect(featuredIcon).height,
        iconBackground: featuredIconStyle.backgroundImage,
        cardColumnGap: cardRects[1].left - cardRects[0].right,
        cardRowGap: cardRects[2].top - cardRects[0].bottom,
        imageWidth: imageRect.width,
        imageHeight: imageRect.height,
        labelHeight: labelRect.height,
        cardTitleSize: number(css(firstTitle).fontSize),
        dateSize: number(css(firstDate).fontSize),
      },
      upcoming: {
        width: upcomingRect.width,
        headWidth: upcomingHeadRect.width,
        headHeight: upcomingHeadRect.height,
        titleSize: number(css(upcomingTitle).fontSize),
        iconWidth: rect(upcomingIcon).width,
        iconHeight: rect(upcomingIcon).height,
        iconBackground: upcomingIconStyle.backgroundImage,
        filterWidth: filterRect.width,
        filterHeight: filterRect.height,
        selectWidth: selectRect.width,
        selectHeight: selectRect.height,
        rowWidth: firstRowRect.width,
        rowHeight: firstRowRect.height,
        rowDirection: firstRowStyle.flexDirection,
        rowBg: firstRowStyle.backgroundColor,
        secondRowBg: secondRowStyle.backgroundColor,
        whenBorderRight: firstWhenStyle.borderRightWidth,
        whenBorderBottom: firstWhenStyle.borderBottomWidth,
        daySize: number(css(firstDay).fontSize),
        titleSizeRow: number(css(firstUpcomingTitle).fontSize),
        hostSize: number(css(firstHost).fontSize),
        rawUrlCount: urls.length,
      },
      more: {
        justify: css(more).justifyContent,
        width: moreRect.width,
        iconWidth: moreIconRect.width,
        iconHeight: moreIconRect.height,
      },
    };
  });
}

const browser = await chromium.launch({ headless: true });
try {
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 2600 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobileContext.newPage();
  await open(mobilePage, url);
  const sp = await readSection(mobilePage);
  assert(sp, 'SP TOP Events elements missing');
  assert(!sp.legacyCalendar, 'SP legacy calendar DOM must be absent');
  assert(!sp.legacySns, 'SP legacy Events SNS DOM must be absent');
  assert(close(sp.section.width, 375, 1), `SP section width ${sp.section.width}`);
  assert(close(sp.heading.size, 28, 0.5), `SP heading ${sp.heading.size}`);
  assert(close(sp.heading.enSize, 22, 0.5), `SP Event label ${sp.heading.enSize}`);
  assert(sp.layout.display === 'flex' && sp.layout.direction === 'column', `SP layout ${sp.layout.display}/${sp.layout.direction}`);
  assert(close(sp.layout.rowGap, 48, 1), `SP layout gap ${sp.layout.rowGap}`);
  assert(close(sp.featured.headHeight, 53, 1), `SP featured head height ${sp.featured.headHeight}`);
  assert(close(sp.featured.sectionTitleSize, 24, 0.5), `SP featured title ${sp.featured.sectionTitleSize}`);
  assert(close(sp.featured.iconWidth, 32, 1) && close(sp.featured.iconHeight, 24, 1), `SP facility icon ${sp.featured.iconWidth}x${sp.featured.iconHeight}`);
  assert(sp.featured.iconBackground.includes('ico-facilities-red.svg'), `SP facility icon source ${sp.featured.iconBackground}`);
  assert(close(sp.featured.cardColumnGap, 17, 2), `SP card column gap ${sp.featured.cardColumnGap}`);
  assert(close(sp.featured.cardRowGap, 32, 2), `SP card row gap ${sp.featured.cardRowGap}`);
  assert(sp.featured.imageWidth >= 153 && sp.featured.imageWidth <= 157, `SP card image width ${sp.featured.imageWidth}`);
  assert(close(sp.featured.imageHeight, sp.featured.imageWidth * 0.75, 2), `SP card image ${sp.featured.imageWidth}x${sp.featured.imageHeight}`);
  assert(close(sp.featured.labelHeight, 20, 1), `SP chip height ${sp.featured.labelHeight}`);
  assert(close(sp.featured.cardTitleSize, 15, 0.5), `SP card title ${sp.featured.cardTitleSize}`);
  assert(close(sp.featured.dateSize, 13, 0.5), `SP card date ${sp.featured.dateSize}`);
  assert(close(sp.upcoming.headHeight, 53, 1), `SP upcoming head height ${sp.upcoming.headHeight}`);
  assert(close(sp.upcoming.iconWidth, 24, 1) && close(sp.upcoming.iconHeight, 24, 1), `SP calendar icon ${sp.upcoming.iconWidth}x${sp.upcoming.iconHeight}`);
  assert(sp.upcoming.iconBackground.includes('ico-calendar-red.svg'), `SP calendar icon source ${sp.upcoming.iconBackground}`);
  assert(close(sp.upcoming.filterWidth, 240, 1) && close(sp.upcoming.filterHeight, 36, 1), `SP filter ${sp.upcoming.filterWidth}x${sp.upcoming.filterHeight}`);
  assert(close(sp.upcoming.rowWidth, 327, 2), `SP upcoming row width ${sp.upcoming.rowWidth}`);
  assert(sp.upcoming.rowDirection === 'column', `SP upcoming row direction ${sp.upcoming.rowDirection}`);
  assert(rgb(sp.upcoming.rowBg) === 'rgb(242,242,242)', `SP first upcoming row bg ${sp.upcoming.rowBg}`);
  assert(rgb(sp.upcoming.secondRowBg) !== 'rgb(242,242,242)', `SP second upcoming row bg ${sp.upcoming.secondRowBg}`);
  assert(close(sp.upcoming.daySize, 20, 0.5), `SP upcoming day ${sp.upcoming.daySize}`);
  assert(sp.upcoming.rawUrlCount === 1, `SP expected one externally-owned raw URL, got ${sp.upcoming.rawUrlCount}`);
  assert(close(sp.more.iconWidth, 40, 1) && close(sp.more.iconHeight, 40, 1), `SP more icon ${sp.more.iconWidth}x${sp.more.iconHeight}`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 1800 } });
  const desktopPage = await desktopContext.newPage();
  await open(desktopPage, url);
  const pc = await readSection(desktopPage);
  assert(pc, 'PC TOP Events elements missing');
  assert(!pc.legacyCalendar, 'PC legacy calendar DOM must be absent');
  assert(!pc.legacySns, 'PC legacy Events SNS DOM must be absent');
  assert(close(pc.heading.size, 32, 0.5), `PC heading ${pc.heading.size}`);
  assert(close(pc.heading.enSize, 22, 0.5), `PC Event label ${pc.heading.enSize}`);
  assert(pc.layout.display === 'grid', `PC layout display ${pc.layout.display}`);
  assert(close(pc.layout.columnGap, 80, 1), `PC layout gap ${pc.layout.columnGap}`);
  assert(close(pc.featured.width, 480, 2), `PC featured width ${pc.featured.width}`);
  assert(close(pc.upcoming.width, 600, 2), `PC upcoming width ${pc.upcoming.width}`);
  assert(close(pc.featured.headWidth, 480, 2) && close(pc.featured.headHeight, 53, 1), `PC featured head ${pc.featured.headWidth}x${pc.featured.headHeight}`);
  assert(close(pc.featured.sectionTitleSize, 24, 0.5), `PC featured title ${pc.featured.sectionTitleSize}`);
  assert(close(pc.featured.iconWidth, 32, 1) && close(pc.featured.iconHeight, 24, 1), `PC facility icon ${pc.featured.iconWidth}x${pc.featured.iconHeight}`);
  assert(pc.featured.iconBackground.includes('ico-facilities-red.svg'), `PC facility icon source ${pc.featured.iconBackground}`);
  assert(close(pc.featured.cardColumnGap, 40, 1), `PC card column gap ${pc.featured.cardColumnGap}`);
  assert(close(pc.featured.cardRowGap, 56, 2), `PC card row gap ${pc.featured.cardRowGap}`);
  assert(close(pc.featured.imageWidth, 220, 1) && close(pc.featured.imageHeight, 165, 1), `PC card image ${pc.featured.imageWidth}x${pc.featured.imageHeight}`);
  assert(close(pc.featured.cardTitleSize, 16, 0.5), `PC card title ${pc.featured.cardTitleSize}`);
  assert(close(pc.featured.dateSize, 14, 0.5), `PC card date ${pc.featured.dateSize}`);
  assert(close(pc.upcoming.headWidth, 600, 2) && close(pc.upcoming.headHeight, 53, 1), `PC upcoming head ${pc.upcoming.headWidth}x${pc.upcoming.headHeight}`);
  assert(close(pc.upcoming.iconWidth, 24, 1) && close(pc.upcoming.iconHeight, 24, 1), `PC calendar icon ${pc.upcoming.iconWidth}x${pc.upcoming.iconHeight}`);
  assert(pc.upcoming.iconBackground.includes('ico-calendar-red.svg'), `PC calendar icon source ${pc.upcoming.iconBackground}`);
  assert(close(pc.upcoming.filterWidth, 180, 1) && close(pc.upcoming.filterHeight, 36, 1), `PC filter ${pc.upcoming.filterWidth}x${pc.upcoming.filterHeight}`);
  assert(close(pc.upcoming.rowWidth, 600, 2), `PC upcoming row width ${pc.upcoming.rowWidth}`);
  assert(pc.upcoming.rowDirection === 'row', `PC upcoming row direction ${pc.upcoming.rowDirection}`);
  assert(pc.upcoming.rowHeight >= 123 && pc.upcoming.rowHeight <= 132, `PC upcoming row height ${pc.upcoming.rowHeight}`);
  assert(rgb(pc.upcoming.rowBg) === 'rgb(242,242,242)', `PC first upcoming row bg ${pc.upcoming.rowBg}`);
  assert(close(pc.upcoming.daySize, 24, 0.5), `PC upcoming day ${pc.upcoming.daySize}`);
  assert(pc.upcoming.whenBorderRight !== '0px' && pc.upcoming.whenBorderBottom === '0px', `PC date separator right=${pc.upcoming.whenBorderRight} bottom=${pc.upcoming.whenBorderBottom}`);
  assert(pc.upcoming.rawUrlCount === 1, `PC expected one externally-owned raw URL, got ${pc.upcoming.rawUrlCount}`);
  assert(pc.more.justify === 'flex-end', `PC more alignment ${pc.more.justify}`);
  assert(close(pc.more.iconWidth, 40, 1) && close(pc.more.iconHeight, 40, 1), `PC more icon ${pc.more.iconWidth}x${pc.more.iconHeight}`);

  await desktopContext.close();
  console.log('PASS Budokan TOP Events current-Figma SP/PC geometry and data-owner QA.');
  console.log('PASS legacy FullCalendar/SNS section DOM is absent and exact Figma heading SVG assets are used.');
} finally {
  await browser.close();
}
