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
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

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

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    const trigger = page.locator('.qa-modal-trigger');
    await trigger.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const before = await snapshot();
    assert(before.header && before.trigger, `${label}: modal fixture/header missing.`);
    assert(before.docWidth <= before.clientWidth + 1, `${label}: baseline horizontal overflow ${before.docWidth}px > ${before.clientWidth}px.`);

    await trigger.click();
    await page.locator('.modaal-wrapper').waitFor({ state: 'visible' });
    await page.waitForTimeout(450);
    const opened = await snapshot();
    assert(opened.modalOpen, `${label}: Modaal did not open.`);
    assert(opened.bodyClass.includes('modaal-noscroll'), `${label}: Modaal did not lock background scroll.`);
    assert(close(opened.scrollY, before.scrollY), `${label}: open changed scrollY ${before.scrollY} -> ${opened.scrollY}.`);
    assert(close(opened.header.left, before.header.left), `${label}: open moved header left ${before.header.left} -> ${opened.header.left}.`);
    assert(close(opened.header.width, before.header.width), `${label}: open resized header ${before.header.width} -> ${opened.header.width}.`);
    assert(close(opened.bodyWidth, before.bodyWidth), `${label}: open resized body ${before.bodyWidth} -> ${opened.bodyWidth}.`);
    assert(opened.docWidth <= opened.clientWidth + 1, `${label}: open introduced horizontal overflow ${opened.docWidth}px > ${opened.clientWidth}px.`);
    assert(opened.activeInsideModal, `${label}: focus did not move inside modal.`);

    await page.keyboard.press('Escape');
    await page.locator('.modaal-wrapper').waitFor({ state: 'detached' });
    await page.waitForTimeout(400);
    const escaped = await snapshot();
    assert(!escaped.bodyClass.includes('modaal-noscroll'), `${label}: Escape close left background scroll locked.`);
    assert(close(escaped.scrollY, before.scrollY), `${label}: Escape close changed scrollY ${before.scrollY} -> ${escaped.scrollY}.`);
    assert(close(escaped.header.width, before.header.width), `${label}: Escape close did not restore header width.`);
    assert(escaped.activeIsTrigger, `${label}: Escape close did not return focus to trigger.`);

    await trigger.click();
    await page.locator('.modaal-wrapper').waitFor({ state: 'visible' });
    await page.waitForTimeout(400);
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
    assert(close(closed.scrollY, before.scrollY), `${label}: pointer close changed scrollY ${before.scrollY} -> ${closed.scrollY}.`);
    assert(closed.activeIsTrigger, `${label}: pointer close did not return focus to trigger.`);
    assert(errors.length === 0, `${label}: browser errors: ${errors.join(' | ')}`);
    console.log(`PASS ${label}: Modaal keeps background geometry/scroll stable and restores focus after Escape/pointer close.`);
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
