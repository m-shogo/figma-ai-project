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
        const root = page.locator('.block-editor_wrap');
        const figures = root.locator('figure.wp-block-flexible-table-block-table');
        assert.equal(await figures.count(), 3);
        const scroll = figures.nth(0);
        const table = scroll.locator(':scope > table');
        const hint = scroll.locator(':scope > .scroll-hint-icon-wrap');
        await table.waitFor({ state: 'visible' });
        const measure = () => scroll.evaluate(el => {
          const t = el.querySelector('table');
          const cells = [...t.querySelectorAll('thead th')];
          const cell = getComputedStyle(cells[0]);
          const box = el.getBoundingClientRect();
          const parent = el.closest('.block-editor_wrap').getBoundingClientRect();
          return {
            width: box.width, tableWidth: t.getBoundingClientRect().width,
            client: el.clientWidth, scroll: el.scrollWidth,
            overflow: getComputedStyle(el).overflowX,
            fits: box.left >= parent.left - 1 && box.right <= parent.right + 1,
            columns: cells.map(c => c.getBoundingClientRect().width),
            font: cell.fontSize, weight: cell.fontWeight, padding: cell.paddingBlockStart,
            headerBackground: cell.backgroundColor, border: cell.borderTopWidth,
            merged: t.querySelector('td[colspan="2"]').getBoundingClientRect().width
          };
        });
        const m = await measure();
        assert.ok(m.fits, JSON.stringify(m));
        assert.equal(m.font, '15px');
        assert.equal(m.weight, '400');
        assert.equal(m.padding, width < 768 ? '12px' : '15px');
        assert.equal(m.headerBackground, 'rgb(242, 242, 242)');
        assert.equal(m.border, '1px');
        assert.equal(m.columns.length, 4);
        assert.ok(Math.max(...m.columns) - Math.min(...m.columns) <= 2, JSON.stringify(m));
        assert.ok(Math.abs(m.merged - m.columns[1] - m.columns[2]) <= 2, JSON.stringify(m));
        if (width < 768) {
          assert.ok(Math.abs(m.tableWidth - 960) <= 2 && m.scroll > m.client, JSON.stringify(m));
          await page.waitForFunction(el => el.dataset.jwsnjTableHint !== undefined && el.tabIndex === 0, await scroll.elementHandle());
          assert.equal(await hint.count(), 1);
          assert.equal(await hint.getAttribute('aria-hidden'), 'true');
          assert.equal(await scroll.getAttribute('aria-label'), '横スクロール可能な表');
          if (width === 375) await scroll.screenshot({ path: 'form-qa-results/table-' + engineName + '-375-initial.png' });
          await scroll.focus();
          assert.equal(await scroll.evaluate(el => el === document.activeElement), true);
          assert.equal(await hint.evaluate(el => getComputedStyle(el).visibility), 'hidden');
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(el => el.scrollLeft > 0, await scroll.elementHandle(), { timeout: 5000 });
          await scroll.evaluate(el => { el.scrollLeft = el.scrollWidth; });
          assert.ok(await scroll.evaluate(el => Math.abs(el.scrollLeft + el.clientWidth - el.scrollWidth) <= 2), 'last column is reachable');
          if (width === 375) await scroll.screenshot({ path: 'form-qa-results/table-' + engineName + '-375-end.png' });
          await page.setViewportSize({ width: 1380, height: 900 });
          await page.waitForFunction(el => !el.hasAttribute('tabindex') && !el.hasAttribute('aria-label'), await scroll.elementHandle());
          assert.equal(await hint.evaluate(el => getComputedStyle(el).display), 'none');
          await page.setViewportSize({ width, height: 900 });
          await page.waitForFunction(el => el.tabIndex === 0, await scroll.elementHandle());
          assert.equal(await hint.count(), 1, 'no duplicate hint after resize');
        } else {
          assert.ok(Math.abs(m.tableWidth - m.width) <= 2, JSON.stringify(m));
          assert.equal(await scroll.getAttribute('tabindex'), null);
          assert.equal(await hint.count(), 0);
          if (width === 1380) await scroll.screenshot({ path: 'form-qa-results/table-' + engineName + '-1380.png' });
        }
        assert.equal(await figures.nth(1).locator('td[style*="padding:18px"]').evaluate(el => getComputedStyle(el).paddingBlockStart), '18px', 'explicit cell padding is preserved');
        for (const index of [1, 2]) {
          const variant = figures.nth(index);
          const info = await variant.evaluate(el => {
            const b = el.getBoundingClientRect();
            const t = el.querySelector('table');
            const p = el.closest('.block-editor_wrap').getBoundingClientRect();
            const cell = [...t.querySelectorAll('td')].find(td => td.textContent.includes('LongEditableCell'));
            return {
              fits: b.left >= p.left - 1 && b.right <= p.right + 1,
              cellFits: cell.scrollWidth <= cell.clientWidth + 1,
              stacked: t.classList.contains('is-stacked-on-mobile'),
              hint: !!el.querySelector('.scroll-hint-icon-wrap'),
              overflow: el.scrollWidth - el.clientWidth
            };
          });
          assert.ok(info.fits && info.cellFits && !info.hint, JSON.stringify({ index, info }));
          assert.equal(info.stacked, index === 2);
          if (width === 375 || width === 1380) await variant.screenshot({ path: 'form-qa-results/table-' + engineName + '-' + width + '-variant-' + index + '.png' });
        }
        console.log(JSON.stringify({ partsTablesFrontend: 'PASS', engine: engineName, width, scroll: m }));
      } catch (error) {
        await page.screenshot({ path: 'form-qa-results/table-failure-' + engineName + '-' + width + '.png' }).catch(() => {});
        throw error;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
