import { chromium } from 'playwright';

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Usage: node budokan-event-single-pc-visual-browser-qa.mjs <event-single-url>');
  process.exit(2);
}

const EPS = 2;
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1395, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  const visual = page.locator('.global_mainVisual');
  const titleBand = page.locator('.module_titleSingle');
  const titleHead = titleBand.locator('.head');
  const titleBody = titleBand.locator('.body');
  const title = titleBand.locator('.module_title-01');
  const content = page.locator('.global_inner._content .gc_main._oneColumn');

  await visual.waitFor({ state: 'visible' });
  await titleBand.waitFor({ state: 'visible' });
  await content.waitFor({ state: 'visible' });

  const metrics = await page.evaluate(() => {
    const q = (selector) => document.querySelector(selector);
    const rect = (el) => el.getBoundingClientRect();
    const style = (el) => getComputedStyle(el);
    const visual = q('.global_mainVisual');
    const band = q('.module_titleSingle');
    const head = q('.module_titleSingle .head');
    const body = q('.module_titleSingle .body');
    const title = q('.module_titleSingle .module_title-01');
    const date = q('.module_titleSingle .date');
    const label = q('.module_titleSingle .category .label');
    const content = q('.global_inner._content .gc_main._oneColumn');
    if (!visual || !band || !head || !body || !title || !date || !content) return null;
    const visualRect = rect(visual);
    const bandRect = rect(band);
    const headRect = rect(head);
    const bodyRect = rect(body);
    const contentRect = rect(content);
    const bandStyle = style(band);
    const titleStyle = style(title);
    const dateStyle = style(date);
    return {
      visual: { top: visualRect.top, height: visualRect.height, bottom: visualRect.bottom },
      band: {
        top: bandRect.top,
        bottom: bandRect.bottom,
        paddingTop: parseFloat(bandStyle.paddingTop),
        paddingBottom: parseFloat(bandStyle.paddingBottom),
        marginBottom: parseFloat(bandStyle.marginBottom),
      },
      head: { left: headRect.left, width: headRect.width },
      body: { left: bodyRect.left, width: bodyRect.width, top: bodyRect.top },
      content: { left: contentRect.left, width: contentRect.width, top: contentRect.top },
      title: {
        fontSize: parseFloat(titleStyle.fontSize),
        fontWeight: titleStyle.fontWeight,
        lineHeight: parseFloat(titleStyle.lineHeight),
        letterSpacing: parseFloat(titleStyle.letterSpacing),
      },
      date: {
        fontSize: parseFloat(dateStyle.fontSize),
        fontWeight: dateStyle.fontWeight,
        lineHeight: parseFloat(dateStyle.lineHeight),
        letterSpacing: parseFloat(dateStyle.letterSpacing),
      },
      labelWidth: label ? rect(label).width : null,
      document: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
    };
  });

  assert(metrics, 'Event detail PC geometry could not be measured');
  assert(near(metrics.visual.height, 220), `Figma PC page-title height must be 220px; got ${metrics.visual.height}`);
  assert(near(metrics.band.top, metrics.visual.bottom), `Event detail title band must begin directly after page title; visual bottom ${metrics.visual.bottom}, band top ${metrics.band.top}`);
  assert(near(metrics.band.paddingTop, 48) && near(metrics.band.paddingBottom, 48), `Event detail title band padding must be 48px; got ${metrics.band.paddingTop}/${metrics.band.paddingBottom}`);
  assert(near(metrics.band.marginBottom, 48), `Event detail PC title-to-content rhythm must be 48px; got ${metrics.band.marginBottom}`);
  assert(near(metrics.head.width, 960) && near(metrics.body.width, 960), `Event detail title rail must be 960px; got head ${metrics.head.width}, body ${metrics.body.width}`);
  assert(near(metrics.content.width, 960), `Event detail content rail must be 960px; got ${metrics.content.width}`);
  assert(near(metrics.head.left, metrics.content.left) && near(metrics.body.left, metrics.content.left), 'Event detail title and article rails must share the same PC left edge');
  assert(near(metrics.content.top - metrics.band.bottom, 48), `Figma PC band-to-content gap must be 48px; got ${metrics.content.top - metrics.band.bottom}`);
  assert(near(metrics.title.fontSize, 32), `Event detail PC title must be 32px; got ${metrics.title.fontSize}`);
  assert(metrics.title.fontWeight === '700', `Event detail PC title weight must be 700; got ${metrics.title.fontWeight}`);
  assert(near(metrics.title.lineHeight, 44.8, 1), `Event detail PC title line-height must be 1.4; got ${metrics.title.lineHeight}px`);
  assert(near(metrics.title.letterSpacing, 1.6, 0.25), `Event detail PC title tracking must be 5%; got ${metrics.title.letterSpacing}px`);
  assert(near(metrics.date.fontSize, 14), `Event detail PC date must be 14px; got ${metrics.date.fontSize}`);
  assert(metrics.date.fontWeight === '500', `Event detail PC date weight must be 500; got ${metrics.date.fontWeight}`);
  assert(near(metrics.date.lineHeight, 14, 1), `Event detail PC date line-height must be 1; got ${metrics.date.lineHeight}px`);
  assert(metrics.labelWidth === null || near(metrics.labelWidth, 80, 1), `Event detail PC category label must be 80px; got ${metrics.labelWidth}`);
  assert(metrics.document.scrollWidth <= metrics.document.clientWidth + 1, `Event detail PC has horizontal overflow: ${metrics.document.scrollWidth} > ${metrics.document.clientWidth}`);

  console.log('PASS Budokan Event detail PC visual geometry against current Figma 1632:10382.');
} finally {
  await context.close();
  await browser.close();
}
