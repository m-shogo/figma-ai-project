import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('FAIL usage: node budokan-modal-interaction-browser-qa.mjs <url>');
  process.exit(2);
}
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const close = (a, b, tolerance = 2) => Math.abs(a - b) <= tolerance;
const browser = await chromium.launch({ headless: true });

const runCase = async ({ label, width, mobile = false }) => {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  const pageErrors = [];
  const failedRequests = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    const resourceType = request.resourceType();
    const requestUrl = request.url();
    const failure = request.failure()?.errorText || 'request failed';
    failedRequests.push({ resourceType, requestUrl, failure });
  });

  const snapshot = () => page.evaluate(() => {
    const header = document.querySelector('#global_header');
    const trigger = document.querySelector('.qa-modal-trigger');
    const modal = document.querySelector('.modaal-wrapper');
    const headerRect = header?.getBoundingClientRect();
    const triggerRect = trigger?.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      bodyClass: document.body.className,
      header: headerRect ? { top: headerRect.top, left: headerRect.left, width: headerRect.width, height: headerRect.height } : null,
      trigger: triggerRect ? { top: triggerRect.top, left: triggerRect.left, width: triggerRect.width, height: triggerRect.height } : null,
      docWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.getBoundingClientRect().width,
      modalOpen: Boolean(modal),
      activeInsideModal: Boolean(modal && modal.contains(document.activeElement)),
      activeIsTrigger: document.activeElement === trigger,
    };
  });

  const assertBackgroundStable = (before, after, action) => {
    assert(close(after.scrollY, before.scrollY), `${label}: ${action} changed scrollY ${before.scrollY} -> ${after.scrollY}.`);
    assert(close(after.header.top, before.header.top), `${label}: ${action} moved header top ${before.header.top} -> ${after.header.top}.`);
    assert(close(after.header.left, before.header.left), `${label}: ${action} moved header left ${before.header.left} -> ${after.header.left}.`);
    assert(close(after.header.width, before.header.width), `${label}: ${action} resized header ${before.header.width} -> ${after.header.width}.`);
    assert(close(after.trigger.top, before.trigger.top), `${label}: ${action} moved trigger top ${before.trigger.top} -> ${after.trigger.top}.`);
    assert(close(after.trigger.left, before.trigger.left), `${label}: ${action} moved trigger left ${before.trigger.left} -> ${after.trigger.left}.`);
    assert(close(after.trigger.width, before.trigger.width), `${label}: ${action} resized trigger ${before.trigger.width} -> ${after.trigger.width}.`);
    assert(close(after.bodyWidth, before.bodyWidth), `${label}: ${action} resized body ${before.bodyWidth} -> ${after.bodyWidth}.`);
    assert(close(after.clientWidth, before.clientWidth), `${label}: ${action} changed document client width ${before.clientWidth} -> ${after.clientWidth}.`);
    assert(after.docWidth <= after.clientWidth + 1, `${label}: ${action} introduced horizontal overflow ${after.docWidth}px > ${after.clientWidth}px.`);
  };

  try {
    const origin = new URL(url).origin;
    await page.goto(url, { waitUntil: 'networkidle' });
    const trigger = page.locator('.qa-modal-trigger');
    await trigger.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const before = await snapshot();
    assert(before.header && before.trigger, `${label}: modal fixture/header missing.`);
    assert(before.scrollY > 100, `${label}: modal deep-scroll precondition missing; scrollY=${before.scrollY}.`);
    assert(before.docWidth <= before.clientWidth + 1, `${label}: baseline horizontal overflow ${before.docWidth}px > ${before.clientWidth}px.`);

    await trigger.click();
    await page.locator('.modaal-wrapper').waitFor({ state: 'visible' });
    await page.waitForTimeout(450);
    const opened = await snapshot();
    assert(opened.modalOpen, `${label}: Modaal did not open.`);
    assert(opened.bodyClass.includes('modaal-noscroll'), `${label}: Modaal did not lock background scroll.`);
    assertBackgroundStable(before, opened, 'open');
    assert(opened.activeInsideModal, `${label}: focus did not move inside modal.`);

    await page.keyboard.press('Escape');
    await page.locator('.modaal-wrapper').waitFor({ state: 'detached' });
    await page.waitForTimeout(400);
    const escaped = await snapshot();
    assert(!escaped.bodyClass.includes('modaal-noscroll'), `${label}: Escape close left background scroll locked.`);
    assertBackgroundStable(before, escaped, 'Escape close');
    assert(escaped.activeIsTrigger, `${label}: Escape close did not return focus to trigger.`);

    await trigger.click();
    await page.locator('.modaal-wrapper').waitFor({ state: 'visible' });
    await page.waitForTimeout(400);
    const reopened = await snapshot();
    assert(reopened.modalOpen, `${label}: Modaal did not reopen.`);
    assert(reopened.bodyClass.includes('modaal-noscroll'), `${label}: Modaal reopen did not lock background scroll.`);
    assertBackgroundStable(before, reopened, 'reopen');
    assert(reopened.activeInsideModal, `${label}: focus did not move inside modal on reopen.`);

    const closeButton = page.locator('.modaal-close');
    const hit = await closeButton.evaluate(el => {
      const r = el.getBoundingClientRect();
      const target = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return target === el || el.contains(target);
    });
    assert(hit, `${label}: modal close control is visually present but does not own its pointer hit target.`);
    await closeButton.click();
    await page.locator('.modaal-wrapper').waitFor({ state: 'detached' });
    await page.waitForTimeout(400);
    const closed = await snapshot();
    assertBackgroundStable(before, closed, 'pointer close after reopen');
    assert(closed.activeIsTrigger, `${label}: pointer close did not return focus to trigger.`);

    const criticalRequestFailures = failedRequests.filter(({ resourceType, requestUrl }) => {
      if (!['script', 'stylesheet'].includes(resourceType)) return false;
      try {
        return new URL(requestUrl).origin === origin;
      } catch {
        return false;
      }
    });
    assert(pageErrors.length === 0, `${label}: page errors: ${pageErrors.join(' | ')}`);
    assert(criticalRequestFailures.length === 0, `${label}: critical same-origin resource failures: ${criticalRequestFailures.map(({ resourceType, requestUrl, failure }) => `${resourceType} ${requestUrl} (${failure})`).join(' | ')}`);
    if (failedRequests.length > 0) {
      console.log(`NOTE ${label}: ignored non-critical request failures: ${failedRequests.map(({ resourceType, requestUrl, failure }) => `${resourceType} ${requestUrl} (${failure})`).join(' | ')}`);
    }
    console.log(`PASS ${label}: Modaal keeps deep-scroll background geometry stable across open/Escape/reopen/pointer-close and restores focus.`);
  } finally {
    await context.close();
  }
};

try {
  await runCase({ label: 'Budokan SP 375 modal', width: 375, mobile: true });
  await runCase({ label: 'Budokan PC 1280 modal', width: 1280 });
  await runCase({ label: 'Budokan PC 1380 modal', width: 1380 });
} finally {
  await browser.close();
}
