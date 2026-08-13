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
  await page.waitForSelector('#baseline-diff-toggle');
  invariant(!(await page.locator('#baseline-diff-toggle').isDisabled()), 'Baseline Diff should be available');

  await page.locator('#baseline-diff-toggle').click();
  await page.waitForFunction(() => {
    const panel = document.querySelector('#baseline-diff-review');
    const status = document.querySelector('#baseline-diff-status')?.textContent || '';
    const ratio = document.querySelector('#baseline-diff-ratio')?.textContent || '';
    return panel && !panel.hidden && status.includes('Baseline→Current') && ratio.startsWith('差分 ');
  }, null, { timeout: 15000 });

  const pcRatio = await page.locator('#baseline-diff-ratio').textContent();
  invariant(pcRatio === '差分 0.00%', `Seed PC baseline should equal current capture, got ${pcRatio}`);
  invariant((await page.locator('#baseline-diff-approved').textContent())?.includes('03729d66'), 'Approved baseline commit missing');

  await page.locator('[data-viewport="sp"]').click();
  await page.waitForFunction(() => document.querySelector('#baseline-diff-status')?.textContent?.includes('/ SP / Baseline→Current'));
  const spRatio = await page.locator('#baseline-diff-ratio').textContent();
  invariant(spRatio === '差分 0.00%', `Seed SP baseline should equal current capture, got ${spRatio}`);

  await page.screenshot({ path: path.join(evidenceDir, 'baseline-diff-seeded-sp.png'), fullPage: true });
  console.log(JSON.stringify({ status: 'PASS', baselineDiff: true, pcRatio, spRatio, humanApprovalBoundary: true }, null, 2));
} finally {
  await browser.close();
}
