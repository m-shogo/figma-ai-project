import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) process.exit(2);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;

async function requireCalendar(page, label) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => ({
    hasCalendarNode: Boolean(document.querySelector('#top_calendar')),
    hasFcNode: Boolean(document.querySelector('#top_calendar .fc')),
    fullCalendarType: typeof window.FullCalendar,
    jqueryType: typeof window.jQuery,
    localizedConfig: typeof window.nipponbudokanTopCal,
    scripts: [...document.scripts].map(s => s.src).filter(Boolean).filter(src => /fullcalendar|home\.js|jquery/.test(src)),
  }));
  if (!state.hasFcNode) {
    throw new Error(`${label} FullCalendar did not render: ${JSON.stringify({ ...state, pageErrors: errors })}`);
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 2600 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobileContext.newPage();
  await requireCalendar(mobilePage, 'SP');
  const sp = await mobilePage.evaluate(() => {
    const section = document.querySelector('#top_events-01');
    const heading = section?.querySelector('.te_heading_ja');
    const banner = section?.querySelector('.te_featured_banner');
    const cards = section ? [...section.querySelectorAll('.te_card')] : [];
    const firstImage = cards[0]?.querySelector('.te_card_image img');
    const views = section ? [...section.querySelectorAll('.te_cal_view')] : [];
    const snsLinks = section ? [...section.querySelectorAll('.te_sns a')] : [];
    if (!section || !heading || !banner || cards.length !== 4 || !firstImage || views.length !== 2 || snsLinks.length !== 3) return null;
    return {
      sectionWidth: section.getBoundingClientRect().width,
      headingSize: parseFloat(getComputedStyle(heading).fontSize),
      bannerWidth: banner.getBoundingClientRect().width,
      bannerHeight: banner.getBoundingClientRect().height,
      bannerWritingMode: getComputedStyle(banner).writingMode,
      firstImageWidth: firstImage.getBoundingClientRect().width,
      firstImageHeight: firstImage.getBoundingClientRect().height,
      viewHeights: views.map(el => el.getBoundingClientRect().height),
      snsWidths: snsLinks.map(el => el.getBoundingClientRect().width),
      snsHeights: snsLinks.map(el => el.getBoundingClientRect().height),
      snsFlow: getComputedStyle(section.querySelector('.te_sns ul')).flexDirection,
    };
  });
  assert(sp, 'SP TOP Events elements missing');
  assert(close(sp.sectionWidth, 375), `SP section width ${sp.sectionWidth}`);
  assert(close(sp.headingSize, 28, 0.5), `SP heading size ${sp.headingSize}`);
  assert(sp.bannerWidth >= 325 && sp.bannerWidth <= 335, `SP banner width ${sp.bannerWidth}`);
  assert(close(sp.bannerHeight, 50, 1), `SP banner height ${sp.bannerHeight}`);
  assert(sp.bannerWritingMode.includes('horizontal'), `SP banner writing-mode ${sp.bannerWritingMode}`);
  assert(close(sp.firstImageWidth, 104) && close(sp.firstImageHeight, 78), `SP event image ${sp.firstImageWidth}x${sp.firstImageHeight}`);
  assert(sp.viewHeights.every(h => close(h, 50, 1)), `SP tabs ${sp.viewHeights.join(',')}`);
  assert(sp.snsFlow === 'column', `SP SNS flow ${sp.snsFlow}`);
  assert(sp.snsWidths.every(w => close(w, 280, 1)), `SP SNS widths ${sp.snsWidths.join(',')}`);
  assert(sp.snsHeights.every(h => close(h, 60, 1)), `SP SNS heights ${sp.snsHeights.join(',')}`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 1800 } });
  const desktopPage = await desktopContext.newPage();
  await requireCalendar(desktopPage, 'PC');
  const pc = await desktopPage.evaluate(() => {
    const section = document.querySelector('#top_events-01');
    const heading = section?.querySelector('.te_heading_ja');
    const layout = section?.querySelector('.te_layout');
    const banner = section?.querySelector('.te_featured_banner');
    const cards = section ? [...section.querySelectorAll('.te_card')] : [];
    const firstImage = cards[0]?.querySelector('.te_card_image img');
    const cal = section?.querySelector('.te_calendar_wrap');
    const snsLinks = section ? [...section.querySelectorAll('.te_sns a')] : [];
    const sns = section?.querySelector('.te_sns');
    if (!section || !heading || !layout || !banner || cards.length !== 4 || !firstImage || !cal || snsLinks.length !== 3 || !sns) return null;
    const layoutStyle = getComputedStyle(layout);
    const bannerRect = banner.getBoundingClientRect();
    const imageRect = firstImage.getBoundingClientRect();
    const calRect = cal.getBoundingClientRect();
    const snsRect = sns.getBoundingClientRect();
    const linkRects = snsLinks.map(el => el.getBoundingClientRect());
    return {
      headingSize: parseFloat(getComputedStyle(heading).fontSize),
      layoutDisplay: layoutStyle.display,
      layoutGap: parseFloat(layoutStyle.columnGap),
      bannerWritingMode: getComputedStyle(banner).writingMode,
      bannerWidth: bannerRect.width,
      imageWidth: imageRect.width,
      imageHeight: imageRect.height,
      calendarWidth: calRect.width,
      snsWidth: snsRect.width,
      snsFlow: getComputedStyle(section.querySelector('.te_sns ul')).flexDirection,
      snsWidths: linkRects.map(r => r.width),
      snsHeights: linkRects.map(r => r.height),
    };
  });
  assert(pc, 'PC TOP Events elements missing');
  assert(close(pc.headingSize, 32, 0.5), `PC heading size ${pc.headingSize}`);
  assert(pc.layoutDisplay === 'grid', `PC layout display ${pc.layoutDisplay}`);
  assert(close(pc.layoutGap, 80, 1), `PC layout gap ${pc.layoutGap}`);
  assert(pc.bannerWritingMode.includes('vertical'), `PC banner writing-mode ${pc.bannerWritingMode}`);
  assert(close(pc.bannerWidth, 48, 1), `PC banner width ${pc.bannerWidth}`);
  assert(close(pc.imageWidth, 200) && close(pc.imageHeight, 150), `PC event image ${pc.imageWidth}x${pc.imageHeight}`);
  assert(close(pc.calendarWidth, 420, 1), `PC calendar rail ${pc.calendarWidth}`);
  assert(pc.snsWidth >= 1370, `PC SNS full-width breakout ${pc.snsWidth}`);
  assert(pc.snsFlow === 'row', `PC SNS flow ${pc.snsFlow}`);
  assert(pc.snsWidths.every(w => close(w, 280, 1)), `PC SNS widths ${pc.snsWidths.join(',')}`);
  assert(pc.snsHeights.every(h => close(h, 80, 1)), `PC SNS heights ${pc.snsHeights.join(',')}`);
  await desktopContext.close();

  console.log('PASS Budokan TOP Events SP geometry and FullCalendar runtime QA.');
  console.log('PASS Budokan TOP Events PC two-rail geometry and SNS derivative QA.');
} finally {
  await browser.close();
}
