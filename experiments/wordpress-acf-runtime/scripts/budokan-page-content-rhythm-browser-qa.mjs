import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-page-content-rhythm-browser-qa.mjs <url>');
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
    const visual = document.querySelector('.global_mainVisual');
    const content = document.querySelector('.global_inner._content._normalPage');
    const main = document.querySelector('.gc_main._oneColumn');
    const wrap = main?.querySelector('.block-editor_wrap');
    const paragraph = wrap?.querySelector('p');
    const localNav = document.querySelector('.global_inner._localNavigation .local_navigation');
    if (!visual || !content || !main || !wrap || !paragraph || !localNav) return null;

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

    const style = getComputedStyle(paragraph);
    return {
      rootClientWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      visual: rect(visual),
      content: rect(content),
      main: rect(main),
      wrap: rect(wrap),
      paragraph: rect(paragraph),
      paragraphStyle: {
        fontFamily: style.fontFamily,
        fontSize: parseFloat(style.fontSize),
        fontWeight: style.fontWeight,
        lineHeight: parseFloat(style.lineHeight),
        letterSpacing: parseFloat(style.letterSpacing),
        marginTop: parseFloat(style.marginTop),
      },
      localNav: rect(localNav),
    };
  });

  assert(pc, 'PC normal-page content owner elements were not found.');

  // Current Figma authority: FKQaJDu5TZXHoCzPsfP92E / 1203:4878.
  // The 960px content container starts immediately after the 220px page title,
  // then owns a 64px top inset and a 100px bottom inset. Its first body copy
  // is Zen Kaku Gothic New Regular 17px / 160% / 5% tracking (1203:4882).
  assert(pc.rootScrollWidth <= pc.rootClientWidth + 1, `PC content rhythm must not introduce horizontal overflow: scrollWidth=${pc.rootScrollWidth}, clientWidth=${pc.rootClientWidth}.`);
  assert(near(pc.content.top, pc.visual.bottom), `PC content wrapper should start directly after the page visual: contentTop=${pc.content.top}, visualBottom=${pc.visual.bottom}.`);
  assert(near(pc.main.left, pc.wrap.left) && near(pc.main.right, pc.wrap.right), `PC block editor wrap should preserve the one-column authored width: main=${JSON.stringify(pc.main)}, wrap=${JSON.stringify(pc.wrap)}.`);
  assert(near(pc.paragraph.top - pc.content.top, 64, 1), `PC first authored content should land 64px below the page visual per Figma 1203:4878: inset=${pc.paragraph.top - pc.content.top}px.`);
  assert(near(pc.content.bottom - pc.wrap.bottom, 100, 1), `PC normal-page master should reserve the Figma 100px bottom inset after authored content: inset=${pc.content.bottom - pc.wrap.bottom}px.`);
  assert(pc.paragraphStyle.fontFamily.includes('Zen Kaku Gothic'), `PC body paragraph font family expected Zen Kaku Gothic New, got ${pc.paragraphStyle.fontFamily}.`);
  assert(near(pc.paragraphStyle.fontSize, 17, 0.1), `PC body paragraph font size expected 17px, got ${pc.paragraphStyle.fontSize}px.`);
  assert(Number(pc.paragraphStyle.fontWeight) === 400, `PC body paragraph font weight expected 400, got ${pc.paragraphStyle.fontWeight}.`);
  assert(near(pc.paragraphStyle.lineHeight, 27.2, 0.2), `PC body paragraph line-height expected 27.2px (160%), got ${pc.paragraphStyle.lineHeight}px.`);
  assert(near(pc.paragraphStyle.letterSpacing, 0.85, 0.1), `PC body paragraph tracking expected 0.85px (5%), got ${pc.paragraphStyle.letterSpacing}px.`);
  assert(near(pc.paragraphStyle.marginTop, 0, 0.1), `PC first paragraph should not add its own top margin beyond the shared 64px content inset, got ${pc.paragraphStyle.marginTop}px.`);
  assert(pc.localNav.top >= pc.content.bottom - 1, `PC Local Navigation must remain after the content wrapper without overlap: navTop=${pc.localNav.top}, contentBottom=${pc.content.bottom}.`);

  console.log('PASS Budokan PC normal-page authored content rhythm QA.');
} finally {
  await browser.close();
}
