import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-header-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

function isSerifFamily(family) {
  const value = String(family || '').toLowerCase();
  if (value.includes('sans-serif')) return false;
  return value.includes('serif') || value.includes('mincho') || value.includes('zen old');
}

function isSansFamily(family) {
  const value = String(family || '').toLowerCase();
  return value.includes('sans-serif') || value.includes('gothic') || value.includes('kaku');
}

async function measure(page) {
  return page.evaluate(() => {
    const header = document.querySelector('#global_header.global_header');
    const inner = header?.querySelector('.gh_inner');
    const logo = header?.querySelector('.gh_logo');
    const mark = header?.querySelector('.gh_logo_mark');
    const wordmark = header?.querySelector('.gh_logo_name img');
    const lang = header?.querySelector('.gh_lang');
    const search = header?.querySelector('.gh_search');
    const menu = header?.querySelector('.gh_menu');
    const gnavLink = document.querySelector('.global_navigation .gn_links-01 > .gnl_item-02 > .gnl_title-02 .gnl_link-02');
    if (!header || !inner || !logo || !mark || !wordmark || !lang || !search || !menu) return null;

    const headerRect = header.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();
    const wordmarkRect = wordmark.getBoundingClientRect();
    const langRect = lang.getBoundingClientRect();
    const searchRect = search.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const headerStyle = getComputedStyle(header);
    const logoStyle = getComputedStyle(logo);
    const langStyle = getComputedStyle(lang);
    const innerStyle = getComputedStyle(inner);
    const gnavStyle = gnavLink ? getComputedStyle(gnavLink) : null;

    return {
      headerHeight: headerRect.height,
      headerBg: headerStyle.backgroundColor,
      headerBorderBottom: headerStyle.borderBottomWidth,
      innerPadRight: parseFloat(innerStyle.paddingRight),
      logoWidth: logoRect.width,
      logoBg: logoStyle.backgroundColor,
      logoPadLeft: parseFloat(logoStyle.paddingLeft),
      markWidth: markRect.width,
      markHeight: markRect.height,
      wordmarkWidth: wordmarkRect.width,
      wordmarkHeight: wordmarkRect.height,
      langWidth: langRect.width,
      langHeight: langRect.height,
      searchWidth: searchRect.width,
      menuWidth: menuRect.width,
      langRadius: langStyle.borderTopLeftRadius,
      langFontSize: langStyle.fontSize,
      langFontWeight: langStyle.fontWeight,
      langFontFamily: langStyle.fontFamily,
      langLetterSpacing: langStyle.letterSpacing,
      buttonGap: searchRect.left - langRect.right,
      gnavFontSize: gnavStyle?.fontSize || null,
      gnavFontWeight: gnavStyle?.fontWeight || null,
      gnavFontFamily: gnavStyle?.fontFamily || null,
      gnavLetterSpacing: gnavStyle?.letterSpacing || null,
    };
  });
}

const browser = await chromium.launch({ headless: true });

try {
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 900 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  const sp = await measure(mobilePage);
  assert(sp, 'SP Header was not found.');
  assert(close(sp.headerHeight, 60, 1), `SP header height expected 60, got ${sp.headerHeight}.`);
  assert(sp.headerBg === 'rgb(44, 48, 54)', `SP header background expected #2c3036, got ${sp.headerBg}.`);
  assert(close(sp.logoPadLeft, 20, 1), `SP logo padding-left expected 20, got ${sp.logoPadLeft}.`);
  assert(close(sp.markWidth, 28.85, 1), `SP logo mark width expected ~28.85, got ${sp.markWidth}.`);
  assert(close(sp.markHeight, 28, 1), `SP logo mark height expected 28, got ${sp.markHeight}.`);
  assert(close(sp.wordmarkWidth, 106.4, 2), `SP wordmark width expected ~106.4, got ${sp.wordmarkWidth}.`);
  assert(close(sp.wordmarkHeight, 24.97, 1), `SP wordmark height expected ~25, got ${sp.wordmarkHeight}.`);
  assert(close(sp.langWidth, 60, 1), `SP EN width expected 60, got ${sp.langWidth}.`);
  assert(close(sp.langHeight, 60, 1), `SP EN height expected 60, got ${sp.langHeight}.`);
  assert(close(sp.searchWidth, 60, 1), `SP search width expected 60, got ${sp.searchWidth}.`);
  assert(close(sp.menuWidth, 60, 1), `SP menu width expected 60, got ${sp.menuWidth}.`);
  assert(close(sp.buttonGap, 0, 1), `SP action buttons should be flush, gap ${sp.buttonGap}.`);
  assert(sp.langFontSize === '14px', `SP EN size expected 14px, got ${sp.langFontSize}.`);
  assert(sp.langFontWeight === '500', `SP EN weight expected 500, got ${sp.langFontWeight}.`);
  assert(isSansFamily(sp.langFontFamily), `SP EN must resolve to a sans family, got ${sp.langFontFamily}.`);
  assert(close(parseFloat(sp.langLetterSpacing), 1.4, 0.2), `SP EN tracking expected 1.4px, got ${sp.langLetterSpacing}.`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await measure(desktopPage);
  assert(pc, 'PC Header was not found.');
  assert(close(pc.headerHeight, 100, 1), `PC header height expected 100, got ${pc.headerHeight}.`);
  assert(pc.headerBg === 'rgb(255, 255, 255)', `PC header background expected white, got ${pc.headerBg}.`);
  assert(pc.headerBorderBottom === '0px', `PC header must not keep a full-width bottom border, got ${pc.headerBorderBottom}.`);
  assert(close(pc.innerPadRight, 30, 1), `PC inner padding-right expected 30, got ${pc.innerPadRight}.`);
  assert(close(pc.logoWidth, 340, 1), `PC logo rail expected 340, got ${pc.logoWidth}.`);
  assert(pc.logoBg === 'rgb(44, 48, 54)', `PC logo rail background expected #2c3036, got ${pc.logoBg}.`);
  assert(close(pc.logoPadLeft, 60, 1), `PC logo padding-left expected 60, got ${pc.logoPadLeft}.`);
  assert(close(pc.markWidth, 41.22, 1), `PC logo mark width expected ~41.22, got ${pc.markWidth}.`);
  assert(close(pc.markHeight, 40, 1), `PC logo mark height expected 40, got ${pc.markHeight}.`);
  assert(close(pc.wordmarkWidth, 152, 2), `PC wordmark width expected 152, got ${pc.wordmarkWidth}.`);
  assert(close(pc.wordmarkHeight, 35.68, 1), `PC wordmark height expected ~35.68, got ${pc.wordmarkHeight}.`);
  assert(close(pc.langWidth, 60, 1), `PC EN width expected 60, got ${pc.langWidth}.`);
  assert(close(pc.langHeight, 60, 1), `PC EN height expected 60, got ${pc.langHeight}.`);
  assert(pc.langRadius === '3px', `PC EN radius expected 3px, got ${pc.langRadius}.`);
  assert(close(pc.buttonGap, 10, 1), `PC action gap expected 10, got ${pc.buttonGap}.`);
  assert(pc.gnavFontSize === '16px', `PC GNavi size expected 16px, got ${pc.gnavFontSize}.`);
  assert(pc.gnavFontWeight === '500', `PC GNavi weight expected 500, got ${pc.gnavFontWeight}.`);
  assert(isSerifFamily(pc.gnavFontFamily), `PC GNavi must resolve to a serif/Mincho family, got ${pc.gnavFontFamily}.`);
  assert(close(parseFloat(pc.gnavLetterSpacing), 0.8, 0.2), `PC GNavi tracking expected 0.8px, got ${pc.gnavLetterSpacing}.`);
  await desktopContext.close();

  console.log('PASS Budokan Header SP 60px dark bar / 60px actions / current Figma logo.');
  console.log('PASS Budokan Header PC 100px / 340px dark logo rail / GNavi 16px Mincho.');
} finally {
  await browser.close();
}
