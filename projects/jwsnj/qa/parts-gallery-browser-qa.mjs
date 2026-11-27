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
      try {
        await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort());
        assert.equal((await page.goto(url.href, { waitUntil: 'load' })).status(), 200);
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
        await button.focus();
        await page.keyboard.press('Enter');
        const overlay = page.locator('.wp-lightbox-overlay.active');
        await overlay.waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
        await overlay.waitFor({ state: 'hidden' });
        assert.equal(await button.evaluate(el => el === document.activeElement), true, 'lightbox restores trigger focus');

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
        console.log(JSON.stringify({ partsGalleryFrontend: 'PASS', engine: engineName, width, results, buttonGeometry, geometry }));
      } catch (error) {
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
