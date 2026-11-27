// Real WP content and existing common.js; no ACF Pro or real destination data.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const { chromium, firefox, webkit } = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json')('playwright');
const url = process.argv[2];
assert.match(url, /^http:\/\/127\.0\.0\.1:/);
mkdirSync('form-qa-results', { recursive: true });
const literal = '学校:案内.1';
const errors = [];
for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [375, 768, 1380]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
      try {
        await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        assert.equal((await page.goto(url, { waitUntil: 'load' })).status(), 200);
        await page.waitForFunction(() => window.jQuery?.isReady);
        await page.evaluate(() => document.fonts.ready);
        const links = page.locator('#qa-inpage-links a');
        assert.equal(await links.count(), 5);
        const geometry = await links.evaluateAll(nodes => nodes.map(a => {
          const r = a.getBoundingClientRect();
          const title = a.querySelector('.title');
          const range = document.createRange();
          range.selectNodeContents(title);
          const icon = getComputedStyle(a, '::after');
          const style = getComputedStyle(a);
          return { width: r.width, height: r.height, duration: style.transitionDuration,
            circle: [icon.width, icon.height], glyph: icon.content,
            fits: [...range.getClientRects()].every(line => line.left >= r.left - 1 && line.right <= r.right + 1) };
        }));
        assert.ok(geometry.every(g => g.height >= 47.5 && g.fits && g.circle.join(' ') === '24px 24px' && g.glyph === '"\uf063"'), JSON.stringify(geometry));
        assert.ok(geometry.every(g => g.duration === '0.3s'));
        if (width < 768) assert.ok(geometry.every(g => Math.abs(g.width - geometry[0].width) <= 1));
        if (width === 375 || width === 1380) await page.locator('#qa-inpage-links').screenshot({ path: 'form-qa-results/inpage-' + engineName + '-' + width + '.png' });

        const expected = id => page.evaluate(id => {
          const $ = window.jQuery;
          return Math.max(0, $(document.getElementById(id)).offset().top - ($('#global_header').innerHeight() || 0) - 30);
        }, id);
        const arrival = async (id, target) => {
          await page.waitForFunction(y => Math.abs(window.scrollY - y) <= 2, target, { timeout: 3000 });
          const metrics = await page.evaluate(id => ({
            y: window.scrollY,
            targetTop: document.getElementById(id).getBoundingClientRect().top,
            headerHeight: document.getElementById('global_header').getBoundingClientRect().height
          }), id);
          assert.ok(metrics.targetTop >= metrics.headerHeight - 1, JSON.stringify(metrics));
          return metrics;
        };
        await links.first().focus();
        assert.ok(await links.first().evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== 'none'));
        const destination = await expected(literal);
        const initial = await page.evaluate(() => window.scrollY);
        assert.ok(destination > initial + 100);
        // Start frame capture before the keyboard input, not after a driver round trip.
        await links.first().evaluate(el => {
          window.__qaInPageFrames = [];
          el.addEventListener('click', () => {
            const start = performance.now();
            const sample = () => {
              window.__qaInPageFrames.push(window.scrollY);
              if (performance.now() - start < 500) requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          }, { capture: true, once: true });
        });
        await page.keyboard.press('Enter');
        const first = await arrival(literal, destination);
        const frames = await page.evaluate(() => window.__qaInPageFrames);
        assert.ok(frames.some(y => y > initial + 2 && y < destination - 2), JSON.stringify(frames));

        // Reduced motion must still reach the literal destination.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await links.nth(1).focus();
        const secondTarget = await expected('qa-inpage-second');
        await page.keyboard.press('Enter');
        const second = await arrival('qa-inpage-second', secondTarget);
        assert.equal(await links.nth(1).evaluate(el => getComputedStyle(el).transitionDuration), '0s');

        for (const index of [2, 3]) {
          const link = links.nth(index);
          await link.focus();
          const before = await page.evaluate(() => window.scrollY);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(350); // exceed the authored scroll duration
          assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - before) <= 2, 'invalid fragment moved viewport');
        }
        // The initial URL hash must also account for the header.
        await page.goto(url, { waitUntil: 'load' });
        await page.goto(url + '#' + encodeURIComponent(literal), { waitUntil: 'load' });
        await page.reload({ waitUntil: 'load' });
        await page.waitForFunction(() => window.jQuery?.isReady);
        const deepTarget = await expected(literal);
        const deep = await arrival(literal, deepTarget);
        // Keep the focus-induced scroll separate from the page-top operation.
        await links.nth(4).focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => Math.abs(window.scrollY) <= 2);
        assert.deepEqual(pageErrors, [], 'uncaught JS errors');
        console.log(JSON.stringify({ inPageRuntime: 'PASS', engine: engineName, width, geometry, first, second, deep }));
      } catch (error) {
        errors.push({ engineName, width, message: String(error) });
        await page.screenshot({ path: 'form-qa-results/inpage-failure-' + engineName + '-' + width + '.png' }).catch(() => {});
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
assert.deepEqual(errors, [], 'all in-page runtime cases must pass');
