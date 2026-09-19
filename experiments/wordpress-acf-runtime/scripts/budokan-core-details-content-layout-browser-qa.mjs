import { chromium } from 'playwright';

const targetUrl = process.argv[2];
if (!targetUrl) process.exit(2);

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
      if (!fixture) throw new Error('Core Details fixture missing');
      const spacer = document.createElement('div');
      spacer.style.height = '1100px';
      fixture.before(spacer);
    });

    const snapshot = async (details) => details.evaluate((el) => {
      const summary = el.querySelector('summary');
      const content = Array.from(el.children).find((child) => child !== summary);
      if (!summary || !content) throw new Error('Details content missing');
      const dr = el.getBoundingClientRect();
      const sr = summary.getBoundingClientRect();
      const cr = content.getBoundingClientRect();
      const nr = el.nextElementSibling?.getBoundingClientRect() || null;
      return {
        open: el.open,
        scrollY: window.scrollY,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        detailsHeight: dr.height,
        detailsBottom: dr.bottom,
        summaryTop: sr.top,
        summaryBottom: sr.bottom,
        summaryWidth: sr.width,
        summaryHeight: sr.height,
        contentHasBox: cr.width > 0 && cr.height > 0,
        contentTop: cr.top,
        contentBottom: cr.bottom,
        nextTop: nr?.top ?? null,
      };
    });

    for (const kind of ['standard', 'faq']) {
      const details = page.locator(`[data-qa-details="${kind}"]`);
      const summary = details.locator('summary');
      await details.evaluate((el) => { el.open = false; });
      await summary.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        window.scrollBy(0, rect.top - Math.round(window.innerHeight * 0.3));
      });
      await page.waitForTimeout(60);

      const click = async () => {
        const box = await summary.boundingBox();
        assert(box, `${label}/${kind}: summary missing`);
        const owns = await summary.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return Boolean(hit && (hit === el || el.contains(hit)));
        });
        assert(owns, `${label}/${kind}: summary pointer intercepted`);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(40);
      };

      const closed1 = await snapshot(details);
      assert(!closed1.open && closed1.scrollY > 100, `${label}/${kind}: invalid closed deep-scroll baseline`);

      await click();
      const open1 = await snapshot(details);
      const growth1 = open1.detailsHeight - closed1.detailsHeight;
      assert(open1.open && growth1 > EPS, `${label}/${kind}: Details did not expand`);
      assert(open1.contentHasBox && open1.contentBottom > open1.summaryBottom + EPS, `${label}/${kind}: expanded body has no layout`);
      assert(open1.contentTop >= open1.summaryBottom - EPS, `${label}/${kind}: expanded body overlaps summary`);
      assert(open1.contentBottom <= open1.detailsBottom + EPS, `${label}/${kind}: expanded body escapes Details`);
      if (closed1.nextTop !== null && open1.nextTop !== null) {
        assert(open1.nextTop >= open1.detailsBottom - EPS, `${label}/${kind}: following content overlaps Details`);
        assert(open1.nextTop - closed1.nextTop >= growth1 - EPS, `${label}/${kind}: following content was not displaced by expansion`);
      }
      assert(near(open1.scrollY, closed1.scrollY), `${label}/${kind}: scroll jumped on open`);
      assert(near(open1.summaryTop, closed1.summaryTop), `${label}/${kind}: summary moved on open`);
      assert(near(open1.summaryWidth, closed1.summaryWidth) && near(open1.summaryHeight, closed1.summaryHeight), `${label}/${kind}: summary resized on open`);
      assert(open1.scrollWidth <= open1.clientWidth + 1, `${label}/${kind}: horizontal overflow on open`);

      await click();
      const closed2 = await snapshot(details);
      assert(!closed2.open && near(closed2.detailsHeight, closed1.detailsHeight), `${label}/${kind}: collapsed height did not restore`);
      assert(near(closed2.scrollY, open1.scrollY), `${label}/${kind}: scroll jumped on close`);
      if (closed1.nextTop !== null && closed2.nextTop !== null) assert(near(closed2.nextTop, closed1.nextTop), `${label}/${kind}: following flow did not restore`);

      await click();
      const open2 = await snapshot(details);
      assert(open2.open && near(open2.detailsHeight, open1.detailsHeight), `${label}/${kind}: reopen geometry changed`);
      assert(near(open2.scrollY, closed2.scrollY), `${label}/${kind}: scroll jumped on reopen`);

      await click();
      const closed3 = await snapshot(details);
      assert(!closed3.open && near(closed3.detailsHeight, closed1.detailsHeight), `${label}/${kind}: final close did not restore`);
      assert(closed3.scrollWidth <= closed3.clientWidth + 1, `${label}/${kind}: horizontal overflow after cycle`);
    }

    console.log(`PASS ${label}: Core Details expanded body stays contained and displaces/restores normal flow through reopen.`);
  } finally {
    await browser.close();
  }
}

await runViewport('SP-375', { width: 375, height: 812 });
await runViewport('PC-1380', { width: 1380, height: 900 });
