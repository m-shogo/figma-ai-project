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
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'reduce',
});
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(reviewUrl).origin });
const page = await context.newPage();

try {
  await page.goto(reviewUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#section-nav button');

  const sectionCount = await page.locator('#section-nav button').count();
  invariant(sectionCount === 13, `expected 13 section buttons, got ${sectionCount}`);

  const previewFrame = page.frameLocator('#web-frame');
  await previewFrame.locator('[data-ref001-page]').waitFor();
  invariant(await page.locator('#web-viewport-label').textContent() === '1380px', 'initial PC viewport label drifted');

  const initialFigma = await page.locator('#figma-frame').getAttribute('src');
  invariant(initialFigma?.startsWith('https://embed.figma.com/design/'), 'live Figma embed URL missing');
  invariant(initialFigma?.includes('node-id=21384-8173'), 'initial Figma root node mismatch');

  await page.locator('[data-viewport="sp"]').click();
  invariant(await page.locator('#web-viewport-label').textContent() === '375px', 'SP viewport switch failed');
  let figmaSrc = await page.locator('#figma-frame').getAttribute('src');
  invariant(figmaSrc?.includes('node-id=21376-4401'), 'SP Figma root node mismatch');

  await page.locator('[data-section="student-voice"]').click();
  figmaSrc = await page.locator('#figma-frame').getAttribute('src');
  invariant(figmaSrc?.includes('node-id=21376-4650'), 'Student Voice Figma node switch failed');
  invariant((await page.locator('#current-section-label').textContent())?.includes('Student Voice / SP'), 'section status label failed');

  await page.locator('[data-verdict="slightly_different"]').click();
  await page.locator('input[data-category][value="spacing"]').check();
  await page.locator('#feedback-comment').fill('smoke: SPの余白を確認');
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-viewport="sp"]').click();
  await page.locator('[data-section="student-voice"]').click();
  invariant(await page.locator('[data-verdict="slightly_different"]').evaluate((node) => node.classList.contains('is-active')), 'verdict did not survive reload');
  invariant(await page.locator('input[data-category][value="spacing"]').isChecked(), 'category did not survive reload');
  invariant((await page.locator('#feedback-comment').inputValue()) === 'smoke: SPの余白を確認', 'comment did not survive reload');

  await page.locator('#copy-all').click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  invariant(clipboard.includes('# REF-001 Human Visual Review'), 'all-feedback clipboard header missing');
  invariant(clipboard.includes('## Student Voice / SP'), 'all-feedback section missing');
  invariant(clipboard.includes('🟡 少し違う'), 'all-feedback verdict missing');
  invariant(clipboard.includes('余白'), 'all-feedback category missing');
  invariant(clipboard.includes('smoke: SPの余白を確認'), 'all-feedback comment missing');

  const generatedManifest = await page.evaluate(async () => (await fetch('./manifest.json')).json());
  const overlayExpected = Boolean(generatedManifest.generated?.captures?.sp?.overlay_available);
  const overlayDisabled = await page.locator('[data-mode="overlay"]').isDisabled();
  invariant(overlayDisabled === !overlayExpected, 'Overlay capability gate does not match generated manifest');

  await page.screenshot({ path: path.join(evidenceDir, 'dashboard-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-mobile-panel="figma"]').click();
  invariant(await page.locator('#figma-panel').evaluate((node) => node.classList.contains('is-mobile-active')), 'mobile Figma tab did not activate');
  await page.locator('[data-mobile-panel="web"]').click();
  invariant(await page.locator('#web-panel').evaluate((node) => node.classList.contains('is-mobile-active')), 'mobile Web tab did not reactivate');
  await page.locator('#section-menu-toggle').click();
  invariant(await page.locator('#section-nav').evaluate((node) => node.classList.contains('is-open')), 'mobile section menu did not open');
  await page.screenshot({ path: path.join(evidenceDir, 'dashboard-mobile.png'), fullPage: true });

  console.log(JSON.stringify({
    status: 'PASS',
    sectionCount,
    pc: true,
    sp: true,
    livePreview: true,
    liveFigmaEmbedSource: true,
    feedbackPersistence: true,
    feedbackCopy: true,
    mobileTabs: true,
    overlayCapabilityGate: true,
  }, null, 2));
} finally {
  await browser.close();
}
