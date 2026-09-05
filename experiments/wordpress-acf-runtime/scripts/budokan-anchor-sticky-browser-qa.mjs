import { chromium } from 'playwright';

const targetUrl = process.argv[2];
const requestedAudit = process.argv[3] || 'all';
const requestedViewport = process.argv[4] || 'all';
const allowedAudits = new Set(['all', 'initial-clearance', 'initial-motion', 'repeat']);
const allowedViewports = new Set(['all', 'pc', 'sp']);
if (!targetUrl || !allowedAudits.has(requestedAudit) || !allowedViewports.has(requestedViewport)) {
  console.error('FAIL usage: node budokan-anchor-sticky-browser-qa.mjs <url> [all|initial-clearance|initial-motion|repeat] [all|pc|sp]');
  process.exit(2);
}

const EPS = 2;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;

function withHash(url, hash) {
  const parsed = new URL(url);
  parsed.hash = hash;
  return parsed.toString();
}

async function pageSnapshot(page) {
  return page.evaluate(() => {
    const header = document.querySelector('#global_header');
    const target = document.querySelector('#qa-anchor-target');
    const sticky = document.querySelector('.gf_sticky');
    if (!header || !target) return null;
    const headerRect = header.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const stickyRect = sticky?.getBoundingClientRect() || null;
    const hit = document.elementFromPoint(
      targetRect.left + Math.min(targetRect.width / 2, 30),
      targetRect.top + Math.min(targetRect.height / 2, 20),
    );
    return {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      header: {
        top: headerRect.top,
        bottom: headerRect.bottom,
        left: headerRect.left,
        width: headerRect.width,
        height: headerRect.height,
      },
      target: {
        top: targetRect.top,
        bottom: targetRect.bottom,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
      },
      sticky: stickyRect ? {
        top: stickyRect.top,
        bottom: stickyRect.bottom,
        left: stickyRect.left,
        width: stickyRect.width,
        height: stickyRect.height,
      } : null,
      targetHitOwns: Boolean(hit && (hit === target || target.contains(hit))),
      samples: Array.isArray(window.__budokanInitialHashSamples)
        ? window.__budokanInitialHashSamples.slice()
        : [],
    };
  });
}

function assertDestination(snapshot, label) {
  assert(snapshot, `${label}: required header/target missing`);
  assert(snapshot.scrollY > 100, `${label}: deep-scroll precondition missing; scrollY=${snapshot.scrollY}`);
  assert(snapshot.target.top >= snapshot.header.bottom - EPS,
    `${label}: target hidden behind sticky header; target top ${snapshot.target.top}, header bottom ${snapshot.header.bottom}`);
  assert(snapshot.scrollWidth <= snapshot.clientWidth + 1,
    `${label}: horizontal overflow ${snapshot.scrollWidth} > ${snapshot.clientWidth}`);
}

async function captureInitialHash(page, label) {
  await page.addInitScript(() => {
    window.__budokanInitialHashSamples = [];
    window.addEventListener('scroll', () => {
      window.__budokanInitialHashSamples.push({ y: window.scrollY, t: performance.now() });
    }, { passive: true });
  });

  await page.goto(withHash(targetUrl, 'qa-anchor-target'), { waitUntil: 'load' });
  await page.waitForTimeout(120);
  const early = await pageSnapshot(page);
  assert(early, `${label}/initial-hash early: required header/target missing`);
  assert(early.scrollY > 100, `${label}/initial-hash early: browser did not reach the deep target; scrollY=${early.scrollY}`);
  assert(early.scrollWidth <= early.clientWidth + 1,
    `${label}/initial-hash early: horizontal overflow ${early.scrollWidth} > ${early.clientWidth}`);

  await page.waitForTimeout(520);
  const settled = await pageSnapshot(page);
  assert(settled, `${label}/initial-hash settled: required header/target missing`);
  return { early, settled };
}

async function auditInitialHashClearance(page, label) {
  const { settled } = await captureInitialHash(page, label);
  assertDestination(settled, `${label}/initial-hash settled`);
}

async function auditInitialHashMotion(page, label) {
  const { early, settled } = await captureInitialHash(page, label);
  assert(settled.scrollY > 100, `${label}/initial-hash settled: deep-scroll precondition missing; scrollY=${settled.scrollY}`);
  assert(settled.scrollWidth <= settled.clientWidth + 1,
    `${label}/initial-hash settled: horizontal overflow ${settled.scrollWidth} > ${settled.clientWidth}`);
  assert(near(early.scrollY, settled.scrollY, 4),
    `${label}/initial-hash: page corrected after first visible destination; scrollY ${early.scrollY} -> ${settled.scrollY}; samples=${JSON.stringify(settled.samples)}`);
  assert(near(early.target.top, settled.target.top, 4),
    `${label}/initial-hash: target visibly moved after first render; top ${early.target.top} -> ${settled.target.top}`);
  assert(near(early.header.top, settled.header.top, 2),
    `${label}/initial-hash: header moved during delayed hash correction; top ${early.header.top} -> ${settled.header.top}`);
  assert(near(early.header.width, settled.header.width, 2),
    `${label}/initial-hash: header width changed; ${early.header.width} -> ${settled.header.width}`);
}

async function auditRepeatedClick(page, label) {
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  const link = page.locator('[data-qa-control="inline"]');
  const target = page.locator('#qa-anchor-target');
  await link.scrollIntoViewIfNeeded();
  await link.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    window.scrollBy(0, rect.top - Math.round(window.innerHeight * 0.38));
  });
  await page.waitForTimeout(60);

  for (let pass = 1; pass <= 2; pass += 1) {
    const linkRect = await link.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return { hitOwns: Boolean(hit && (hit === el || el.contains(hit))) };
    });
    assert(linkRect.hitOwns, `${label}/repeat ${pass}: anchor link pointer center intercepted`);

    await link.click();
    await page.waitForTimeout(420);
    const reached = await pageSnapshot(page);
    assertDestination(reached, `${label}/repeat ${pass}`);

    if (pass === 1) {
      await link.scrollIntoViewIfNeeded();
      await link.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        window.scrollBy(0, rect.top - Math.round(window.innerHeight * 0.38));
      });
      await page.waitForTimeout(60);
    }
  }

  const targetBox = await target.boundingBox();
  assert(targetBox, `${label}/repeat: target missing after repeated navigation`);
}

async function runViewport(key, label, viewport) {
  if (requestedViewport !== 'all' && requestedViewport !== key) return;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  try {
    if (requestedAudit === 'all' || requestedAudit === 'initial-clearance') {
      await auditInitialHashClearance(page, label);
      console.log(`PASS ${label}: settled initial URL hash clears the sticky header.`);
    }
    if (requestedAudit === 'all' || requestedAudit === 'initial-motion') {
      await auditInitialHashMotion(page, label);
      console.log(`PASS ${label}: initial URL hash does not visibly re-correct.`);
    }
    if (requestedAudit === 'all' || requestedAudit === 'repeat') {
      await auditRepeatedClick(page, label);
      console.log(`PASS ${label}: repeated same-page anchor interaction is stable.`);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

await runViewport('pc', 'PC 1395', { width: 1395, height: 900 });
await runViewport('sp', 'SP 390', { width: 390, height: 844 });
