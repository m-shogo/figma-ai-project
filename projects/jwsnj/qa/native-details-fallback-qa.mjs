// Real disposable WordPress page. Feature-off simulates the animation guard,
// not the rendering engine of a historical browser.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const { chromium, firefox, webkit } = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json')('playwright');
const url = new URL(process.argv[2]);
assert.equal(url.hostname, '127.0.0.1');
mkdirSync('form-qa-results', { recursive: true });
const failures = [];

for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [375, 768, 1380]) {
      for (const mode of ['no-js', 'feature-off']) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
          javaScriptEnabled: mode !== 'no-js',
          reducedMotion: 'no-preference'
        });
        try {
          await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
          if (mode === 'feature-off') {
            await page.addInitScript(() => {
              const supports = CSS.supports.bind(CSS);
              CSS.supports = (...args) => args[0] === 'selector(details::details-content)' ? false : supports(...args);
            });
          }
          assert.equal((await page.goto(url.href, { waitUntil: 'load' })).status(), 200);
          if (mode === 'feature-off') await page.waitForFunction(() => window.jQuery?.isReady);
          const items = page.locator('.block-editor_wrap details.wp-block-details');
          assert.equal(await items.count(), 3);
          const item = items.first();
          const summary = item.locator(':scope > summary');
          const link = item.locator('.wp-block-details__content a');
          assert.equal(await link.count(), 1);
          assert.equal(await item.getAttribute('data-details-motion'), null);
          const height = () => item.evaluate(el => el.getBoundingClientRect().height);
          const open = () => item.locator('xpath=self::*[@open]').waitFor({ state: 'attached' });
          const closed = await height();
          await summary.focus();
          await page.keyboard.press('Tab');
          assert.equal(await link.evaluate(el => el === document.activeElement), false);
          await summary.focus();
          await page.keyboard.press('Enter');
          await open();
          const expanded = await height();
          assert.ok(expanded > closed + 2);
          await summary.focus();
          await page.keyboard.press('Tab');
          assert.equal(await link.evaluate(el => el === document.activeElement), true);
          if (mode === 'feature-off') {
            await page.keyboard.press('Escape');
          } else {
            await summary.focus();
            await page.keyboard.press('Space');
          }
          await item.locator('xpath=self::*[not(@open)]').waitFor({ state: 'attached' });
          assert.equal(await summary.evaluate(el => el === document.activeElement), true);
          assert.ok(Math.abs(await height() - closed) <= 1);
          await page.keyboard.press('Tab');
          assert.equal(await link.evaluate(el => el === document.activeElement), false);
          // Verify the final icon state separately from immediate native
          // keyboard behavior. The CSS icon can still animate in fallback.
          const waitIcon = expected => page.waitForFunction(({ selector, expected }) => {
            const icon = document.querySelector(selector);
            return icon && Math.abs(parseFloat(getComputedStyle(icon, '::after').rotate) - expected) < 0.1;
          }, { selector: '.block-editor_wrap details.wp-block-details .wp-block-details__button-icon', expected });
          await waitIcon(90);
          if (width === 375 || width === 1380) {
            await summary.focus();
            await page.keyboard.press('Enter');
            await open();
            await waitIcon(0);
            await item.screenshot({ path: 'form-qa-results/details-fallback-' + engineName + '-' + width + '-' + mode + '.png' });
          }
          console.log(JSON.stringify({ nativeDetailsFallback: 'PASS', engine: engineName, width, mode, closed, expanded }));
        } catch (error) {
          failures.push({ engineName, width, mode, error: String(error) });
          await page.screenshot({ path: 'form-qa-results/details-fallback-failure-' + engineName + '-' + width + '-' + mode + '.png' }).catch(() => {});
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
}
assert.deepEqual(failures, [], 'native details fallback cases must all pass');
