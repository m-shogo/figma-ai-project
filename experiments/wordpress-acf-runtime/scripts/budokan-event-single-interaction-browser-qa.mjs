import { chromium } from 'playwright';

const targetUrl = process.argv[2];
const expectedArchiveUrl = process.argv[3];
if (!targetUrl || !expectedArchiveUrl) {
  console.error('Usage: node budokan-event-single-interaction-browser-qa.mjs <url> <event-archive-url>');
  process.exit(2);
}

const EPS = 2;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;
const normalizeUrl = (value, base = targetUrl) => new URL(value, base).href;
const expectedArchive = normalizeUrl(expectedArchiveUrl);

async function snapshot(locator) {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height,
      scrollX: window.scrollX, scrollY: window.scrollY,
      clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
      hitOwns: Boolean(hit && (hit === el || el.contains(hit))), focused: document.activeElement === el };
  });
}

function assertGeometryStable(label, before, after, action, { scroll = true } = {}) {
  assert(near(after.top, before.top), `${label}: top shifted on ${action}`);
  assert(near(after.left, before.left), `${label}: left shifted on ${action}`);
  assert(near(after.width, before.width), `${label}: width shifted on ${action}`);
  assert(near(after.height, before.height), `${label}: height shifted on ${action}`);
  assert(near(after.scrollX, before.scrollX), `${label}: scrollX changed on ${action}`);
  if (scroll) assert(near(after.scrollY, before.scrollY), `${label}: scrollY jumped on ${action}`);
  assert(after.scrollWidth <= after.clientWidth + 1, `${label}: horizontal overflow on ${action}`);
}

async function placeAt(locator, targetTop) {
  await locator.evaluate((el, top) => {
    const rect = el.getBoundingClientRect();
    window.scrollBy(0, rect.top - top);
  }, targetTop);
}

async function auditReturnPager(page, label) {
  const back = page.locator('.module_pager-02 .back a');
  await back.waitFor({ state: 'visible' });
  const href = await back.getAttribute('href');
  assert(href && href !== '#' && !href.endsWith('#'), `${label}: Event return-to-list must use a real destination, got ${href}`);
  assert(normalizeUrl(href, page.url()) === expectedArchive,
    `${label}: Event return destination must equal WordPress archive ownership; expected ${expectedArchive}, got ${normalizeUrl(href, page.url())}`);
  assert(await page.locator('.module_pager-02 .prev a[href="#"], .module_pager-02 .next a[href="#"]').count() === 0,
    `${label}: hidden adjacent pager slots must not expose bare-hash links`);

  await placeAt(back, Math.max(180, Math.min(260, page.viewportSize().height * 0.35)));
  const base = await snapshot(back);
  assert(base.scrollY > 0, `${label}: deep-scroll precondition missing`);
  assert(base.hitOwns, `${label}: Event return-to-list pointer center intercepted`);
  assert(base.scrollWidth <= base.clientWidth + 1, `${label}: horizontal overflow at baseline`);

  await back.hover();
  const hovered = await snapshot(back);
  assertGeometryStable(label, base, hovered, 'hover');
  await back.focus();
  const focused = await snapshot(back);
  assert(focused.focused, `${label}: Event return-to-list focus failed`);
  assertGeometryStable(label, hovered, focused, 'focus');

  const origin = page.url();
  await Promise.all([page.waitForURL((url) => url.href !== origin, { waitUntil: 'domcontentloaded' }), page.keyboard.press('Enter')]);
  assert(normalizeUrl(page.url()) === expectedArchive, `${label}: Enter did not navigate to WordPress-owned Event archive`);

  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  const backAgain = page.locator('.module_pager-02 .back a');
  await placeAt(backAgain, Math.max(180, Math.min(260, page.viewportSize().height * 0.35)));
  const box = await backAgain.boundingBox();
  assert(box, `${label}: Event return-to-list bounding box missing`);
  const ownsPointer = await page.evaluate(({ x, y }) => {
    const hit = document.elementFromPoint(x, y);
    const link = document.querySelector('.module_pager-02 .back a');
    return Boolean(link && hit && (hit === link || link.contains(hit)));
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  assert(ownsPointer, `${label}: real pointer target intercepted before Event return click`);
  const pointerOrigin = page.url();
  await Promise.all([page.waitForURL((url) => url.href !== pointerOrigin, { waitUntil: 'domcontentloaded' }), page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)]);
  assert(normalizeUrl(page.url()) === expectedArchive, `${label}: pointer click did not navigate to WordPress-owned Event archive`);
}

async function auditStickyShortcuts(page, label) {
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  const contact = page.locator('.gf_sticky_contact');
  const access = page.locator('.gf_sticky_access');
  await contact.waitFor({ state: 'visible' });
  await access.waitFor({ state: 'visible' });
  await page.evaluate(() => window.scrollTo(0, Math.max(1, document.documentElement.scrollHeight * 0.45)));
  await page.waitForTimeout(80);

  for (const [name, locator] of [['contact', contact], ['access', access]]) {
    const href = await locator.getAttribute('href');
    assert(href && href !== '#' && !href.endsWith('#'), `${label}: sticky ${name} must use a real destination`);
    const base = await snapshot(locator);
    assert(base.scrollY > 0, `${label}: sticky ${name} deep-scroll precondition missing`);
    assert(base.hitOwns, `${label}: sticky ${name} pointer center intercepted`);
    assert(base.scrollWidth <= base.clientWidth + 1, `${label}: horizontal overflow at sticky ${name} baseline`);
    await locator.hover();
    const hovered = await snapshot(locator);
    assertGeometryStable(`${label} sticky ${name}`, base, hovered, 'hover');
    await locator.focus();
    const focused = await snapshot(locator);
    assert(focused.focused, `${label}: sticky ${name} focus failed`);
    assertGeometryStable(`${label} sticky ${name}`, hovered, focused, 'focus');
  }

  const beforeScrollContact = await snapshot(contact);
  const beforeScrollAccess = await snapshot(access);
  await page.evaluate(() => window.scrollBy(0, 240));
  await page.waitForTimeout(80);
  const afterScrollContact = await snapshot(contact);
  const afterScrollAccess = await snapshot(access);
  assertGeometryStable(`${label} sticky contact`, beforeScrollContact, afterScrollContact, 'page scroll', { scroll: false });
  assertGeometryStable(`${label} sticky access`, beforeScrollAccess, afterScrollAccess, 'page scroll', { scroll: false });
  assert(afterScrollContact.hitOwns, `${label}: sticky contact pointer ownership lost after scroll`);
  assert(afterScrollAccess.hitOwns, `${label}: sticky access pointer ownership lost after scroll`);
}

async function auditStickyContentClearance(page, label) {
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  const sticky = page.locator('.gf_sticky');
  const footerBottom = page.locator('.gf_bottom');
  const footerAccess = page.locator('.gf_access a');
  const pageTop = page.locator('.gf_pageTop a');
  const returnLink = page.locator('.module_pager-02 .back a');

  await sticky.waitFor({ state: 'visible' });
  await footerBottom.waitFor({ state: 'visible' });
  await footerAccess.waitFor({ state: 'visible' });
  await pageTop.waitFor({ state: 'visible' });
  await returnLink.waitFor({ state: 'visible' });

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(100);

  const stickyBox = await snapshot(sticky);
  const footerBottomBox = await snapshot(footerBottom);
  assert(stickyBox.hitOwns, `${label}: sticky shortcut surface lost pointer ownership at document end`);
  assert(footerBottomBox.bottom <= stickyBox.top + EPS,
    `${label}: footer action row extends behind sticky shortcuts at document end; footer bottom ${footerBottomBox.bottom}, sticky top ${stickyBox.top}`);

  for (const [name, locator] of [['footer access', footerAccess], ['Page Top', pageTop]]) {
    const base = await snapshot(locator);
    assert(base.bottom <= stickyBox.top + EPS,
      `${label}: ${name} extends behind sticky shortcuts at document end; target bottom ${base.bottom}, sticky top ${stickyBox.top}`);
    assert(base.hitOwns, `${label}: ${name} pointer center intercepted at document end`);
    await locator.focus();
    await page.waitForTimeout(40);
    const focused = await snapshot(locator);
    assert(focused.focused, `${label}: ${name} focus failed at document end`);
    assert(focused.bottom <= stickyBox.top + EPS,
      `${label}: ${name} moved behind sticky shortcuts when focused`);
    assert(focused.hitOwns, `${label}: ${name} pointer ownership lost when focused at document end`);
    assert(focused.scrollWidth <= focused.clientWidth + 1, `${label}: horizontal overflow while focusing ${name} at document end`);
  }

  await returnLink.focus();
  await page.waitForTimeout(60);
  const returnFocused = await snapshot(returnLink);
  const stickyAfterReturnFocus = await snapshot(sticky);
  assert(returnFocused.focused, `${label}: return-to-list focus failed in sticky clearance audit`);
  assert(returnFocused.bottom <= stickyAfterReturnFocus.top + EPS,
    `${label}: focused return-to-list is hidden behind sticky shortcuts`);
  assert(returnFocused.hitOwns, `${label}: focused return-to-list pointer center intercepted by sticky shortcuts`);
  assert(returnFocused.scrollWidth <= returnFocused.clientWidth + 1, `${label}: horizontal overflow after return-to-list focus`);
}

async function runViewport(label, viewport, contextOptions = {}, auditSticky = false) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    assert(await page.locator('.module_titleSingle').count(), `${label}: Event detail title missing`);
    assert(await page.locator('.single_featured').count() === 0, `${label}: Event detail must not auto-inject archive-card thumbnail`);
    await auditReturnPager(page, label);
    if (auditSticky) {
      await auditStickyShortcuts(page, label);
      await auditStickyContentClearance(page, label);
    }
    console.log(`PASS ${label}: Event detail pager${auditSticky ? ', sticky shortcut, and sticky-content clearance' : ''} interaction stability.`);
  } finally {
    await context.close();
    await browser.close();
  }
}

await runViewport('SP-390', { width: 390, height: 844 }, { isMobile: true, hasTouch: true }, true);
await runViewport('PC-1395', { width: 1395, height: 900 });
console.log('PASS Budokan Event single and SP fixed/sticky interaction QA.');
