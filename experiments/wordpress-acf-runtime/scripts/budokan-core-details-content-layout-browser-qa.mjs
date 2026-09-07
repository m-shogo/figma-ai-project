import { chromium } from 'playwright';

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Usage: node budokan-core-details-content-layout-browser-qa.mjs <url>');
  process.exit(2);
}

const EPS = 2;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const near = (a, b, eps = EPS) => Math.abs(a - b) <= eps;

async function runViewport(label, viewport) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const fixture = document.querySelector('.qa-core-details-fixture');
      if (!fixture) throw new Error('Core Details QA fixture missing.');
      const spacer = document.createElement('div');
      spacer.style.height = '1100px';
      spacer.setAttribute('data-qa-content-layout-spacer', '');
      fixture.before(spacer);
    });

    async function stage(details, kind) {
      await details.evaluate((el) => { el.open = false; });
      await details.locator('summary').evaluate((summary) => {
        const rect = summary.getBoundingClientRect();
        const desiredTop = Math.round(window.innerHeight * 0.3);
        window.scrollBy(0, rect.top - desiredTop);
      });
      await page.waitForTimeout(60);

      const position = await details.locator('summary').evaluate((summary) => {
        const rect = summary.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, scrollY: window.scrollY, innerHeight: window.innerHeight };
      });
      assert(position.scrollY > 100, `${label}/${kind}: deep-scroll precondition missing`);
      assert(position.top >= 140 && position.bottom <= position.innerHeight - 120,
        `${label}/${kind}: summary is outside pointer-safe viewport band`);
    }

    async function snapshot(details) {
      return details.evaluate((el) => {
        const summary = el.querySelector('summary');
        const content = Array.from(el.children).find((child) => child !== summary) || null;
        if (!summary || !content) throw new Error('Details summary/content missing.');

        const detailsRect = el.getBoundingClientRect();
        const summaryRect = summary.getBoundingClientRect();
        const contentRects = content.getClientRects();
        const contentRect = contentRects.length ? content.getBoundingClientRect() : null;
        const next = el.nextElementSibling;
        const nextRect = next ? next.getBoundingClientRect() : null;
        const hit = document.elementFromPoint(
          summaryRect.left + summaryRect.width / 2,
          summaryRect.top + summaryRect.height / 2,
        );

        return {
          open: el.open,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          detailsTop: detailsRect.top,
          detailsBottom: detailsRect.bottom,
          detailsHeight: detailsRect.height,
          summaryTop: summaryRect.top,
          summaryBottom: summaryRect.bottom,
          summaryWidth: summaryRect.width,
          summaryHeight: summaryRect.height,
          contentVisible: Boolean(contentRect && contentRect.width > 0 && contentRect.height > 0),
          contentTop: contentRect?.top ?? null,
          contentBottom: contentRect?.bottom ?? null,
          nextTop: nextRect?.top ?? null,
          hitOwnsSummary: Boolean(hit && (hit === summary || summary.contains(hit))),
        };
      });
    }

    async function pointerToggle(details, kind) {
      const summary = details.locator('summary');
      const box = await summary.boundingBox();
      assert(box, `${label}/${kind}: summary bounding box missing`);
      const owns = await page.evaluate(({ x, y, selector }) => {
        const target = document.querySelector(selector)?.querySelector('summary');
        const hit = document.elementFromPoint(x, y);
        return Boolean(target && hit && (hit === target || target.contains(hit)));
      }, {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        selector: `[data-qa-details="${kind}"]`,
      });
      assert(owns, `${label}/${kind}: real pointer center is intercepted`);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(40);
    }

    function assertOpenLayout(closed, opened, kind, action) {
      assert(opened.open, `${label}/${kind}: ${action} did not open Details`);
      assert(opened.contentVisible, `${label}/${kind}: expanded content is not visibly rendered on ${action}`);
      assert(opened.detailsHeight > closed.detailsHeight + EPS,
        `${label}/${kind}: Details did not expand in normal flow on ${action}; ${closed.detailsHeight} -> ${opened.detailsHeight}`);
      assert(opened.contentTop >= opened.summaryBottom - EPS,
        `${label}/${kind}: expanded content overlaps summary on ${action}`);
      assert(opened.contentBottom <= opened.detailsBottom + EPS,
        `${label}/${kind}: expanded content is clipped outside Details on ${action}`);
      if (opened.nextTop !== null) {
        assert(opened.nextTop >= opened.detailsBottom - EPS,
          `${label}/${kind}: following content overlaps expanded Details on ${action}`);
      }
      assert(near(opened.scrollY, closed.scrollY), `${label}/${kind}: scrollY jumped on ${action}`);
      assert(near(opened.scrollX, closed.scrollX), `${label}/${kind}: scrollX changed on ${action}`);
      assert(near(opened.summaryTop, closed.summaryTop), `${label}/${kind}: summary top shifted on ${action}`);
      assert(near(opened.summaryWidth, closed.summaryWidth), `${label}/${kind}: summary width shifted on ${action}`);
      assert(near(opened.summaryHeight, closed.summaryHeight), `${label}/${kind}: summary height shifted on ${action}`);
      assert(opened.scrollWidth <= opened.clientWidth + 1, `${label}/${kind}: horizontal overflow on ${action}`);
    }

    function assertClosedLayout(opened, closed, kind, action) {
      assert(!closed.open, `${label}/${kind}: ${action} did not close Details`);
      assert(!closed.contentVisible, `${label}/${kind}: collapsed content remains visibly rendered on ${action}`);
      assert(near(closed.detailsHeight, opened.detailsHeight, 2) === false,
        `${label}/${kind}: collapse did not reduce Details height on ${action}`);
      assert(near(closed.scrollY, opened.scrollY), `${label}/${kind}: scrollY jumped on ${action}`);
      assert(closed.scrollWidth <= closed.clientWidth + 1, `${label}/${kind}: horizontal overflow on ${action}`);
    }

    for (const kind of ['standard', 'faq']) {
      const details = page.locator(`[data-qa-details="${kind}"]`);
      await stage(details, kind);
      const closed1 = await snapshot(details);
      assert(!closed1.open && !closed1.contentVisible, `${label}/${kind}: invalid collapsed baseline`);
      assert(closed1.hitOwnsSummary, `${label}/${kind}: pointer center intercepted at baseline`);

      await pointerToggle(details, kind);
      const open1 = await snapshot(details);
      assertOpenLayout(closed1, open1, kind, 'pointer open');

      await pointerToggle(details, kind);
      const closed2 = await snapshot(details);
      assertClosedLayout(open1, closed2, kind, 'pointer close');
      assert(near(closed2.detailsHeight, closed1.detailsHeight),
        `${label}/${kind}: collapsed height did not restore after close`);

      await pointerToggle(details, kind);
      const open2 = await snapshot(details);
      assertOpenLayout(closed2, open2, kind, 'pointer reopen');

      await pointerToggle(details, kind);
      const closed3 = await snapshot(details);
      assertClosedLayout(open2, closed3, kind, 'final pointer close');
      assert(near(closed3.detailsHeight, closed1.detailsHeight),
        `${label}/${kind}: collapsed height did not restore after reopen cycle`);
    }

    console.log(`PASS ${label}: expanded Core Details content stays visible, contained, non-overlapping and scroll-stable through reopen.`);
  } finally {
    await browser.close();
  }
}

await runViewport('SP-375', { width: 375, height: 812 });
await runViewport('PC-1380', { width: 1380, height: 900 });
console.log('PASS Budokan Core Details expanded-content layout QA.');
