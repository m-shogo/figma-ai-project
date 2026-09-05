import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-footer-browser-qa.mjs <url>');
  process.exit(2);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

function isSansFamily(family) {
  const value = String(family || '').toLowerCase();
  return value.includes('sans-serif') || value.includes('gothic') || value.includes('kaku') || value.includes('roboto');
}

async function assertFooterSnsPlaceholdersFailClosed(page, label) {
  const legacyLinks = await page.locator('.gf_sns a[href="#"]').count();
  assert(legacyLinks === 0, `${label}: unresolved footer SNS destinations still render as href="#" links (${legacyLinks}).`);

  const disabledOwners = page.locator('.gf_sns .gf_sns_link[aria-disabled="true"]');
  const disabledCount = await disabledOwners.count();
  assert(disabledCount === 3, `${label}: expected 3 fail-closed footer SNS visual owners, got ${disabledCount}.`);

  const labels = await disabledOwners.evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label')));
  assert(
    JSON.stringify(labels) === JSON.stringify(['YouTube', 'Instagram', 'X']),
    `${label}: footer SNS placeholder labels changed unexpectedly: ${JSON.stringify(labels)}.`,
  );
}

async function measure(page) {
  return page.evaluate(() => {
    const footer = document.querySelector('#global_footer.global_footer');
    const body = footer?.querySelector('.gf_body');
    const map = footer?.querySelector('.gf_map');
    const sns = footer?.querySelector('.gf_sns');
    const snsLink = footer?.querySelector('.gf_sns_link');
    const links = footer?.querySelector('.gf_links-wrap');
    const pageTop = footer?.querySelector('.gf_pageTop a');
    const copyright = footer?.querySelector('.gf_copyright');
    const address = footer?.querySelector('.gf_address');
    if (!footer || !body || !sns || !snsLink || !links || !pageTop || !copyright || !address) return null;

    const footerStyle = getComputedStyle(footer);
    const bodyStyle = getComputedStyle(body);
    const mapRect = map ? map.getBoundingClientRect() : { width: 0, height: 0 };
    const mapStyle = map ? getComputedStyle(map) : null;
    const snsStyle = getComputedStyle(sns);
    const snsLinkRect = snsLink.getBoundingClientRect();
    const linksStyle = getComputedStyle(links);
    const pageTopStyle = getComputedStyle(pageTop);
    const pageTopRect = pageTop.getBoundingClientRect();
    const copyrightStyle = getComputedStyle(copyright);
    const addressStyle = getComputedStyle(address);

    return {
      footerBg: footerStyle.backgroundColor,
      footerColor: footerStyle.color,
      bodyPadTop: parseFloat(bodyStyle.paddingTop),
      bodyPadInline: parseFloat(bodyStyle.paddingLeft),
      hasMap: footer.classList.contains('_hasMap'),
      mapDisplay: mapStyle ? mapStyle.display : 'none',
      mapWidth: mapRect.width,
      mapHeight: mapRect.height,
      snsDisplay: snsStyle.display,
      snsSize: snsLinkRect.width,
      linksDisplay: linksStyle.display,
      pageTopBg: pageTopStyle.backgroundColor,
      pageTopWidth: pageTopRect.width,
      pageTopHeight: pageTopRect.height,
      copyrightSize: copyrightStyle.fontSize,
      copyrightFamily: copyrightStyle.fontFamily,
      addressSize: addressStyle.fontSize,
      addressFamily: addressStyle.fontFamily,
      addressTracking: copyrightStyle.letterSpacing,
      addressColor: addressStyle.color,
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
  await assertFooterSnsPlaceholdersFailClosed(mobilePage, 'SP Footer');
  const sp = await measure(mobilePage);
  assert(sp, 'SP Footer was not found.');
  assert(sp.footerBg === 'rgb(255, 255, 255)', `SP footer background expected white, got ${sp.footerBg}.`);
  assert(sp.footerColor === 'rgb(51, 51, 51)', `SP footer color expected #333, got ${sp.footerColor}.`);
  assert(close(sp.bodyPadTop, 48, 1), `SP body padding-top expected 48, got ${sp.bodyPadTop}.`);
  assert(close(sp.bodyPadInline, 30, 1), `SP body padding-inline expected 30, got ${sp.bodyPadInline}.`);
  if (sp.hasMap) {
    assert(sp.mapDisplay === 'block', `TOP SP map must show, got ${sp.mapDisplay}.`);
    assert(close(sp.mapWidth, 315, 2), `TOP SP map width expected 315, got ${sp.mapWidth}.`);
    assert(close(sp.mapHeight, 168, 2), `TOP SP map height expected 168, got ${sp.mapHeight}.`);
  } else {
    assert(sp.mapDisplay === 'none', `Subpage SP map must stay hidden, got ${sp.mapDisplay}.`);
  }
  assert(sp.snsDisplay === 'flex', `SP SNS expected flex, got ${sp.snsDisplay}.`);
  assert(close(sp.snsSize, 48, 1), `SP SNS size expected 48, got ${sp.snsSize}.`);
  assert(sp.linksDisplay === 'none', `SP footer links must stay hidden, got ${sp.linksDisplay}.`);
  assert(sp.pageTopBg === 'rgb(202, 153, 87)', `SP Page Top expected gold #ca9957, got ${sp.pageTopBg}.`);
  assert(close(sp.pageTopWidth, 50, 1), `SP Page Top width expected 50, got ${sp.pageTopWidth}.`);
  assert(sp.copyrightSize === '12px', `SP copyright expected 12px, got ${sp.copyrightSize}.`);
  assert(sp.addressSize === '14px', `SP address expected 14px, got ${sp.addressSize}.`);
  assert(isSansFamily(sp.addressFamily), `SP address must resolve to a sans family, got ${sp.addressFamily}.`);
  assert(sp.addressColor === 'rgb(51, 51, 51)', `SP address color expected #333, got ${sp.addressColor}.`);
  await mobileContext.close();

  const desktopContext = await browser.newContext({ viewport: { width: 1380, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(url, { waitUntil: 'networkidle' });
  await assertFooterSnsPlaceholdersFailClosed(desktopPage, 'PC Footer');
  const pc = await measure(desktopPage);
  assert(pc, 'PC Footer was not found.');
  assert(pc.footerBg === 'rgb(255, 255, 255)', `PC footer background expected white, got ${pc.footerBg}.`);
  if (pc.hasMap) {
    assert(close(pc.bodyPadTop, 72, 1), `TOP PC body padding-top expected 72, got ${pc.bodyPadTop}.`);
    assert(pc.mapDisplay === 'block', `TOP PC map must show, got ${pc.mapDisplay}.`);
    assert(close(pc.mapWidth, 600, 2), `TOP PC map width expected 600, got ${pc.mapWidth}.`);
    assert(close(pc.mapHeight, 320, 2), `TOP PC map height expected 320, got ${pc.mapHeight}.`);
  } else {
    assert(close(pc.bodyPadTop, 56, 1), `Subpage PC body padding-top expected 56, got ${pc.bodyPadTop}.`);
    assert(pc.mapDisplay === 'none', `Subpage PC map must stay hidden, got ${pc.mapDisplay}.`);
  }
  assert(close(pc.bodyPadInline, 110, 1), `PC body padding-inline expected 110, got ${pc.bodyPadInline}.`);
  assert(close(pc.snsSize, 40, 1), `PC SNS size expected 40, got ${pc.snsSize}.`);
  assert(pc.linksDisplay === 'block', `PC footer links expected block owner, got ${pc.linksDisplay}.`);
  assert(pc.pageTopBg === 'rgb(202, 153, 87)', `PC Page Top expected gold, got ${pc.pageTopBg}.`);
  assert(close(pc.pageTopWidth, 170, 2), `PC Page Top width expected 170, got ${pc.pageTopWidth}.`);
  assert(close(pc.pageTopHeight, 60, 1), `PC Page Top height expected 60, got ${pc.pageTopHeight}.`);
  assert(pc.copyrightSize === '14px', `PC copyright expected 14px, got ${pc.copyrightSize}.`);
  assert(pc.addressSize === '14px', `PC address expected 14px, got ${pc.addressSize}.`);
  await desktopContext.close();

  if (sp.hasMap) {
    console.log('PASS Budokan TOP Footer SP map 315x168 / SNS 48 / gold Page Top.');
    console.log('PASS Budokan TOP Footer PC map 600x320 / links under identity / gold Page Top 170x60.');
  } else {
    console.log('PASS Budokan subpage Footer SP white / SNS 48 / gold Page Top / no map.');
    console.log('PASS Budokan subpage Footer PC white / SNS 40 / links / gold Page Top 170x60.');
  }
  console.log('PASS unresolved footer SNS destinations fail closed without changing authored SNS geometry.');
} finally {
  await browser.close();
}
