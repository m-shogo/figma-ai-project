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
const failures = [];

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
          const moreLabel = heading.querySelector('.jwsnj_topNews_moreLabel');
          const en = heading.querySelector('.jwsnj_topNews_en');
          const ja = heading.querySelector('.jwsnj_topNews_ja');
          return {
            panel: rect(el), header: rect(heading), list: rect(list), gap: getComputedStyle(el).rowGap,
            sizes: [getComputedStyle(en).fontSize, getComputedStyle(ja).fontSize, getComputedStyle(heading.querySelector('a')).fontSize],
            moreLabel: { rect: rect(moreLabel), lineHeight: parseFloat(getComputedStyle(moreLabel).lineHeight), fits: fits(moreLabel), gap: arrow.getBoundingClientRect().left - moreLabel.getBoundingClientRect().right },
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
        assert.ok(data.moreLabel.fits && near(data.moreLabel.gap, 16), JSON.stringify(data.moreLabel));
        if (width === 375 || width >= 768) assert.ok(near(data.moreLabel.rect.height, data.moreLabel.lineHeight), JSON.stringify(data.moreLabel));
        assert.ok(data.blossom[0] && data.blossom[1] > 0 && data.blossom[2] > 0);
        assert.ok(near(data.blossom[3].width, 12) && near(data.blossom[3].height, 12), JSON.stringify(data.blossom));
        if (!data.documentFits) {
          const overflow = await page.evaluate(() => {
            const root = document.documentElement;
            const body = document.body;
            const nodes = [];
            for (const node of body.querySelectorAll('*')) {
              const r = node.getBoundingClientRect();
              if (!r.width || !r.height || (r.right <= innerWidth + 1 && r.left >= -1)) continue;
              const clips = [];
              for (let parent = node.parentElement; parent && parent !== root; parent = parent.parentElement) {
                const style = getComputedStyle(parent);
                if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)) {
                  clips.push({ tag: parent.tagName, className: parent.getAttribute('class'), overflowX: style.overflowX });
                }
              }
              nodes.push({ tag: node.tagName, className: node.getAttribute('class'), id: node.id,
                left: r.left, right: r.right, width: r.width, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, clips });
            }
            return { innerWidth, rootClientWidth: root.clientWidth, rootScrollWidth: root.scrollWidth,
              bodyScrollWidth: body.scrollWidth, nodes: nodes.sort((a, b) => b.right - a.right).slice(0, 30) };
          });
          console.log(JSON.stringify({ topNews: 'DOCUMENT_OVERFLOW', engine: engineName, width, overflow }));
        }
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
        await page.waitForFunction(() => {
          const arrow = document.querySelector('.jwsnj_topNews_arrow');
          const title = document.querySelector('.top_news-01 .mnl-01_article .title');
          return getComputedStyle(arrow).backgroundColor === 'rgb(40, 172, 95)' && parseFloat(getComputedStyle(title).backgroundSize) === 0;
        });
        if (width === 375 || width === 1380) {
          await panel.screenshot({ path: 'form-qa-results/top-news-' + engineName + '-' + width + '.png',
            style: '#global_header { visibility: hidden !important; }' });
        }
        console.log(JSON.stringify({ topNews: 'PASS', engine: engineName, width }));

        // Verify the actual adjacent Instagram view without changing the
        // approved News row owner or fabricating the pending account URL.
        const instagram = section.locator('.jwsnj_topInstagram');
        assert.equal(await instagram.count(), 1);
        assert.equal(await instagram.locator('h2').textContent(), 'Instagram');
        assert.equal(await instagram.locator('a[href],button,[tabindex]').count(), 0);
        await instagram.locator('img').evaluate(async img => { img.loading = 'eager'; await img.decode(); });
        const measureInstagram = () => instagram.evaluate(el => {
          const rect = node => {
            const r = node.getBoundingClientRect();
            return { x:r.left, y:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
          };
          const fits = node => node.scrollWidth <= node.clientWidth + 1;
          const parent = el.parentElement;
          const news = parent.querySelector('.jwsnj_topNews_panel');
          const heading = el.querySelector('.jwsnj_topInstagram_heading');
          const icon = el.querySelector('.jwsnj_topInstagram_icon');
          const copy = el.querySelector('.jwsnj_topInstagram_copy');
          const label = copy.querySelector('.jwsnj_topInstagram_label');
          const description = copy.querySelector('.jwsnj_topInstagram_description');
          const art = el.querySelector('.jwsnj_topInstagram_art');
          const style = getComputedStyle(el);
          const glyph = getComputedStyle(icon, '::before');
          return { panel:rect(el),news:rect(news),heading:rect(heading),icon:rect(icon),copy:rect(copy),
            label:rect(label),description:rect(description),art:rect(art),
            gap:parseFloat(style.rowGap),copyGap:parseFloat(getComputedStyle(copy).rowGap),
            padding:[style.paddingTop,style.paddingBottom,style.paddingLeft,style.paddingRight].map(parseFloat),
            font:[heading,label,description].map(n=>getComputedStyle(n).fontSize),
            iconFont:glyph.fontSize,iconFamily:glyph.fontFamily,iconContent:glyph.content,
            src:new URL(art.currentSrc).pathname,natural:[art.naturalWidth,art.naturalHeight],
            fits:[el,heading,copy,label,description].every(fits),
            docFits:document.documentElement.scrollWidth<=innerWidth+1 };
        });
        const ig = await measureInstagram();
        console.log(JSON.stringify({ topInstagram:'MEASURED', engine:engineName,width,ig }));
        const desktop = width >= 1080;
        assert.ok(ig.fits && ig.docFits, JSON.stringify(ig));
        assert.deepEqual(ig.font,desktop?['22px','16px','14px']:['20px','13px','14px']);
        assert.equal(ig.iconFont,desktop?'28px':'22px');
        assert.ok(ig.iconContent.includes('\uf16d') && /brands/i.test(ig.iconFamily),JSON.stringify(ig));
        assert.equal(ig.gap,desktop?24:20);
        assert.equal(ig.copyGap,16);
        assert.deepEqual(ig.padding.slice(0,2),desktop?[56,32]:[32,24]);
        assert.ok(ig.src.endsWith('/images/top/img_instagram.svg') && ig.natural.every(n=>n>0));
        assert.ok(near(ig.art.width,desktop?66:42) && near(ig.art.height,ig.art.width*155/66,2),JSON.stringify(ig));
        assert.ok(near(ig.copy.x-ig.panel.x,ig.padding[2])&&near(ig.panel.right-ig.copy.right,ig.padding[3]),JSON.stringify(ig));
        assert.ok(near((ig.art.x+ig.art.right)/2,(ig.panel.x+ig.panel.right)/2),JSON.stringify(ig));
        if(desktop) {
          assert.ok(near(ig.panel.x-ig.news.right,80)&&near(ig.panel.y,ig.news.y)&&near(ig.panel.height,ig.news.height),JSON.stringify(ig));
        } else {
          assert.ok(near(ig.panel.y-ig.news.bottom,40)&&near(ig.panel.width,ig.news.width),JSON.stringify(ig));
        }
        if(width===375||width===1380) {
          await section.screenshot({path:'form-qa-results/top-news-instagram-'+engineName+'-'+width+'.png',
            style:'#global_header { visibility: hidden !important; }'});
          await instagram.locator('.jwsnj_topInstagram_label').evaluate(el=>{el.append(' 長い編集用の検証文言 LongEditableLabel1234567890');});
          try {
            for(const scale of [1.5,2]) {
              await page.evaluate(scale=>{document.documentElement.style.fontSize=(16*scale)+'px';},scale);
              const stress=await measureInstagram();
              console.log(JSON.stringify({topInstagramStress:'MEASURED',engine:engineName,width,scale,stress}));
              assert.ok(stress.fits&&stress.docFits,JSON.stringify(stress));
            }
          } finally {
            await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));
          }
        }
        console.log(JSON.stringify({topInstagram:'PASS',engine:engineName,width}));
      } catch (error) {
        await page.screenshot({ path: 'form-qa-results/top-news-failure-' + engineName + '-' + width + '.png' }).catch(() => {});
        failures.push({ engine: engineName, width, message: String(error) });
        console.error(JSON.stringify({ topNews: 'FAIL', engine: engineName, width, message: String(error) }));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
assert.equal(failures.length, 0, JSON.stringify(failures));
