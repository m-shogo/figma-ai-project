import { chromium } from 'playwright';

const [baseUrl, idsJson] = process.argv.slice(2);
if (!baseUrl || !idsJson) {
  throw new Error('usage: node budokan-tankoubon-detail-browser-qa.mjs <baseUrl> <tankoubonIdsJson>');
}

const ids = JSON.parse(idsJson);
for (const key of ['standard', 'long', 'empty']) {
  if (!ids[key]) throw new Error(`missing tankoubon fixture id: ${key}`);
}

const browser = await chromium.launch({ headless: true });
const postUrl = id => `${baseUrl}/?p=${id}&post_type=tankoubon`;

async function open(viewport, id) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const response = await page.goto(postUrl(id), { waitUntil: 'networkidle' });
  if (!response || !response.ok()) throw new Error(`HTTP failure tankoubon ${id}: ${response?.status()}`);
  return { context, page };
}

async function documentMetrics(page) {
  return page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    bodyMin: parseFloat(getComputedStyle(document.body).minWidth || '0'),
  }));
}

async function assertResponsive(page, viewport, label) {
  const m = await documentMetrics(page);
  if (viewport.width < 768 && m.scroll > m.client + 1) {
    throw new Error(`${label}: unexpected SP horizontal overflow ${m.scroll} > ${m.client}`);
  }
  if (viewport.width >= 768 && m.bodyMin < 1280) {
    throw new Error(`${label}: PC breakpoint must retain body min-width 1280, got ${m.bodyMin}`);
  }
}

async function assertStandard(viewport) {
  const label = `Tankoubon standard ${viewport.width}`;
  const { context, page } = await open(viewport, ids.standard);
  try {
    await assertResponsive(page, viewport, label);
    for (const selector of ['.publication_book-head', '.publication_book-heading', '.publication_book-summary', '.publication_book-cover img', '.publication_book-meta', '.publication_book-actions', '.publication_book-content']) {
      if (!(await page.locator(selector).count())) throw new Error(`${label}: missing ${selector}`);
    }
    const metrics = await page.evaluate(() => {
      const summary = document.querySelector('.publication_book-summary');
      const cover = document.querySelector('.publication_book-cover');
      const image = cover?.querySelector('img');
      const actions = document.querySelectorAll('.publication_book-action');
      return {
        summaryDisplay: summary ? getComputedStyle(summary).display : '',
        coverWidth: cover?.getBoundingClientRect().width || 0,
        imageWidth: image?.getBoundingClientRect().width || 0,
        imageHeight: image?.getBoundingClientRect().height || 0,
        actionCount: actions.length,
      };
    });
    if (metrics.coverWidth <= 0 || metrics.imageWidth <= 0 || metrics.imageHeight <= 0) throw new Error(`${label}: cover has no rendered geometry`);
    if (metrics.actionCount < 4) throw new Error(`${label}: expected reading + Amazon + additional CTA output, got ${metrics.actionCount}`);
    if (viewport.width < 768 && metrics.summaryDisplay !== 'flex') throw new Error(`${label}: SP summary must use responsive one-column flex owner, got ${metrics.summaryDisplay}`);
    if (viewport.width >= 768 && metrics.summaryDisplay !== 'grid') throw new Error(`${label}: PC summary must use grid owner, got ${metrics.summaryDisplay}`);
  } finally {
    await context.close();
  }
}

async function assertLong(viewport) {
  const label = `Tankoubon long ${viewport.width}`;
  const { context, page } = await open(viewport, ids.long);
  try {
    await assertResponsive(page, viewport, label);
    const metrics = await page.evaluate(() => {
      const heading = document.querySelector('.publication_book-heading');
      const meta = document.querySelector('.publication_book-meta');
      const action = document.querySelector('.publication_book-action');
      return {
        headingHeight: heading?.getBoundingClientRect().height || 0,
        metaWidth: meta?.getBoundingClientRect().width || 0,
        metaScroll: meta?.scrollWidth || 0,
        actionWidth: action?.getBoundingClientRect().width || 0,
        actionScroll: action?.scrollWidth || 0,
      };
    });
    if (metrics.headingHeight <= 0) throw new Error(`${label}: long heading did not render`);
    if (metrics.metaScroll > metrics.metaWidth + 1) throw new Error(`${label}: long metadata overflows ${metrics.metaScroll} > ${metrics.metaWidth}`);
    if (metrics.actionScroll > metrics.actionWidth + 1) throw new Error(`${label}: long CTA overflows ${metrics.actionScroll} > ${metrics.actionWidth}`);
  } finally {
    await context.close();
  }
}

async function assertEmpty(viewport) {
  const label = `Tankoubon empty ${viewport.width}`;
  const { context, page } = await open(viewport, ids.empty);
  try {
    await assertResponsive(page, viewport, label);
    if (!(await page.locator('.publication_book-head').count())) throw new Error(`${label}: head missing`);
    if (!(await page.locator('.publication_book-heading').count())) throw new Error(`${label}: title missing`);
    for (const selector of ['.publication_book-summary', '.publication_book-cover', '.publication_book-meta', '.publication_book-actions', '.publication_book-content']) {
      if (await page.locator(selector).count()) throw new Error(`${label}: empty owner must suppress ${selector}`);
    }
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

const cases = [
  ['standard', assertStandard],
  ['long', assertLong],
  ['empty', assertEmpty],
];

try {
  for (const viewport of viewports) {
    for (const [caseName, assertion] of cases) {
      console.log(`[Tankoubon QA] START case=${caseName} viewport=${viewport.width}x${viewport.height}`);
      try {
        await assertion(viewport);
        console.log(`[Tankoubon QA] PASS case=${caseName} viewport=${viewport.width}x${viewport.height}`);
      } catch (error) {
        console.error(`[Tankoubon QA] FAIL case=${caseName} viewport=${viewport.width}x${viewport.height}: ${error?.stack || error}`);
        throw error;
      }
    }
  }

  console.log('PASS Tankoubon detail real WordPress browser QA: standard/long/empty fixtures at 375/390/430/767/768/1380; responsive owner, empty suppression, CTA/content output and overflow boundaries.');
} finally {
  await browser.close();
}
