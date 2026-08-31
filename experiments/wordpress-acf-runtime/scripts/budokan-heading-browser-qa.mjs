function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function close(actual, expected, tolerance = 2) {
  return Math.abs(actual - expected) <= tolerance;
}

function isKakuFamily(family) {
  const value = String(family || '').toLowerCase();
  return value.includes('kaku');
}

function markerTileOk(size) {
  const last = String(size || '').trim().split(/\s+/).pop() || '';
  if (last.endsWith('em')) return close(parseFloat(last), 1.6, 0.05);
  return close(parseFloat(last), 27.2, 1);
}

function isGoldMarker(image) {
  const value = String(image || '');
  if (/202,\s*153,\s*87/.test(value) || /ca9957/i.test(value) || /color-mix/i.test(value)) return true;
  const srgb = value.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (!srgb) return false;
  const r = Math.round(parseFloat(srgb[1]) * 255);
  const g = Math.round(parseFloat(srgb[2]) * 255);
  const b = Math.round(parseFloat(srgb[3]) * 255);
  return close(r, 202, 2) && close(g, 153, 2) && close(b, 87, 2);
}

function isDarkZoom(color) {
  const value = String(color || '');
  const compact = value.replace(/\s+/g, '');
  if (compact === 'rgba(51,51,51,0.7)' || compact === 'rgb(51,51,51)') return true;
  const srgb = value.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (!srgb) return false;
  const r = Math.round(parseFloat(srgb[1]) * 255);
  const g = Math.round(parseFloat(srgb[2]) * 255);
  const b = Math.round(parseFloat(srgb[3]) * 255);
  return close(r, 51, 2) && close(g, 51, 2) && close(b, 51, 2);
}

function isMinchoFamily(family) {
  const value = String(family || '').toLowerCase();
  if (value.includes('sans-serif')) return false;
  return value.includes('mincho') || value.includes('zen old');
}

export async function measureHeadings(page) {
  return page.evaluate(() => {
    const wrap = document.querySelector('.block-editor_wrap');
    const h2 = wrap?.querySelector('h2.wp-block-heading');
    const h3 = wrap?.querySelector('h3.wp-block-heading');
    const h4 = wrap?.querySelector('h4.wp-block-heading');
    const h2Follow = h2?.nextElementSibling;
    const listItem = wrap?.querySelector('ul.wp-block-list > li');
    const marker = wrap?.querySelector('span[style*="underline"]');
    const buttonLink = wrap?.querySelector('.wp-block-button__link');
    const detailsTitle = wrap?.querySelector('.wp-block-details__title');
    const closedDetails = wrap?.querySelector('.wp-block-details:not([open])');
    const openDetails = wrap?.querySelector('.wp-block-details[open]');
    const closedSummary = closedDetails?.querySelector('summary');
    const closedButton = closedDetails?.querySelector('.wp-block-details__button');
    const plus = closedDetails?.querySelector('.wp-block-details__button span');
    const openSummary = openDetails?.querySelector('summary');
    const openContent = openDetails?.querySelector('.wp-block-details__content');
    const openButton = openDetails?.querySelector('.wp-block-details__button');
    const tableHead = wrap?.querySelector('.wp-block-table th');
    const tableCell = wrap?.querySelector('.wp-block-table td');
    const pageLink = wrap?.querySelector('.module_inPageLink-01 .inPageLink a');
    const qaDetails = wrap?.querySelector('.wp-block-details._qa');
    const qaSummary = qaDetails?.querySelector('summary');
    const qaPlus = qaDetails?.querySelector('.wp-block-details__button span');
    const mediaText = wrap?.querySelector('.wp-block-media-text');
    const mediaContent = mediaText?.querySelector('.wp-block-media-text__content');
    const mediaFigure = mediaText?.querySelector('.wp-block-media-text__media');
    const mediaLink = mediaFigure?.querySelector('a');
    const caption = mediaText?.querySelector('.wp-element-caption');
    const navTitle = wrap?.querySelector('.module_navigation.--large .title');
    const navText = wrap?.querySelector('.module_navigation.--large .text');
    const tabButton = wrap?.querySelector('.module_tab-wrapper .tab-button');
    if (!wrap || !h2 || !h3 || !h4 || !h2Follow || !listItem || !marker || !buttonLink || !detailsTitle || !closedSummary || !closedButton || !plus || !openSummary || !openContent || !openButton || !tableHead || !tableCell || !pageLink || !qaSummary || !qaPlus || !mediaText || !mediaContent || !mediaFigure || !mediaLink || !caption || !navTitle || !navText || !tabButton) return null;

    const h2Style = getComputedStyle(h2);
    const h3Style = getComputedStyle(h3);
    const h4Style = getComputedStyle(h4);
    const followStyle = getComputedStyle(h2Follow);
    const listStyle = getComputedStyle(listItem);
    const markerStyle = getComputedStyle(marker);
    const buttonStyle = getComputedStyle(buttonLink);
    const detailsStyle = getComputedStyle(detailsTitle);
    const closedSummaryStyle = getComputedStyle(closedSummary);
    const closedButtonStyle = getComputedStyle(closedButton);
    const plusStyle = getComputedStyle(plus, '::before');
    const openSummaryStyle = getComputedStyle(openSummary);
    const openContentStyle = getComputedStyle(openContent);
    const openButtonStyle = getComputedStyle(openButton);
    const tableHeadStyle = getComputedStyle(tableHead);
    const tableCellStyle = getComputedStyle(tableCell);
    const pageLinkStyle = getComputedStyle(pageLink);
    const qaSummaryStyle = getComputedStyle(qaSummary);
    const qaMarkStyle = getComputedStyle(qaSummary, '::before');
    const qaPlusStyle = getComputedStyle(qaPlus, '::before');
    const mediaStyle = getComputedStyle(mediaText);
    const mediaContentRect = mediaContent.getBoundingClientRect();
    const mediaFigureRect = mediaFigure.getBoundingClientRect();
    const captionStyle = getComputedStyle(caption);
    const zoomStyle = getComputedStyle(mediaLink, '::after');
    const navTitleStyle = getComputedStyle(navTitle);
    const navTextStyle = getComputedStyle(navText);
    const tabStyle = getComputedStyle(tabButton);

    return {
      h2Size: h2Style.fontSize,
      h2Weight: h2Style.fontWeight,
      h2Family: h2Style.fontFamily,
      h2Gap: h2Style.columnGap || h2Style.gap,
      h3Size: h3Style.fontSize,
      h3Family: h3Style.fontFamily,
      h3PaddingTop: h3Style.paddingTop,
      h3PaddingLeft: h3Style.paddingLeft,
      h3Bg: h3Style.backgroundColor,
      h4Size: h4Style.fontSize,
      h4Family: h4Style.fontFamily,
      h4Gap: h4Style.columnGap || h4Style.gap,
      h2FollowMarginTop: followStyle.marginTop,
      pFamily: followStyle.fontFamily,
      pSize: followStyle.fontSize,
      pWeight: followStyle.fontWeight,
      pColor: followStyle.color,
      pLineHeight: followStyle.lineHeight,
      listFamily: listStyle.fontFamily,
      listSize: listStyle.fontSize,
      listPaddingLeft: listStyle.paddingLeft,
      markerDecoration: markerStyle.textDecorationLine,
      markerImage: markerStyle.backgroundImage,
      markerSize: markerStyle.backgroundSize,
      buttonFamily: buttonStyle.fontFamily,
      buttonSize: buttonStyle.fontSize,
      buttonWeight: buttonStyle.fontWeight,
      buttonGap: buttonStyle.columnGap || buttonStyle.gap,
      detailsFamily: detailsStyle.fontFamily,
      detailsSize: detailsStyle.fontSize,
      detailsWeight: detailsStyle.fontWeight,
      detailsTracking: detailsStyle.letterSpacing,
      detailsClosedPadTop: closedSummaryStyle.paddingTop,
      detailsClosedPadLeft: closedSummaryStyle.paddingLeft,
      detailsClosedRail: closedButtonStyle.width,
      detailsPlusColor: plusStyle.backgroundColor,
      detailsOpenPadLeft: openSummaryStyle.paddingLeft,
      detailsOpenContentPadTop: openContentStyle.paddingTop,
      detailsOpenContentPadLeft: openContentStyle.paddingLeft,
      detailsOpenRail: openButtonStyle.width,
      tableHeadFamily: tableHeadStyle.fontFamily,
      tableHeadSize: tableHeadStyle.fontSize,
      tableHeadWeight: tableHeadStyle.fontWeight,
      tableCellFamily: tableCellStyle.fontFamily,
      tableCellSize: tableCellStyle.fontSize,
      pageLinkFamily: pageLinkStyle.fontFamily,
      pageLinkSize: pageLinkStyle.fontSize,
      pageLinkWeight: pageLinkStyle.fontWeight,
      qaPadTop: qaSummaryStyle.paddingTop,
      qaPadLeft: qaSummaryStyle.paddingLeft,
      qaMarkWidth: qaMarkStyle.width,
      qaPlusColor: qaPlusStyle.backgroundColor,
      mediaRowGap: mediaStyle.rowGap,
      mediaColGap: mediaStyle.columnGap,
      mediaContentTop: mediaContentRect.top,
      mediaFigureTop: mediaFigureRect.top,
      mediaContentLeft: mediaContentRect.left,
      mediaFigureLeft: mediaFigureRect.left,
      captionFamily: captionStyle.fontFamily,
      captionSize: captionStyle.fontSize,
      captionWeight: captionStyle.fontWeight,
      captionColor: captionStyle.color,
      captionMarginTop: captionStyle.marginTop,
      zoomSize: zoomStyle.width,
      zoomColor: zoomStyle.backgroundColor,
      navTitleFamily: navTitleStyle.fontFamily,
      navTitleSize: navTitleStyle.fontSize,
      navTitleWeight: navTitleStyle.fontWeight,
      navTextFamily: navTextStyle.fontFamily,
      navTextSize: navTextStyle.fontSize,
      tabFamily: tabStyle.fontFamily,
      tabSize: tabStyle.fontSize,
      tabWeight: tabStyle.fontWeight,
    };
  });
}

export function assertHeadings(measured, band) {
  assert(measured, `${band} Gutenberg headings were not found on the fixture page.`);
  assert(isMinchoFamily(measured.h2Family), `${band} h2 must resolve to Zen Old Mincho, got ${measured.h2Family}.`);
  assert(isMinchoFamily(measured.h3Family), `${band} h3 must resolve to Zen Old Mincho, got ${measured.h3Family}.`);
  assert(isMinchoFamily(measured.h4Family), `${band} h4 must resolve to Zen Old Mincho, got ${measured.h4Family}.`);
  assert(measured.h2Weight === '500', `${band} h2 expected weight 500, got ${measured.h2Weight}.`);
  assert(measured.h3Size === '20px', `${band} h3 expected 20px, got ${measured.h3Size}.`);
  assert(measured.h4Size === '18px', `${band} h4 expected 18px, got ${measured.h4Size}.`);
  assert(measured.h3Bg === 'rgb(242, 242, 242)', `${band} h3 band expected #f2f2f2, got ${measured.h3Bg}.`);
  assert(isKakuFamily(measured.pFamily), `${band} paragraph must resolve to Zen Kaku Gothic New, got ${measured.pFamily}.`);
  assert(measured.pSize === '17px', `${band} paragraph expected 17px, got ${measured.pSize}.`);
  assert(measured.pWeight === '400', `${band} paragraph expected weight 400, got ${measured.pWeight}.`);
  assert(measured.pColor === 'rgb(51, 51, 51)', `${band} paragraph expected #333, got ${measured.pColor}.`);
  assert(close(parseFloat(measured.pLineHeight), 27.2, 1), `${band} paragraph line-height expected ~27.2px, got ${measured.pLineHeight}.`);
  assert(isKakuFamily(measured.listFamily), `${band} list must resolve to Zen Kaku Gothic New, got ${measured.listFamily}.`);
  assert(measured.listSize === '17px', `${band} list expected 17px, got ${measured.listSize}.`);
  assert(measured.listPaddingLeft === '18px', `${band} unordered list text inset expected 18px, got ${measured.listPaddingLeft}.`);
  assert(measured.markerDecoration === 'none', `${band} marker must not keep a CSS underline, got ${measured.markerDecoration}.`);
  assert(isGoldMarker(measured.markerImage), `${band} marker expected gold #ca9957 overlay, got ${measured.markerImage}.`);
  assert(markerTileOk(measured.markerSize), `${band} marker tile expected 1.6em (~27.2px), got ${measured.markerSize}.`);
  assert(isKakuFamily(measured.buttonFamily), `${band} button_L must resolve to Zen Kaku Gothic New, got ${measured.buttonFamily}.`);
  assert(measured.buttonSize === '15px', `${band} button_L expected 15px, got ${measured.buttonSize}.`);
  assert(measured.buttonWeight === '500', `${band} button_L expected weight 500, got ${measured.buttonWeight}.`);
  assert(measured.buttonGap === '8px', `${band} button_L icon/text gap expected 8px, got ${measured.buttonGap}.`);
  assert(isMinchoFamily(measured.detailsFamily), `${band} details title must resolve to Zen Old Mincho, got ${measured.detailsFamily}.`);
  assert(measured.detailsSize === '18px', `${band} details title expected 18px, got ${measured.detailsSize}.`);
  assert(measured.detailsWeight === '600', `${band} details title expected weight 600, got ${measured.detailsWeight}.`);
  assert(measured.detailsPlusColor === 'rgb(191, 62, 43)', `${band} details plus/minus expected primary #bf3e2b, got ${measured.detailsPlusColor}.`);
  assert(isKakuFamily(measured.tableHeadFamily), `${band} table header must resolve to Zen Kaku Gothic New, got ${measured.tableHeadFamily}.`);
  assert(isKakuFamily(measured.tableCellFamily), `${band} table cell must resolve to Zen Kaku Gothic New, got ${measured.tableCellFamily}.`);
  assert(measured.tableHeadSize === '15px' && measured.tableCellSize === '15px', `${band} table expected 15px, got th ${measured.tableHeadSize} / td ${measured.tableCellSize}.`);
  assert(measured.tableHeadWeight === '400', `${band} table header expected weight 400, got ${measured.tableHeadWeight}.`);
  assert(isKakuFamily(measured.pageLinkFamily), `${band} page-link must resolve to Zen Kaku Gothic New, got ${measured.pageLinkFamily}.`);
  assert(measured.pageLinkSize === '16px', `${band} page-link expected 16px, got ${measured.pageLinkSize}.`);
  assert(measured.pageLinkWeight === '500', `${band} page-link expected weight 500, got ${measured.pageLinkWeight}.`);
  assert(parseFloat(measured.qaMarkWidth) <= 24, `${band} QA Q/A mark must hug the glyph, not a 32px slot, got ${measured.qaMarkWidth}.`);
  assert(measured.qaPlusColor === 'rgb(202, 153, 87)', `${band} QA plus/minus expected gold #ca9957, got ${measured.qaPlusColor}.`);
  assert(measured.mediaRowGap === '30px' && measured.mediaColGap === '30px', `${band} media-text gap expected 30px, got row ${measured.mediaRowGap} / col ${measured.mediaColGap}.`);
  assert(isKakuFamily(measured.captionFamily), `${band} caption must resolve to Zen Kaku Gothic New, got ${measured.captionFamily}.`);
  assert(measured.captionSize === '14px', `${band} caption expected 14px, got ${measured.captionSize}.`);
  assert(measured.captionWeight === '500', `${band} caption expected weight 500, got ${measured.captionWeight}.`);
  assert(measured.captionColor === 'rgb(51, 51, 51)', `${band} caption expected #333, got ${measured.captionColor}.`);
  assert(measured.captionMarginTop === '20px', `${band} caption margin-top expected 20px, got ${measured.captionMarginTop}.`);
  assert(measured.zoomSize === '50px', `${band} media-text zoom expected 50px, got ${measured.zoomSize}.`);
  assert(isDarkZoom(measured.zoomColor), `${band} media-text zoom expected #333 / 70%, got ${measured.zoomColor}.`);
  assert(isMinchoFamily(measured.navTitleFamily), `${band} navigation-large title must resolve to Zen Old Mincho, got ${measured.navTitleFamily}.`);
  assert(measured.navTitleSize === '18px', `${band} navigation-large title expected 18px, got ${measured.navTitleSize}.`);
  assert(measured.navTitleWeight === '600', `${band} navigation-large title expected weight 600, got ${measured.navTitleWeight}.`);
  assert(isKakuFamily(measured.navTextFamily), `${band} navigation-large copy must resolve to Zen Kaku Gothic New, got ${measured.navTextFamily}.`);
  assert(measured.navTextSize === '15px', `${band} navigation-large copy expected 15px, got ${measured.navTextSize}.`);
  assert(isKakuFamily(measured.tabFamily), `${band} tab label must resolve to Zen Kaku Gothic New, got ${measured.tabFamily}.`);
  assert(measured.tabSize === '14px', `${band} tab label expected 14px, got ${measured.tabSize}.`);
  assert(measured.tabWeight === '500', `${band} tab label expected weight 500, got ${measured.tabWeight}.`);

  if (band === 'SP') {
    assert(measured.h2Size === '24px', `SP h2 expected 24px, got ${measured.h2Size}.`);
    assert(measured.h2Gap === '12px', `SP h2 gap expected 12px, got ${measured.h2Gap}.`);
    assert(measured.h4Gap === '12px', `SP h4 gap expected 12px, got ${measured.h4Gap}.`);
    assert(measured.h3PaddingTop === '11px' && measured.h3PaddingLeft === '15px', `SP h3 padding expected 11/15 (border-compensated), got ${measured.h3PaddingTop}/${measured.h3PaddingLeft}.`);
    assert(close(parseFloat(measured.h2FollowMarginTop), 28), `SP h2→p gap expected 28px, got ${measured.h2FollowMarginTop}.`);
    assert(close(parseFloat(measured.detailsTracking), 0.9, 0.15), `SP details tracking expected ~0.9px, got ${measured.detailsTracking}.`);
    assert(measured.detailsClosedPadTop === '16px' && measured.detailsClosedPadLeft === '20px', `SP closed details title padding expected 16/20, got ${measured.detailsClosedPadTop}/${measured.detailsClosedPadLeft}.`);
    assert(measured.detailsClosedRail === '59px' && measured.detailsOpenRail === '59px', `SP details rail expected 59px, got closed ${measured.detailsClosedRail} / open ${measured.detailsOpenRail}.`);
    assert(measured.detailsOpenContentPadTop === '20px' && measured.detailsOpenContentPadLeft === '20px', `SP open details content padding expected 20, got ${measured.detailsOpenContentPadTop}/${measured.detailsOpenContentPadLeft}.`);
    assert(measured.qaPadTop === '20px' && measured.qaPadLeft === '20px', `SP QA details title padding expected 20/20, got ${measured.qaPadTop}/${measured.qaPadLeft}.`);
    assert(measured.mediaContentTop < measured.mediaFigureTop, `SP media-text must stack text above image, content ${measured.mediaContentTop} vs media ${measured.mediaFigureTop}.`);
    return;
  }

  assert(measured.h2Size === '26px', `PC h2 expected 26px, got ${measured.h2Size}.`);
  assert(measured.h2Gap === '20px', `PC h2 gap expected 20px, got ${measured.h2Gap}.`);
  assert(measured.h4Gap === '16px', `PC h4 gap expected 16px, got ${measured.h4Gap}.`);
  assert(measured.h3PaddingTop === '15px' && measured.h3PaddingLeft === '19px', `PC h3 padding expected 15/19 (border-compensated), got ${measured.h3PaddingTop}/${measured.h3PaddingLeft}.`);
  assert(close(parseFloat(measured.h2FollowMarginTop), 32), `PC h2→p gap expected 32px, got ${measured.h2FollowMarginTop}.`);
  assert(close(parseFloat(measured.detailsTracking), 1.8, 0.2), `PC details tracking expected ~1.8px, got ${measured.detailsTracking}.`);
  assert(measured.detailsClosedPadTop === '24px' && measured.detailsClosedPadLeft === '24px', `PC closed details title padding expected 24/24, got ${measured.detailsClosedPadTop}/${measured.detailsClosedPadLeft}.`);
  assert(measured.detailsClosedRail === '68px' && measured.detailsOpenRail === '68px', `PC details rail expected 68px, got closed ${measured.detailsClosedRail} / open ${measured.detailsOpenRail}.`);
  assert(measured.detailsOpenPadLeft === '32px', `PC open details title padding-left expected 32px, got ${measured.detailsOpenPadLeft}.`);
  assert(measured.detailsOpenContentPadTop === '32px' && measured.detailsOpenContentPadLeft === '32px', `PC open details content padding expected 32, got ${measured.detailsOpenContentPadTop}/${measured.detailsOpenContentPadLeft}.`);
  assert(measured.qaPadTop === '24px' && measured.qaPadLeft === '32px', `PC QA details title padding expected 24/32, got ${measured.qaPadTop}/${measured.qaPadLeft}.`);
  assert(measured.mediaContentLeft < measured.mediaFigureLeft, `PC media-text must keep text left of image, content ${measured.mediaContentLeft} vs media ${measured.mediaFigureLeft}.`);
}
