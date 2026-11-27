import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:8772/';
const outputDir = process.argv[3] || '/tmp/ref002-budokan-wave3';
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

function near(actual, expected, label, tolerance = 0.75) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected}, got ${actual} (${(actual - expected).toFixed(3)}px)`);
  }
}

async function capture(name, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    reducedMotion: 'reduce'
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => document.documentElement.dataset.aboutScrollMode, null, { timeout: 10000 });
  await page.evaluate(() => document.fonts?.ready);

  const read = () => page.evaluate(() => {
    const box = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x:r.x+scrollX, y:r.y+scrollY, width:r.width, height:r.height, bottom:r.bottom+scrollY };
    };
    const cards = [...document.querySelectorAll('.about-card')].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        id: el.dataset.aboutCard,
        display: getComputedStyle(el).display,
        x: r.x,
        y: r.y + scrollY,
        width: r.width,
        height: r.height
      };
    });
    const scroller = document.querySelector('[data-ref002-about-scroller]');
    const thumb = document.querySelector('.about-scroll-indicator span');
    const thumbRect = thumb?.getBoundingClientRect();
    return {
      document: {clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth},
      section: box('.about-section'),
      visual: box('.about-visual'),
      summary: box('.about-summary'),
      scroller: box('[data-ref002-about-scroller]'),
      indicator: box('.about-scroll-indicator'),
      cards,
      scroll: scroller ? {left:scroller.scrollLeft,clientWidth:scroller.clientWidth,scrollWidth:scroller.scrollWidth,max:scroller.scrollWidth-scroller.clientWidth} : null,
      thumb: thumbRect ? {x:thumbRect.x,width:thumbRect.width} : null,
      mode: document.documentElement.dataset.aboutScrollMode,
      assetPendingCount: document.querySelectorAll('[data-asset-status="pending"]').length
    };
  });

  let evidence = await read();
  if (evidence.document.scrollWidth > evidence.document.clientWidth + 1) {
    throw new Error(`${name}: page horizontal overflow ${evidence.document.scrollWidth}/${evidence.document.clientWidth}`);
  }
  if (evidence.assetPendingCount < 15) throw new Error(`${name}: About assets were silently treated as resolved`);

  if (name === 'pc') {
    near(evidence.section.y, 2696, 'pc.about.y');
    near(evidence.section.height, 1179, 'pc.about.height');
    near(evidence.visual.width, 420, 'pc.about.visual.width');
    near(evidence.visual.height, 700, 'pc.about.visual.height');
    near(evidence.summary.x, 520, 'pc.about.summary.x');
    near(evidence.summary.y, 2744, 'pc.about.summary.y');
    near(evidence.summary.width, 760, 'pc.about.summary.width');
    near(evidence.scroller.x, 520, 'pc.about.cards.x');
    near(evidence.scroller.y, 2908, 'pc.about.cards.y');
    near(evidence.scroller.width, 760, 'pc.about.cards.width');
    near(evidence.scroller.height, 967, 'pc.about.cards.height');
    if (evidence.mode !== 'pc-grid') throw new Error(`pc: unexpected About mode ${evidence.mode}`);
    const visible = evidence.cards.filter(card => card.display !== 'none');
    if (visible.length !== 6) throw new Error(`pc: expected six authored cards, got ${visible.length}`);
  } else {
    near(evidence.section.y, 4144, 'sp.about.y');
    near(evidence.section.height, 1053, 'sp.about.height');
    near(evidence.visual.width, 375, 'sp.about.visual.width');
    near(evidence.visual.height, 424, 'sp.about.visual.height');
    near(evidence.summary.x, 24, 'sp.about.summary.x');
    near(evidence.summary.y, 4324, 'sp.about.summary.y');
    near(evidence.summary.width, 327, 'sp.about.summary.width');
    near(evidence.summary.height, 488, 'sp.about.summary.height');
    near(evidence.scroller.x, 0, 'sp.about.scroller.x');
    near(evidence.scroller.y, 4852, 'sp.about.scroller.y');
    near(evidence.scroller.width, 375, 'sp.about.scroller.width');
    near(evidence.scroller.height, 244, 'sp.about.scroller.height');
    near(evidence.indicator.x, 24, 'sp.about.indicator.x');
    near(evidence.indicator.y, 5136, 'sp.about.indicator.y');
    near(evidence.indicator.width, 327, 'sp.about.indicator.width');
    near(evidence.scroll.left, 279, 'sp.about.initialScrollLeft', 1.25);
    near(evidence.scroll.clientWidth, 375, 'sp.about.scroller.clientWidth');
    near(evidence.scroll.scrollWidth, 933, 'sp.about.scroller.scrollWidth', 1);
    if (evidence.mode !== 'sp-native-scroll-snap') throw new Error(`sp: unexpected About mode ${evidence.mode}`);
    const visible = evidence.cards.filter(card => card.display !== 'none');
    if (visible.length !== 3) throw new Error(`sp: expected exactly three authored mobile cards, got ${visible.length}`);
    const card2 = visible.find(card => card.id === '2');
    near(card2.x, 40, 'sp.about.centerCard.x', 1.25);
    near(card2.width, 295, 'sp.about.centerCard.width');

    const scroller = page.locator('[data-ref002-about-scroller]');
    await scroller.evaluate((el) => el.scrollTo({left: el.scrollWidth - el.clientWidth, behavior:'auto'}));
    await page.waitForFunction(() => Number(document.documentElement.dataset.aboutScrollLeft || 0) > 550);
    const endState = await read();
    near(endState.scroll.left, 558, 'sp.about.endScrollLeft', 1.5);
    if (!(endState.thumb.x > evidence.thumb.x + 90)) throw new Error('sp: authored scroll indicator did not follow native scroller');

    await scroller.evaluate((el) => el.scrollTo({left:279,behavior:'auto'}));
    await page.waitForFunction(() => Math.abs(Number(document.documentElement.dataset.aboutScrollLeft || 0) - 279) < 2);
    evidence = await read();
  }

  await page.screenshot({path:`${outputDir}/${name}-about-wave3.png`,fullPage:true});
  await page.close();
  return {name,width,height,evidence};
}

try {
  const pc = await capture('pc',1380,900);
  const sp = await capture('sp',375,844);
  const out = {
    generatedAt:new Date().toISOString(),
    evidenceDomain:'web-page',
    learning:{
      desktop:'six-card two-column grid',
      mobile:'three-card authored horizontal native scroll-snap; do not invent PC-only cards',
      principle:'responsive counterpart discovery must search descendants and preserve authored content/placement differences instead of assuming hide-or-scale'
    },
    pc,sp
  };
  await fs.writeFile(`${outputDir}/about-wave3-evidence.json`,JSON.stringify(out,null,2));
  console.log(JSON.stringify(out,null,2));
} finally {
  await browser.close();
}
