import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:8765/visual-preview/';
const output = process.argv[3] || 'captures/ref001-text-runtime.json';

// 375 / 1380 are the supplied Figma acceptance endpoints. The additional
// widths are Web-runtime safety probes only: they do NOT define production
// breakpoints and are never compared pixel-for-pixel with Figma.
const scenarios = [
  { key: 'w320', role: 'RUNTIME_SAFETY', viewport: { width: 320, height: 844 } },
  { key: 'w360', role: 'RUNTIME_SAFETY', viewport: { width: 360, height: 844 } },
  { key: 'sp', role: 'FIGMA_ACCEPTANCE', viewport: { width: 375, height: 844 } },
  { key: 'w390', role: 'RUNTIME_SAFETY', viewport: { width: 390, height: 844 } },
  { key: 'w430', role: 'RUNTIME_SAFETY', viewport: { width: 430, height: 900 } },
  { key: 'w599', role: 'FIXTURE_SEAM_SAFETY', viewport: { width: 599, height: 900 } },
  { key: 'w600', role: 'FIXTURE_SEAM_SAFETY', viewport: { width: 600, height: 900 } },
  { key: 'w601', role: 'FIXTURE_SEAM_SAFETY', viewport: { width: 601, height: 900 } },
  { key: 'w768', role: 'RUNTIME_SAFETY', viewport: { width: 768, height: 900 } },
  { key: 'w1024', role: 'RUNTIME_SAFETY', viewport: { width: 1024, height: 900 } },
  { key: 'w1200', role: 'RUNTIME_SAFETY', viewport: { width: 1200, height: 900 } },
  { key: 'pc', role: 'FIGMA_ACCEPTANCE', viewport: { width: 1380, height: 900 } },
];

const browser = await chromium.launch({ headless: true });
const report = { schema_version: 4, url, scenarios: {} };
let failed = false;

for (const scenario of scenarios) {
  const page = await browser.newPage({ viewport: scenario.viewport });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const result = await page.evaluate(() => {
    const round = (value) => Math.round(value * 10) / 10;
    const root = document.documentElement;
    const viewportWidth = root.clientWidth;
    const pageOverflow = Math.max(root.scrollWidth, document.body?.scrollWidth ?? 0) - viewportWidth;

    const candidates = Array.from(document.body.querySelectorAll('*')).filter((element) => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.getAttribute('aria-hidden') === 'true') return false;
      const ownText = Array.from(element.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      if (!ownText) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity) !== 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    });

    const text = candidates.map((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const fontSizePx = Number.parseFloat(style.fontSize) || 0;
      const parsedLineHeight = Number.parseFloat(style.lineHeight);
      const lineHeightPx = Number.isFinite(parsedLineHeight) ? parsedLineHeight : null;
      const lineHeightRatio = lineHeightPx && fontSizePx ? lineHeightPx / fontSizePx : null;
      const lineBoxExtraPx = lineHeightPx && fontSizePx ? lineHeightPx - fontSizePx : null;
      const halfLeadingApproxPx = lineBoxExtraPx === null ? null : lineBoxExtraPx / 2;
      const widthOverflowPx = element.clientWidth > 0 ? element.scrollWidth - element.clientWidth : 0;
      const heightOverflowPx = element.clientHeight > 0 ? element.scrollHeight - element.clientHeight : 0;
      const clippedX = widthOverflowPx > 1 && ['hidden', 'clip'].includes(style.overflowX);
      const clippedY = heightOverflowPx > 1 && ['hidden', 'clip'].includes(style.overflowY);
      const intentionalTruncation =
        style.textOverflow === 'ellipsis' || element.dataset.intentionalTruncation === 'true';

      const primaryFontFamily = style.fontFamily
        .split(',')[0]
        ?.trim()
        .replace(/^['"]|['"]$/g, '') || null;
      let primaryFontLoaded = null;
      if (primaryFontFamily) {
        try {
          primaryFontLoaded = document.fonts.check(
            `${fontSizePx || 16}px "${primaryFontFamily.replaceAll('"', '\\"')}"`,
          );
        } catch {
          primaryFontLoaded = null;
        }
      }

      const range = document.createRange();
      range.selectNodeContents(element);
      const rangeRects = Array.from(range.getClientRects()).filter(
        (rangeRect) => rangeRect.width > 0 && rangeRect.height > 0,
      );
      const lineTops = [];
      for (const lineRect of rangeRects) {
        const top = Math.round(lineRect.top * 2) / 2;
        if (!lineTops.some((existing) => Math.abs(existing - top) <= 1)) lineTops.push(top);
      }
      const rangeTop = rangeRects.length ? Math.min(...rangeRects.map((item) => item.top)) : null;
      const rangeBottom = rangeRects.length ? Math.max(...rangeRects.map((item) => item.bottom)) : null;
      const rangeTopInsetPx = rangeTop === null ? null : rangeTop - rect.top;
      const rangeBottomInsetPx = rangeBottom === null ? null : rect.bottom - rangeBottom;
      const rangeVisualHeightPx =
        rangeTop === null || rangeBottom === null ? null : Math.max(0, rangeBottom - rangeTop);

      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: typeof element.className === 'string' ? element.className : null,
        text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 160) || '',
        box: {
          x: round(rect.x),
          y: round(rect.y),
          width: round(rect.width),
          height: round(rect.height),
        },
        font: {
          family: style.fontFamily,
          primaryFamily: primaryFontFamily,
          primaryLoaded: primaryFontLoaded,
          sizePx: fontSizePx,
          weight: style.fontWeight,
          stretch: style.fontStretch,
          lineHeightPx,
          lineHeightRatio: lineHeightRatio === null ? null : Math.round(lineHeightRatio * 1000) / 1000,
          lineBoxExtraPx: lineBoxExtraPx === null ? null : round(lineBoxExtraPx),
          halfLeadingApproxPx: halfLeadingApproxPx === null ? null : round(halfLeadingApproxPx),
          letterSpacing: style.letterSpacing,
          opticalSizing: style.fontOpticalSizing,
          variationSettings: style.fontVariationSettings,
          featureSettings: style.fontFeatureSettings,
          kerning: style.fontKerning,
          synthesis: style.fontSynthesis,
        },
        textRange: {
          topInsetPx: rangeTopInsetPx === null ? null : round(rangeTopInsetPx),
          bottomInsetPx: rangeBottomInsetPx === null ? null : round(rangeBottomInsetPx),
          visualHeightPx: rangeVisualHeightPx === null ? null : round(rangeVisualHeightPx),
        },
        whiteSpace: style.whiteSpace,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        textOverflow: style.textOverflow,
        renderedLines: lineTops.length,
        widthOverflowPx,
        heightOverflowPx,
        clippedX,
        clippedY,
        intentionalTruncation,
        nowrapOverflow: ['nowrap', 'pre'].includes(style.whiteSpace) && widthOverflowPx > 1,
      };
    });

    const failures = text.filter(
      (item) =>
        item.nowrapOverflow ||
        ((item.clippedX || item.clippedY) && !item.intentionalTruncation),
    );

    const leadingCandidates = text
      .filter((item) => item.font.lineHeightRatio !== null && item.font.lineHeightRatio >= 1.5)
      .sort((a, b) => (b.font.lineBoxExtraPx ?? 0) - (a.font.lineBoxExtraPx ?? 0))
      .slice(0, 40);

    const missingPrimaryFonts = text
      .filter((item) => item.font.primaryFamily && item.font.primaryLoaded === false)
      .map((item) => item.font.primaryFamily)
      .filter((family, index, families) => families.indexOf(family) === index)
      .sort();

    const nowrapElements = text
      .filter((item) => ['nowrap', 'pre'].includes(item.whiteSpace))
      .slice(0, 80);

    return {
      viewportWidth,
      documentScrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body?.scrollWidth ?? 0,
      pageOverflowPx: Math.max(0, pageOverflow),
      textElementCount: text.length,
      missingPrimaryFonts,
      failures,
      leadingCandidates,
      nowrapElements,
    };
  });

  report.scenarios[scenario.key] = {
    role: scenario.role,
    viewport: scenario.viewport,
    ...result,
  };
  console.log(JSON.stringify({ scenario: scenario.key, role: scenario.role, ...result }, null, 2));

  if (result.pageOverflowPx > 0 || result.failures.length > 0) {
    failed = true;
  }

  await page.close();
}

await browser.close();
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');

if (failed) {
  console.error(
    'REF-001 Web text runtime gate failed: page overflow, unintentional clipping, or overflowing nowrap text was detected at an acceptance or runtime-safety width.',
  );
  process.exit(1);
}
