import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json');
const { chromium, firefox, webkit } = require('playwright');
const url = new URL(process.argv[2]);
assert.equal(url.hostname, '127.0.0.1');
mkdirSync('form-qa-results', { recursive: true });
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) <= 1, message + ': ' + actual + ' vs ' + expected);

for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [320, 375, 767, 768, 781, 782, 1380]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
        assert.equal((await page.goto(url.href, { waitUntil: 'load' })).status(), 200);
        await page.evaluate(() => document.fonts.ready);
        const pairs = page.locator('.block-editor_wrap .wp-block-columns.is-style-jwsnj-background-boxes');
        assert.equal(await pairs.count(), 2);
        const metrics = await pairs.evaluateAll(elements => {
          const rect = el => {
            const r = el.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
          };
          return elements.map(pair => ({
            pair: rect(pair),
            display: getComputedStyle(pair).display,
            wrap: getComputedStyle(pair).flexWrap,
            gap: parseFloat(getComputedStyle(pair).gap),
            boxes: [...pair.children].map(column => {
              const box = column.querySelector('.is-style-jwsnj-background-box');
              const title = box.querySelector('h4');
              const body = box.querySelector('p');
              const r = rect(box);
              const h = rect(title);
              const p = rect(body);
              const style = getComputedStyle(box);
              return {
                column: rect(column), box: r, title: h, body: p,
                padding: parseFloat(style.paddingTop), radius: parseFloat(style.borderRadius),
                background: style.backgroundColor, titleFont: getComputedStyle(title).fontSize,
                blossom: getComputedStyle(title).backgroundImage,
                gap: p.y - h.bottom,
                fits: h.x >= r.x && h.right <= r.right + 1 && p.x >= r.x && p.right <= r.right + 1 &&
                  title.scrollWidth <= title.clientWidth + 1 && body.scrollWidth <= body.clientWidth + 1 &&
                  p.bottom <= r.bottom + 1
              };
            })
          }));
        });
        // Core 7.0.2 Columns stack <=781, independent of Theme 768 spacing.
        const stacked = width < 782;
        const gap = width < 768 ? 24 : 40;
        const padding = width < 768 ? 32 : 40;
        for (const m of metrics) {
          const detail = JSON.stringify({ engineName, width, m });
          assert.equal(m.display, 'flex', detail);
          assert.equal(m.wrap, stacked ? 'wrap' : 'nowrap', detail);
          near(m.gap, gap, detail);
          assert.equal(m.boxes.length, 2, detail);
          const [a, b] = m.boxes;
          for (const item of m.boxes) {
            near(item.padding, padding, detail);
            near(item.radius, 5, detail);
            near(item.gap, 20, detail);
            assert.equal(item.background, 'rgb(245, 253, 235)', detail);
            assert.equal(item.titleFont, '18px', detail);
            assert.match(item.blossom, /ico_blossom\.svg/);
            assert.ok(item.fits, detail);
            near(item.column.width, item.box.width, detail);
            near(item.column.height, item.box.height, detail);
            assert.ok(item.box.x >= m.pair.x - 1 && item.box.right <= m.pair.right + 1, detail);
          }
          if (stacked) {
            near(a.box.width, m.pair.width, detail);
            near(b.box.width, m.pair.width, detail);
            near(b.box.y - a.box.bottom, gap, detail);
          } else {
            near(a.box.width, b.box.width, detail);
            near(a.box.y, b.box.y, detail);
            near(b.box.x - a.box.right, gap, detail);
            near(a.box.height, b.box.height, detail);
            near(a.box.width + b.box.width + gap, m.pair.width, detail);
          }
        }
        if (width === 375 || width === 1380) {
          for (let i = 0; i < 2; i++) {
            await pairs.nth(i).screenshot({ path: 'form-qa-results/native-text-boxes-' + engineName + '-' + width + '-' + i + '.png' });
          }
        }
        console.log(JSON.stringify({ nativeTextBoxes: 'PASS', engine: engineName, width, metrics }));
      } catch (error) {
        await page.screenshot({ path: 'form-qa-results/native-text-boxes-failure-' + engineName + '-' + width + '.png' }).catch(() => {});
        throw error;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
