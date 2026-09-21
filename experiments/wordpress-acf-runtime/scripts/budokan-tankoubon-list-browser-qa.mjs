import { chromium } from 'playwright';

const [baseUrl, pageId] = process.argv.slice(2);
if (!baseUrl || !pageId) {
  throw new Error('usage: node budokan-tankoubon-list-browser-qa.mjs <baseUrl> <pageId>');
}

const browser = await chromium.launch({ headless: true });
const pageUrl = `${baseUrl}/?page_id=${pageId}`;

async function open(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const response = await page.goto(pageUrl, { waitUntil: 'networkidle' });
  if (!response || !response.ok()) throw new Error(`HTTP failure Tankoubon list: ${response?.status()}`);
  return { context, page };
}

async function metrics(page) {
  return page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    bodyMin: parseFloat(getComputedStyle(document.body).minWidth || '0'),
  }));
}

async function assertViewport(viewport) {
  const label = `Tankoubon list ${viewport.width}`;
  const { context, page } = await open(viewport);
  try {
    const doc = await metrics(page);
    if (viewport.width < 768 && doc.scroll > doc.client + 1) {
      throw new Error(`${label}: unexpected SP horizontal overflow ${doc.scroll} > ${doc.client}`);
    }
    if (viewport.width >= 768 && doc.bodyMin < 1280) {
      throw new Error(`${label}: PC breakpoint must retain body min-width 1280, got ${doc.bodyMin}`);
    }

    for (const selector of [
      '.publication_book-listShell',
      '.publication_book-latest',
      '.publication_book-categoryNav',
      '.publication_book-categorySections',
      '.publication_book-categorySection',
      '.publication_book-cardList',
    ]) {
      if (!(await page.locator(selector).count())) throw new Error(`${label}: missing ${selector}`);
    }

    for (const text of [
      'QA 単行本一覧 最新刊',
      'QA 単行本一覧 複数カテゴリ所属',
      'QA 単行本一覧 空ACF・画像なし',
    ]) {
      if (!(await page.getByText(text, { exact: false }).count())) throw new Error(`${label}: missing fixture text ${text}`);
    }

    const result = await page.evaluate(() => {
      const navLinks = [...document.querySelectorAll('.publication_book-categoryNav a')];
      const cards = [...document.querySelectorAll('.publication_book-card')];
      const emptyCard = cards.find(card => card.textContent?.includes('QA 単行本一覧 空ACF・画像なし'));
      const longCard = cards.find(card => card.textContent?.includes('QA 単行本一覧 長タイトル'));
      const latest = document.querySelector('.publication_book-latest');
      const latestCard = latest?.querySelector('.publication_book-card');
      const categoryList = document.querySelector('.publication_book-categoryList');
      const cardList = document.querySelector('.publication_book-cardList');
      return {
        navCount: navLinks.length,
        badAnchors: navLinks.filter(link => {
          const href = link.getAttribute('href') || '';
          return !href.startsWith('#book-category-') || !document.querySelector(href);
        }).map(link => link.getAttribute('href')),
        latestText: latestCard?.textContent || '',
        categoryDisplay: categoryList ? getComputedStyle(categoryList).display : '',
        cardListDisplay: cardList ? getComputedStyle(cardList).display : '',
        emptyHasImage: !!emptyCard?.querySelector('img'),
        emptyText: emptyCard?.textContent || '',
        longWidth: longCard?.getBoundingClientRect().width || 0,
        longScroll: longCard?.scrollWidth || 0,
      };
    });

    if (result.navCount < 2) throw new Error(`${label}: expected multiple category anchors, got ${result.navCount}`);
    if (result.badAnchors.length) throw new Error(`${label}: broken category anchors ${JSON.stringify(result.badAnchors)}`);
    if (!result.latestText.includes('QA 単行本一覧 最新刊')) throw new Error(`${label}: latest owner did not render latest fixture`);
    if (result.emptyHasImage) throw new Error(`${label}: image-less fixture unexpectedly rendered an image`);
    if (result.longScroll > result.longWidth + 1) throw new Error(`${label}: long card overflows ${result.longScroll} > ${result.longWidth}`);
  } finally {
    await context.close();
  }
}

const viewports = [
  { width: 375, height: 900 },
  { width: 390, height: 900 },
  { width: 430, height: 900 },
  { width: 767, height: 900 },
  { width: 768, height: 900 },
  { width: 1380, height: 1000 },
];

try {
  for (const viewport of viewports) {
    console.log(`[Tankoubon List QA] START viewport=${viewport.width}x${viewport.height}`);
    try {
      await assertViewport(viewport);
      console.log(`[Tankoubon List QA] PASS viewport=${viewport.width}x${viewport.height}`);
    } catch (error) {
      console.error(`[Tankoubon List QA] FAIL viewport=${viewport.width}x${viewport.height}: ${error?.stack || error}`);
      throw error;
    }
  }
  console.log('PASS Tankoubon list real WordPress browser QA: latest/category anchors/all-list fixtures at 375/390/430/767/768/1380 with overflow and empty-image boundaries.');
} finally {
  await browser.close();
}
