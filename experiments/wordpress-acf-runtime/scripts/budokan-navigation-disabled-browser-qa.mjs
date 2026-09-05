import { chromium } from 'playwright';

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('FAIL usage: node budokan-navigation-disabled-browser-qa.mjs <url>');
  process.exit(2);
}

const EPS = 1;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;

async function state(locator) {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      href: el.getAttribute('href'),
      ariaDisabled: el.getAttribute('aria-disabled'),
      tabIndex: el.tabIndex,
      pointerEvents: style.pointerEvents,
      focused: document.activeElement === el,
      hitOwns: Boolean(hit && (hit === el || el.contains(hit))),
      scrollY: window.scrollY,
      scrollX: window.scrollX,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
}

async function place(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    window.scrollBy(0, rect.top - Math.round(window.innerHeight * 0.36));
  });
  await page.waitForTimeout(60);
}

function assertGeometry(before, after, label) {
  for (const key of ['top', 'left', 'width', 'height']) {
    assert(near(before[key], after[key]), `${label}: ${key} shifted ${before[key]} -> ${after[key]}`);
  }
  assert(near(before.scrollY, after.scrollY), `${label}: scrollY shifted ${before.scrollY} -> ${after.scrollY}`);
  assert(near(before.scrollX, after.scrollX), `${label}: scrollX shifted ${before.scrollX} -> ${after.scrollX}`);
  assert(after.scrollWidth <= after.clientWidth + 1, `${label}: horizontal overflow ${after.scrollWidth} > ${after.clientWidth}`);
}

async function auditFamily(page, label, family) {
  const enabled = page.locator(`[data-qa-nav="${family}-enabled"]`);
  const disabled = page.locator(`[data-qa-nav="${family}-disabled"]`);
  await enabled.waitFor({ state: 'visible' });
  await disabled.waitFor({ state: 'visible' });
  await place(page, enabled);

  const disabledState = await state(disabled);
  assert(disabledState.href === null, `${label}/${family}: disabled card still has href=${disabledState.href}`);
  assert(disabledState.ariaDisabled === 'true', `${label}/${family}: disabled card missing aria-disabled=true`);
  assert(disabledState.tabIndex === -1, `${label}/${family}: disabled card remains keyboard-focusable; tabIndex=${disabledState.tabIndex}`);
  assert(disabledState.pointerEvents === 'none', `${label}/${family}: disabled card pointer-events is ${disabledState.pointerEvents}`);
  assert(!disabledState.hitOwns, `${label}/${family}: disabled anchor unexpectedly owns pointer center despite pointer-events:none`);

  const base = await state(enabled);
  assert(base.href === '#qa-navigation-target', `${label}/${family}: enabled card lost href`);
  assert(base.hitOwns, `${label}/${family}: enabled card pointer center intercepted`);
  assert(base.scrollY > 100, `${label}/${family}: deep-scroll precondition missing`);
  assert(base.scrollWidth <= base.clientWidth + 1, `${label}/${family}: horizontal overflow at baseline`);

  await enabled.hover();
  await page.waitForTimeout(100);
  const hovered = await state(enabled);
  assert(hovered.hitOwns, `${label}/${family}: enabled card pointer center intercepted on hover`);
  assertGeometry(base, hovered, `${label}/${family} hover`);

  await enabled.focus();
  await page.waitForTimeout(80);
  const focused = await state(enabled);
  assert(focused.focused, `${label}/${family}: enabled card focus failed`);
  assertGeometry(hovered, focused, `${label}/${family} focus`);

  await page.keyboard.press('Tab');
  await page.waitForTimeout(50);
  const activeQa = await page.evaluate(() => document.activeElement?.getAttribute('data-qa-nav') || '');
  assert(activeQa !== `${family}-disabled`, `${label}/${family}: Tab entered disabled URL-less card`);
}

async function auditStickyFocusBoundary(page, label, family) {
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  const enabled = page.locator(`[data-qa-nav="${family}-enabled"]`);
  const sticky = page.locator('.gf_sticky');
  await enabled.waitFor({ state: 'visible' });
  await sticky.waitFor({ state: 'visible' });

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(80);
  await enabled.focus();
  await page.waitForTimeout(100);

  const focused = await state(enabled);
  const stickyState = await state(sticky);
  assert(focused.focused, `${label}/${family}: enabled card focus failed from document-end boundary`);
  assert(focused.bottom <= stickyState.top + EPS,
    `${label}/${family}: focused card is hidden behind sticky shortcuts; card bottom ${focused.bottom}, sticky top ${stickyState.top}`);
  assert(focused.hitOwns, `${label}/${family}: enabled card pointer center intercepted after document-end focus`);
  assert(focused.scrollWidth <= focused.clientWidth + 1,
    `${label}/${family}: horizontal overflow after document-end focus`);

  const beforeScroll = await state(enabled);
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(100);
  const afterScroll = await state(enabled);
  assert(afterScroll.scrollWidth <= afterScroll.clientWidth + 1,
    `${label}/${family}: horizontal overflow after follow-up scroll`);
  assert(afterScroll.bottom <= stickyState.top + 121,
    `${label}/${family}: follow-up scroll placed card unexpectedly deep behind sticky shortcuts`);
  assert(beforeScroll.scrollY <= afterScroll.scrollY + EPS,
    `${label}/${family}: follow-up downward scroll unexpectedly moved page upward ${beforeScroll.scrollY} -> ${afterScroll.scrollY}`);
}

async function run(label, viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    for (const family of ['large', 'small']) {
      await auditFamily(page, label, family);
    }
    if (viewport.width < 768) {
      for (const family of ['large', 'small']) {
        await auditStickyFocusBoundary(page, label, family);
      }
    }
    console.log(`PASS ${label}: ACF Navigation Large/Small URL-less cards fail closed for pointer and keyboard, enabled cards keep stable hover/focus geometry, and SP document-end focus clears fixed shortcuts.`);
  } finally {
    await context.close();
    await browser.close();
  }
}

await run('PC 1395', { width: 1395, height: 900 });
await run('SP 390', { width: 390, height: 844 });
