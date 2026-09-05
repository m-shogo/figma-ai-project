import { chromium } from 'playwright';

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Usage: node budokan-core-details-interaction-browser-qa.mjs <url>');
  process.exit(2);
}

const EPS = 2;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;

async function runViewport(label, viewport, expectedStandardTextShift) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const fixture = document.querySelector('.qa-core-details-fixture');
      if (!fixture) throw new Error('Core Details QA fixture missing.');
      const spacer = document.createElement('div');
      spacer.style.height = '1100px';
      spacer.setAttribute('data-qa-deep-scroll-spacer', '');
      fixture.before(spacer);
    });

    async function ensureViewport(locator, kind) {
      await locator.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -120));
      assert((await page.evaluate(() => window.scrollY)) > 0, `${label}/${kind}: deep-scroll precondition missing`);
    }

    async function snapshot(locator) {
      return locator.evaluate((details) => {
        const summary = details.querySelector('summary');
        if (!summary) throw new Error('summary missing');
        const rect = summary.getBoundingClientRect();
        const range = document.createRange();
        const textNode = [...summary.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
        if (!textNode) throw new Error('summary text node missing');
        range.selectNodeContents(textNode);
        const textRect = range.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return {
          open: details.open,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          textLeft: textRect.left,
          hitOwnsSummary: Boolean(hit && (hit === summary || summary.contains(hit))),
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          focused: document.activeElement === summary,
        };
      });
    }

    async function clickSummary(locator, kind) {
      const summary = locator.locator('summary');
      const box = await summary.boundingBox();
      assert(box, `${label}/${kind}: summary bounding box missing`);
      const owns = await page.evaluate(({ x, y }) => {
        const hit = document.elementFromPoint(x, y);
        const active = document.querySelector('[data-qa-active-summary="true"]');
        return Boolean(active && hit && (hit === active || active.contains(hit)));
      }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      assert(owns, `${label}/${kind}: pointer center intercepted`);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    function assertStable(before, after, kind, action, expectedShift) {
      assert(near(after.scrollY, before.scrollY), `${label}/${kind}: scrollY jumped on ${action}`);
      assert(near(after.scrollX, before.scrollX), `${label}/${kind}: scrollX changed on ${action}`);
      assert(near(after.top, before.top), `${label}/${kind}: summary top shifted on ${action}`);
      assert(near(after.width, before.width), `${label}/${kind}: summary width shifted on ${action}`);
      assert(near(after.height, before.height), `${label}/${kind}: summary height shifted on ${action}`);
      assert(near(after.textLeft - before.textLeft, expectedShift), `${label}/${kind}: text shift ${after.textLeft - before.textLeft}px != ${expectedShift}px on ${action}`);
      assert(after.scrollWidth <= after.clientWidth + 1, `${label}/${kind}: horizontal overflow on ${action}`);
    }

    async function exercise(locator, kind, expectedOpenShift) {
      await ensureViewport(locator, kind);
      const summary = locator.locator('summary');
      await summary.evaluate((el) => el.setAttribute('data-qa-active-summary', 'true'));

      const closed1 = await snapshot(locator);
      assert(!closed1.open && closed1.hitOwnsSummary, `${label}/${kind}: invalid closed pointer baseline`);
      await clickSummary(locator, kind);
      const open1 = await snapshot(locator);
      assert(open1.open, `${label}/${kind}: pointer open failed`);
      assertStable(closed1, open1, kind, 'pointer open', expectedOpenShift);

      const openBaseline = await snapshot(locator);
      await clickSummary(locator, kind);
      const closed2 = await snapshot(locator);
      assert(!closed2.open, `${label}/${kind}: pointer close failed`);
      assertStable(openBaseline, closed2, kind, 'pointer close', -expectedOpenShift);

      const closedBaseline = await snapshot(locator);
      await clickSummary(locator, kind);
      const open2 = await snapshot(locator);
      assert(open2.open, `${label}/${kind}: pointer reopen failed`);
      assertStable(closedBaseline, open2, kind, 'pointer reopen', expectedOpenShift);

      await clickSummary(locator, kind);
      assert(!(await snapshot(locator)).open, `${label}/${kind}: final pointer close failed`);

      await ensureViewport(locator, `${kind}-keyboard`);
      await summary.focus();
      const keyboardClosed = await snapshot(locator);
      assert(keyboardClosed.focused && !keyboardClosed.open, `${label}/${kind}: keyboard baseline invalid`);
      await page.keyboard.press('Enter');
      const keyboardOpen = await snapshot(locator);
      assert(keyboardOpen.focused && keyboardOpen.open, `${label}/${kind}: Enter open/focus failed`);
      assertStable(keyboardClosed, keyboardOpen, kind, 'keyboard open', expectedOpenShift);

      const keyboardOpenBaseline = await snapshot(locator);
      await page.keyboard.press('Enter');
      const keyboardClosed2 = await snapshot(locator);
      assert(keyboardClosed2.focused && !keyboardClosed2.open, `${label}/${kind}: Enter close/focus failed`);
      assertStable(keyboardOpenBaseline, keyboardClosed2, kind, 'keyboard close', -expectedOpenShift);

      await summary.evaluate((el) => el.removeAttribute('data-qa-active-summary'));
    }

    await exercise(page.locator('[data-qa-details="standard"]'), 'standard', expectedStandardTextShift);
    await exercise(page.locator('[data-qa-details="faq"]'), 'faq', 0);
    console.log(`PASS ${label}: Core Details pointer/keyboard/deep-scroll stability; Figma state geometry preserved.`);
  } finally {
    await browser.close();
  }
}

await runViewport('SP-375', { width: 375, height: 812 }, 0);
await runViewport('PC-1380', { width: 1380, height: 900 }, 8);
console.log('PASS Budokan native Core Details interaction QA.');
