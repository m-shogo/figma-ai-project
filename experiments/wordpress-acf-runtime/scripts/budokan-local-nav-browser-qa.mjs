import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-local-nav-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 900 } });

try {
  await page.goto(url, { waitUntil: 'networkidle' });

  const sp = await page.evaluate(() => {
    const nav = document.querySelector('.local_navigation');
    const familyTitle = document.querySelector('.lnl_item-02 > .lnl_title-02');
    const familyLink = document.querySelector('.lnl_item-02 > .lnl_title-02 > .lnl_link-02');
    const selector = document.querySelector('.lnl_item-02 > .lnl_title-02 > .lnl_button-02');
    const wrapper = document.querySelector('.lnl_item-02 > .lnl_wrapper-02');
    if (!nav || !familyTitle || !familyLink || !selector || !wrapper) return null;
    const navStyle = getComputedStyle(nav);
    const selectorRect = selector.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    return {
      title: familyLink.textContent.trim(),
      titleDisplay: getComputedStyle(familyTitle).display,
      selectorDisplay: getComputedStyle(selector).display,
      selectorHeight: selectorRect.height,
      wrapperHeight: wrapperRect.height,
      background: navStyle.backgroundColor,
    };
  });

  assert(sp, 'SP Local Navigation owner elements were not found.');
  assert(sp.title === '武道 振興・普及事業', `SP family heading mismatch: ${sp.title}`);
  assert(sp.titleDisplay !== 'none', 'SP broad family heading is hidden.');
  assert(sp.selectorDisplay !== 'none', 'SP selector control is hidden.');
  assert(Math.abs(sp.selectorHeight - 50) <= 1, `SP selector height expected 50px, got ${sp.selectorHeight}.`);
  assert(sp.wrapperHeight <= 1, `SP closed wrapper should collapse, got ${sp.wrapperHeight}px.`);
  assert(sp.background === 'rgb(242, 242, 242)', `SP background expected rgb(242, 242, 242), got ${sp.background}.`);

  await page.setViewportSize({ width: 1380, height: 1000 });
  await page.reload({ waitUntil: 'networkidle' });

  const pc = await page.evaluate(() => {
    const familyTitle = document.querySelector('.lnl_item-02 > .lnl_title-02');
    const subgroupTitle = document.querySelector('.lnl_item-03 > .lnl_title-03');
    const subgroupLink = document.querySelector('.lnl_item-03 > .lnl_title-03 > .lnl_link-03');
    const selector02 = document.querySelector('.lnl_button-02');
    const selector03 = document.querySelector('.lnl_button-03');
    const childItems = [...document.querySelectorAll('.lnl_item-04')];
    const current = childItems.find((el) => el.classList.contains('current-menu-item') || el.classList.contains('current_page_item'));
    if (!familyTitle || !subgroupTitle || !subgroupLink || !selector02 || !selector03) return null;
    const boxes = childItems.map((el) => {
      const rect = el.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    });
    return {
      familyDisplay: getComputedStyle(familyTitle).display,
      subgroupDisplay: getComputedStyle(subgroupTitle).display,
      subgroupTitle: subgroupLink.textContent.trim(),
      selector02Display: getComputedStyle(selector02).display,
      selector03Display: getComputedStyle(selector03).display,
      childCount: childItems.length,
      childTexts: childItems.map((el) => el.textContent.trim()),
      boxes,
      currentText: current ? current.textContent.trim() : null,
    };
  });

  assert(pc, 'PC Local Navigation owner elements were not found.');
  assert(pc.familyDisplay === 'none', `PC broad family heading must be hidden, got display=${pc.familyDisplay}.`);
  assert(pc.subgroupDisplay !== 'none', 'PC subgroup heading is hidden.');
  assert(pc.subgroupTitle === '指導者研修・指導法研究', `PC subgroup heading mismatch: ${pc.subgroupTitle}`);
  assert(pc.selector02Display === 'none', `PC depth-02 selector must be hidden, got ${pc.selector02Display}.`);
  assert(pc.selector03Display === 'none', `PC depth-03 selector must be hidden, got ${pc.selector03Display}.`);
  assert(pc.childCount === 4, `PC expected exactly four depth-04 children, got ${pc.childCount}.`);
  assert(pc.childTexts.includes('地域社会武道指導者研修会'), 'PC Regional Training child is missing.');
  assert(pc.currentText === '地域社会武道指導者研修会', `PC current child mismatch: ${pc.currentText}`);

  const topSpread = Math.max(...pc.boxes.map((box) => box.top)) - Math.min(...pc.boxes.map((box) => box.top));
  assert(topSpread <= 2, `PC four children are not on one row; top spread=${topSpread}px.`);
  const distinctLefts = new Set(pc.boxes.map((box) => Math.round(box.left)));
  assert(distinctLefts.size === 4, `PC four children do not occupy four columns; distinct x=${distinctLefts.size}.`);

  console.log('PASS Budokan Local Navigation SP closed-state browser QA.');
  console.log('PASS Budokan Local Navigation PC depth-03 heading + four depth-04 columns browser QA.');
} finally {
  await browser.close();
}
