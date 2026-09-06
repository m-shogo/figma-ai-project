import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-news-archive-rhythm-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

async function measure(page) {
  return page.evaluate(() => {
    const archive = document.querySelector('.news_archive');
    const tabs = document.querySelector('.news_tabs_archive');
    const articles = document.querySelector('.module_newsList-01');
    const pager = document.querySelector('.news_archive .news_pager');
    if (!archive || !tabs || !articles || !pager) return null;

    const archiveRect = archive.getBoundingClientRect();
    const tabsRect = tabs.getBoundingClientRect();
    const articlesRect = articles.getBoundingClientRect();
    const pagerRect = pager.getBoundingClientRect();
    const style = getComputedStyle(archive);

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      archive: {
        left: archiveRect.left,
        right: archiveRect.right,
        width: archiveRect.width,
        paddingTop: parseFloat(style.paddingTop),
        paddingBottom: parseFloat(style.paddingBottom),
        rowGap: parseFloat(style.rowGap || style.gap),
      },
      tabToArticle: articlesRect.top - tabsRect.bottom,
      articleToPager: pagerRect.top - articlesRect.bottom,
    };
  });
}

const browser = await chromium.launch({ headless: true });
try {
  const spContext = await browser.newContext({
    viewport: { width: 375, height: 1200 },
    isMobile: true,
    hasTouch: true,
  });
  const spPage = await spContext.newPage();
  await spPage.goto(url, { waitUntil: 'networkidle' });
  const sp = await measure(spPage);
  assert(sp, 'SP News archive rhythm surfaces were not found.');
  assert(close(sp.archive.left, 24), `SP archive left inset expected 24px, got ${sp.archive.left}.`);
  assert(close(sp.viewportWidth - sp.archive.right, 24), `SP archive right inset expected 24px, got ${sp.viewportWidth - sp.archive.right}.`);
  assert(close(sp.archive.width, 327), `SP archive rail expected 327px, got ${sp.archive.width}.`);
  assert(close(sp.archive.paddingTop, 48), `SP archive top inset expected 48px, got ${sp.archive.paddingTop}.`);
  assert(close(sp.archive.paddingBottom, 64), `SP archive bottom inset expected 64px, got ${sp.archive.paddingBottom}.`);
  assert(close(sp.archive.rowGap, 32), `SP archive section gap expected 32px, got ${sp.archive.rowGap}.`);
  assert(close(sp.tabToArticle, 32), `SP tab-to-article gap expected 32px, got ${sp.tabToArticle}.`);
  assert(close(sp.articleToPager, 32), `SP article-to-pager gap expected 32px, got ${sp.articleToPager}.`);
  assert(sp.documentWidth <= sp.viewportWidth + 1, `SP horizontal overflow: document=${sp.documentWidth}, viewport=${sp.viewportWidth}.`);
  await spContext.close();

  const pcContext = await browser.newContext({ viewport: { width: 1380, height: 1200 } });
  const pcPage = await pcContext.newPage();
  await pcPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await measure(pcPage);
  assert(pc, 'PC News archive rhythm surfaces were not found.');
  const pcSideInset = (pc.viewportWidth - pc.archive.width) / 2;
  assert(close(pc.archive.width, 960), `PC archive rail expected 960px, got ${pc.archive.width}.`);
  assert(close(pc.archive.left, pcSideInset), `PC archive expected centered 960px rail; left=${pc.archive.left}, expected=${pcSideInset}.`);
  assert(close(pc.viewportWidth - pc.archive.right, pcSideInset), `PC archive expected centered 960px rail; right=${pc.viewportWidth - pc.archive.right}, expected=${pcSideInset}.`);
  assert(close(pc.archive.paddingTop, 64), `PC archive top inset expected 64px, got ${pc.archive.paddingTop}.`);
  assert(close(pc.archive.paddingBottom, 100), `PC archive bottom inset expected 100px, got ${pc.archive.paddingBottom}.`);
  assert(close(pc.archive.rowGap, 56), `PC archive section gap expected 56px, got ${pc.archive.rowGap}.`);
  assert(close(pc.tabToArticle, 56), `PC tab-to-article gap expected 56px, got ${pc.tabToArticle}.`);
  assert(close(pc.articleToPager, 56), `PC article-to-pager gap expected 56px, got ${pc.articleToPager}.`);
  assert(pc.documentWidth <= pc.viewportWidth + 1, `PC horizontal overflow: document=${pc.documentWidth}, viewport=${pc.viewportWidth}.`);
  await pcContext.close();

  console.log('PASS Budokan News archive PC/SP container rhythm QA.');
} finally {
  await browser.close();
}
