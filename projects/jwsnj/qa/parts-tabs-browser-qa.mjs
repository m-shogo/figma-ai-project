import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json');
const { chromium, firefox, webkit } = require('playwright');
const url = new URL(process.argv[2]);
assert.equal(url.hostname, '127.0.0.1');
mkdirSync('form-qa-results', { recursive: true });

for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [320, 375, 768, 1380]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
        assert.equal((await page.goto(url.href, { waitUntil: 'load' })).status(), 200);
        await page.evaluate(() => document.fonts.ready);
        const root = page.locator('.block-editor_wrap .wp-block-tabs');
        const list = root.locator('.wp-block-tab-list');
        const tabs = list.locator('button[role="tab"]');
        const panels = root.locator('.wp-block-tab-panels > [role="tabpanel"]');
        assert.equal(await tabs.count(), 3);
        assert.equal(await panels.count(), 3);
        const state = async active => {
          await page.waitForFunction(({ el, active }) => {
            const buttons = [...el.querySelectorAll('.wp-block-tab-list > button')];
            const panels = [...el.querySelectorAll('.wp-block-tab-panels > [role="tabpanel"]')];
            return buttons.every((button, i) => button.getAttribute('aria-selected') === String(i === active)) &&
              panels.every((panel, i) => (panel.getClientRects().length > 0) === (i === active));
          }, { el: await root.elementHandle(), active }, { timeout: 10000 });
          for (let i = 0; i < 3; i++) {
            const button = tabs.nth(i);
            const panel = panels.nth(i);
            assert.equal(await button.getAttribute('aria-controls'), await panel.getAttribute('id'));
            assert.equal(await panel.getAttribute('aria-labelledby'), await button.getAttribute('id'));
            assert.equal(await button.evaluate(el => el.tabIndex), i === active ? 0 : -1);
          }
        };
        await state(0);
        const geometry = await list.evaluate(el => {
          const box = el.getBoundingClientRect();
          const root = el.closest('.wp-block-tabs').getBoundingClientRect();
          const buttons = [...el.querySelectorAll('button')].map(button => {
            const b = button.getBoundingClientRect();
            const cs = getComputedStyle(button);
            return { width: b.width, height: b.height, scroll: button.scrollWidth, client: button.clientWidth,
              font: cs.fontSize, duration: cs.transitionDuration, whitespace: cs.whiteSpace };
          });
          return { fits: box.left >= root.left - 1 && box.right <= root.right + 1,
            width: box.width, client: el.clientWidth, scroll: el.scrollWidth,
            overflow: getComputedStyle(el).overflowX, buttons };
        });
        assert.ok(geometry.fits, JSON.stringify(geometry));
        assert.ok(geometry.scroll > geometry.client, JSON.stringify(geometry));
        assert.equal(geometry.overflow, 'auto');
        for (const button of geometry.buttons) {
          assert.ok(button.width <= geometry.width + 1 && button.scroll <= button.client + 1, JSON.stringify(geometry));
          assert.equal(button.font, '17px');
          assert.equal(button.duration, '0s');
          assert.equal(button.whitespace, 'normal');
        }
        assert.ok(geometry.buttons[1].height >= geometry.buttons[0].height, JSON.stringify(geometry));
        // Core tabs use manual activation: arrows move focus, Enter/Space select.
        await tabs.first().focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(el => el === document.activeElement, await tabs.nth(1).elementHandle());
        await state(0);
        await page.keyboard.press('Enter');
        await state(1);
        assert.ok(await panels.nth(1).getByText('タブの中身2', { exact: true }).isVisible());
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(el => el === document.activeElement, await tabs.nth(2).elementHandle());
        await page.keyboard.press('Space');
        await state(2);
        const complex = panels.nth(2);
        assert.ok(await complex.locator('h2').isVisible());
        assert.ok(await complex.locator('ul ul').isVisible());
        assert.ok(await complex.locator('.wp-block-flexible-table-block-table').isVisible());
        const image = complex.locator('img');
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(el => el.decode());
        assert.ok(await image.evaluate(el => el.naturalWidth > 0));
        if (width === 375 || width === 1380) {
          await root.screenshot({ path: 'form-qa-results/tabs-' + engineName + '-' + width + '-complex.png' });
        }
        await tabs.first().click();
        await state(0);
        assert.equal(await complex.getByRole('link').count(), 0, 'hidden panel links are excluded from accessibility tree');
        await tabs.first().focus();
        await page.keyboard.press('ArrowLeft');
        await page.waitForFunction(el => el === document.activeElement, await tabs.nth(2).elementHandle());
        await state(0);
        if (width === 375 || width === 1380) {
          await root.screenshot({ path: 'form-qa-results/tabs-' + engineName + '-' + width + '-first.png' });
        }
        console.log(JSON.stringify({ partsTabsFrontend: 'PASS', engine: engineName, width, geometry }));
      } catch (error) {
        await page.screenshot({ path: 'form-qa-results/tabs-failure-' + engineName + '-' + width + '.png' }).catch(() => {});
        throw error;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
