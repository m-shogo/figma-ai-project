import { chromium } from 'playwright';

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Usage: node budokan-core-details-interaction-browser-qa.mjs <url>');
  process.exit(2);
}

const EPS = 1.5;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
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
      spacer.setAttribute('data-qa-deep-scroll-spacer', '');
      spacer.style.height = '1100px';
      fixture.before(spacer);
    });

    const standard = page.locator('[data-qa-details="standard"]');
    const faq = page.locator('[data-qa-details="faq"]');

    async function snapshot(locator) {
      return locator.evaluate((details) => {
        const summary = details.querySelector('summary');
        if (!summary) throw new Error('summary missing');
        const rect = summary.getBoundingClientRect();
        const range = document.createRange();
        const textNode = [...summary.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (!textNode) throw new Error('summary text node missing');
        range.selectNodeContents(textNode);
        const textRect = range.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        return {
          open: details.open,
          summary: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          textLeft: textRect.left,
          hitOwnsSummary: Boolean(hit && (hit === summary || summary.contains(hit))),
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          activeIsSummary: document.activeElement === summary,
        };
      });
    }

    async function clickCenter(locator) {
      const summary = locator.locator('summary');
      const box = await summary.boundingBox();
      if (!box) throw new Error(`${label}: summary bounding box missing`);
      const hitOwns = await page.evaluate(({ x, y }) => {
        const hit = document.elementFromPoint(x, y);
        const summary = document.querySelector('[data-qa-active-summary="true"]');
        return Boolean(summary && hit && (hit === summary || summary.contains(hit)));
      }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      assert(hitOwns, `${label}: pointer center is intercepted before click`);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    async function exercise(locator, kind, expectedTextShift) {
      // Establish the same deterministic deep-scroll precondition separately
      // for each control. The FAQ sits below the standard Details and must not
      // inherit an off-screen pointer coordinate from the prior exercise.
      await locator.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -140));
      assert((await page.evaluate(() => window.scrollY)) > 0, `${label}/${kind}: deep-scroll precondition was not established`);

      const summary = locator.locator('summary');
      await summary.evaluate((el) => el.setAttribute('data-qa-active-summary', 'true'));
      const closed = await snapshot(locator);
      assert(!closed.open, `${label}/${kind}: fixture must start closed`);
      assert(closed.hitOwnsSummary, `${label}/${kind}: summary does not own pointer hit`);
      assert(closed.scrollWidth <= closed.clientWidth + 1, `${label}/${kind}: horizontal overflow before open`);

      await clickCenter(locator);
      const opened = await snapshot(locator);
      assert(opened.open, `${label}/${kind}: pointer click did not open details`);
      assert(near(opened.scrollY, closed.scrollY), `${label}/${kind}: page scroll jumped on open (${closed.scrollY} -> ${opened.scrollY})`);
      assert(near(opened.scrollX, closed.scrollX), `${label}/${kind}: horizontal scroll changed on open`);
      assert(near(opened.summary.top, closed.summary.top), `${label}/${kind}: summary top shifted on open`);
      assert(near(opened.summary.width, closed.summary.width), `${label}/${kind}: summary width shifted on open`);
      assert(near(opened.summary.height, closed.summary.height), `${label}/${kind}: summary height shifted on open`);
      assert(near(opened.textLeft - closed.textLeft, expectedTextShift), `${label}/${kind}: summary text shift ${opened.textLeft - closed.textLeft}px != Figma-authorized ${expectedTextShift}px`);
      assert(opened.scrollWidth <= opened.clientWidth + 1, `${label}/${kind}: horizontal overflow after open`);

      await summary.focus();
      const focused = await snapshot(locator);
      assert(focused.activeIsSummary, `${label}/${kind}: summary did not retain keyboard focus`);
      await page.keyboard.press('Enter');
      const closedByKeyboard = await snapshot(locator);
      assert(!closedByKeyboard.open, `${label}/${kind}: Enter did not close details`);
      assert(closedByKeyboard.activeIsSummary, `${label}/${kind}: focus escaped after Enter close`);
      assert(near(closedByKeyboard.scrollY, closed.scrollY), `${label}/${kind}: page scroll jumped on keyboard close`);

      await page.keyboard.press('Space');
      const reopened = await snapshot(locator);
      assert(reopened.open, `${label}/${kind}: Space did not reopen details`);
      assert(reopened.activeIsSummary, `${label}/${kind}: focus escaped after Space reopen`);
      assert(near(reopened.scrollY, closed.scrollY), `${label}/${kind}: page scroll jumped on keyboard reopen`);
      assert(near(reopened.textLeft - closed.textLeft, expectedTextShift), `${label}/${kind}: reopened text shift changed`);

      await page.keyboard.press('Enter');
      const finalClosed = await snapshot(locator);
      assert(!finalClosed.open, `${label}/${kind}: final close failed`);
      assert(near(finalClosed.textLeft, closed.textLeft), `${label}/${kind}: text did not return to closed geometry`);
      assert(near(finalClosed.scrollY, closed.scrollY), `${label}/${kind}: final close changed page scroll`);
      await summary.evaluate((el) => el.removeAttribute('data-qa-active-summary'));
    }

    await exercise(standard, 'standard', expectedStandardTextShift);
    await exercise(faq, 'faq', 0);

    console.log(`PASS ${label}: native Core Details pointer/keyboard/deep-scroll stability; standard Figma state shift ${expectedStandardTextShift}px preserved.`);
  } finally {
    await browser.close();
  }
}

await runViewport('SP-375', { width: 375, height: 812 }, 0);
await runViewport('PC-1380', { width: 1380, height: 900 }, 8);
console.log('PASS Budokan native Core Details interaction QA.');
