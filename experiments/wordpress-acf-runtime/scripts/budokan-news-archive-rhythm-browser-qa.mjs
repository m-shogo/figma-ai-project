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
    const shell = archive?.closest('.global_inner._content');
    if (!archive || !tabs || !articles || !pager || !shell) return null;

    const archiveRect = archive.getBoundingClientRect();
    const tabsRect = tabs.getBoundingClientRect();
    const articlesRect = articles.getBoundingClientRect();
    const pagerRect = pager.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();
    const style = getComputedStyle(archive);
    const shellStyle = getComputedStyle(shell);
    const shellContentLeft = shellRect.left + parseFloat(shellStyle.paddingLeft);
    const shellContentRight = shellRect.right - parseFloat(shellStyle.paddingRight);

    return {
      viewportWidth: window.innerWidth,
      layoutWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      shell: {
        contentLeft: shellContentLeft,
        contentRight: shellContentRight,
        contentWidth: shellContentRight - shellContentLeft,
      },
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
  const spShellInset = (sp.shell.contentWidth - sp.archive.width) / 2;
  assert(close(sp.archive.left - sp.shell.contentLeft, spShellInset), `SP archive expected centered inside the authored content box; left inset=${sp.archive.left - sp.shell.contentLeft}, expected=${spShellInset}.`);
  assert(close(sp.shell.contentRight - sp.archive.right, spShellInset), `SP archive expected symmetric content-box inset; right inset=${sp.shell.contentRight - sp.archive.right}, expected=${spShellInset}.`);
  assert(close(sp.archive.left, 24), `SP archive page inset expected 24px, got ${sp.archive.left}.`);
  assert(close(sp.archive.width, 327), `SP archive rail expected 327px, got ${sp.archive.width}.`);
  assert(close(sp.archive.paddingTop, 48), `SP archive top inset expected 48px, got ${sp.archive.paddingTop}.`);
  assert(close(sp.archive.paddingBottom, 64), `SP archive bottom inset expected 64px, got ${sp.archive.paddingBottom}.`);
  assert(close(sp.archive.rowGap, 32), `SP archive section gap expected 32px, got ${sp.archive.rowGap}.`);
  assert(close(sp.tabToArticle, 32), `SP tab-to-article gap expected 32px, got ${sp.tabToArticle}.`);
  assert(close(sp.articleToPager, 32), `SP article-to-pager gap expected 32px, got ${sp.articleToPager}.`);
  assert(sp.documentWidth <= sp.layoutWidth + 1, `SP horizontal overflow: document=${sp.documentWidth}, layout=${sp.layoutWidth}, inner=${sp.viewportWidth}.`);
  await spContext.close();

  const pcContext = await browser.newContext({ viewport: { width: 1380, height: 1200 } });
  const pcPage = await pcContext.newPage();
  await pcPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await measure(pcPage);
  assert(pc, 'PC News archive rhythm surfaces were not found.');
  const pcShellInset = (pc.shell.contentWidth - pc.archive.width) / 2;
  assert(close(pc.archive.width, 960), `PC archive rail expected 960px, got ${pc.archive.width}.`);
  assert(close(pc.shell.contentWidth, 960), `PC authored content box expected 960px, got ${pc.shell.contentWidth}.`);
  assert(close(pc.archive.left - pc.shell.contentLeft, pcShellInset), `PC archive expected centered inside the authored content box; left inset=${pc.archive.left - pc.shell.contentLeft}, expected=${pcShellInset}.`);
  assert(close(pc.shell.contentRight - pc.archive.right, pcShellInset), `PC archive expected symmetric content-box inset; right inset=${pc.shell.contentRight - pc.archive.right}, expected=${pcShellInset}.`);
  assert(close(pc.archive.paddingTop, 64), `PC archive top inset expected 64px, got ${pc.archive.paddingTop}.`);
  assert(close(pc.archive.paddingBottom, 100), `PC archive bottom inset expected 100px, got ${pc.archive.paddingBottom}.`);
  assert(close(pc.archive.rowGap, 56), `PC archive section gap expected 56px, got ${pc.archive.rowGap}.`);
  assert(close(pc.tabToArticle, 56), `PC tab-to-article gap expected 56px, got ${pc.tabToArticle}.`);
  assert(close(pc.articleToPager, 56), `PC article-to-pager gap expected 56px, got ${pc.articleToPager}.`);
  assert(pc.documentWidth <= pc.layoutWidth + 1, `PC horizontal overflow: document=${pc.documentWidth}, layout=${pc.layoutWidth}, inner=${pc.viewportWidth}.`);
  await pcContext.close();

  console.log('PASS Budokan News archive PC/SP container rhythm QA.');
} finally {
  await browser.close();
}
