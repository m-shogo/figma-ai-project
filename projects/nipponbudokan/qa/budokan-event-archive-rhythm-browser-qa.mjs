import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-event-archive-rhythm-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

async function openPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  // Local hot reload polls /wp-json/figma-ai-local/v1/stamp, so networkidle never settles.
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts?.ready);
  // Windows classic scrollbars shrink the layout box below the requested viewport.
  // Grow the window until the document box matches the Figma frame width.
  const layoutWidth = await page.evaluate(() => document.documentElement.getBoundingClientRect().width);
  const missing = viewport.width - layoutWidth;
  if (missing > 0.5) {
    await page.setViewportSize({ width: Math.ceil(viewport.width + missing), height: viewport.height });
    await page.evaluate(() => document.fonts?.ready);
  }
  return { context, page };
}

async function collect(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('.event_archive_inner');
    const archive = document.querySelector('.event_archive');
    const monthNav = document.querySelector('.event_archive .ea_monthNav');
    const board = document.querySelector('.event_archive .ea_board');
    const tabs = document.querySelector('.event_archive .news_tabs_archive .news_tabs_list');
    const list = document.querySelector('.event_archive .ea_list');
    const cards = Array.from(document.querySelectorAll('.event_archive .ea_card'));
    const pager = document.querySelector('.event_archive .news_pager');
    const firstCard = cards[0] || null;
    const firstCardLink = firstCard?.querySelector('.ea_card_link') || null;
    const firstDay = firstCard?.querySelector('.ea_day') || null;
    const firstBody = firstCard?.querySelector('.ea_body') || null;
    const labelCandidates = firstCard ? Array.from(firstCard.querySelectorAll('.label')) : [];
    const firstLabel = labelCandidates.find((el) => el.getClientRects().length > 0) || null;
    const firstTitle = firstCard?.querySelector('.ea_title') || null;
    const monthSp = document.querySelector('.event_archive .ea_months-sp');
    const monthPc = document.querySelector('.event_archive .ea_months-pc');

    if (!shell || !archive || !monthNav || !board || !tabs || !list || !firstCard || !firstCardLink || !firstDay || !firstBody || !firstLabel || !firstTitle || !pager) {
      return null;
    }

    const rect = (el) => el.getBoundingClientRect();
    const shellRect = rect(shell);
    const archiveRect = rect(archive);
    const monthRect = rect(monthNav);
    const boardRect = rect(board);
    const tabsRect = rect(tabs);
    const listRect = rect(list);
    const cardRect = rect(firstCard);
    const cardLinkRect = rect(firstCardLink);
    const dayRect = rect(firstDay);
    const bodyRect = rect(firstBody);
    const labelRect = rect(firstLabel);
    const pagerRect = rect(pager);
    const shellStyle = getComputedStyle(shell);
    const archiveStyle = getComputedStyle(archive);
    const cardLinkStyle = getComputedStyle(firstCardLink);
    const titleStyle = getComputedStyle(firstTitle);
    const tabLabels = Array.from(tabs.querySelectorAll('.news_tabs_item:not(.news_tabs_item-filler) .news_tabs_link'))
      .map((el) => el.textContent.trim());
    const tabItems = Array.from(tabs.querySelectorAll('.news_tabs_item:not(.news_tabs_item-filler)'));
    const tabRects = tabItems.map((el) => {
      const r = rect(el);
      return { width: r.width, height: r.height };
    });

    const shellContentLeft = shellRect.left + parseFloat(shellStyle.paddingLeft);
    const shellContentRight = shellRect.right - parseFloat(shellStyle.paddingRight);

    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      shellWidth: shellRect.width,
      shellContentWidth: shellContentRight - shellContentLeft,
      shellContentLeft,
      shellContentRight,
      paddingTop: parseFloat(shellStyle.paddingTop),
      paddingBottom: parseFloat(shellStyle.paddingBottom),
      archiveWidth: archiveRect.width,
      archiveLeft: archiveRect.left,
      archiveRight: archiveRect.right,
      archiveGap: parseFloat(archiveStyle.rowGap || archiveStyle.gap),
      monthHeight: monthRect.height,
      boardHeight: boardRect.height,
      tabsWidth: tabsRect.width,
      tabsHeight: tabsRect.height,
      tabLabels,
      tabRects,
      cardCount: cards.length,
      firstCardWidth: cardRect.width,
      firstCardHeight: cardRect.height,
      firstCardPaddingTop: parseFloat(cardLinkStyle.paddingTop),
      firstCardPaddingRight: parseFloat(cardLinkStyle.paddingRight),
      firstCardPaddingBottom: parseFloat(cardLinkStyle.paddingBottom),
      firstCardPaddingLeft: parseFloat(cardLinkStyle.paddingLeft),
      firstDayWidth: dayRect.width,
      firstBodyWidth: bodyRect.width,
      firstLabelWidth: labelRect.width,
      firstTitleDecoration: titleStyle.textDecorationLine,
      boardToList: listRect.top - boardRect.bottom,
      listToPager: pagerRect.top - listRect.bottom,
      monthSpDisplay: monthSp ? getComputedStyle(monthSp).display : null,
      monthPcDisplay: monthPc ? getComputedStyle(monthPc).display : null,
      monthSpCount: monthSp ? monthSp.children.length : 0,
      monthPcCount: monthPc ? monthPc.children.length : 0,
    };
  });
}

const browser = await chromium.launch({ headless: true });
try {
  {
    const { context, page } = await openPage(browser, { width: 1380, height: 1200 });
    const metrics = await collect(page);

    assert(metrics, 'PC Event archive surfaces were not found.');
    assert(close(metrics.shellContentWidth, 960), 'PC authored content box expected 960px, got ' + metrics.shellContentWidth + '.');
    assert(close(metrics.archiveWidth, 960), 'PC Event archive rail expected 960px, got ' + metrics.archiveWidth + '.');
    assert(close(metrics.archiveLeft, metrics.shellContentLeft), 'PC Event archive left edge must align to authored rail.');
    assert(close(metrics.archiveRight, metrics.shellContentRight), 'PC Event archive right edge must align to authored rail.');
    assert(close(metrics.paddingTop, 64), 'PC Event archive top inset expected 64px, got ' + metrics.paddingTop + '.');
    assert(close(metrics.paddingBottom, 100), 'PC Event archive bottom inset expected 100px, got ' + metrics.paddingBottom + '.');
    assert(close(metrics.archiveGap, 64), 'PC Event archive section gap expected 64px, got ' + metrics.archiveGap + '.');
    assert(close(metrics.monthHeight, 90), 'PC month navigation expected 90px, got ' + metrics.monthHeight + '.');
    assert(close(metrics.tabsHeight, 48), 'PC category tabs expected 48px height, got ' + metrics.tabsHeight + '.');
    assert(metrics.tabRects.length === 4, 'PC category tabs expected 4 authored items, got ' + metrics.tabRects.length + '.');
    assert(metrics.tabRects.every((r) => close(r.width, 120) && close(r.height, 48)), 'PC category tabs must be 120x48px.');
    assert(metrics.tabLabels.join('|') === '全て|一般|武道|書道', 'PC category order mismatch: ' + metrics.tabLabels.join('|') + '.');
    assert(metrics.cardCount === 10, 'PC Event archive expected 10 cards, got ' + metrics.cardCount + '.');
    assert(close(metrics.firstCardWidth, 960), 'PC first card expected 960px width, got ' + metrics.firstCardWidth + '.');
    assert(close(metrics.firstCardHeight, 124, 3), 'PC first card expected 124px height, got ' + metrics.firstCardHeight + '.');
    assert(close(metrics.firstCardPaddingTop, 24) && close(metrics.firstCardPaddingBottom, 24), 'PC card vertical padding expected 24px.');
    assert(close(metrics.firstCardPaddingLeft, 20) && close(metrics.firstCardPaddingRight, 20), 'PC card horizontal padding expected 20px.');
    assert(close(metrics.firstLabelWidth, 90), 'PC category label expected 90px width, got ' + metrics.firstLabelWidth + '.');
    assert(metrics.firstTitleDecoration === 'none', 'PC linked event title should not be underlined at rest.');
    assert(close(metrics.boardToList, 64), 'PC category-to-card gap expected 64px, got ' + metrics.boardToList + '.');
    assert(close(metrics.listToPager, 64), 'PC card-to-pager gap expected 64px, got ' + metrics.listToPager + '.');
    assert(metrics.monthSpDisplay === 'none', 'PC must hide the 3-month SP navigation.');
    assert(metrics.monthPcDisplay === 'grid', 'PC must show the 12-month navigation as a grid.');
    assert(metrics.monthPcCount === 12, 'PC month navigation expected 12 months, got ' + metrics.monthPcCount + '.');
    assert(metrics.documentWidth <= metrics.viewportWidth + 1, 'PC horizontal overflow: document=' + metrics.documentWidth + ', viewport=' + metrics.viewportWidth + '.');

    console.log('PASS Budokan Event archive PC Figma geometry QA.');
    await context.close();
  }

  {
    const { context, page } = await openPage(browser, { width: 375, height: 900 });
    const metrics = await collect(page);

    assert(metrics, 'SP Event archive surfaces were not found.');
    assert(close(metrics.shellWidth, 375), 'SP shell expected 375px width, got ' + metrics.shellWidth + '.');
    assert(close(metrics.shellContentWidth, 327), 'SP authored content box expected 327px, got ' + metrics.shellContentWidth + '.');
    assert(close(metrics.archiveWidth, 327), 'SP Event archive rail expected 327px, got ' + metrics.archiveWidth + '.');
    assert(close(metrics.archiveLeft, metrics.shellContentLeft), 'SP Event archive left edge must align to 24px inset.');
    assert(close(metrics.archiveRight, metrics.shellContentRight), 'SP Event archive right edge must align to 24px inset.');
    assert(close(metrics.paddingTop, 48), 'SP Event archive top inset expected 48px, got ' + metrics.paddingTop + '.');
    assert(close(metrics.paddingBottom, 64), 'SP Event archive bottom inset expected 64px, got ' + metrics.paddingBottom + '.');
    assert(close(metrics.archiveGap, 32), 'SP Event archive section gap expected 32px, got ' + metrics.archiveGap + '.');
    assert(close(metrics.monthHeight, 90), 'SP month navigation expected 90px, got ' + metrics.monthHeight + '.');
    assert(close(metrics.boardHeight, 130, 3), 'SP heading/category board expected 130px, got ' + metrics.boardHeight + '.');
    assert(close(metrics.tabsWidth, 327), 'SP category grid expected 327px width, got ' + metrics.tabsWidth + '.');
    assert(close(metrics.tabsHeight, 68), 'SP category grid expected 68px height, got ' + metrics.tabsHeight + '.');
    assert(metrics.tabRects.length === 4, 'SP category grid expected 4 authored category items, got ' + metrics.tabRects.length + '.');
    assert(metrics.tabLabels.join('|') === '全て|一般|武道|書道', 'SP category order mismatch: ' + metrics.tabLabels.join('|') + '.');
    assert(metrics.cardCount === 10, 'SP Event archive expected 10 cards, got ' + metrics.cardCount + '.');
    assert(close(metrics.firstCardWidth, 327), 'SP first card expected 327px width, got ' + metrics.firstCardWidth + '.');
    assert(close(metrics.firstCardHeight, 157, 4), 'SP first card expected about 157px height, got ' + metrics.firstCardHeight + '.');
    assert(close(metrics.firstCardPaddingTop, 20) && close(metrics.firstCardPaddingBottom, 20), 'SP card vertical padding expected 20px.');
    assert(close(metrics.firstCardPaddingLeft, 20) && close(metrics.firstCardPaddingRight, 20), 'SP card horizontal padding expected 20px.');
    assert(close(metrics.firstDayWidth, 45, 3), 'SP first day/category column expected about 45px, got ' + metrics.firstDayWidth + '.');
    assert(close(metrics.firstBodyWidth, 218, 4), 'SP first body column expected about 218px, got ' + metrics.firstBodyWidth + '.');
    assert(metrics.firstTitleDecoration.includes('underline'), 'SP linked event title should be underlined.');
    assert(close(metrics.boardToList, 32), 'SP category-to-card gap expected 32px, got ' + metrics.boardToList + '.');
    assert(close(metrics.listToPager, 32), 'SP card-to-pager gap expected 32px, got ' + metrics.listToPager + '.');
    assert(metrics.monthSpDisplay === 'grid', 'SP must show the 3-month navigation as a grid.');
    assert(metrics.monthPcDisplay === 'none', 'SP must hide the 12-month PC navigation.');
    assert(metrics.monthSpCount === 3, 'SP month navigation expected 3 months, got ' + metrics.monthSpCount + '.');
    assert(metrics.documentWidth <= metrics.viewportWidth + 1, 'SP horizontal overflow: document=' + metrics.documentWidth + ', viewport=' + metrics.viewportWidth + '.');

    console.log('PASS Budokan Event archive SP Figma geometry QA.');
    await context.close();
  }
} finally {
  await browser.close();
}
