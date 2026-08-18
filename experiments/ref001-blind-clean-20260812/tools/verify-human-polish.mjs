import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:8765/preview.php';
const outDir = process.argv[3] || '/tmp/ref001-human-polish';
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { url, viewports: [], interaction: null };
let failed = false;

async function settle(page) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-section="messages"]');
    return !m || ['SWIPER_READY', 'SWIPER_FALLBACK'].includes(m.dataset.interactionStatus);
  }, null, { timeout: 15000 }).catch(() => {});
}

try {
  for (const mode of [{ name: 'pc', width: 1380, height: 1000 }, { name: 'sp', width: 375, height: 844 }]) {
    const page = await browser.newPage({ viewport: { width: mode.width, height: mode.height }, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error)));
    await settle(page);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      transitionMs: document.documentElement.dataset.ref001TransitionMs || '',
      messagesStatus: document.querySelector('[data-section="messages"]')?.dataset.interactionStatus || '',
      activeMessage: document.querySelector('[data-section="messages"]')?.dataset.activeSlide || '',
    }));
    await page.screenshot({ fullPage: true, path: path.join(outDir, `${mode.name}-initial.png`) });
    const errors = [];
    if (pageErrors.length) errors.push(`page errors: ${pageErrors.join(' | ')}`);
    if (metrics.scrollWidth !== metrics.clientWidth) errors.push(`horizontal overflow ${metrics.scrollWidth}/${metrics.clientWidth}`);
    if (metrics.transitionMs !== '300') errors.push(`transition contract ${metrics.transitionMs}`);
    if (!['SWIPER_READY', 'SWIPER_FALLBACK'].includes(metrics.messagesStatus)) errors.push(`messages status ${metrics.messagesStatus}`);
    report.viewports.push({ ...mode, ...metrics, pageErrors, errors });
    if (errors.length) failed = true;
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1380, height: 1000 }, deviceScaleFactor: 1, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  await settle(page);

  const initial = await page.evaluate(() => {
    const item2 = document.querySelector('.ref-voice-item[data-voice-item="2"]');
    const item3 = document.querySelector('.ref-voice-item[data-voice-item="3"]');
    const toggle2 = item2?.querySelector('.ref-voice-toggle');
    const headerBlue = document.querySelector('.ref-header .ref-action--blue');
    const mvOc = document.querySelector('.ref-mv__oc');
    const pageTop = document.querySelector('.ref-footer__pagetop');
    const links = [...document.querySelectorAll('.ref-footer__related a')].map(a => a.href);
    return {
      jsReady: document.documentElement.dataset.ref001Js || '',
      voiceAuthority: document.querySelector('[data-section="student-voice"]')?.dataset.interactionAuthority || '',
      voice2State: item2?.dataset.voiceState || '',
      voice2Expanded: toggle2?.getAttribute('aria-expanded') || '',
      voice2Bg: item2 ? getComputedStyle(item2.querySelector('.ref-content')).backgroundColor : '',
      voice3Bg: item3 ? getComputedStyle(item3.querySelector('.ref-content')).backgroundColor : '',
      messagesAuthority: document.querySelector('[data-section="messages"]')?.dataset.interactionAuthority || '',
      messagesStatus: document.querySelector('[data-section="messages"]')?.dataset.interactionStatus || '',
      messagesActive: document.querySelector('[data-section="messages"]')?.dataset.activeSlide || '',
      messagesAutoplay: document.querySelector('[data-section="messages"]')?.dataset.autoplay || '',
      headerTransition: headerBlue ? getComputedStyle(headerBlue).transitionDuration : '',
      headerBg: headerBlue ? getComputedStyle(headerBlue).backgroundColor : '',
      headerColor: headerBlue ? getComputedStyle(headerBlue).color : '',
      ocAfterBg: mvOc ? getComputedStyle(mvOc, '::after').backgroundColor : '',
      pageTopVisibleAtTop: pageTop?.classList.contains('is-visible') || false,
      footerLinks: links,
    };
  });

  const errors = [];
  if (pageErrors.length) errors.push(`page errors: ${pageErrors.join(' | ')}`);
  if (initial.jsReady !== 'ready') errors.push(`JS readiness ${initial.jsReady}`);
  if (initial.voiceAuthority !== 'PRODUCT_DECISION') errors.push(`voice authority ${initial.voiceAuthority}`);
  if (initial.voice2State !== 'collapsed' || initial.voice2Expanded !== 'false') errors.push(`voice2 initial ${initial.voice2State}/${initial.voice2Expanded}`);
  if (!initial.voice2Bg || !initial.voice3Bg || initial.voice2Bg === initial.voice3Bg) errors.push('voice odd/even backgrounds are not distinct');
  if (initial.messagesAuthority !== 'PRODUCT_DECISION') errors.push(`messages authority ${initial.messagesAuthority}`);
  if (!['SWIPER_READY', 'SWIPER_FALLBACK'].includes(initial.messagesStatus)) errors.push(`messages status ${initial.messagesStatus}`);
  if (initial.messagesAutoplay && initial.messagesAutoplay !== 'QA_PAUSED') errors.push(`QA autoplay ${initial.messagesAutoplay}`);
  if (!initial.headerTransition.split(',').every(value => value.trim() === '0.3s')) errors.push(`button transition ${initial.headerTransition}`);
  if (initial.pageTopVisibleAtTop) errors.push('page top should be hidden at document top');
  if (!initial.footerLinks.some(href => href === 'https://www.cku.ac.jp/') || !initial.footerLinks.some(href => href === 'https://www.chiba-kc.ac.jp/')) errors.push(`footer links ${initial.footerLinks.join(', ')}`);

  const header = page.locator('.ref-header .ref-action--blue').first();
  const headerBefore = await header.evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
  await header.hover();
  await page.waitForTimeout(350);
  const headerAfter = await header.evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
  if (headerBefore.bg === headerAfter.bg || headerBefore.color === headerAfter.color) errors.push('header button did not invert on hover');

  const oc = page.locator('.ref-mv__oc');
  const ocBefore = await oc.evaluate(el => ({ bg: getComputedStyle(el, '::after').backgroundColor, image: getComputedStyle(el, '::after').backgroundImage }));
  await oc.hover();
  await page.waitForTimeout(350);
  const ocAfter = await oc.evaluate(el => ({ bg: getComputedStyle(el, '::after').backgroundColor, image: getComputedStyle(el, '::after').backgroundImage }));
  if (ocBefore.bg === ocAfter.bg || ocBefore.image === ocAfter.image) errors.push('MV OC arrow circle did not invert on hover');

  const voice2 = page.locator('.ref-voice-item[data-voice-item="2"]');
  const heightBefore = await voice2.evaluate(el => el.getBoundingClientRect().height);
  await voice2.locator('.ref-voice-toggle').click();
  await page.waitForTimeout(350);
  const voiceAfter = await voice2.evaluate(el => ({ state: el.dataset.voiceState, height: el.getBoundingClientRect().height, hidden: el.querySelector('.ref-voice-disclosure')?.getAttribute('aria-hidden') }));
  if (voiceAfter.state !== 'open' || voiceAfter.hidden !== 'false' || voiceAfter.height <= heightBefore) errors.push(`voice2 did not open ${JSON.stringify(voiceAfter)} from ${heightBefore}`);

  const messages = page.locator('[data-section="messages"]');
  const activeBefore = await messages.getAttribute('data-active-slide');
  await messages.locator('.ref-messages__next').click();
  await page.waitForTimeout(400);
  const activeAfter = await messages.getAttribute('data-active-slide');
  if (!activeAfter || activeAfter === activeBefore) errors.push(`messages next did not move ${activeBefore} -> ${activeAfter}`);

  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(100);
  const pageTopVisible = await page.locator('.ref-footer__pagetop').evaluate(el => el.classList.contains('is-visible'));
  if (!pageTopVisible) errors.push('page top did not appear after scroll');
  await page.locator('.ref-footer__pagetop').click();
  await page.waitForTimeout(450);
  const scrollAfterTop = await page.evaluate(() => window.scrollY);
  if (scrollAfterTop > 3) errors.push(`page top ended at ${scrollAfterTop}`);

  report.interaction = { initial, headerBefore, headerAfter, ocBefore, ocAfter, voiceAfter, messages: { activeBefore, activeAfter }, pageTop: { visible: pageTopVisible, scrollAfterTop }, pageErrors, errors };
  if (errors.length) failed = true;
  await fs.writeFile(path.join(outDir, 'pc-after-interactions.png'), await page.screenshot({ fullPage: true }));
  await page.close();
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
for (const viewport of report.viewports) console.log(`[${viewport.name}] ${viewport.errors.length ? 'FAIL' : 'PASS'} width=${viewport.scrollWidth}/${viewport.clientWidth} status=${viewport.messagesStatus}`);
console.log(`interaction=${report.interaction?.errors?.length ? 'FAIL' : 'PASS'}`);
for (const error of report.interaction?.errors || []) console.error(error);
if (failed) process.exit(1);
