import { chromium } from 'playwright';

const targetUrl = process.argv[2];
const requestedAudit = process.argv[3] || 'all';
const allowedAudits = new Set(['all', 'controls', 'tab', 'anchor', 'sticky']);
if (!targetUrl || !allowedAudits.has(requestedAudit)) {
  console.error('FAIL usage: node budokan-content-interaction-browser-qa.mjs <url> [all|controls|tab|anchor|sticky]');
  process.exit(2);
}

const EPS = 1;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;

async function snapshot(locator) {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      focused: document.activeElement === el,
      hitOwns: Boolean(hit && (hit === el || el.contains(hit))),
    };
  });
}

function assertStableGeometry(before, after, label) {
  for (const key of ['top', 'left', 'width', 'height']) {
    assert(near(before[key], after[key]), `${label}: ${key} shifted from ${before[key]} to ${after[key]}`);
  }
  assert(near(before.scrollY, after.scrollY), `${label}: scrollY shifted from ${before.scrollY} to ${after.scrollY}`);
  assert(near(before.scrollX, after.scrollX), `${label}: scrollX shifted from ${before.scrollX} to ${after.scrollX}`);
  assert(after.scrollWidth <= after.clientWidth + 1, `${label}: horizontal overflow ${after.scrollWidth} > ${after.clientWidth}`);
}

async function placeInSafeBand(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const desiredTop = Math.round(window.innerHeight * 0.38);
    window.scrollBy(0, rect.top - desiredTop);
  });
  await page.waitForTimeout(60);
}

async function auditControl(page, label, name) {
  const control = page.locator(`[data-qa-control="${name}"]`);
  await control.waitFor({ state: 'visible' });
  await placeInSafeBand(page, control);

  const base = await snapshot(control);
  assert(base.scrollY > 100, `${label}/${name}: deep-scroll precondition missing; scrollY=${base.scrollY}`);
  assert(base.hitOwns, `${label}/${name}: pointer center intercepted at baseline`);
  assert(base.scrollWidth <= base.clientWidth + 1, `${label}/${name}: horizontal overflow at baseline`);

  await control.hover();
  await page.waitForTimeout(80);
  const hovered = await snapshot(control);
  assert(hovered.hitOwns, `${label}/${name}: pointer center intercepted on hover`);
  assertStableGeometry(base, hovered, `${label}/${name} hover`);

  await control.focus();
  await page.waitForTimeout(80);
  const focused = await snapshot(control);
  assert(focused.focused, `${label}/${name}: focus failed`);
  assert(focused.hitOwns, `${label}/${name}: pointer center intercepted on focus`);
  assertStableGeometry(hovered, focused, `${label}/${name} focus`);
}

async function auditTabTraversal(page, label) {
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  const expected = ['default', 'cta', 'outline', 'small', 'inline'];
  const first = page.locator('[data-qa-control="default"]');
  await placeInSafeBand(page, first);
  await first.focus();

  for (let index = 0; index < expected.length; index += 1) {
    const active = await page.evaluate(() => document.activeElement?.getAttribute('data-qa-control') || '');
    assert(active === expected[index], `${label}/tab: expected ${expected[index]} at step ${index}, got ${active || '(none)'}`);
    if (index < expected.length - 1) {
      const before = await snapshot(page.locator(`[data-qa-control="${expected[index]}"]`));
      await page.keyboard.press('Tab');
      await page.waitForTimeout(40);
      const next = await snapshot(page.locator(`[data-qa-control="${expected[index + 1]}"]`));
      assert(next.focused, `${label}/tab: ${expected[index + 1]} did not receive keyboard focus`);
      assert(next.hitOwns, `${label}/tab: ${expected[index + 1]} pointer center intercepted after Tab`);
      assert(next.scrollWidth <= next.clientWidth + 1, `${label}/tab: horizontal overflow after Tab to ${expected[index + 1]}`);
      assert(near(before.scrollY, next.scrollY), `${label}/tab: page jumped while tabbing ${expected[index]} -> ${expected[index + 1]}`);
    }
  }
}

async function auditStickyFocusBoundary(page, label) {
  for (const name of ['default', 'cta', 'outline', 'small', 'inline']) {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    const control = page.locator(`[data-qa-control="${name}"]`);
    const sticky = page.locator('.gf_sticky');
    await sticky.waitFor({ state: 'visible' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(60);
    await control.focus();
    await page.waitForTimeout(80);

    const focused = await snapshot(control);
    const stickyBox = await snapshot(sticky);
    assert(focused.focused, `${label}/${name}: focus failed from document-end boundary`);
    assert(focused.bottom <= stickyBox.top + EPS,
      `${label}/${name}: focused control is hidden behind sticky shortcuts; control bottom ${focused.bottom}, sticky top ${stickyBox.top}`);
    assert(focused.hitOwns, `${label}/${name}: pointer center intercepted after focus from document end`);
    assert(focused.scrollWidth <= focused.clientWidth + 1, `${label}/${name}: horizontal overflow after document-end focus`);
  }
}

async function auditAnchorJump(page, label) {
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  const link = page.locator('[data-qa-control="inline"]');
  const target = page.locator('#qa-anchor-target');
  await placeInSafeBand(page, link);
  assert((await snapshot(link)).hitOwns, `${label}/anchor: inline link pointer center intercepted before click`);
  assert(await link.getAttribute('href') === '#qa-anchor-target', `${label}/anchor: fixture link lost its real target href`);

  await page.evaluate(() => {
    window.__budokanContentAnchorSamples = [];
    window.addEventListener('scroll', () => {
      window.__budokanContentAnchorSamples.push({ y: window.scrollY, t: performance.now() });
    }, { passive: true });
  });

  await link.click();
  await page.waitForTimeout(650);

  const targetBox = await snapshot(target);
  const headerBox = await page.locator('#global_header').evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height };
  });
  const samples = await page.evaluate(() => window.__budokanContentAnchorSamples || []);

  // common.js intentionally prevents the browser default hash navigation and
  // delegates same-page links to the Theme-owned 300ms scroll routine. The URL
  // hash is therefore not an ownership contract; rendered destination geometry is.
  assert(targetBox.scrollY > 100, `${label}/anchor: page did not move to the lower target`);
  assert(targetBox.top >= headerBox.bottom - EPS,
    `${label}/anchor: target is hidden behind header; target top ${targetBox.top}, header bottom ${headerBox.bottom}`);
  assert(targetBox.scrollWidth <= targetBox.clientWidth + 1, `${label}/anchor: horizontal overflow after anchor navigation`);

  const meaningfulDepth = Math.max(20, targetBox.scrollY * 0.5);
  const firstDeepIndex = samples.findIndex((sample) => sample.y > meaningfulDepth);
  const resetAfterDeep = firstDeepIndex >= 0 && samples.slice(firstDeepIndex + 1).some((sample) => sample.y <= 2);
  assert(!resetAfterDeep, `${label}/anchor: page visibly reset toward the top after reaching depth: ${JSON.stringify(samples)}`);
}

async function runViewport(label, viewport) {
  if (requestedAudit === 'sticky' && viewport.width >= 768) return;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    assert(await page.locator('.qa-content-interaction-fixture').count(), `${label}: fixture root missing`);

    if (requestedAudit === 'all' || requestedAudit === 'controls') {
      for (const name of ['default', 'cta', 'outline', 'small', 'inline']) {
        await auditControl(page, label, name);
      }
      console.log(`PASS ${label}: controls pointer/hover/focus geometry is stable.`);
    }
    if (requestedAudit === 'all' || requestedAudit === 'tab') {
      await auditTabTraversal(page, label);
      console.log(`PASS ${label}: Tab traversal is stable.`);
    }
    if (requestedAudit === 'all' || requestedAudit === 'anchor') {
      await auditAnchorJump(page, label);
      console.log(`PASS ${label}: same-page anchor navigation is stable.`);
    }
    if ((requestedAudit === 'all' || requestedAudit === 'sticky') && viewport.width < 768) {
      await auditStickyFocusBoundary(page, label);
      console.log(`PASS ${label}: sticky-focus clearance is stable.`);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

await runViewport('PC 1395', { width: 1395, height: 900 });
await runViewport('SP 390', { width: 390, height: 844 });
