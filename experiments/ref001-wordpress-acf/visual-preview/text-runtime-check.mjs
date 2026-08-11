import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:8765/visual-preview/';
const output = process.argv[3] || 'captures/ref001-text-runtime.json';

const endpoints = [
  { key: 'pc', viewport: { width: 1380, height: 900 } },
  { key: 'sp', viewport: { width: 375, height: 844 } },
];

const browser = await chromium.launch({ headless: true });
const report = { schema_version: 1, url, endpoints: {} };
let failed = false;

for (const endpoint of endpoints) {
  const page = await browser.newPage({ viewport: endpoint.viewport });
  await page.goto(url, { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
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
      const widthOverflowPx = element.clientWidth > 0 ? element.scrollWidth - element.clientWidth : 0;
      const heightOverflowPx = element.clientHeight > 0 ? element.scrollHeight - element.clientHeight : 0;
      const clippedX = widthOverflowPx > 1 && ['hidden', 'clip'].includes(style.overflowX);
      const clippedY = heightOverflowPx > 1 && ['hidden', 'clip'].includes(style.overflowY);
      const intentionalTruncation =
        style.textOverflow === 'ellipsis' || element.dataset.intentionalTruncation === 'true';

      const range = document.createRange();
      range.selectNodeContents(element);
      const lineTops = [];
      for (const lineRect of Array.from(range.getClientRects())) {
        if (lineRect.width <= 0 || lineRect.height <= 0) continue;
        const top = Math.round(lineRect.top * 2) / 2;
        if (!lineTops.some((existing) => Math.abs(existing - top) <= 1)) lineTops.push(top);
      }

      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: typeof element.className === 'string' ? element.className : null,
        text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 160) || '',
        box: {
          x: Math.round(rect.x * 10) / 10,
          y: Math.round(rect.y * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
        },
        font: {
          family: style.fontFamily,
          sizePx: fontSizePx,
          lineHeightPx,
          lineHeightRatio: lineHeightRatio === null ? null : Math.round(lineHeightRatio * 1000) / 1000,
          lineBoxExtraPx: lineBoxExtraPx === null ? null : Math.round(lineBoxExtraPx * 10) / 10,
          letterSpacing: style.letterSpacing,
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

    const nowrapElements = text
      .filter((item) => ['nowrap', 'pre'].includes(item.whiteSpace))
      .slice(0, 80);

    return {
      viewportWidth,
      documentScrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body?.scrollWidth ?? 0,
      pageOverflowPx: Math.max(0, pageOverflow),
      textElementCount: text.length,
      failures,
      leadingCandidates,
      nowrapElements,
    };
  });

  report.endpoints[endpoint.key] = result;
  console.log(JSON.stringify({ endpoint: endpoint.key, ...result }, null, 2));

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
    'REF-001 Web text runtime gate failed: page overflow, unintentional clipping, or overflowing nowrap text was detected.',
  );
  process.exit(1);
}
