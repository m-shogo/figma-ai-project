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
  return /202,\s*153,\s*87/.test(value) || /ca9957/i.test(value) || /color-mix/i.test(value);
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
    if (!wrap || !h2 || !h3 || !h4 || !h2Follow || !listItem || !marker) return null;

    const h2Style = getComputedStyle(h2);
    const h3Style = getComputedStyle(h3);
    const h4Style = getComputedStyle(h4);
    const followStyle = getComputedStyle(h2Follow);
    const listStyle = getComputedStyle(listItem);
    const markerStyle = getComputedStyle(marker);

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

  if (band === 'SP') {
    assert(measured.h2Size === '24px', `SP h2 expected 24px, got ${measured.h2Size}.`);
    assert(measured.h2Gap === '12px', `SP h2 gap expected 12px, got ${measured.h2Gap}.`);
    assert(measured.h4Gap === '12px', `SP h4 gap expected 12px, got ${measured.h4Gap}.`);
    assert(measured.h3PaddingTop === '11px' && measured.h3PaddingLeft === '15px', `SP h3 padding expected 11/15 (border-compensated), got ${measured.h3PaddingTop}/${measured.h3PaddingLeft}.`);
    assert(close(parseFloat(measured.h2FollowMarginTop), 28), `SP h2→p gap expected 28px, got ${measured.h2FollowMarginTop}.`);
    return;
  }

  assert(measured.h2Size === '26px', `PC h2 expected 26px, got ${measured.h2Size}.`);
  assert(measured.h2Gap === '20px', `PC h2 gap expected 20px, got ${measured.h2Gap}.`);
  assert(measured.h4Gap === '16px', `PC h4 gap expected 16px, got ${measured.h4Gap}.`);
  assert(measured.h3PaddingTop === '15px' && measured.h3PaddingLeft === '19px', `PC h3 padding expected 15/19 (border-compensated), got ${measured.h3PaddingTop}/${measured.h3PaddingLeft}.`);
  assert(close(parseFloat(measured.h2FollowMarginTop), 32), `PC h2→p gap expected 32px, got ${measured.h2FollowMarginTop}.`);
}
