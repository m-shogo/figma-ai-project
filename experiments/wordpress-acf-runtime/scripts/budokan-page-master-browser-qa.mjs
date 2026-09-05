import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-page-master-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1380, height: 1000 } });

try {
  await page.goto(url, { waitUntil: 'networkidle' });

  const pc = await page.evaluate(() => {
    const visual = document.querySelector('.global_mainVisual');
    const content = document.querySelector('.global_inner._content');
    const main = document.querySelector('.gc_main._oneColumn');
    const localNav = document.querySelector('.global_inner._localNavigation .local_navigation');
    const breadcrumb = document.querySelector('.module_breadCrumb');
    const footer = document.querySelector('footer');
    if (!visual || !content || !main || !localNav || !breadcrumb || !footer) return null;

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

    return {
      innerWidth: window.innerWidth,
      rootClientWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      body: rect(document.body),
      visual: rect(visual),
      content: rect(content),
      main: rect(main),
      localNav: rect(localNav),
      breadcrumb: rect(breadcrumb),
      footer: rect(footer),
      contentPaddingTop: parseFloat(getComputedStyle(content).paddingTop),
      contentPaddingBottom: parseFloat(getComputedStyle(content).paddingBottom),
      breadcrumbBackground: getComputedStyle(breadcrumb).backgroundColor,
    };
  });

  assert(pc, 'PC normal-page master owner elements were not found.');

  // Current Figma normal-page authority: FKQaJDu5TZXHoCzPsfP92E / 1203:4865.
  // Header occupies y=0..100, page title y=100..320, content shell x=210..1170,
  // Local Navigation follows content at full width, then breadcrumb, then footer.
  // The live Theme intentionally reserves a stable scrollbar gutter, so compare
  // full-width surfaces to the actual body containing block rather than 1380px.
  assert(pc.rootScrollWidth <= pc.rootClientWidth + 1, `PC normal page must not introduce horizontal overflow: scrollWidth=${pc.rootScrollWidth}, clientWidth=${pc.rootClientWidth}.`);
  assert(Math.abs(pc.visual.left - pc.body.left) <= 1 && Math.abs(pc.visual.right - pc.body.right) <= 1, `PC page visual should fill the body containing block: visual=${JSON.stringify(pc.visual)}, body=${JSON.stringify(pc.body)}.`);
  assert(Math.abs(pc.visual.height - 220) <= 1, `PC page visual height expected 220px from Figma 1203:4867, got ${pc.visual.height}px.`);

  assert(Math.abs(pc.content.width - 960) <= 1, `PC normal-page content width expected 960px from Figma 1203:4878, got ${pc.content.width}px.`);
  assert(Math.abs((pc.content.left + pc.content.right) / 2 - (pc.body.left + pc.body.right) / 2) <= 1, `PC normal-page content should remain centered: content=${JSON.stringify(pc.content)}, body=${JSON.stringify(pc.body)}.`);
  assert(Math.abs(pc.content.top - pc.visual.bottom) <= 1, `PC content shell should start directly after page visual: contentTop=${pc.content.top}, visualBottom=${pc.visual.bottom}.`);
  assert(Math.abs(pc.main.left - pc.content.left) <= 1 && Math.abs(pc.main.right - pc.content.right) <= 1, `PC one-column main should fill the authored 960px content shell: main=${JSON.stringify(pc.main)}, content=${JSON.stringify(pc.content)}.`);

  assert(Math.abs(pc.localNav.left - pc.body.left) <= 1 && Math.abs(pc.localNav.right - pc.body.right) <= 1, `PC Local Navigation should remain a full-width surface in the normal-page master: nav=${JSON.stringify(pc.localNav)}, body=${JSON.stringify(pc.body)}.`);
  assert(pc.localNav.top >= pc.content.bottom - 1, `PC Local Navigation must follow content without overlap: navTop=${pc.localNav.top}, contentBottom=${pc.content.bottom}.`);
  assert(pc.breadcrumb.top >= pc.localNav.bottom - 1, `PC breadcrumb must follow Local Navigation: breadcrumbTop=${pc.breadcrumb.top}, navBottom=${pc.localNav.bottom}.`);
  assert(Math.abs(pc.breadcrumb.height - 61) <= 1, `PC breadcrumb height expected 61px from Figma 1203:4868, got ${pc.breadcrumb.height}px.`);
  assert(pc.footer.top >= pc.breadcrumb.bottom - 1, `PC footer must follow breadcrumb without overlap: footerTop=${pc.footer.top}, breadcrumbBottom=${pc.breadcrumb.bottom}.`);

  console.log('PASS Budokan PC normal-page master current-Figma geometry/order QA.');
} finally {
  await browser.close();
}
