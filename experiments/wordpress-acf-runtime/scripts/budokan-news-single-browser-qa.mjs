import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-news-single-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

async function measure(page) {
  return page.evaluate(() => {
    const pager = document.querySelector('.module_pager-02');
    const back = document.querySelector('.module_pager-02 .back');
    const link = document.querySelector('.module_pager-02 .back a');
    const span = document.querySelector('.module_pager-02 .back a span');
    const prev = document.querySelector('.module_pager-02 .prev');
    const next = document.querySelector('.module_pager-02 .next');
    const breadcrumb = document.querySelector('.module_breadCrumb');
    const breadcrumbItem = document.querySelector('.module_breadCrumb-01 li:not(:last-child)');
    if (!pager || !back || !link || !span || !prev || !next || !breadcrumb || !breadcrumbItem) return null;

    const pagerRect = pager.getBoundingClientRect();
    const backRect = back.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const style = getComputedStyle(link);
    const iconStyle = getComputedStyle(span, '::before');
    const prevStyle = getComputedStyle(prev);
    const nextStyle = getComputedStyle(next);
    const breadcrumbStyle = getComputedStyle(breadcrumb);
    const breadcrumbSeparatorStyle = getComputedStyle(breadcrumbItem, '::after');

    return {
      pagerWidth: pagerRect.width,
      pagerCenter: pagerRect.left + pagerRect.width / 2,
      backCenter: backRect.left + backRect.width / 2,
      backWidth: backRect.width,
      linkWidth: linkRect.width,
      linkHeight: linkRect.height,
      radius: style.borderTopLeftRadius,
      borderColor: style.borderTopColor,
      background: style.backgroundColor,
      color: style.color,
      iconContent: iconStyle.content,
      iconColor: iconStyle.color,
      prevDisplay: prevStyle.display,
      prevVisibility: prevStyle.visibility,
      nextDisplay: nextStyle.display,
      nextVisibility: nextStyle.visibility,
      breadcrumbFontSize: breadcrumbStyle.fontSize,
      breadcrumbLineHeight: breadcrumbStyle.lineHeight,
      breadcrumbSeparatorFontSize: breadcrumbSeparatorStyle.fontSize,
      breadcrumbSeparatorMarginLeft: breadcrumbSeparatorStyle.marginLeft,
      breadcrumbSeparatorMarginRight: breadcrumbSeparatorStyle.marginRight,
      breadcrumbSeparatorColor: breadcrumbSeparatorStyle.color,
    };
  });
}

const browser = await chromium.launch({ headless: true });

try {
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 1200 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(url, { waitUntil: 'networkidle' });
  const sp = await measure(mobilePage);
  assert(sp, 'SP detail pager/breadcrumb was not found.');
  assert(close(sp.backWidth, 270), `SP back item expected 270px, got ${sp.backWidth}.`);
  assert(close(sp.linkWidth, 270), `SP back link expected 270px, got ${sp.linkWidth}.`);
  assert(close(sp.linkHeight, 60), `SP back link expected 60px, got ${sp.linkHeight}.`);
  assert(close(sp.backCenter, sp.pagerCenter), `SP return action must stay centered; centers=${sp.backCenter}/${sp.pagerCenter}.`);
  assert(sp.radius === '3px', `SP return radius expected 3px, got ${sp.radius}.`);
  assert(sp.borderColor === 'rgb(215, 212, 212)', `SP return border expected Figma separator, got ${sp.borderColor}.`);
  assert(sp.background === 'rgb(255, 255, 255)', `SP return background expected white, got ${sp.background}.`);
  assert(sp.color === 'rgb(51, 51, 51)', `SP return text expected #333, got ${sp.color}.`);
  assert(sp.iconContent && sp.iconContent !== 'none' && sp.iconContent !== 'normal', `SP list icon must be generated; got ${sp.iconContent}.`);
  assert(sp.iconColor === 'rgb(191, 62, 43)', `SP list icon expected main red, got ${sp.iconColor}.`);
  assert(sp.prevDisplay === 'none' && sp.nextDisplay === 'none', `SP absent adjacent controls must remain display:none; prev=${sp.prevDisplay}, next=${sp.nextDisplay}.`);
  assert(sp.breadcrumbFontSize === '13px', `SP breadcrumb base font expected 13px, got ${sp.breadcrumbFontSize}.`);
  assert(sp.breadcrumbLineHeight === '13px', `SP breadcrumb line-height expected 1 (13px), got ${sp.breadcrumbLineHeight}.`);
  assert(sp.breadcrumbSeparatorFontSize === '10px', `SP breadcrumb chevron expected 10px, got ${sp.breadcrumbSeparatorFontSize}.`);
  assert(sp.breadcrumbSeparatorMarginLeft === '8px' && sp.breadcrumbSeparatorMarginRight === '8px', `SP breadcrumb rhythm expected 8px around chevrons, got ${sp.breadcrumbSeparatorMarginLeft}/${sp.breadcrumbSeparatorMarginRight}.`);
  assert(sp.breadcrumbSeparatorColor === 'rgb(191, 62, 43)', `SP breadcrumb chevron expected main red, got ${sp.breadcrumbSeparatorColor}.`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1395, height: 1200 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  const pc = await measure(desktopPage);
  assert(pc, 'PC detail pager/breadcrumb was not found.');
  assert(close(pc.backWidth, 270), `PC back item expected 270px, got ${pc.backWidth}.`);
  assert(close(pc.linkWidth, 270), `PC back link expected 270px, got ${pc.linkWidth}.`);
  assert(close(pc.linkHeight, 60), `PC back link expected 60px, got ${pc.linkHeight}.`);
  assert(close(pc.backCenter, pc.pagerCenter), `PC return action must stay centered between reserved adjacent slots; centers=${pc.backCenter}/${pc.pagerCenter}.`);
  assert(pc.radius === '3px', `PC return radius expected 3px, got ${pc.radius}.`);
  assert(pc.borderColor === 'rgb(215, 212, 212)', `PC return border expected Figma separator, got ${pc.borderColor}.`);
  assert(pc.background === 'rgb(255, 255, 255)', `PC return background expected white, got ${pc.background}.`);
  assert(pc.color === 'rgb(51, 51, 51)', `PC return text expected #333, got ${pc.color}.`);
  assert(pc.iconContent && pc.iconContent !== 'none' && pc.iconContent !== 'normal', `PC list icon must be generated; got ${pc.iconContent}.`);
  assert(pc.iconColor === 'rgb(191, 62, 43)', `PC list icon expected main red, got ${pc.iconColor}.`);
  assert(pc.prevDisplay === 'block' && pc.prevVisibility === 'hidden', `PC previous placeholder must preserve layout reservation; display=${pc.prevDisplay}, visibility=${pc.prevVisibility}.`);
  assert(pc.nextDisplay === 'block' && pc.nextVisibility === 'hidden', `PC next placeholder must preserve layout reservation; display=${pc.nextDisplay}, visibility=${pc.nextVisibility}.`);
  assert(pc.breadcrumbFontSize === '13px', `PC breadcrumb base font expected 13px, got ${pc.breadcrumbFontSize}.`);
  assert(pc.breadcrumbLineHeight === '13px', `PC breadcrumb line-height expected 1 (13px), got ${pc.breadcrumbLineHeight}.`);
  assert(pc.breadcrumbSeparatorFontSize === '10px', `PC breadcrumb chevron expected 10px, got ${pc.breadcrumbSeparatorFontSize}.`);
  assert(pc.breadcrumbSeparatorMarginLeft === '10px' && pc.breadcrumbSeparatorMarginRight === '10px', `PC breadcrumb rhythm expected 10px around chevrons, got ${pc.breadcrumbSeparatorMarginLeft}/${pc.breadcrumbSeparatorMarginRight}.`);
  assert(pc.breadcrumbSeparatorColor === 'rgb(191, 62, 43)', `PC breadcrumb chevron expected main red, got ${pc.breadcrumbSeparatorColor}.`);
  await desktopContext.close();

  console.log('PASS Budokan News single SP return-to-list and breadcrumb rhythm QA.');
  console.log('PASS Budokan News single PC return-to-list and breadcrumb rhythm QA.');
} finally {
  await browser.close();
}
