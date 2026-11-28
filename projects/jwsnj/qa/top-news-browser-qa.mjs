import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json');
const { chromium, firefox, webkit } = require('playwright');
const base = new URL(process.argv[2]);
assert.equal(base.hostname, '127.0.0.1');
const archiveId = Number(process.argv[3]);
assert.ok(Number.isSafeInteger(archiveId) && archiveId > 0);
mkdirSync('form-qa-results', { recursive: true });
const near = (a, b, tolerance = 1) => Math.abs(a - b) <= tolerance;

for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [320, 375, 768, 1080, 1380]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
      try {
        await page.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
        assert.equal((await page.goto(base.href, { waitUntil: 'load' })).status(), 200);
        await page.evaluate(() => document.fonts.ready);
        const section = page.locator('main.global_contents > .top_news-01');
        const panel = section.locator('.jwsnj_topNews_panel');
        const rows = panel.locator('.module_newsList-01 > .mnl-01_article');
        const more = panel.locator('.jwsnj_topNews_more');
        assert.equal(await section.count(), 1);
        assert.equal(await rows.count(), 5);
        const titles = await rows.locator('.title').allTextContents();
        assert.deepEqual(titles.map(title => Number(title.match(/No([0-9])/)[1])), [5, 4, 3, 2, 1]);
        assert.equal(await rows.locator('h3.title').count(), 5);
        assert.equal(await rows.locator('a.link').count(), 4);
        assert.equal(await rows.last().locator('div.no-link').count(), 1);
        const moreUrl = new URL(await more.getAttribute('href'), base);
        assert.equal(moreUrl.origin, base.origin);
        assert.equal(moreUrl.searchParams.get('page_id'), String(archiveId));
        const data = await panel.evaluate(el => {
          const rect = node => {
            const r = node.getBoundingClientRect();
            return { x: r.left, y: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
          };
          const fits = node => node.scrollWidth <= node.clientWidth + 1;
          const heading = el.querySelector('.jwsnj_topNews_head');
          const list = el.querySelector('.module_newsList-01');
          const blossom = heading.querySelector('img');
          const section = el.closest('.top_news-01');
          const arrow = heading.querySelector('.jwsnj_topNews_arrow');
          const en = heading.querySelector('.jwsnj_topNews_en');
          const ja = heading.querySelector('.jwsnj_topNews_ja');
          return {
            panel: rect(el), header: rect(heading), list: rect(list), gap: getComputedStyle(el).rowGap,
            sizes: [getComputedStyle(en).fontSize, getComputedStyle(ja).fontSize, getComputedStyle(heading.querySelector('a')).fontSize],
            arrow: rect(arrow), blossom: [blossom.complete, blossom.naturalWidth, blossom.naturalHeight, rect(blossom)],
            panelFits: fits(el), sectionFits: fits(section), documentFits: document.documentElement.scrollWidth <= innerWidth + 1,
            rows: [...list.children].map(row => {
              const wrapper = row.firstElementChild;
              const head = row.querySelector('.head');
              const date = head.querySelector('.date');
              const label = head.querySelector('.label');
              const body = row.querySelector('.body');
              const title = body.querySelector('.title');
              const w = getComputedStyle(wrapper);
              const l = getComputedStyle(label);
              return { row: rect(row), head: rect(head), date: rect(date), label: rect(label), body: rect(body), title: rect(title),
                gap: w.rowGap, columnGap: w.columnGap, padding: [w.paddingTop, w.paddingBottom], display: w.display,
                dateText: date.textContent.trim(), dateFont: getComputedStyle(date).fontSize, labelStyle: [l.fontSize, l.fontWeight, l.lineHeight],
                titleFont: getComputedStyle(title).fontSize, border: getComputedStyle(row).borderBottomWidth,
                fits: [row, wrapper, head, body, title, label].every(fits) };
            })
          };
        });
        console.log(JSON.stringify({ topNews: 'MEASURED', engine: engineName, width, data }));
        const wide = width >= 768;
        assert.equal(data.gap, '32px');
        assert.deepEqual(data.sizes, wide ? ['46px', '15px', '16px'] : ['36px', '13px', '15px']);
        assert.ok(near(data.arrow.width, 32) && near(data.arrow.height, 32));
        assert.ok(data.blossom[0] && data.blossom[1] > 0 && data.blossom[2] > 0);
        assert.ok(near(data.blossom[3].width, 12) && near(data.blossom[3].height, 12), JSON.stringify(data.blossom));
        assert.ok(data.panelFits && data.sectionFits && data.documentFits, JSON.stringify(data));
        for (const [i, row] of data.rows.entries()) {
          assert.ok(row.fits, JSON.stringify(row));
          assert.match(row.dateText, /^\d{2}\.\d{2}\.\d{4}$/);
          assert.deepEqual([row.dateFont, row.titleFont], ['14px', '16px']);
          assert.deepEqual(row.labelStyle.slice(0, 2), ['11px', '700']);
          assert.ok(near(row.label.x - row.date.right, 20) && near(row.label.width, 80), JSON.stringify(row));
          assert.deepEqual(row.padding, Array(2).fill(wide ? '24px' : '20px'));
          assert.equal(row.border, i === 4 ? '0px' : '1px');
          if (wide) {
            assert.equal(row.display, 'grid');
            assert.ok(near(row.body.x - row.head.right, 40), JSON.stringify(row));
          } else {
            assert.equal(row.display, 'flex');
            assert.ok(near(row.body.y - row.head.bottom, 20) && near(row.body.x, row.head.x), JSON.stringify(row));
          }
        }
        const link = rows.first().locator('a.link');
        await more.evaluate(el => el.scrollIntoView({ block: 'center' }));
        await more.focus();
        await page.keyboard.press('Tab');
        assert.equal(await link.evaluate(el => document.activeElement === el), true);
        assert.equal(await link.evaluate(el => el.matches(':focus-visible')), true);
        await link.evaluate(el => el.scrollIntoView({ block: 'center' }));
        await link.hover();
        const highlight = link.locator('.title');
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.top_news-01 .mnl-01_article .title')).backgroundSize.startsWith('100%'));
        assert.equal(await highlight.evaluate(el => getComputedStyle(el).transitionDuration), '0.3s');
        await more.hover();
        const arrow = more.locator('.jwsnj_topNews_arrow');
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.jwsnj_topNews_arrow')).color === 'rgb(40, 172, 95)');
        assert.equal(await arrow.evaluate(el => getComputedStyle(el, '::before').fontSize), '12px');
        await page.mouse.move(0, 0);
        await page.locator('body').evaluate(el => document.activeElement?.blur());
        if (width === 375 || width === 1380) {
          await panel.screenshot({ path: 'form-qa-results/top-news-' + engineName + '-' + width + '.png',
            style: '#global_header { visibility: hidden !important; }' });
        }
        console.log(JSON.stringify({ topNews: 'PASS', engine: engineName, width }));
      } catch (error) {
        await page.screenshot({ path: 'form-qa-results/top-news-failure-' + engineName + '-' + width + '.png' }).catch(() => {});
        throw error;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
