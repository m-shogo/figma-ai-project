import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) process.exit(2);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;

const browser = await chromium.launch({ headless: true });
try {
  const mobileContext = await browser.newContext({ viewport: { width: 375, height: 1200 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  const sp = await mobilePage.evaluate(() => {
    const root = document.querySelector('.top_mainVisual');
    const mv = root?.querySelector('.tm_mv');
    const bg = root?.querySelector('.tm_background');
    const inner = root?.querySelector('.tm_inner');
    const title = root?.querySelector('.tm_title');
    const lead = root?.querySelector('.tm_lead');
    const notice = root?.querySelector('.top_notice-01');
    const noticeInner = notice?.querySelector('.tn_inner');
    const noticeText = notice?.querySelector('.tn_text, .tn_item');
    const guide = root?.querySelector('.tm_guide');
    if (!root || !mv || !bg || !inner || !title || !lead || !notice || !noticeInner || !noticeText || !guide) return null;
    const rootRect = root.getBoundingClientRect();
    const mvRect = mv.getBoundingClientRect();
    const bgRect = bg.getBoundingClientRect();
    const innerRect = inner.getBoundingClientRect();
    const noticeRect = notice.getBoundingClientRect();
    return {
      rootWidth: rootRect.width,
      viewportWidth: document.documentElement.clientWidth,
      mvWidth: mvRect.width,
      bgHeight: bgRect.height,
      titleSize: parseFloat(getComputedStyle(title).fontSize),
      titleLineHeight: parseFloat(getComputedStyle(title).lineHeight),
      leadSize: parseFloat(getComputedStyle(lead).fontSize),
      leadLineHeight: parseFloat(getComputedStyle(lead).lineHeight),
      innerLeft: innerRect.left - mvRect.left,
      innerTop: innerRect.top - mvRect.top,
      noticeWidth: noticeRect.width,
      noticeHeight: noticeInner.getBoundingClientRect().height,
      noticeTopRelativeToMv: noticeRect.top - mvRect.top,
      noticeTextSize: parseFloat(getComputedStyle(noticeText).fontSize),
      guideDisplay: getComputedStyle(guide).display,
    };
  });
  assert(sp, 'SP TOP FV elements missing');
  assert(close(sp.viewportWidth, 375), `SP viewport width ${sp.viewportWidth}`);
  assert(close(sp.rootWidth, sp.viewportWidth), `SP root width ${sp.rootWidth} vs viewport ${sp.viewportWidth}`);
  assert(close(sp.mvWidth, sp.rootWidth), `SP MV width ${sp.mvWidth} vs root ${sp.rootWidth}`);
  assert(close(sp.bgHeight, 483, 1), `SP MV height ${sp.bgHeight}`);
  assert(close(sp.titleSize, 32, 0.5), `SP title size ${sp.titleSize}`);
  assert(close(sp.titleLineHeight, 44.8, 1), `SP title line-height ${sp.titleLineHeight}`);
  assert(close(sp.leadSize, 15, 0.5), `SP lead size ${sp.leadSize}`);
  assert(close(sp.leadLineHeight, 24, 1), `SP lead line-height ${sp.leadLineHeight}`);
  assert(close(sp.innerLeft, 20, 1), `SP inner left ${sp.innerLeft}`);
  assert(close(sp.innerTop, 246, 2), `SP inner top ${sp.innerTop}`);
  assert(close(sp.noticeWidth, 335, 1), `SP notice width ${sp.noticeWidth}`);
  assert(close(sp.noticeHeight, 70, 1), `SP notice height ${sp.noticeHeight}`);
  assert(close(sp.noticeTopRelativeToMv, 448, 2), `SP notice relative top ${sp.noticeTopRelativeToMv}`);
  assert(close(sp.noticeTextSize, 13, 0.5), `SP notice text ${sp.noticeTextSize}`);
  assert(sp.guideDisplay === 'none', `SP guide display ${sp.guideDisplay}`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 1000 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await desktopPage.evaluate(() => {
    const root = document.querySelector('.top_mainVisual');
    const stage = root?.querySelector('.tm_stage');
    const mv = root?.querySelector('.tm_mv');
    const bg = root?.querySelector('.tm_background');
    const inner = root?.querySelector('.tm_inner');
    const title = root?.querySelector('.tm_title');
    const lead = root?.querySelector('.tm_lead');
    const guide = root?.querySelector('.tm_guide');
    const notice = root?.querySelector('.top_notice-01');
    const noticeInner = notice?.querySelector('.tn_inner');
    if (!root || !stage || !mv || !bg || !inner || !title || !lead || !guide || !notice || !noticeInner) return null;
    const rootRect = root.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const mvRect = mv.getBoundingClientRect();
    const guideRect = guide.getBoundingClientRect();
    const innerRect = inner.getBoundingClientRect();
    return {
      rootLeft: rootRect.left,
      rootWidth: rootRect.width,
      stageLeft: stageRect.left,
      stageWidth: stageRect.width,
      stageGap: parseFloat(getComputedStyle(stage).columnGap),
      mvHeight: bg.getBoundingClientRect().height,
      guideWidth: guideRect.width,
      guideHeight: guideRect.height,
      guideDisplay: getComputedStyle(guide).display,
      titleSize: parseFloat(getComputedStyle(title).fontSize),
      leadSize: parseFloat(getComputedStyle(lead).fontSize),
      innerTop: innerRect.top - mvRect.top,
      noticeWidth: notice.getBoundingClientRect().width,
      noticeHeight: noticeInner.getBoundingClientRect().height,
    };
  });
  assert(pc, 'PC TOP FV elements missing');
  assert(close(pc.stageLeft, pc.rootLeft, 1), `PC stage/root left ${pc.stageLeft}/${pc.rootLeft}`);
  assert(close(pc.stageWidth, pc.rootWidth, 1), `PC stage/root width ${pc.stageWidth}/${pc.rootWidth}`);
  assert(pc.stageWidth >= 1360 && pc.stageWidth <= 1380, `PC rendered stage width ${pc.stageWidth}`);
  assert(close(pc.stageGap, 20, 1), `PC stage gap ${pc.stageGap}`);
  assert(close(pc.mvHeight, 600, 1), `PC MV height ${pc.mvHeight}`);
  assert(close(pc.guideWidth, 240, 1) && close(pc.guideHeight, 600, 1), `PC guide ${pc.guideWidth}x${pc.guideHeight}`);
  assert(pc.guideDisplay !== 'none', 'PC guide unexpectedly hidden');
  assert(close(pc.titleSize, 44, 0.5), `PC title size ${pc.titleSize}`);
  assert(close(pc.leadSize, 18, 0.5), `PC lead size ${pc.leadSize}`);
  assert(close(pc.innerTop, 330, 2), `PC inner top ${pc.innerTop}`);
  assert(close(pc.noticeWidth, 700, 1), `PC notice width ${pc.noticeWidth}`);
  assert(close(pc.noticeHeight, 80, 1), `PC notice height ${pc.noticeHeight}`);
  await desktopContext.close();

  console.log('PASS Budokan TOP FV canonical SP geometry and hidden desktop-only guide QA.');
  console.log('PASS Budokan TOP FV canonical PC MV + purpose guide + notice geometry QA.');
} finally {
  await browser.close();
}
