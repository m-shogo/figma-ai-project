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
    const firstArticle = document.querySelector('.news_item');
    const firstArticleLink = firstArticle?.querySelector('.news_item_link');
    const firstMeta = firstArticle?.querySelector('.news_item_meta');
    const firstTitle = firstArticle?.querySelector('.news_item_title');
    const pager = document.querySelector('.news_archive .news_pager');
    const pageNumber = document.querySelector('.news_pager_numbers .page-numbers:not(.prev):not(.next):not(.dots)');
    const prevSlot = document.querySelector('.news_pager_prev');
    const nextSlot = document.querySelector('.news_pager_next');
    if (!archive || !list || tabs.length !== 6 || links.length !== 6 || !firstArticle || !firstArticleLink || !firstMeta || !firstTitle || !pager || !pageNumber || !prevSlot || !nextSlot) return null;

    const archiveRect = archive.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const rects = tabs.map((tab) => tab.getBoundingClientRect());
    const linkStyles = links.map((link) => getComputedStyle(link));
    const articleRect = firstArticle.getBoundingClientRect();
    const articleLinkStyle = getComputedStyle(firstArticleLink);
    const metaStyle = getComputedStyle(firstMeta);
    const titleStyle = getComputedStyle(firstTitle);
    const pagerRect = pager.getBoundingClientRect();
    const pagerStyle = getComputedStyle(pager);
    const numberRect = pageNumber.getBoundingClientRect();
    const numberStyle = getComputedStyle(pageNumber);
    const prevRect = prevSlot.getBoundingClientRect();
    const nextRect = nextSlot.getBoundingClientRect();

    return {
      archiveWidth: archiveRect.width,
      listWidth: listRect.width,
      widths: rects.map((rect) => rect.width),
      heights: rects.map((rect) => rect.height),
      colGaps: [rects[1].left - rects[0].right, rects[2].left - rects[1].right],
      rowGap: rects[3].top - rects[0].bottom,
      firstRadius: linkStyles[0].borderTopLeftRadius,
      listBorder: getComputedStyle(list).borderTopWidth,
      middleLeftBorder: linkStyles[1].borderLeftWidth,
      secondRowTopBorder: linkStyles[3].borderTopWidth,
      articleWidth: articleRect.width,
      articlePaddingTop: articleLinkStyle.paddingTop,
      articlePaddingLeft: articleLinkStyle.paddingLeft,
      articleGap: articleLinkStyle.gap,
      metaGap: metaStyle.gap,
      titleLineHeight: titleStyle.lineHeight,
      pagerWidth: pagerRect.width,
      pagerDisplay: pagerStyle.display,
      pagerJustify: pagerStyle.justifyContent,
      numberWidth: numberRect.width,
      numberHeight: numberRect.height,
      numberRadius: numberStyle.borderTopLeftRadius,
      numberBottomBorder: numberStyle.borderBottomWidth,
      prevSize: [prevRect.width, prevRect.height],
      nextSize: [nextRect.width, nextRect.height],
    };
  });

  assert(sp, 'SP News archive controls were not found.');
  assert(close(sp.archiveWidth, 327), `SP archive rail expected 327px, got ${sp.archiveWidth}.`);
  assert(close(sp.listWidth, 327), `SP tab rail expected 327px, got ${sp.listWidth}.`);
  assert(sp.widths.every((width) => close(width, 109, 1)), `SP tabs expected three equal ~109px columns, got ${sp.widths.join(',')}.`);
  assert(sp.heights.every((height) => close(height, 34, 1)), `SP tabs expected ~34px row height, got ${sp.heights.join(',')}.`);
  assert(sp.colGaps.every((gap) => Math.abs(gap) <= 1) && Math.abs(sp.rowGap) <= 1, `SP tabs must form a contiguous 3x2 grid; gaps=${sp.colGaps.join(',')}/${sp.rowGap}.`);
  assert(sp.firstRadius === '0px', `SP tabs must not retain the old pill radius; got ${sp.firstRadius}.`);
  assert(sp.listBorder === '1px' && sp.middleLeftBorder === '1px' && sp.secondRowTopBorder === '1px', `SP tab grid separators missing: outer=${sp.listBorder}, middle=${sp.middleLeftBorder}, row=${sp.secondRowTopBorder}.`);
  assert(close(sp.articleWidth, 327), `SP article rail expected 327px, got ${sp.articleWidth}.`);
  assert(sp.articlePaddingTop === '20px' && sp.articlePaddingLeft === '16px', `SP article padding expected 20px/16px, got ${sp.articlePaddingTop}/${sp.articlePaddingLeft}.`);
  assert(sp.articleGap === '16px' && sp.metaGap === '24px', `SP article/meta gaps expected 16px/24px, got ${sp.articleGap}/${sp.metaGap}.`);
  assert(close(parseFloat(sp.titleLineHeight), 25.6, 1), `SP title line-height expected ~25.6px, got ${sp.titleLineHeight}.`);
  assert(close(sp.pagerWidth, 327), `SP pager rail expected 327px, got ${sp.pagerWidth}.`);
  assert(sp.pagerDisplay === 'flex' && sp.pagerJustify === 'space-between', `SP pager should be one-row flex/space-between, got ${sp.pagerDisplay}/${sp.pagerJustify}.`);
  assert(close(sp.numberWidth, 50) && close(sp.numberHeight, 40), `SP page number expected 50x40, got ${sp.numberWidth}x${sp.numberHeight}.`);
  assert(sp.numberRadius === '0px' && sp.numberBottomBorder === '2px', `SP page number must use underline family, got radius=${sp.numberRadius} border=${sp.numberBottomBorder}.`);
  assert(close(sp.prevSize[0], 40) && close(sp.prevSize[1], 40) && close(sp.nextSize[0], 40) && close(sp.nextSize[1], 40), `SP pager arrow slots expected 40x40, got prev=${sp.prevSize} next=${sp.nextSize}.`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 1200 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });

  const pc = await desktopPage.evaluate(() => {
    const archive = document.querySelector('.news_archive');
    const list = document.querySelector('.news_tabs_archive .news_tabs_list');
    const tabs = [...document.querySelectorAll('.news_tabs_archive .news_tabs_item')];
    const links = [...document.querySelectorAll('.news_tabs_archive .news_tabs_link')];
    const pager = document.querySelector('.news_archive .news_pager');
    const pageNumber = document.querySelector('.news_pager_numbers .page-numbers:not(.prev):not(.next):not(.dots)');
    if (!archive || !list || tabs.length !== 6 || links.length !== 6 || !pager || !pageNumber) return null;

    const archiveRect = archive.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const rects = tabs.map((tab) => tab.getBoundingClientRect());
    const styles = links.map((link) => getComputedStyle(link));
    const numberRect = pageNumber.getBoundingClientRect();
    const numberStyle = getComputedStyle(pageNumber);
    return {
      archiveWidth: archiveRect.width,
      listWidth: listRect.width,
      widths: rects.map((rect) => rect.width),
      heights: rects.map((rect) => rect.height),
      starts: rects.map((rect) => rect.left - listRect.left),
      gaps: rects.slice(1).map((rect, index) => rect.left - rects[index].right),
      radius: styles[0].borderTopLeftRadius,
      borders: styles.map((style) => style.borderLeftWidth),
      pagerJustify: getComputedStyle(pager).justifyContent,
      pagerGap: getComputedStyle(pager).gap,
      numberWidth: numberRect.width,
      numberHeight: numberRect.height,
      numberBottomBorder: numberStyle.borderBottomWidth,
    };
  });

  assert(pc, 'PC News archive controls were not found.');
  assert(close(pc.archiveWidth, 960), `PC archive rail expected 960px, got ${pc.archiveWidth}.`);
  assert(close(pc.listWidth, 960), `PC tab rail expected 960px, got ${pc.listWidth}.`);
  assert(pc.widths.every((width) => close(width, 120)), `PC tabs expected 120px widths, got ${pc.widths.join(',')}.`);
  assert(pc.heights.every((height) => close(height, 48)), `PC tabs expected 48px heights, got ${pc.heights.join(',')}.`);
  assert(pc.gaps.every((gap) => close(gap, 12, 1)), `PC tabs expected 12px gaps, got ${pc.gaps.join(',')}.`);
  assert(pc.starts.every((start, index) => close(start, index * 132, 1)), `PC tab starts expected 132px increments, got ${pc.starts.join(',')}.`);
  assert(pc.radius === '3px' && pc.borders.every((border) => border === '1px'), `PC tabs expected independent 3px bordered cards, got radius=${pc.radius}, borders=${pc.borders.join(',')}.`);
  assert(pc.pagerJustify === 'center' && pc.pagerGap === '48px', `PC pager expected centered 48px family, got ${pc.pagerJustify}/${pc.pagerGap}.`);
  assert(close(pc.numberWidth, 50) && close(pc.numberHeight, 40) && pc.numberBottomBorder === '2px', `PC page number expected 50x40 underline, got ${pc.numberWidth}x${pc.numberHeight}/${pc.numberBottomBorder}.`);
  await desktopContext.close();

  console.log('PASS Budokan News archive SP current 3x2 tabs, article rail and one-row pager QA.');
  console.log('PASS Budokan News archive PC current 6x120 tab and pager geometry QA.');
} finally {
  await browser.close();
}
