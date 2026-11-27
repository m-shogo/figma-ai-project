import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json');
const { chromium, firefox, webkit } = require('playwright');
const url = new URL(process.argv[2]);
assert.equal(url.hostname, '127.0.0.1', 'disposable runtime only');
mkdirSync('form-qa-results', { recursive: true });

for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [320, 375, 768, 1380]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
        assert.equal((await page.goto(url.href, { waitUntil: 'load' })).status(), 200);
        const root = page.locator('.block-editor_wrap');
        assert.equal(await root.count(), 1);
        const headings = root.locator('h2.wp-block-heading, h3.wp-block-heading, h4.wp-block-heading');
        assert.equal(await headings.count(), 3);
        const metrics = await headings.evaluateAll(elements => elements.map(el => ({
          tag: el.tagName,
          font: getComputedStyle(el).fontSize,
          gap: el.nextElementSibling.getBoundingClientRect().top - el.getBoundingClientRect().bottom
        })));
        assert.deepEqual(metrics.map(item => item.font), width >= 768 ? ['30px', '24px', '18px'] : ['24px', '22px', '18px']);
        assert.deepEqual(metrics.map(item => Math.round(item.gap)), width >= 768 ? [40, 30, 20] : [32, 24, 20]);
        const lists = root.locator('ul.wp-block-list, ol.wp-block-list');
        assert.equal(await lists.count(), 4);
        assert.equal(await root.locator('ol.wp-block-list').getAttribute('start'), '10');
        assert.equal(await root.locator('ul.annotation-list').count(), 1);
        const buttons = root.locator('.wp-block-button__link');
        assert.equal(await buttons.count(), 2);
        const fitting = await buttons.evaluateAll(elements => elements.every(el => {
          const host = el.closest('.wp-block-buttons').getBoundingClientRect();
          const rect = el.getBoundingClientRect();
          return rect.left >= host.left - 1 && rect.right <= host.right + 1 && rect.height >= 49;
        }));
        assert.ok(fitting, 'native button fits containing block');
        const details = root.locator('details.wp-block-details');
        assert.equal(await details.count(), 3);
        const states = [];
        for (let i = 0; i < 3; i++) {
          const item = details.nth(i);
          const summary = item.locator(':scope > summary.wp-block-details__summary');
          const body = item.locator(':scope > .wp-block-details__content');
          assert.equal(await summary.count(), 1);
          assert.equal(await body.locator('.wp-block-details__inner').count(), 1);
          const read = () => item.evaluate(el => {
            const box = el.getBoundingClientRect();
            const next = el.nextElementSibling.getBoundingClientRect();
            const summary = el.querySelector('summary');
            const title = summary.querySelector('.wp-block-details__title');
            const rail = summary.querySelector('.wp-block-details__button').getBoundingClientRect();
            const text = title.getBoundingClientRect();
            const body = el.querySelector('.wp-block-details__content').getBoundingClientRect();
            return {
              open: el.open, height: box.height, following: next.top + window.scrollY,
              titleFits: text.left >= box.left - 1 && text.right <= rail.left + 1,
              bodyFits: body.left >= box.left - 1 && body.right <= box.right + 1 && body.bottom <= box.bottom + 1,
              summaryHeight: summary.getBoundingClientRect().height,
              focus: summary === document.activeElement
            };
          });
          await summary.scrollIntoViewIfNeeded();
          const closed = await read();
          assert.equal(closed.open, false);
          assert.ok(closed.titleFits && closed.summaryHeight >= 74, JSON.stringify(closed));
          await summary.focus();
          await page.keyboard.press('Enter');
          await page.waitForFunction(el => el.open, await item.elementHandle());
          const opened = await read();
          assert.ok(opened.open && opened.focus && opened.titleFits && opened.bodyFits, JSON.stringify(opened));
          assert.ok(opened.height > closed.height && opened.following > closed.following, 'expanded body remains in normal flow');
          if (i === 0) {
            await page.keyboard.press('Tab');
            assert.equal(await body.locator('a').evaluate(el => el === document.activeElement), true, 'expanded link is keyboard reachable');
          }
          if (width === 375 || width === 1380) {
            await item.screenshot({ path: 'form-qa-results/native-parts-' + engineName + '-' + width + '-details-' + i + '-open.png' });
          }
          await summary.focus();
          await page.keyboard.press('Space');
          await page.waitForFunction(el => !el.open, await item.elementHandle());
          const restored = await read();
          assert.equal(restored.open, false);
          assert.ok(restored.focus && Math.abs(restored.height - closed.height) <= 1 && Math.abs(restored.following - closed.following) <= 1, JSON.stringify({ closed, restored }));
          if (i === 0) {
            await page.keyboard.press('Tab');
            assert.equal(await body.locator('a').evaluate(el => el === document.activeElement), false, 'closed link is not tabbable');
          }
          states.push({ index: i, closed: closed.height, opened: opened.height, restored: restored.height });
        }
        if (width === 375 || width === 1380) {
          await root.screenshot({ path: 'form-qa-results/native-parts-' + engineName + '-' + width + '-closed.png' });
        }
        console.log(JSON.stringify({ nativePartsFrontend: 'PASS', engine: engineName, width, headings: metrics, details: states }));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
