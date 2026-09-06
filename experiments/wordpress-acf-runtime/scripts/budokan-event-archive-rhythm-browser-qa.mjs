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

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1380, height: 1200 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const metrics = await page.evaluate(() => {
    const archive = document.querySelector('.event_archive');
    const tabs = document.querySelector('.event_archive .news_tabs_archive');
    const cards = document.querySelector('.event_archive .module_newsCard-01');
    const pager = document.querySelector('.event_archive .news_pager');
    const shell = archive?.closest('.global_inner._content');
    if (!archive || !tabs || !cards || !pager || !shell) return null;

    const archiveRect = archive.getBoundingClientRect();
    const tabsRect = tabs.getBoundingClientRect();
    const cardsRect = cards.getBoundingClientRect();
    const pagerRect = pager.getBoundingClientRect();
    const archiveStyle = getComputedStyle(archive);
    const shellRect = shell.getBoundingClientRect();
    const shellStyle = getComputedStyle(shell);
    const shellContentLeft = shellRect.left + parseFloat(shellStyle.paddingLeft);
    const shellContentRight = shellRect.right - parseFloat(shellStyle.paddingRight);

    return {
      layoutWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      shellContentWidth: shellContentRight - shellContentLeft,
      archiveWidth: archiveRect.width,
      archiveLeft: archiveRect.left,
      archiveRight: archiveRect.right,
      shellContentLeft,
      shellContentRight,
      paddingTop: parseFloat(archiveStyle.paddingTop),
      paddingBottom: parseFloat(archiveStyle.paddingBottom),
      rowGap: parseFloat(archiveStyle.rowGap || archiveStyle.gap),
      tabToCards: cardsRect.top - tabsRect.bottom,
      cardsToPager: pagerRect.top - cardsRect.bottom,
    };
  });

  assert(metrics, 'PC Event archive rhythm surfaces were not found.');
  assert(close(metrics.shellContentWidth, 960), `PC authored content box expected 960px, got ${metrics.shellContentWidth}.`);
  assert(close(metrics.archiveWidth, 960), `PC Event archive rail expected 960px, got ${metrics.archiveWidth}.`);
  assert(close(metrics.archiveLeft, metrics.shellContentLeft), `PC Event archive left edge must align to authored rail; got ${metrics.archiveLeft} vs ${metrics.shellContentLeft}.`);
  assert(close(metrics.archiveRight, metrics.shellContentRight), `PC Event archive right edge must align to authored rail; got ${metrics.archiveRight} vs ${metrics.shellContentRight}.`);
  assert(close(metrics.paddingTop, 64), `PC Event archive top inset expected 64px, got ${metrics.paddingTop}.`);
  assert(close(metrics.paddingBottom, 100), `PC Event archive bottom inset expected 100px, got ${metrics.paddingBottom}.`);
  assert(close(metrics.rowGap, 64), `PC Event archive section gap expected 64px, got ${metrics.rowGap}.`);
  assert(close(metrics.tabToCards, 64), `PC Event category-to-card gap expected 64px, got ${metrics.tabToCards}.`);
  assert(close(metrics.cardsToPager, 64), `PC Event card-to-pager gap expected 64px, got ${metrics.cardsToPager}.`);
  assert(metrics.documentWidth <= metrics.layoutWidth + 1, `PC horizontal overflow: document=${metrics.documentWidth}, layout=${metrics.layoutWidth}.`);

  console.log('PASS Budokan Event archive PC container rhythm QA.');
  await context.close();
} finally {
  await browser.close();
}
