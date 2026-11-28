import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json');
const { chromium, firefox, webkit } = require('playwright');
const url = new URL(process.argv[2]);
assert.equal(url.hostname, '127.0.0.1');
mkdirSync('form-qa-results', { recursive: true });
const near = (a, b, tolerance = 1) => Math.abs(a - b) <= tolerance;

for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    for (const width of [320, 375, 768, 1380]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const runtimeErrors = [];
      page.on('pageerror', error => runtimeErrors.push({ type: 'pageerror', message: error.message }));
      page.on('console', message => {
        if (message.type() === 'error') runtimeErrors.push({ type: 'console', message: message.text() });
      });
      page.on('requestfailed', request => {
        if (new URL(request.url()).origin === url.origin) runtimeErrors.push({ type: 'requestfailed', url: request.url(), error: request.failure()?.errorText });
      });
      try {
        await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
        assert.equal((await page.goto(url.href, { waitUntil: 'load' })).status(), 200);
        // No development module may run before the native WP import map.
        const moduleOrder = await page.evaluate(() => {
          const scripts = [...document.querySelectorAll('script[type="module"],script[type="importmap"]')];
          return { map: scripts.findIndex(el => el.id === 'wp-importmap'),
            firstModule: scripts.findIndex(el => el.type === 'module'),
            vite: scripts.findIndex(el => el.src.includes('/@vite/client')) };
        });
        assert.ok(moduleOrder.map >= 0 && moduleOrder.firstModule > moduleOrder.map &&
          moduleOrder.vite > moduleOrder.map, JSON.stringify(moduleOrder));
        const root = page.locator('.block-editor_wrap');
        const galleries = root.locator('.wp-block-gallery.has-nested-images');
        assert.equal(await galleries.count(), 2);
        const results = [];
        for (let index = 0; index < 2; index++) {
          const gallery = galleries.nth(index);
          const images = gallery.locator('figure.wp-block-image img');
          assert.equal(await images.count(), index === 0 ? 2 : 3);
          for (const image of await images.all()) {
            await image.scrollIntoViewIfNeeded();
            await image.evaluate(img => img.decode());
          }
          const m = await gallery.evaluate(el => {
            const b = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            const cards = [...el.querySelectorAll('figure.wp-block-image')].map(card => {
              const box = card.getBoundingClientRect();
              const img = card.querySelector('img');
              const pic = img.getBoundingClientRect();
              const caption = card.querySelector('figcaption');
              const cap = caption.getBoundingClientRect();
              const cs = getComputedStyle(caption);
              return {
                x: box.left - b.left, y: box.top - b.top, width: box.width, bottom: box.bottom - b.top,
                imageWidth: pic.width, ratio: pic.width / pic.height, natural: img.naturalWidth,
                fit: getComputedStyle(img).objectFit, radius: getComputedStyle(img).borderRadius,
                gap: cap.top - pic.bottom, font: cs.fontSize, lineHeight: cs.lineHeight,
                fits: cap.left >= box.left - 1 && cap.right <= box.right + 1 && caption.scrollWidth <= caption.clientWidth + 1
              };
            });
            return { width: b.width, columns: style.gridTemplateColumns.split(' ').length, gap: parseFloat(style.columnGap), rowGap: parseFloat(style.rowGap), cards };
          });
          const columns = index === 0 ? (width >= 768 ? 2 : 1) : (width >= 768 ? 3 : 2);
          assert.equal(m.columns, columns, JSON.stringify(m));
          assert.equal(m.gap, index === 1 && width < 768 ? 15 : 40);
          assert.equal(m.rowGap, 40);
          for (const card of m.cards) {
            assert.ok(card.natural > 0 && near(card.ratio, 1.5, 0.02) && near(card.imageWidth, card.width) &&
              card.fit === 'cover' && card.radius === '5px' && near(card.gap, 20) && card.fits, JSON.stringify(m));
            assert.equal(card.font, width >= 768 ? '14px' : '12px');
            assert.ok(near(parseFloat(card.lineHeight), width >= 768 ? 21 : 19.2, 0.3));
          }
          assert.ok(near(m.cards[0].width, (m.width - (columns - 1) * m.gap) / columns), JSON.stringify(m));
          if (m.cards.length > columns) {
            assert.ok(near(m.cards[columns].x, 0) && near(m.cards[columns].y - Math.max(...m.cards.slice(0, columns).map(card => card.bottom)), 40), JSON.stringify(m));
          }
          if (width === 375 || width === 1380) await gallery.screenshot({ path: 'form-qa-results/gallery-' + engineName + '-' + width + '-' + index + '.png' });
          results.push(m);
        }
        const button = galleries.first().locator('button.lightbox-trigger').first();
        assert.equal(await galleries.first().locator('button.lightbox-trigger').count(), 2);
        assert.equal(await galleries.nth(1).locator('button.lightbox-trigger').count(), 0);
        await button.scrollIntoViewIfNeeded();
        const buttonGeometry = await button.evaluate(el => {
          const b = el.getBoundingClientRect();
          const img = el.closest('figure').querySelector('img').getBoundingClientRect();
          return { width: b.width, height: b.height, right: img.right - b.right, bottom: img.bottom - b.bottom };
        });
        assert.ok(near(buttonGeometry.width, 44) && near(buttonGeometry.height, 44) &&
          near(buttonGeometry.right, width >= 768 ? 20 : 16) && near(buttonGeometry.bottom, width >= 768 ? 20 : 16), JSON.stringify(buttonGeometry));
        assert.ok(await button.evaluate(el => {
          const box = el.getBoundingClientRect();
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return el.contains(hit) && getComputedStyle(el).opacity === '1';
        }), 'visible zoom control is the real hit target');
        if (width === 375 || width === 1380) await galleries.first().screenshot({ path: 'form-qa-results/gallery-' + engineName + '-' + width + '-zoom-control.png' });
        // The core Interactivity API adds the accessible label when it hydrates.
        // A rendered button is not proof that the module has attached handlers.
        await page.waitForFunction(el => !!el.getAttribute('aria-label')?.trim(), await button.elementHandle(), { timeout: 10000 });
        await button.focus();
        assert.equal(await button.evaluate(el => el === document.activeElement), true);
        await page.keyboard.press('Enter');
        const overlay = page.locator('.wp-lightbox-overlay.active');
        await overlay.waitFor({ state: 'visible' });
        // Core's setOverlayFocus and hideLightbox callbacks are asynchronous.
        // Require actual dialog focus, never move focus ourselves to make Escape pass.
        await page.waitForFunction(() => document.querySelector('.wp-lightbox-overlay.active')?.contains(document.activeElement), null, { timeout: 5000 });
        await page.keyboard.press('Escape');
        await overlay.waitFor({ state: 'hidden' });
        await page.waitForFunction(el => el === document.activeElement, await button.elementHandle(), { timeout: 5000 });

        const media = root.locator('.wp-block-media-text');
        const mediaImage = media.locator('.wp-block-media-text__media img');
        await mediaImage.scrollIntoViewIfNeeded();
        await mediaImage.evaluate(img => img.decode());
        const geometry = await media.evaluate(el => {
          const b = el.getBoundingClientRect();
          const img = el.querySelector('.wp-block-media-text__media').getBoundingClientRect();
          const copy = el.querySelector('.wp-block-media-text__content').getBoundingClientRect();
          return { width: b.width, img: img.width, copy: copy.width, horizontalGap: copy.left - img.right, verticalGap: copy.top - img.bottom };
        });
        if (width >= 768) {
          assert.ok(near(geometry.horizontalGap, 40) && near(geometry.img / geometry.copy, 410 / 510, 0.02), JSON.stringify(geometry));
        } else {
          assert.ok(near(geometry.img, geometry.width) && near(geometry.copy, geometry.width) && near(geometry.verticalGap, 40), JSON.stringify(geometry));
        }
        if (width === 375 || width === 1380) await media.screenshot({ path: 'form-qa-results/media-text-' + engineName + '-' + width + '.png' });

        // Actual shared PHP view from the disposable media page; no ACF stubs
        // or synthetic HTML injected by the browser.
        const navigation = root.locator('#qa-large-navigation');
        const cards = navigation.locator('.module_navigationCard');
        assert.equal(await cards.count(), 4);
        for (const image of await cards.locator('img').all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(img => img.decode());
        }
        const nav = await navigation.evaluate(list => {
          const box = list.getBoundingClientRect();
          const style = getComputedStyle(list);
          return {
            columns: style.gridTemplateColumns.split(' ').length,
            gap: parseFloat(style.columnGap), rowGap: parseFloat(style.rowGap),
            cards: [...list.querySelectorAll('.module_navigationCard')].map(a => {
              const r = a.getBoundingClientRect();
              const photo = a.querySelector('.module_navigationCard_photo');
              const image = a.querySelector('img');
              const copy = a.querySelector('.module_navigationCard_content');
              const title = a.querySelector('.module_navigationCard_title');
              const text = a.querySelector('.module_navigationCard_text');
              const arrow = a.querySelector('.module_navigationCard_arrow');
              const p = photo?.getBoundingClientRect();
              const ar = arrow?.getBoundingClientRect();
              return {
                href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'),
                fits: r.left >= box.left - 1 && r.right <= box.right + 1 &&
                  title.scrollWidth <= title.clientWidth + 1 && (!text || text.scrollWidth <= text.clientWidth + 1),
                titleFont: getComputedStyle(title).fontSize,
                titleBorder: getComputedStyle(title).borderBottomWidth,
                ratio: p ? p.width / p.height : null,
                cropRadius: image ? getComputedStyle(image.parentElement).borderRadius : null,
                imageNatural: image?.naturalWidth || 0,
                imageFit: image ? getComputedStyle(image).objectFit : null,
                gap: p ? copy.getBoundingClientRect().top - p.bottom : null,
                copyGap: text ? text.getBoundingClientRect().top - title.getBoundingClientRect().bottom : null,
                arrow: ar ? [ar.width, ar.height, p.right - ar.right, p.bottom - ar.bottom] : null,
                arrowHidden: arrow?.getAttribute('aria-hidden') || null
              };
            })
          };
        });
        assert.equal(nav.columns, width >= 768 ? 3 : 1);
        assert.equal(nav.gap, 40);
        assert.equal(nav.rowGap, 40);
        assert.deepEqual(nav.cards.map(card => card.href), ['#qa-navigation-end', null, '#qa-navigation-end', null]);
        assert.equal(nav.cards[2].target, '_blank');
        assert.ok(nav.cards[2].rel.includes('noopener') && nav.cards[2].rel.includes('noreferrer'));
        for (const card of nav.cards) {
          assert.ok(card.fits && card.titleFont === '18px' && card.titleBorder === '0px', JSON.stringify(nav));
          if (card.ratio !== null) {
            assert.ok(near(card.ratio, 1.5, 0.02) && near(card.gap, 24) && near(card.copyGap, 20), JSON.stringify(card));
            assert.ok(card.imageNatural > 0 && card.imageFit === 'cover' && card.cropRadius === '5px');
            assert.ok(card.arrow.every((v, i) => near(v, [32, 32, 0, 0][i])) && card.arrowHidden === 'true');
          }
        }
        assert.equal(nav.cards[3].ratio, null);
        await cards.first().focus();
        assert.ok(await cards.first().evaluate(el => el === document.activeElement && parseFloat(getComputedStyle(el).outlineWidth) >= 2));
        await page.keyboard.press('Tab');
        assert.ok(await cards.nth(2).evaluate(el => el === document.activeElement), 'skip first empty URL');
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'qa-navigation-next');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await cards.first().hover();
        await page.waitForFunction(el => getComputedStyle(el.querySelector('img')).transform !== 'none' &&
          Math.abs(parseFloat(getComputedStyle(el.querySelector('.module_navigationCard_content')).opacity) - 0.7) < 0.02,
          await cards.first().elementHandle());
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(await cards.first().locator('img').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
        await page.mouse.move(0, 0);
        await navigation.scrollIntoViewIfNeeded();
        if (width === 375 || width === 1380) {
          const path = 'form-qa-results/large-navigation-wp-' + engineName + '-' + width;
          // Keep unmodified evidence of the real page. Also capture the
          // component without the unrelated sticky header obscuring pixels.
          // Playwright's screenshot style applies ONLY during the capture.
          // All interaction and geometry checks above use the intact page.
          await navigation.screenshot({ path: path + '.png' });
          await navigation.screenshot({
            path: path + '-component-only.png',
            style: '#global_header { visibility: hidden !important; }'
          });
        }
        console.log(JSON.stringify({ largeNavigationWordPress: 'PASS', engine: engineName, width, nav }));

        // Figma proportions, separate from the long-text/empty-data fixture.
        const reference = root.locator('#qa-large-navigation-reference');
        assert.equal(await reference.locator('.module_navigationCard').count(), 3);
        for (const image of await reference.locator('img').all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(img => img.decode());
        }
        const design = await reference.evaluate(list => {
          const box = list.getBoundingClientRect();
          return {
            width: box.width, columns: getComputedStyle(list).gridTemplateColumns.split(' ').length,
            cards: [...list.querySelectorAll('.module_navigationCard')].map(card => {
              const r = card.getBoundingClientRect();
              const photo = card.querySelector('.module_navigationCard_photo');
              const p = photo.getBoundingClientRect();
              const notch = getComputedStyle(photo, '::after');
              const title = card.querySelector('.module_navigationCard_title');
              const copy = card.querySelector('.module_navigationCard_text');
              const arrow = card.querySelector('.module_navigationCard_arrow');
              const glyph = getComputedStyle(arrow, '::before');
              return {
                x: r.left - box.left, y: r.top - box.top, bottom: r.bottom - box.top,
                width: r.width, photoHeight: p.height,
                title: title.textContent.trim(), titleSize: getComputedStyle(title).fontSize,
                titleWeight: getComputedStyle(title).fontWeight,
                copySize: getComputedStyle(copy).fontSize, copyWeight: getComputedStyle(copy).fontWeight,
                copyLine: parseFloat(getComputedStyle(copy).lineHeight),
                notch: [notch.width, notch.height, notch.borderTopLeftRadius, notch.backgroundColor],
                arrow: [arrow.getBoundingClientRect().width, getComputedStyle(arrow).backgroundColor],
                glyph: [glyph.content, glyph.fontSize, glyph.fontWeight],
                fits: title.scrollWidth <= title.clientWidth + 1 && copy.scrollWidth <= copy.clientWidth + 1
              };
            })
          };
        });
        assert.equal(design.columns, width >= 768 ? 3 : 1);
        if (width === 1380) assert.ok(near(design.width, 960), JSON.stringify(design));
        const expectedWidth = (design.width - (design.columns - 1) * 40) / design.columns;
        assert.deepEqual(design.cards.map(card => card.title), ['幼児部', '初等部', '中等部']);
        for (const card of design.cards) {
          assert.ok(card.fits && near(card.width, expectedWidth) &&
            near(card.photoHeight, expectedWidth * 2 / 3), JSON.stringify(design));
          assert.deepEqual([card.titleSize, card.titleWeight, card.copySize, card.copyWeight], ['18px', '500', '16px', '400']);
          assert.ok(near(card.copyLine, 22.4, 0.2), JSON.stringify(card));
          assert.deepEqual(card.notch, ['48px', '48px', '20px', 'rgb(255, 255, 255)']);
          assert.deepEqual(card.arrow, [32, 'rgb(40, 172, 95)']);
          assert.ok(card.glyph[0].includes('\uf061'), JSON.stringify(card));
          assert.deepEqual(card.glyph.slice(1), ['10px', '400']);
        }
        if (design.columns === 3) {
          assert.ok(design.cards.every((card, i) => near(card.x, i * (expectedWidth + 40)) && near(card.y, 0)), JSON.stringify(design));
        } else {
          assert.ok(design.cards.every((card, i) => near(card.x, 0) &&
            (i === 0 || near(card.y - design.cards[i - 1].bottom, 40))), JSON.stringify(design));
        }
        if (width === 375 || width === 1380) {
          await reference.screenshot({
            path: 'form-qa-results/large-navigation-reference-' + engineName + '-' + width + '.png',
            style: '#global_header { visibility: hidden !important; }'
          });
        }
        console.log(JSON.stringify({ largeNavigationReference: 'PASS', engine: engineName, width, design }));

        console.log(JSON.stringify({ partsGalleryFrontend: 'PASS', engine: engineName, width, results, buttonGeometry, geometry }));
      } catch (error) {
        console.error(JSON.stringify({ engineName, width, runtimeErrors, state: await page.evaluate(() => ({
          active: document.activeElement?.outerHTML.slice(0, 600),
          trigger: document.querySelector('button.lightbox-trigger')?.outerHTML.slice(0, 600),
          dialog: document.querySelector('.wp-lightbox-overlay')?.className,
          modules: [...document.querySelectorAll('script[type="module"],script[type="importmap"]')].map(el => ({ id: el.id, src: el.src, imports: el.type === 'importmap' ? el.textContent.slice(0, 2000) : undefined }))
        })) }));
        await page.screenshot({ path: 'form-qa-results/gallery-failure-' + engineName + '-' + width + '.png' }).catch(() => {});
        throw error;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
