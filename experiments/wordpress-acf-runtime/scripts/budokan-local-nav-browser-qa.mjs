import { chromium } from 'playwright';

const url = process.argv[2];
const phase = process.argv[3] || 'all';
if (!url) {
  console.error('FAIL usage: node budokan-local-nav-browser-qa.mjs <url> [surface|typography|list|current|all]');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isKakuFamily(family) {
  return String(family || '').toLowerCase().includes('kaku');
}

function runs(name) {
  return phase === 'all' || phase === name;
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
      titleFamily: getComputedStyle(familyLink).fontFamily,
      selectorFamily: getComputedStyle(selector, '::before').fontFamily,
    };
  });

  assert(sp, 'SP Local Navigation owner elements were not found.');
  assert(sp.title === '武道 振興・普及事業', `SP family heading mismatch: ${sp.title}`);
  assert(sp.titleDisplay !== 'none', 'SP broad family heading is hidden.');
  assert(sp.selectorDisplay !== 'none', 'SP selector control is hidden.');
  assert(Math.abs(sp.selectorHeight - 50) <= 1, `SP selector height expected 50px, got ${sp.selectorHeight}.`);
  assert(sp.wrapperHeight <= 1, `SP closed wrapper should collapse, got ${sp.wrapperHeight}px.`);
  assert(sp.background === 'rgb(242, 242, 242)', `SP background expected rgb(242, 242, 242), got ${sp.background}.`);
  assert(isKakuFamily(sp.titleFamily), `SP family heading must resolve to Zen Kaku Gothic New, got ${sp.titleFamily}.`);
  assert(isKakuFamily(sp.selectorFamily), `SP selector prompt must resolve to Zen Kaku Gothic New, got ${sp.selectorFamily}.`);

  await page.setViewportSize({ width: 1380, height: 1000 });
  await page.reload({ waitUntil: 'networkidle' });

  const pc = await page.evaluate(() => {
    const nav = document.querySelector('.local_navigation');
    const familyTitle = document.querySelector('.lnl_item-02 > .lnl_title-02');
    const subgroupTitle = document.querySelector('.lnl_item-03 > .lnl_title-03');
    const subgroupLink = document.querySelector('.lnl_item-03 > .lnl_title-03 > .lnl_link-03');
    const list = document.querySelector('.lnl_list-03');
    const selector02 = document.querySelector('.lnl_button-02');
    const selector03 = document.querySelector('.lnl_button-03');
    const childItems = [...document.querySelectorAll('.lnl_item-04')];
    const current = childItems.find((el) => el.classList.contains('current-menu-item') || el.classList.contains('current_page_item'));
    const currentLink = current ? current.querySelector('.lnl_link-04') : null;
    if (!nav || !familyTitle || !subgroupTitle || !subgroupLink || !list || !selector02 || !selector03) return null;
    const navRect = nav.getBoundingClientRect();
    const navStyle = getComputedStyle(nav);
    const subgroupRect = subgroupLink.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const listStyle = getComputedStyle(list);
    const boxes = childItems.map((el) => {
      const rect = el.getBoundingClientRect();
      const link = el.querySelector('.lnl_link-04');
      const linkStyle = link ? getComputedStyle(link) : null;
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderBottomColor: linkStyle?.borderBottomColor || null,
        fontWeight: linkStyle?.fontWeight || null,
      };
    });
    const currentLinkStyle = currentLink ? getComputedStyle(currentLink) : null;
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
      headingFamily: getComputedStyle(subgroupLink).fontFamily,
      childFamily: currentLinkStyle?.fontFamily || null,
      navBox: {
        left: navRect.left,
        width: navRect.width,
        height: navRect.height,
      },
      navBackground: navStyle.backgroundColor,
      navBorderTopWidth: navStyle.borderTopWidth,
      navBorderBottomWidth: navStyle.borderBottomWidth,
      navBoxShadow: navStyle.boxShadow,
      navPaddingTop: parseFloat(navStyle.paddingTop),
      navPaddingRight: parseFloat(navStyle.paddingRight),
      navPaddingBottom: parseFloat(navStyle.paddingBottom),
      navPaddingLeft: parseFloat(navStyle.paddingLeft),
      subgroupFontSize: parseFloat(getComputedStyle(subgroupLink).fontSize),
      subgroupLineHeight: parseFloat(getComputedStyle(subgroupLink).lineHeight),
      subgroupTop: subgroupRect.top,
      listBox: {
        left: listRect.left,
        top: listRect.top,
        width: listRect.width,
      },
      listPaddingLeft: parseFloat(listStyle.paddingLeft),
      listPaddingRight: parseFloat(listStyle.paddingRight),
      listColumnGap: parseFloat(listStyle.columnGap),
      currentBorderBottomColor: currentLinkStyle?.borderBottomColor || null,
      currentFontWeight: currentLinkStyle?.fontWeight || null,
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
  assert(isKakuFamily(pc.headingFamily), `PC subgroup heading must resolve to Zen Kaku Gothic New, got ${pc.headingFamily}.`);
  assert(isKakuFamily(pc.childFamily), `PC current child must resolve to Zen Kaku Gothic New, got ${pc.childFamily}.`);

  // Current Figma Local Navigation authority: FKQaJDu5TZXHoCzPsfP92E / 1216:6311.
  // Figma strokes are inside the authored 222px frame; the Theme renders those
  // separators as inset shadows so browser borders do not add 2px to layout.
  if (runs('surface')) {
    assert(Math.abs(pc.navBox.left) <= 1, `PC Local Navigation should reach viewport left edge, got left=${pc.navBox.left}.`);
    assert(Math.abs(pc.navBox.width - 1380) <= 1, `PC Local Navigation width expected 1380px, got ${pc.navBox.width}.`);
    assert(Math.abs(pc.navBox.height - 222) <= 1, `PC Local Navigation height expected 222px, got ${pc.navBox.height}.`);
    assert(pc.navBackground === 'rgb(255, 255, 255)', `PC Local Navigation background expected white, got ${pc.navBackground}.`);
    assert(pc.navBorderTopWidth === '0px' && pc.navBorderBottomWidth === '0px', `PC Local Navigation separators must not add layout height: top=${pc.navBorderTopWidth}, bottom=${pc.navBorderBottomWidth}.`);
    assert(pc.navBoxShadow.includes('rgb(215, 212, 212)') && pc.navBoxShadow.includes('inset'), `PC Local Navigation inset separator contract mismatch: ${pc.navBoxShadow}.`);
    assert(Math.abs(pc.navPaddingTop - 56) <= 1 && Math.abs(pc.navPaddingBottom - 56) <= 1, `PC Local Navigation vertical padding expected 56px, got top=${pc.navPaddingTop}, bottom=${pc.navPaddingBottom}.`);
    assert(Math.abs(pc.navPaddingLeft - 110) <= 1 && Math.abs(pc.navPaddingRight - 110) <= 1, `PC Local Navigation horizontal padding expected 110px, got left=${pc.navPaddingLeft}, right=${pc.navPaddingRight}.`);
  }

  if (runs('typography')) {
    assert(Math.abs(pc.subgroupFontSize - 20) <= 0.5, `PC subgroup heading expected 20px, got ${pc.subgroupFontSize}px.`);
    assert(Math.abs(pc.subgroupLineHeight - 28) <= 1, `PC subgroup heading line-height expected 28px, got ${pc.subgroupLineHeight}px.`);
  }

  if (runs('list')) {
    assert(Math.abs(pc.listBox.top - pc.subgroupTop - 76) <= 1, `PC heading-to-list rhythm expected 48px after 28px heading, got delta=${pc.listBox.top - pc.subgroupTop}px.`);
    assert(Math.abs(pc.listBox.width - 1160) <= 1, `PC Local Navigation list width expected 1160px, got ${pc.listBox.width}.`);
    assert(Math.abs(pc.listPaddingLeft - 36) <= 1 && Math.abs(pc.listPaddingRight - 36) <= 1, `PC Local Navigation list inset expected 36px, got left=${pc.listPaddingLeft}, right=${pc.listPaddingRight}.`);
    assert(Math.abs(pc.listColumnGap - 20) <= 1, `PC Local Navigation column gap expected 20px, got ${pc.listColumnGap}.`);
    for (const [index, box] of pc.boxes.entries()) {
      assert(Math.abs(box.width - 257) <= 1, `PC child ${index + 1} width expected 257px, got ${box.width}.`);
      assert(Math.abs(box.height - 34) <= 1, `PC child ${index + 1} height expected 34px, got ${box.height}.`);
    }
  }

  if (runs('current')) {
    assert(pc.currentBorderBottomColor === 'rgb(202, 153, 87)', `PC current child underline expected #ca9957, got ${pc.currentBorderBottomColor}.`);
    assert(Number(pc.currentFontWeight) >= 500, `PC current child expected Medium weight, got ${pc.currentFontWeight}.`);
  }

  console.log(`PASS Budokan Local Navigation baseline browser QA (${phase}).`);
  console.log(`PASS Budokan Local Navigation PC current-Figma ${phase} contract QA.`);
} finally {
  await browser.close();
}
