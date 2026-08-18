import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.argv[2] || 'http://127.0.0.1:8764/preview.php';
const headUrl = process.argv[3] || 'http://127.0.0.1:8765/preview.php';
const outDir = process.argv[4] || '/tmp/ref001-js-finalization';

await fs.mkdir(outDir, { recursive: true });

const modes = [
  { name: 'pc', width: 1380, height: 1000 },
  { name: 'sp', width: 375, height: 844 },
];

const browser = await chromium.launch({ headless: true });
const report = { baseUrl, headUrl, visual: [], interaction: null };
let failed = false;

async function settle(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
}

try {
  for (const mode of modes) {
    const basePage = await browser.newPage({ viewport: { width: mode.width, height: mode.height }, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    const headPage = await browser.newPage({ viewport: { width: mode.width, height: mode.height }, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    await settle(basePage, baseUrl);
    await settle(headPage, headUrl);

    const baseBuffer = await basePage.screenshot({ fullPage: true });
    const headBuffer = await headPage.screenshot({ fullPage: true });
    await fs.writeFile(path.join(outDir, `base-${mode.name}.png`), baseBuffer);
    await fs.writeFile(path.join(outDir, `head-${mode.name}.png`), headBuffer);

    const basePng = PNG.sync.read(baseBuffer);
    const headPng = PNG.sync.read(headBuffer);
    let diffPixels = Number.POSITIVE_INFINITY;
    let dimensionsMatch = basePng.width === headPng.width && basePng.height === headPng.height;

    if (dimensionsMatch) {
      const diff = new PNG({ width: basePng.width, height: basePng.height });
      diffPixels = pixelmatch(basePng.data, headPng.data, diff.data, basePng.width, basePng.height, { threshold: 0 });
      await fs.writeFile(path.join(outDir, `diff-${mode.name}.png`), PNG.sync.write(diff));
    }

    const row = {
      mode: mode.name,
      dimensionsMatch,
      base: { width: basePng.width, height: basePng.height },
      head: { width: headPng.width, height: headPng.height },
      diffPixels,
    };
    report.visual.push(row);
    if (!dimensionsMatch || diffPixels !== 0) failed = true;

    await basePage.close();
    await headPage.close();
  }

  const page = await browser.newPage({ viewport: { width: 1380, height: 1000 }, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  await settle(page, headUrl);

  const interaction = await page.evaluate(() => {
    const pictures = [...document.querySelectorAll('picture[data-asset-slot]')];
    const unresolved = [...document.querySelectorAll('a[data-link-status="UNRESOLVED"]')];
    const voice = document.querySelector('[data-section="student-voice"]');
    const messages = document.querySelector('[data-section="messages"]');
    const voiceItems = voice ? [...voice.querySelectorAll('.ref-voice-item')] : [];
    const voiceMore = voice ? [...voice.querySelectorAll('.ref-voice-more')] : [];

    window.scrollTo(0, 1200);
    const beforeScroll = window.scrollY;
    let placeholderClick = null;
    if (unresolved[0]) {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      unresolved[0].dispatchEvent(event);
      placeholderClick = {
        defaultPrevented: event.defaultPrevented,
        beforeScroll,
        afterScroll: window.scrollY,
        hash: window.location.hash,
      };
    }

    return {
      jsReady: document.documentElement.dataset.ref001Js,
      pictureCount: pictures.length,
      picturesMissingLineage: pictures.filter(node => !node.dataset.figmaPc || !node.dataset.figmaSp).map(node => node.dataset.assetSlot),
      unresolvedLinkCount: unresolved.length,
      placeholderClick,
      voice: voice ? {
        authority: voice.dataset.interactionAuthority,
        states: voiceItems.map(item => item.dataset.voiceState),
        pendingControls: voiceMore.filter(node => node.dataset.interactionStatus === 'CONTENT_PENDING' && node.getAttribute('aria-disabled') === 'true').length,
        controlCount: voiceMore.length,
      } : null,
      messages: messages ? {
        authority: messages.dataset.interactionAuthority,
        status: messages.dataset.interactionStatus,
        authoredSlides: messages.dataset.authoredSlides,
        displayedTotal: messages.dataset.displayedTotal,
      } : null,
    };
  });

  const errors = [];
  if (pageErrors.length) errors.push(`page errors: ${pageErrors.join(' | ')}`);
  if (interaction.jsReady !== 'ready') errors.push(`JS readiness ${interaction.jsReady ?? 'missing'} != ready`);
  if (interaction.pictureCount !== 16) errors.push(`picture count ${interaction.pictureCount} != 16`);
  if (interaction.picturesMissingLineage.length) errors.push(`missing asset lineage: ${interaction.picturesMissingLineage.join(', ')}`);
  if (!interaction.placeholderClick?.defaultPrevented) errors.push('unresolved # link click was not prevented');
  if (interaction.placeholderClick && interaction.placeholderClick.beforeScroll !== interaction.placeholderClick.afterScroll) errors.push('unresolved # link changed scroll position');
  if (!interaction.voice) errors.push('Student Voice section missing');
  else {
    if (interaction.voice.authority !== 'STRONGLY_INFERRED') errors.push(`voice authority ${interaction.voice.authority}`);
    if (JSON.stringify(interaction.voice.states) !== JSON.stringify(['open', 'collapsed', 'collapsed'])) errors.push(`voice states ${JSON.stringify(interaction.voice.states)}`);
    if (interaction.voice.pendingControls !== interaction.voice.controlCount || interaction.voice.controlCount !== 2) errors.push(`voice pending controls ${interaction.voice.pendingControls}/${interaction.voice.controlCount}`);
  }
  if (!interaction.messages) errors.push('Messages section missing');
  else {
    if (interaction.messages.authority !== 'STRONGLY_INFERRED') errors.push(`messages authority ${interaction.messages.authority}`);
    if (interaction.messages.status !== 'SLIDE_DATA_PENDING') errors.push(`messages status ${interaction.messages.status}`);
    if (interaction.messages.authoredSlides !== '1' || interaction.messages.displayedTotal !== '4') errors.push(`messages slide contract ${interaction.messages.authoredSlides}/${interaction.messages.displayedTotal}`);
  }

  report.interaction = { ...interaction, pageErrors, errors };
  if (errors.length) failed = true;
  await page.close();
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
for (const row of report.visual) console.log(`[${row.mode}] dimensions=${row.dimensionsMatch ? 'PASS' : 'FAIL'} diffPixels=${row.diffPixels}`);
console.log(`interaction=${report.interaction?.errors?.length ? 'FAIL' : 'PASS'}`);
for (const error of report.interaction?.errors || []) console.error(error);
if (failed) process.exit(1);
