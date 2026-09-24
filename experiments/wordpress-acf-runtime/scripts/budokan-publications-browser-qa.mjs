import { chromium } from 'playwright';

const [baseUrl, pagesJson, budoJson, shodouJson = '{}'] = process.argv.slice(2);
if (!baseUrl || !pagesJson || !budoJson) {
  throw new Error('usage: node budokan-publications-browser-qa.mjs <baseUrl> <pagesJson> <budoIdsJson> [shodouIdsJson]');
}

const pages = JSON.parse(pagesJson);
const budoIds = JSON.parse(budoJson);
const shodouIds = JSON.parse(shodouJson);
const hasShodou = Boolean(pages.shodou_back && shodouIds.full);
const browser = await chromium.launch({ headless: true });

const almost = (actual, expected, tolerance = 1) => {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`expected ${expected}±${tolerance}, got ${actual}`);
  }
};
const pageUrl = id => `${baseUrl}/?page_id=${id}`;
const postUrl = (id, type) => `${baseUrl}/?p=${id}&post_type=${encodeURIComponent(type)}`;

async function open(viewport, url) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const response = await page.goto(url, { waitUntil: 'load' });
  if (!response || !response.ok()) throw new Error(`HTTP failure ${url}: ${response?.status()}`);
  return { context, page };
}

async function assertResponsiveDocument(page, viewport, label) {
  const m = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    bodyMin: getComputedStyle(document.body).minWidth,
  }));
  if (viewport.width < 768 && m.scroll > m.client + 1) {
    throw new Error(`${label}: unexpected SP horizontal overflow ${m.scroll} > ${m.client}`);
  }
  if (viewport.width >= 768 && parseFloat(m.bodyMin || '0') < 1280) {
    throw new Error(`${label}: PC breakpoint must retain body min-width 1280, got ${m.bodyMin}`);
  }
}

async function assertList(url, label, viewport, { pdf = false } = {}) {
  const { context, page } = await open(viewport, url);
  try {
    await assertResponsiveDocument(page, viewport, label);
    const shell = page.locator('.publication_budo-shell--list').first();
    const first = page.locator('.publication_budo-backItem').first();
    if (!(await shell.count()) || !(await first.count())) throw new Error(`${label}: list shell/item missing`);

    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('.publication_budo-shell--list');
      const main = shell?.querySelector('.gc_main');
      const cover = document.querySelector('.publication_budo-backItem .publication_budo-backCover');
      const detail = document.querySelector('.publication_budo-backItem .publication_budo-backDetail .wp-block-button__link');
      const cs = shell ? getComputedStyle(shell) : null;
      const ds = detail ? getComputedStyle(detail) : null;
      const before = detail ? getComputedStyle(detail, '::before') : null;
      const noImage = document.querySelector('.publication_budo-backItem._noImage');
      const copy = document.querySelector('.publication_budo-backItem .publication_budo-backCopy');
      const copyCs = copy ? getComputedStyle(copy) : null;
      return {
        shellPaddingLeft: cs ? parseFloat(cs.paddingLeft) : -1,
        shellPaddingTop: cs ? parseFloat(cs.paddingTop) : -1,
        shellPaddingBottom: cs ? parseFloat(cs.paddingBottom) : -1,
        mainWidth: main?.getBoundingClientRect().width || 0,
        coverWidth: cover?.getBoundingClientRect().width || 0,
        coverHeight: cover?.getBoundingClientRect().height || 0,
        detailFont: ds ? parseFloat(ds.fontSize) : 0,
        detailGap: ds ? parseFloat(ds.gap) : 0,
        detailIconWidth: before ? parseFloat(before.width) : 0,
        detailIconHeight: before ? parseFloat(before.height) : 0,
        noImage: Boolean(noImage),
        copyGap: copyCs ? parseFloat(copyCs.columnGap || copyCs.gap) : -1,
        copyAlign: copyCs ? copyCs.alignItems : '',
        detailInCopy: Boolean(copy?.querySelector('.publication_budo-backDetail')),
      };
    });

    almost(metrics.shellPaddingLeft, viewport.width < 768 ? 24 : 60);
    almost(metrics.shellPaddingTop, viewport.width < 768 ? 48 : 64);
    almost(metrics.shellPaddingBottom, viewport.width < 768 ? 64 : 100);
    if (viewport.width === 1380) almost(metrics.mainWidth, 1040);
    almost(metrics.coverWidth, 160);
    almost(metrics.coverHeight, 226);
    // New Figma authority OtS... (Budo SP 2608:5702 / Shodou PC 2629:7385)
    // uses the small-button family but its publication CTA geometry is 16px text,
    // 8px gap and a 26px octagon. Guard the visual authority rather than silently
    // accepting a later shared-button cascade that changes the computed result.
    almost(metrics.detailFont, 16);
    almost(metrics.detailGap, 8);
    almost(metrics.detailIconWidth, 26);
    almost(metrics.detailIconHeight, 26);
    if (!metrics.detailInCopy) throw new Error(`${label}: detail CTA must sit in the summary column`);
    almost(metrics.copyGap, viewport.width < 768 ? 24 : 30);
    const expectedAlign = viewport.width < 768 ? 'flex-end' : 'flex-start';
    if (metrics.copyAlign !== expectedAlign) {
      throw new Error(`${label}: summary column align ${metrics.copyAlign}, expected ${expectedAlign}`);
    }
    if (!metrics.noImage) throw new Error(`${label}: no-image fixture not represented in real output`);

    if (pdf) {
      const count = await page.locator('.publication_budo-backPdf a[href$=".pdf"]').count();
      if (count < 1) throw new Error(`${label}: expected PDF text links from Shodou repeater`);
    }

    const coverLink = first.locator('.publication_budo-coverLink');
    const image = coverLink.locator('img');
    if (await coverLink.count()) {
      const objectFit = await image.evaluate(el => getComputedStyle(el).objectFit);
      if (objectFit !== 'cover') throw new Error(`${label}: cover object-fit=${objectFit}`);
      const beforeBox = await coverLink.boundingBox();

      for (let i = 0; i < 80; i += 1) {
        await page.keyboard.press('Tab');
        const active = await page.evaluate(() => document.activeElement?.classList.contains('publication_budo-coverLink') || false);
        if (active) break;
      }
      const activeIsCover = await page.evaluate(() => document.activeElement?.classList.contains('publication_budo-coverLink') || false);
      if (!activeIsCover) throw new Error(`${label}: keyboard could not reach cover link`);
      await page.waitForTimeout(230);
      const focusOpacity = parseFloat(await image.evaluate(el => getComputedStyle(el).opacity));
      almost(focusOpacity, 0.7, 0.02);

      await coverLink.hover();
      await page.waitForTimeout(230);
      const hoverOpacity = parseFloat(await image.evaluate(el => getComputedStyle(el).opacity));
      almost(hoverOpacity, 0.7, 0.02);
      const afterBox = await coverLink.boundingBox();
      if (!beforeBox || !afterBox) throw new Error(`${label}: cover box unavailable`);
      almost(afterBox.width, beforeBox.width, 0.1);
      almost(afterBox.height, beforeBox.height, 0.1);
      almost(afterBox.x, beforeBox.x, 0.1);
      almost(afterBox.y, beforeBox.y, 0.1);
    }
  } finally {
    await context.close();
  }
}

async function assertDetail(url, label, viewport) {
  const { context, page } = await open(viewport, url);
  try {
    await assertResponsiveDocument(page, viewport, label);
    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('.publication_budo-shell--detail');
      const main = shell?.querySelector('.gc_main');
      const cover = document.querySelector('.publication_budo-cover');
      const image = cover?.querySelector('img');
      const cs = shell ? getComputedStyle(shell) : null;
      return {
        shellPaddingLeft: cs ? parseFloat(cs.paddingLeft) : -1,
        shellPaddingTop: cs ? parseFloat(cs.paddingTop) : -1,
        shellPaddingBottom: cs ? parseFloat(cs.paddingBottom) : -1,
        mainWidth: main?.getBoundingClientRect().width || 0,
        coverWidth: cover?.getBoundingClientRect().width || 0,
        coverHeight: cover?.getBoundingClientRect().height || 0,
        objectFit: image ? getComputedStyle(image).objectFit : '',
      };
    });
    almost(metrics.shellPaddingLeft, viewport.width < 768 ? 24 : 60);
    almost(metrics.shellPaddingTop, viewport.width < 768 ? 48 : 64);
    almost(metrics.shellPaddingBottom, viewport.width < 768 ? 64 : 100);
    if (viewport.width === 1380) almost(metrics.mainWidth, 960);
    almost(metrics.coverWidth, 140);
    almost(metrics.coverHeight, 198);
    if (metrics.objectFit !== 'cover') throw new Error(`${label}: detail object-fit=${metrics.objectFit}`);
  } finally {
    await context.close();
  }
}

const spViewports = [{ width: 375, height: 900 }, { width: 390, height: 900 }, { width: 430, height: 900 }, { width: 767, height: 900 }];
for (const viewport of spViewports) {
  await assertList(pageUrl(pages.budo_back), `Budo list SP ${viewport.width}`, viewport);
  await assertDetail(postUrl(budoIds.full, 'budo-book'), `Budo detail SP ${viewport.width}`, viewport);
  if (hasShodou) {
    await assertList(pageUrl(pages.shodou_back), `Shodou list SP ${viewport.width}`, viewport, { pdf: true });
    await assertDetail(postUrl(shodouIds.full, 'shodou-book'), `Shodou detail SP ${viewport.width}`, viewport);
  }
}

const breakpoint = { width: 768, height: 900 };
await assertList(pageUrl(pages.budo_back), 'Budo list breakpoint 768', breakpoint);
if (hasShodou) await assertList(pageUrl(pages.shodou_back), 'Shodou list breakpoint 768', breakpoint, { pdf: true });

const pc = { width: 1380, height: 1000 };
await assertList(pageUrl(pages.budo_back), 'Budo list PC 1380', pc);
await assertDetail(postUrl(budoIds.full, 'budo-book'), 'Budo detail PC 1380', pc);
if (hasShodou) {
  await assertList(pageUrl(pages.shodou_back), 'Shodou list PC 1380', pc, { pdf: true });
  await assertDetail(postUrl(shodouIds.full, 'shodou-book'), 'Shodou detail PC 1380', pc);
}

console.log(`PASS Budokan publication real WordPress browser QA: Budo${hasShodou ? ' + Shodou' : ''}; shared rails, cover geometry, Figma-authoritative publication CTA geometry, hover/focus opacity, empty-image cases, responsive overflow${hasShodou ? ', PDF links' : ''}.`);
await browser.close();
