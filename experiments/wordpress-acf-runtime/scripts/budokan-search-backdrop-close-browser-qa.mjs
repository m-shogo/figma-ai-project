import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-search-backdrop-close-browser-qa.mjs <url>');
  process.exit(2);
}

const EPS = 2;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const near = (a, b, tolerance = EPS) => Math.abs(a - b) <= tolerance;

async function snapshot(page) {
  return page.evaluate(() => {
    const header = document.querySelector('#global_header');
    const fv = document.querySelector('.top_mainVisual');
    const search = document.querySelector('#gh_search');
    if (!header || !fv || !search) return null;
    const headerRect = header.getBoundingClientRect();
    const fvRect = fv.getBoundingClientRect();
    const searchRect = search.getBoundingClientRect();
    return {
      bodyClass: document.body.className,
      scrollY: window.scrollY,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      headerTop: headerRect.top,
      headerLeft: headerRect.left,
      headerWidth: headerRect.width,
      headerHeight: headerRect.height,
      fvTop: fvRect.top,
      fvLeft: fvRect.left,
      fvWidth: fvRect.width,
      searchTop: searchRect.top,
      searchLeft: searchRect.left,
      searchWidth: searchRect.width,
      searchHeight: searchRect.height,
      searchExpanded: search.getAttribute('aria-expanded'),
      activeClass: document.activeElement?.className || '',
    };
  });
}

function assertBackgroundStable(before, after, label, { scroll = true } = {}) {
  assert(before && after, `${label}: required geometry missing`);
  if (scroll) {
    assert(near(after.scrollY, before.scrollY), `${label}: scrollY shifted ${before.scrollY} -> ${after.scrollY}`);
  }
  assert(near(after.clientWidth, before.clientWidth, 0.5), `${label}: client width shifted ${before.clientWidth} -> ${after.clientWidth}`);
  assert(after.scrollWidth <= before.scrollWidth + 1, `${label}: horizontal overflow increased ${before.scrollWidth} -> ${after.scrollWidth}`);
  assert(near(after.headerTop, before.headerTop), `${label}: header top shifted ${before.headerTop} -> ${after.headerTop}`);
  assert(near(after.headerLeft, before.headerLeft), `${label}: header left shifted ${before.headerLeft} -> ${after.headerLeft}`);
  assert(near(after.headerWidth, before.headerWidth, 0.5), `${label}: header width shifted ${before.headerWidth} -> ${after.headerWidth}`);
  assert(near(after.headerHeight, before.headerHeight, 0.5), `${label}: header height shifted ${before.headerHeight} -> ${after.headerHeight}`);
  assert(near(after.fvTop, before.fvTop), `${label}: FV top shifted ${before.fvTop} -> ${after.fvTop}`);
  assert(near(after.fvLeft, before.fvLeft), `${label}: FV left shifted ${before.fvLeft} -> ${after.fvLeft}`);
  assert(near(after.fvWidth, before.fvWidth, 0.5), `${label}: FV width shifted ${before.fvWidth} -> ${after.fvWidth}`);
}

async function pointerClick(page, selector, label) {
  const target = page.locator(selector);
  await target.waitFor({ state: 'visible' });
  const box = await target.boundingBox();
  assert(box, `${label}: no pointer box`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const owns = await page.evaluate(({ selector, x, y }) => {
    const target = document.querySelector(selector);
    const hit = document.elementFromPoint(x, y);
    return Boolean(target && hit && (hit === target || target.contains(hit)));
  }, { selector, x, y });
  assert(owns, `${label}: pointer center intercepted`);
  await page.mouse.click(x, y);
}

async function clickBackdrop(page, label) {
  const overlay = page.locator('#overlay');
  await overlay.waitFor({ state: 'visible' });
  const box = await overlay.boundingBox();
  assert(box, `${label}: overlay has no pointer box`);

  const candidates = [
    [box.x + box.width * 0.5, box.y + box.height * 0.85],
    [box.x + box.width * 0.15, box.y + box.height * 0.75],
    [box.x + box.width * 0.85, box.y + box.height * 0.75],
    [box.x + box.width * 0.5, box.y + box.height * 0.6],
  ];

  const point = await page.evaluate(({ candidates }) => {
    const overlay = document.querySelector('#overlay');
    if (!overlay) return null;
    for (const [x, y] of candidates) {
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === overlay || overlay.contains(hit))) return { x, y };
    }
    return null;
  }, { candidates });
  assert(point, `${label}: no visible backdrop point is pointer-owned by #overlay`);
  await page.mouse.click(point.x, point.y);
}

async function runViewport(browser, viewport, contextOptions, label) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    const maxScrollY = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
    const targetY = maxScrollY > 700 ? Math.floor(maxScrollY * 0.7) : Math.max(1, Math.min(350, maxScrollY));
    await page.evaluate((y) => window.scrollTo(0, y), targetY);
    await page.waitForTimeout(120);

    const before = await snapshot(page);
    assert(before && before.scrollY > 0, `${label}: deep-scroll precondition missing`);

    await pointerClick(page, '#gh_search', `${label} search open`);
    await page.waitForTimeout(450);
    const opened = await snapshot(page);
    assert(opened?.bodyClass.includes('_open-search'), `${label}: search did not open`);
    assert(opened?.bodyClass.includes('_contentFixed'), `${label}: search did not enter scroll lock`);
    assert(opened?.searchExpanded === 'true', `${label}: aria-expanded not true after open`);
    assert(String(opened?.activeClass).includes('ms_input'), `${label}: search input did not receive focus after open animation`);
    // The established scroll lock stores the deep-scroll position on body.top.
    // While locked, visual geometry is the invariant; window.scrollY is verified
    // only after close restores the saved document position.
    assertBackgroundStable(before, opened, `${label} search open/focus`, { scroll: false });

    await clickBackdrop(page, `${label} search backdrop close`);
    await page.waitForTimeout(450);
    const closed = await snapshot(page);
    assert(closed && !closed.bodyClass.includes('_open-search'), `${label}: _open-search remained after backdrop close`);
    assert(closed && !closed.bodyClass.includes('_contentFixed'), `${label}: scroll lock remained after backdrop close`);
    assert(closed?.searchExpanded === 'false', `${label}: aria-expanded not false after backdrop close`);
    assertBackgroundStable(before, closed, `${label} backdrop close`);

    await pointerClick(page, '#gh_search', `${label} search reopen`);
    await page.waitForTimeout(450);
    const reopened = await snapshot(page);
    assert(reopened?.bodyClass.includes('_open-search'), `${label}: search did not reopen`);
    assert(reopened?.searchExpanded === 'true', `${label}: aria-expanded not true after reopen`);
    assert(String(reopened?.activeClass).includes('ms_input'), `${label}: search input did not receive focus after reopen`);
    assertBackgroundStable(before, reopened, `${label} search reopen/focus`, { scroll: false });

    await clickBackdrop(page, `${label} search second backdrop close`);
    await page.waitForTimeout(450);
    const reclosed = await snapshot(page);
    assert(reclosed && !reclosed.bodyClass.includes('_open-search'), `${label}: search remained open after second backdrop close`);
    assert(reclosed && !reclosed.bodyClass.includes('_contentFixed'), `${label}: scroll lock remained after second backdrop close`);
    assertBackgroundStable(before, reclosed, `${label} second backdrop close`);
    assert(errors.length === 0, `${label}: browser errors: ${errors.join(' | ')}`);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  await runViewport(browser, { width: 375, height: 900 }, { isMobile: true, hasTouch: true }, 'SP 375');
  await runViewport(browser, { width: 1380, height: 900 }, {}, 'PC 1380');
  console.log('PASS Budokan search backdrop uses a real pointer-owned close path at deep scroll on SP/PC.');
  console.log('PASS search open focus, backdrop close, reopen, and second backdrop close preserve header/FV/document geometry and restore scroll state after close.');
} finally {
  await browser.close();
}
