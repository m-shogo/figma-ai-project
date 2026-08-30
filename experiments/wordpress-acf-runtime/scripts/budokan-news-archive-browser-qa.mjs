import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-news-archive-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

const browser = await chromium.launch({ headless: true });

try {
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 1200 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });

  const sp = await mobilePage.evaluate(() => {
    const archive = document.querySelector('.news_archive');
    const list = document.querySelector('.news_tabs_archive .news_tabs_list');
    const tabs = [...document.querySelectorAll('.news_tabs_archive .news_tabs_item')];
    const links = [...document.querySelectorAll('.news_tabs_archive .news_tabs_link')];
    if (!archive || !list || tabs.length !== 6 || links.length !== 6) return null;

    const archiveRect = archive.getBoundingClientRect();
    const rects = tabs.map((tab) => tab.getBoundingClientRect());
    const styles = links.map((link) => getComputedStyle(link));
    return {
      archiveWidth: archiveRect.width,
      widths: rects.map((rect) => rect.width),
      heights: rects.map((rect) => rect.height),
      firstRowGap: rects[1].left - rects[0].right,
      secondRowGap: rects[4].left - rects[3].right,
      radius: styles[0].borderTopLeftRadius,
    };
  });

  assert(sp, 'SP News archive tabs were not found.');
  assert(close(sp.archiveWidth, 335), `SP archive rail expected 335px, got ${sp.archiveWidth}.`);
  assert(sp.widths.every((width) => close(width, 90)), `SP tabs expected 90px widths, got ${sp.widths.join(',')}.`);
  assert(sp.heights.every((height) => close(height, 32)), `SP tabs expected 32px heights, got ${sp.heights.join(',')}.`);
  assert(close(sp.firstRowGap, 20) && close(sp.secondRowGap, 20), `SP tabs must retain 20px gaps, got ${sp.firstRowGap}/${sp.secondRowGap}.`);
  assert(sp.radius === '16px', `SP pill radius expected 16px, got ${sp.radius}.`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 1200 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });

  const pc = await desktopPage.evaluate(() => {
    const archive = document.querySelector('.news_archive');
    const list = document.querySelector('.news_tabs_archive .news_tabs_list');
    const tabs = [...document.querySelectorAll('.news_tabs_archive .news_tabs_item')];
    const links = [...document.querySelectorAll('.news_tabs_archive .news_tabs_link')];
    if (!archive || !list || tabs.length !== 6 || links.length !== 6) return null;

    const archiveRect = archive.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const rects = tabs.map((tab) => tab.getBoundingClientRect());
    const styles = links.map((link) => getComputedStyle(link));
    return {
      archiveWidth: archiveRect.width,
      listWidth: listRect.width,
      widths: rects.map((rect) => rect.width),
      heights: rects.map((rect) => rect.height),
      starts: rects.map((rect) => rect.left - listRect.left),
      gaps: rects.slice(1).map((rect, index) => rect.left - rects[index].right),
      firstRadiusLeft: styles[0].borderTopLeftRadius,
      firstRadiusRight: styles[0].borderTopRightRadius,
      interiorLeftBorder: styles[1].borderLeftWidth,
      lastRadiusRight: styles[5].borderTopRightRadius,
    };
  });

  assert(pc, 'PC News archive tabs were not found.');
  assert(close(pc.archiveWidth, 960), `PC archive rail expected 960px, got ${pc.archiveWidth}.`);
  assert(close(pc.listWidth, 960), `PC tab rail expected 960px, got ${pc.listWidth}.`);
  assert(pc.widths.every((width) => close(width, 160)), `PC tabs expected 160px widths, got ${pc.widths.join(',')}.`);
  assert(pc.heights.every((height) => close(height, 48)), `PC tabs expected 48px heights, got ${pc.heights.join(',')}.`);
  assert(pc.gaps.every((gap) => Math.abs(gap) <= 1), `PC tabs must be contiguous; gaps=${pc.gaps.join(',')}.`);
  assert(pc.starts.every((start, index) => close(start, index * 160)), `PC tab starts expected 160px increments, got ${pc.starts.join(',')}.`);
  assert(pc.firstRadiusLeft === '3px' && pc.firstRadiusRight === '0px', `PC first tab should own only left outer radius; got ${pc.firstRadiusLeft}/${pc.firstRadiusRight}.`);
  assert(pc.interiorLeftBorder === '0px', `PC interior tab left border expected 0px, got ${pc.interiorLeftBorder}.`);
  assert(pc.lastRadiusRight === '3px', `PC final tab right radius expected 3px, got ${pc.lastRadiusRight}.`);
  await desktopContext.close();

  console.log('PASS Budokan News archive SP tab geometry QA.');
  console.log('PASS Budokan News archive PC contiguous 6×160 tab geometry QA.');
} finally {
  await browser.close();
}
