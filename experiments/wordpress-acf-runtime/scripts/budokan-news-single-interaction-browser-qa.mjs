import { chromium } from 'playwright';

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Usage: node budokan-news-single-interaction-browser-qa.mjs <url>');
  process.exit(2);
}

const EPS = 2;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;

async function runViewport(label, viewport, contextOptions = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    const back = page.locator('.module_pager-02 .back a');
    const breadcrumb = page.locator('.module_breadCrumb-01 a').first();
    await back.waitFor({ state: 'visible' });
    assert(await breadcrumb.count(), `${label}: breadcrumb link missing`);

    const href = await back.getAttribute('href');
    assert(href && href !== '#' && !href.endsWith('#'), `${label}: return-to-list must use a real destination, got ${href}`);
    assert(await page.locator('.module_pager-02 .prev a[href="#"], .module_pager-02 .next a[href="#"]').count() === 0,
      `${label}: hidden adjacent pager slots must not expose bare-hash links`);

    await back.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const targetTop = Math.max(180, Math.min(260, window.innerHeight * 0.35));
      window.scrollBy(0, rect.top - targetTop);
    });

    async function snapshot(locator) {
      return locator.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          hitOwns: Boolean(hit && (hit === el || el.contains(hit))),
          focused: document.activeElement === el,
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderTopColor: style.borderTopColor,
        };
      });
    }

    function assertGeometryStable(before, after, action) {
      assert(near(after.top, before.top), `${label}: top shifted on ${action}`);
      assert(near(after.left, before.left), `${label}: left shifted on ${action}`);
      assert(near(after.width, before.width), `${label}: width shifted on ${action}`);
      assert(near(after.height, before.height), `${label}: height shifted on ${action}`);
      assert(near(after.scrollX, before.scrollX), `${label}: scrollX changed on ${action}`);
      assert(near(after.scrollY, before.scrollY), `${label}: scrollY jumped on ${action}`);
      assert(after.scrollWidth <= after.clientWidth + 1, `${label}: horizontal overflow on ${action}`);
    }

    const base = await snapshot(back);
    assert(base.scrollY > 0, `${label}: deep-scroll precondition missing`);
    assert(base.hitOwns, `${label}: return-to-list pointer center intercepted`);
    assert(base.scrollWidth <= base.clientWidth + 1, `${label}: horizontal overflow at baseline`);

    await back.hover();
    const hovered = await snapshot(back);
    assertGeometryStable(base, hovered, 'hover');

    await back.focus();
    const focused = await snapshot(back);
    assert(focused.focused, `${label}: return-to-list focus failed`);
    assertGeometryStable(hovered, focused, 'focus');

    const origin = new URL(page.url()).href;
    await Promise.all([
      page.waitForURL((url) => url.href !== origin, { waitUntil: 'domcontentloaded' }),
      page.keyboard.press('Enter'),
    ]);
    const keyboardDestination = page.url();
    assert(keyboardDestination !== origin && !keyboardDestination.endsWith('#'), `${label}: Enter did not follow real return destination`);

    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    const backAgain = page.locator('.module_pager-02 .back a');
    await backAgain.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const targetTop = Math.max(180, Math.min(260, window.innerHeight * 0.35));
      window.scrollBy(0, rect.top - targetTop);
    });
    const box = await backAgain.boundingBox();
    assert(box, `${label}: return-to-list bounding box missing`);
    const ownsPointer = await page.evaluate(({ x, y }) => {
      const hit = document.elementFromPoint(x, y);
      const link = document.querySelector('.module_pager-02 .back a');
      return Boolean(link && hit && (hit === link || link.contains(hit)));
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    assert(ownsPointer, `${label}: real pointer target intercepted before click`);

    const pointerOrigin = page.url();
    await Promise.all([
      page.waitForURL((url) => url.href !== pointerOrigin, { waitUntil: 'domcontentloaded' }),
      page.mouse.click(box.x + box.width / 2, box.y + box.height / 2),
    ]);
    assert(page.url() !== pointerOrigin && !page.url().endsWith('#'), `${label}: pointer click did not follow real return destination`);

    console.log(`PASS ${label}: News single return pager pointer/keyboard/deep-scroll stability.`);
  } finally {
    await context.close();
    await browser.close();
  }
}

await runViewport('SP-390', { width: 390, height: 844 }, { isMobile: true, hasTouch: true });
await runViewport('PC-1395', { width: 1395, height: 900 });
console.log('PASS Budokan News single interaction QA.');
