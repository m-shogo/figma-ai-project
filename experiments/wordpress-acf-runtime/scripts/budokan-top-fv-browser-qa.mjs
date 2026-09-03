import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) process.exit(2);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const close = (actual, expected, tolerance = 2) => Math.abs(actual - expected) <= tolerance;
function isMinchoFamily(family) {
  const value = String(family || '').toLowerCase();
  if (value.includes('sans-serif')) return false;
  return value.includes('mincho') || value.includes('zen old');
}
function isKakuFamily(family) {
  return String(family || '').toLowerCase().includes('kaku');
}

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
      titleFamily: getComputedStyle(title).fontFamily,
      titleLineHeight: parseFloat(getComputedStyle(title).lineHeight),
      leadSize: parseFloat(getComputedStyle(lead).fontSize),
      leadFamily: getComputedStyle(lead).fontFamily,
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
  assert(isMinchoFamily(sp.titleFamily), `SP title must resolve to Zen Old Mincho, got ${sp.titleFamily}.`);
  assert(close(sp.titleLineHeight, 44.8, 1), `SP title line-height ${sp.titleLineHeight}`);
  assert(close(sp.leadSize, 15, 0.5), `SP lead size ${sp.leadSize}`);
  assert(isKakuFamily(sp.leadFamily), `SP lead must resolve to Zen Kaku Gothic New, got ${sp.leadFamily}.`);
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
    const guideBody = root?.querySelector('.tm_guide_body');
    const guideHead = root?.querySelector('.tm_guide_head');
    const firstGuideGroup = root?.querySelector('.tm_guide_group');
    const lastGuideTitle = root?.querySelector('.tm_guide_group:last-child .tm_guide_title');
    if (!root || !stage || !mv || !bg || !inner || !title || !lead || !guide || !notice || !noticeInner || !guideBody || !guideHead || !firstGuideGroup || !lastGuideTitle) return null;
    const rootRect = root.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const mvRect = mv.getBoundingClientRect();
    const guideRect = guide.getBoundingClientRect();
    const innerRect = inner.getBoundingClientRect();
    const noticeStyle = getComputedStyle(noticeInner);
    return {
      rootLeft: rootRect.left,
      rootWidth: rootRect.width,
      stageLeft: stageRect.left,
      stageWidth: stageRect.width,
      stageGap: parseFloat(getComputedStyle(stage).columnGap),
      mvWidth: mvRect.width,
      mvHeight: bg.getBoundingClientRect().height,
      guideWidth: guideRect.width,
      guideHeight: guideRect.height,
      guideDisplay: getComputedStyle(guide).display,
      titleSize: parseFloat(getComputedStyle(title).fontSize),
      titleFamily: getComputedStyle(title).fontFamily,
      titleLineHeight: parseFloat(getComputedStyle(title).lineHeight),
      leadSize: parseFloat(getComputedStyle(lead).fontSize),
      leadFamily: getComputedStyle(lead).fontFamily,
      innerLeft: innerRect.left - mvRect.left,
      innerTop: innerRect.top - mvRect.top,
      noticeWidth: notice.getBoundingClientRect().width,
      noticeHeight: noticeInner.getBoundingClientRect().height,
      noticeBg: noticeStyle.backgroundColor,
      noticeColor: noticeStyle.color,
      noticeBorderWidth: parseFloat(noticeStyle.borderTopWidth),
      noticeBorderColor: noticeStyle.borderTopColor,
      noticeTopLeftRadius: parseFloat(noticeStyle.borderTopLeftRadius),
      noticeTopRightRadius: parseFloat(noticeStyle.borderTopRightRadius),
      noticeBottomRightRadius: parseFloat(noticeStyle.borderBottomRightRadius),
      noticeBottomLeftRadius: parseFloat(noticeStyle.borderBottomLeftRadius),
      guideBodyBg: getComputedStyle(guideBody).backgroundColor,
      guideHeadFamily: getComputedStyle(guideHead).fontFamily,
      guideSeparatorColor: getComputedStyle(firstGuideGroup).borderBottomColor,
      lastGuideTitleSpacing: parseFloat(getComputedStyle(lastGuideTitle).letterSpacing),
    };
  });
  assert(pc, 'PC TOP FV elements missing');
  assert(close(pc.stageLeft, pc.rootLeft, 1), `PC stage/root left ${pc.stageLeft}/${pc.rootLeft}`);
  assert(close(pc.stageWidth, pc.rootWidth, 1), `PC stage/root width ${pc.stageWidth}/${pc.rootWidth}`);
  assert(pc.stageWidth >= 1360 && pc.stageWidth <= 1380, `PC rendered stage width ${pc.stageWidth}`);
  assert(close(pc.stageGap, 20, 1), `PC stage gap ${pc.stageGap}`);
  assert(close(pc.mvWidth, 1030, 1), `PC MV width ${pc.mvWidth}`);
  assert(close(pc.mvHeight, 600, 1), `PC MV height ${pc.mvHeight}`);
  assert(close(pc.guideWidth, 240, 1) && close(pc.guideHeight, 600, 1), `PC guide ${pc.guideWidth}x${pc.guideHeight}`);
  assert(pc.guideDisplay !== 'none', 'PC guide unexpectedly hidden');
  assert(close(pc.titleSize, 46, 0.5), `PC title size ${pc.titleSize}`);
  assert(isMinchoFamily(pc.titleFamily), `PC title must resolve to Zen Old Mincho, got ${pc.titleFamily}.`);
  assert(close(pc.titleLineHeight, 69, 1), `PC title line-height ${pc.titleLineHeight}`);
  assert(close(pc.leadSize, 18, 0.5), `PC lead size ${pc.leadSize}`);
  assert(isKakuFamily(pc.leadFamily), `PC lead must resolve to Zen Kaku Gothic New, got ${pc.leadFamily}.`);
  assert(close(pc.innerLeft, 60, 1), `PC inner left ${pc.innerLeft}`);
  assert(close(pc.innerTop, 307, 2), `PC inner top ${pc.innerTop}`);
  assert(close(pc.noticeWidth, 600, 1), `PC notice width ${pc.noticeWidth}`);
  assert(close(pc.noticeHeight, 70, 1), `PC notice height ${pc.noticeHeight}`);
  assert(pc.noticeBg === 'rgb(255, 255, 255)', `PC notice expected white, got ${pc.noticeBg}.`);
  assert(pc.noticeColor === 'rgb(191, 62, 43)', `PC notice text expected primary #bf3e2b, got ${pc.noticeColor}.`);
  assert(close(pc.noticeBorderWidth, 1, 0.1), `PC notice border width ${pc.noticeBorderWidth}`);
  assert(pc.noticeBorderColor === 'rgb(191, 62, 43)', `PC notice border expected primary #bf3e2b, got ${pc.noticeBorderColor}.`);
  assert(close(pc.noticeTopLeftRadius, 0, 0.1), `PC notice top-left radius ${pc.noticeTopLeftRadius}`);
  assert(close(pc.noticeTopRightRadius, 3, 0.1), `PC notice top-right radius ${pc.noticeTopRightRadius}`);
  assert(close(pc.noticeBottomRightRadius, 3, 0.1), `PC notice bottom-right radius ${pc.noticeBottomRightRadius}`);
  assert(close(pc.noticeBottomLeftRadius, 3, 0.1), `PC notice bottom-left radius ${pc.noticeBottomLeftRadius}`);
  assert(pc.guideBodyBg === 'rgb(249, 242, 229)', `PC guide body expected #f9f2e5, got ${pc.guideBodyBg}.`);
  assert(isMinchoFamily(pc.guideHeadFamily), `PC guide head must resolve to Zen Old Mincho, got ${pc.guideHeadFamily}.`);
  assert(pc.guideSeparatorColor === 'rgb(226, 211, 184)', `PC guide separator expected #e2d3b8, got ${pc.guideSeparatorColor}.`);
  assert(close(pc.lastGuideTitleSpacing, 1.6, 0.2), `PC final guide title tracking ${pc.lastGuideTitleSpacing}`);
  await desktopContext.close();

  console.log('PASS Budokan TOP FV canonical SP geometry and hidden desktop-only guide QA.');
  console.log('PASS Budokan TOP FV current PC MV + purpose guide + notice geometry QA.');
} finally {
  await browser.close();
}
