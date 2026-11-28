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
        const stampTrace = [];
        const isStamp = request => request.url().includes('/figma-ai-local/v1/stamp');
        page.on('request', request => {
          if (isStamp(request)) stampTrace.push({ type: 'request', url: request.url(), method: request.method(), page: page.url() });
        });
        page.on('response', response => {
          if (isStamp(response.request())) stampTrace.push({ type: 'response', url: response.url(), status: response.status(),
            allowOrigin: response.headers()['access-control-allow-origin'] || null, page: page.url() });
        });
        page.on('requestfailed', request => {
          if (isStamp(request)) stampTrace.push({ type: 'failed', url: request.url(), failure: request.failure()?.errorText, page: page.url() });
        });
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
          // Focus can scroll an offscreen anchor into view asynchronously.
          // Measure that separately from the subsequent keyboard activation.
          await link.focus();
          const focusTrace = await link.evaluate(el => new Promise((resolve, reject) => {
            const start = performance.now();
            let stableSince = start;
            let last = window.scrollY;
            const frames = [];
            const sample = () => {
              const now = performance.now();
              const y = window.scrollY;
              frames.push({ t: Math.round(now - start), y });
              if (y !== last) stableSince = now;
              last = y;
              if (document.activeElement !== el) return reject(new Error('invalid fragment lost focus before activation'));
              if (now - stableSince >= 150) return resolve(frames);
              if (now - start >= 2000) return reject(new Error('focus scroll did not settle: ' + JSON.stringify(frames)));
              requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          }));
          const before = await link.evaluate(el => {
            window.__qaInvalidFragment = { href: el.getAttribute('href'), hash: location.hash, click: null, frames: [] };
            el.addEventListener('click', event => {
              const evidence = window.__qaInvalidFragment;
              const start = performance.now();
              evidence.click = { y: window.scrollY, trusted: event.isTrusted, hash: location.hash };
              const sample = () => {
                evidence.frames.push({ t: Math.round(performance.now() - start), y: window.scrollY });
                if (performance.now() - start < 350) requestAnimationFrame(sample);
              };
              requestAnimationFrame(sample);
            }, { capture: true, once: true });
            return window.scrollY;
          });
          await page.keyboard.press('Enter');
          await page.waitForTimeout(400); // exceed the authored scroll duration
          const after = await page.evaluate(() => ({
            y: window.scrollY, hash: location.hash, trace: window.__qaInvalidFragment
          }));
          const evidence = JSON.stringify({ index, before, after, focusTrace });
          assert.ok(after.trace.click?.trusted, 'invalid fragment keyboard activation missing: ' + evidence);
          assert.equal(after.hash, after.trace.hash, 'invalid fragment changed URL: ' + evidence);
          assert.ok(Math.abs(after.y - before) <= 2, 'invalid fragment moved viewport: ' + evidence);
          assert.ok(after.trace.frames.every(frame => Math.abs(frame.y - before) <= 2), 'invalid fragment moved during activation: ' + evidence);
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
        if (pageErrors.length) console.error(JSON.stringify({ localStampEvidence: true, engineName, width, stampTrace, pageErrors }));
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
