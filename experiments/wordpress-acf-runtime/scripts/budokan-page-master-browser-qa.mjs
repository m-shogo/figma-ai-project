import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-page-master-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function near(actual, expected, tolerance = 1) {
  return Math.abs(actual - expected) <= tolerance;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1380, height: 1000 } });

try {
  await page.goto(url, { waitUntil: 'networkidle' });

  const pc = await page.evaluate(() => {
    const header = document.querySelector('header');
    const visual = document.querySelector('.global_mainVisual');
    const visualInner = visual?.querySelector('.gm_inner');
    const title = visual?.querySelector('.gm_title');
    const content = document.querySelector('.global_inner._content');
    const main = document.querySelector('.gc_main._oneColumn');
    const localNav = document.querySelector('.global_inner._localNavigation .local_navigation');
    const breadcrumb = document.querySelector('.module_breadCrumb');
    const breadcrumbInner = breadcrumb?.querySelector('.mb_inner');
    const breadcrumbList = breadcrumb?.querySelector('.module_breadCrumb-01');
    const breadcrumbFirstItem = breadcrumbList?.querySelector('li');
    const footer = document.querySelector('footer');
    if (!header || !visual || !visualInner || !title || !content || !main || !localNav || !breadcrumb || !breadcrumbInner || !breadcrumbList || !breadcrumbFirstItem || !footer) return null;

    const rect = (el) => {
      const box = el.getBoundingClientRect();
      return {
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      };
    };

    const pickStyle = (el) => {
      const style = getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        fontFamily: style.fontFamily,
        fontSize: parseFloat(style.fontSize),
        fontWeight: style.fontWeight,
        lineHeight: parseFloat(style.lineHeight),
        letterSpacing: parseFloat(style.letterSpacing),
        textAlign: style.textAlign,
        paddingTop: parseFloat(style.paddingTop),
        paddingRight: parseFloat(style.paddingRight),
        paddingBottom: parseFloat(style.paddingBottom),
        paddingLeft: parseFloat(style.paddingLeft),
      };
    };

    const contentStyle = getComputedStyle(content);
    const contentPaddingLeft = parseFloat(contentStyle.paddingLeft);
    const contentPaddingRight = parseFloat(contentStyle.paddingRight);

    return {
      innerWidth: window.innerWidth,
      rootClientWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      body: rect(document.body),
      header: rect(header),
      visual: rect(visual),
      visualStyle: pickStyle(visual),
      visualInner: rect(visualInner),
      title: rect(title),
      titleStyle: pickStyle(title),
      content: rect(content),
      main: rect(main),
      localNav: rect(localNav),
      breadcrumb: rect(breadcrumb),
      breadcrumbStyle: pickStyle(breadcrumb),
      breadcrumbInner: rect(breadcrumbInner),
      breadcrumbInnerStyle: pickStyle(breadcrumbInner),
      breadcrumbFirstItemStyle: pickStyle(breadcrumbFirstItem),
      footer: rect(footer),
      contentPaddingLeft,
      contentPaddingRight,
      contentAreaLeft: rect(content).left + contentPaddingLeft,
      contentAreaRight: rect(content).right - contentPaddingRight,
      contentAreaWidth: rect(content).width - contentPaddingLeft - contentPaddingRight,
    };
  });

  assert(pc, 'PC normal-page master owner elements were not found.');

  // Current Figma normal-page authority: FKQaJDu5TZXHoCzPsfP92E / 1203:4865.
  // Header occupies y=0..100, page title y=100..320, authored content is
  // x=210..1170 (960px), Local Navigation follows content at full width,
  // then breadcrumb, then footer.
  //
  // Current title authority (1203:4867): Zen Old Mincho Bold 32px, 140%
  // line-height, 5% tracking, centered in the 220px gold title surface.
  // Current breadcrumb authority (1203:4868): 61px high, Zen Kaku Gothic New
  // Regular 13px / 100% / 5% tracking, with 64px desktop inline padding and
  // 24px block padding.
  //
  // Theme ownership is deliberate here: .global_inner._content has a 1080px
  // outer box because --width-content:960px is wrapped by the shared 60px
  // tablet/desktop padding on each side. The Figma 960px frame maps to the
  // padded wrapper's authored content area / .gc_main, not to that outer box.
  // Measure the actual authored area instead of weakening the Theme token.
  // The live Theme also reserves a stable scrollbar gutter, so compare full-
  // width surfaces to the actual body containing block rather than 1380px.
  assert(pc.rootScrollWidth <= pc.rootClientWidth + 1, `PC normal page must not introduce horizontal overflow: scrollWidth=${pc.rootScrollWidth}, clientWidth=${pc.rootClientWidth}.`);
  assert(near(pc.header.height, 100), `PC header height expected 100px from Figma 1203:4876, got ${pc.header.height}px.`);
  assert(near(pc.visual.top, pc.header.bottom), `PC page visual should start directly after the 100px header: visualTop=${pc.visual.top}, headerBottom=${pc.header.bottom}.`);
  assert(near(pc.visual.left, pc.body.left) && near(pc.visual.right, pc.body.right), `PC page visual should fill the body containing block: visual=${JSON.stringify(pc.visual)}, body=${JSON.stringify(pc.body)}.`);
  assert(near(pc.visual.height, 220), `PC page visual height expected 220px from Figma 1203:4867, got ${pc.visual.height}px.`);
  assert(pc.visualStyle.backgroundColor === 'rgb(202, 153, 87)', `PC page visual gold expected #ca9957 from current Figma/Theme token, got ${pc.visualStyle.backgroundColor}.`);

  assert(pc.titleStyle.fontFamily.includes('Zen Old Mincho'), `PC page title font family expected Zen Old Mincho, got ${pc.titleStyle.fontFamily}.`);
  assert(near(pc.titleStyle.fontSize, 32, 0.1), `PC page title font size expected 32px, got ${pc.titleStyle.fontSize}px.`);
  assert(Number(pc.titleStyle.fontWeight) === 700, `PC page title font weight expected 700, got ${pc.titleStyle.fontWeight}.`);
  assert(near(pc.titleStyle.lineHeight, 44.8, 0.2), `PC page title line-height expected 44.8px (140%), got ${pc.titleStyle.lineHeight}px.`);
  assert(near(pc.titleStyle.letterSpacing, 1.6, 0.1), `PC page title tracking expected 1.6px (5%), got ${pc.titleStyle.letterSpacing}px.`);
  assert(pc.titleStyle.textAlign === 'center', `PC page title text-align expected center, got ${pc.titleStyle.textAlign}.`);
  assert(near((pc.title.top + pc.title.bottom) / 2, (pc.visual.top + pc.visual.bottom) / 2, 1), `PC page title should remain vertically centered in the 220px title surface: title=${JSON.stringify(pc.title)}, visual=${JSON.stringify(pc.visual)}.`);

  assert(near(pc.contentAreaWidth, 960), `PC normal-page authored content area expected 960px from Figma 1203:4878, got ${pc.contentAreaWidth}px (outer=${pc.content.width}, padding=${pc.contentPaddingLeft}+${pc.contentPaddingRight}).`);
  assert(near((pc.contentAreaLeft + pc.contentAreaRight) / 2, (pc.body.left + pc.body.right) / 2), `PC normal-page authored content area should remain centered: area=${pc.contentAreaLeft}..${pc.contentAreaRight}, body=${JSON.stringify(pc.body)}.`);
  assert(near(pc.content.top, pc.visual.bottom), `PC content wrapper should start directly after page visual: contentTop=${pc.content.top}, visualBottom=${pc.visual.bottom}.`);
  assert(near(pc.main.left, pc.contentAreaLeft) && near(pc.main.right, pc.contentAreaRight), `PC one-column main should fill the authored 960px content area: main=${JSON.stringify(pc.main)}, area=${pc.contentAreaLeft}..${pc.contentAreaRight}.`);

  assert(near(pc.localNav.left, pc.body.left) && near(pc.localNav.right, pc.body.right), `PC Local Navigation should remain a full-width surface in the normal-page master: nav=${JSON.stringify(pc.localNav)}, body=${JSON.stringify(pc.body)}.`);
  assert(pc.localNav.top >= pc.content.bottom - 1, `PC Local Navigation must follow content without overlap: navTop=${pc.localNav.top}, contentBottom=${pc.content.bottom}.`);
  assert(pc.breadcrumb.top >= pc.localNav.bottom - 1, `PC breadcrumb must follow Local Navigation: breadcrumbTop=${pc.breadcrumb.top}, navBottom=${pc.localNav.bottom}.`);
  assert(near(pc.breadcrumb.height, 61), `PC breadcrumb height expected 61px from Figma 1203:4868, got ${pc.breadcrumb.height}px.`);
  assert(pc.breadcrumbStyle.fontFamily.includes('Zen Kaku Gothic'), `PC breadcrumb font family expected Zen Kaku Gothic New, got ${pc.breadcrumbStyle.fontFamily}.`);
  assert(near(pc.breadcrumbStyle.fontSize, 13, 0.1), `PC breadcrumb font size expected 13px, got ${pc.breadcrumbStyle.fontSize}px.`);
  assert(Number(pc.breadcrumbStyle.fontWeight) === 400, `PC breadcrumb base font weight expected 400, got ${pc.breadcrumbStyle.fontWeight}.`);
  assert(near(pc.breadcrumbStyle.lineHeight, 13, 0.1), `PC breadcrumb line-height expected 13px (100%), got ${pc.breadcrumbStyle.lineHeight}px.`);
  assert(near(pc.breadcrumbStyle.letterSpacing, 0.65, 0.1), `PC breadcrumb tracking expected 0.65px (5%), got ${pc.breadcrumbStyle.letterSpacing}px.`);
  assert(near(pc.breadcrumbInnerStyle.paddingLeft, 64) && near(pc.breadcrumbInnerStyle.paddingRight, 64), `PC breadcrumb inline padding expected 64px, got ${pc.breadcrumbInnerStyle.paddingLeft}/${pc.breadcrumbInnerStyle.paddingRight}px.`);
  assert(near(pc.breadcrumbInnerStyle.paddingTop, 24) && near(pc.breadcrumbInnerStyle.paddingBottom, 24), `PC breadcrumb block padding expected 24px, got ${pc.breadcrumbInnerStyle.paddingTop}/${pc.breadcrumbInnerStyle.paddingBottom}px.`);
  assert(near(pc.breadcrumbInner.left - pc.body.left, 0) && near(pc.body.right - pc.breadcrumbInner.right, 0), `PC breadcrumb inner should remain full-width before its 64px padding: inner=${JSON.stringify(pc.breadcrumbInner)}, body=${JSON.stringify(pc.body)}.`);
  assert(pc.footer.top >= pc.breadcrumb.bottom - 1, `PC footer must follow breadcrumb without overlap: footerTop=${pc.footer.top}, breadcrumbBottom=${pc.breadcrumb.bottom}.`);

  console.log('PASS Budokan PC normal-page master current-Figma geometry/typography/order QA.');
} finally {
  await browser.close();
}
