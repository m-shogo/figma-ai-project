import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:8765/visual-preview/';
const output = process.argv[3] || 'captures/ref001-measure.json';

const targets = {
  pc: {
    viewport: { width: 1380, height: 900 },
    fullHeight: 7714,
    sections: [
      { key: 'header', selector: '[data-figma-pc="21378:8066"]', top: 0, height: 94 },
      { key: 'mv', selector: '[data-figma-pc="21378:8032"]', top: 94, height: 714 },
      { key: 'reason', selector: '[data-figma-pc="21378:7999"]', top: 886, height: 559 },
      { key: 'education', selector: '[data-figma-pc="21378:7868"]', top: 1541, height: 684 },
      { key: 'cta_1', selector: '[data-figma-pc="21378:7867"]', index: 0, top: 2225, height: 328 },
      { key: 'student_voice', selector: '[data-figma-pc="21378:7766"]', visualTop: 2649, visualHeight: 1393 },
      { key: 'messages', selector: '[data-figma-pc="21378:7746"]', top: 4225, height: 440 },
      { key: 'cta_2', selector: '[data-figma-pc="21378:7867"]', index: 1, top: 4783, height: 328 },
      { key: 'courses', selector: '[data-figma-pc="21378:7505"]', top: 5111, height: 1514 },
      { key: 'links', selector: '[data-figma-pc="21378:7458"]', top: 6697, height: 260 },
      { key: 'cta_value', selector: '[data-figma-pc="21378:7481"]', top: 7029, height: 328 },
      { key: 'footer', selector: '[data-figma-pc="21378:7457"]', top: 7357, height: 357 },
    ],
  },
  sp: {
    viewport: { width: 375, height: 844 },
    // Figma frame includes a 40px iOS status bar. The website intentionally does not.
    fullHeight: 10777,
    sections: [
      { key: 'header', selector: '[data-figma-sp="21376:4918"]', top: 0, height: 67 },
      { key: 'mv', selector: '[data-figma-sp="21376:4886"]', top: 67, height: 724 },
      { key: 'reason', selector: '[data-figma-sp="21376:4852"]', top: 847, height: 1295 },
      { key: 'education', selector: '[data-figma-sp="21376:4720"]', top: 2198, height: 1534 },
      { key: 'cta_1', selector: '[data-figma-sp="21376:4719"]', index: 0, top: 3732, height: 350 },
      { key: 'student_voice', selector: '[data-figma-sp="21376:4650"]', visualTop: 4138, visualHeight: 1758 },
      { key: 'messages', selector: '[data-figma-sp="21376:4629"]', top: 5952, height: 538 },
      { key: 'cta_2', selector: '[data-figma-sp="21376:4719"]', index: 1, top: 6546, height: 350 },
      { key: 'courses', selector: '[data-figma-sp="21376:4403"]', top: 6896, height: 2515 },
      { key: 'links', selector: '[data-figma-sp="21376:4919"]', top: 9467, height: 343 },
      { key: 'cta_value', selector: '[data-figma-sp="21376:4942"]', top: 9866, height: 396 },
      { key: 'footer', selector: '[data-figma-sp="21376:4402"]', top: 10262, height: 515 },
    ],
  },
};

const browser = await chromium.launch({ headless: true });
const report = { schema_version: 1, url, captures: {} };

for (const [mode, spec] of Object.entries(targets)) {
  const page = await browser.newPage({ viewport: spec.viewport });
  await page.goto(url, { waitUntil: 'networkidle' });

  const bodyHeight = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  const rows = [];

  for (const target of spec.sections) {
    const nodes = page.locator(target.selector);
    const count = await nodes.count();
    const index = target.index ?? 0;
    if (count <= index) {
      rows.push({ key: target.key, status: 'MISSING', selector: target.selector });
      continue;
    }

    const box = await nodes.nth(index).boundingBox();
    if (!box) {
      rows.push({ key: target.key, status: 'NO_BOX', selector: target.selector });
      continue;
    }

    const actualTop = Math.round(box.y);
    const actualHeight = Math.round(box.height);
    const expectedTop = target.top ?? target.visualTop ?? null;
    const expectedHeight = target.height ?? target.visualHeight ?? null;

    rows.push({
      key: target.key,
      status: 'OK',
      selector: target.selector,
      actual: { top: actualTop, height: actualHeight },
      figma: { top: expectedTop, height: expectedHeight },
      delta: {
        top: expectedTop === null ? null : actualTop - expectedTop,
        height: expectedHeight === null ? null : actualHeight - expectedHeight,
      },
      note: target.visualTop !== undefined
        ? 'Figma value is visible-group geometry; wrapper may intentionally include leading whitespace.'
        : undefined,
    });
  }

  report.captures[mode] = {
    viewport: spec.viewport,
    bodyHeight,
    figmaBodyHeight: spec.fullHeight,
    bodyHeightDelta: bodyHeight - spec.fullHeight,
    sections: rows,
  };

  await page.close();
}

await browser.close();
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
