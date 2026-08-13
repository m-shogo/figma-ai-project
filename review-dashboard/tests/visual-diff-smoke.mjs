import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const reviewUrl = process.env.REVIEW_URL || 'http://127.0.0.1:8877/ref-001/latest/review/';
const evidenceDir = process.env.REVIEW_SMOKE_DIR || '/tmp/ref001-review-smoke';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

await fs.mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

try {
  await page.goto(reviewUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#section-nav button');
  await page.locator('[data-viewport="sp"]').click();
  await page.locator('[data-section="student-voice"]').click();
  await page.locator('#visual-diff-toggle').click();
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#visual-diff-canvas');
    const status = document.querySelector('#diff-status')?.textContent || '';
    return canvas && !canvas.hidden && status.includes('Student Voice / SP / Standard');
  }, null, { timeout: 15000 });

  invariant(!(await page.locator('#visual-diff-review').isHidden()), 'Visual Diff panel did not open');
  invariant((await page.locator('#diff-ratio').textContent())?.startsWith('差分 '), 'Visual Diff ratio missing');
  invariant((await page.locator('#diff-bbox').textContent())?.length > 3, 'Visual Diff bbox missing');
  invariant((await page.locator('#diff-scale').textContent()) === '解析 1:1', 'Student Voice should be analyzed 1:1');

  await page.locator('[data-diff-sensitivity="loose"]').click();
  await page.waitForFunction(() => document.querySelector('#diff-status')?.textContent?.includes('/ Loose'));
  invariant((await page.locator('#diff-profile-label').textContent())?.includes('threshold 0.20'), 'Loose threshold drifted');

  await page.locator('[data-diff-sensitivity="strict"]').click();
  await page.waitForFunction(() => document.querySelector('#diff-status')?.textContent?.includes('/ Strict'));
  invariant((await page.locator('#diff-profile-label').textContent())?.includes('threshold 0.08'), 'Strict threshold drifted');

  await page.screenshot({ path: path.join(evidenceDir, 'visual-diff-student-voice-sp.png'), fullPage: true });

  console.log(JSON.stringify({
    status: 'PASS',
    stagedSensitivity: true,
    perceptualDiffCanvas: true,
    diffRatio: true,
    diffBoundingBox: true,
    sectionCrop: true,
  }, null, 2));
} finally {
  await browser.close();
}
