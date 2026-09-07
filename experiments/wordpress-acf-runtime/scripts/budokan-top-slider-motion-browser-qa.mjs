import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) process.exit(2);
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function exercise(reducedMotion) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1380, height: 1000 },
      reducedMotion,
    });
    const page = await context.newPage();

    // The disposable WordPress runtime deliberately has no ACF Pro repeater, so
    // front-page.php renders one canonical fallback slide. Duplicate that already-
    // rendered Theme slide before window.load so home.js exercises its real
    // multi-slide Swiper path without inventing a second production content owner.
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const wrapper = document.querySelector('.tm_swiper-container .swiper-wrapper');
        if (!wrapper || wrapper.dataset.qaMultislide === 'true') return;
        const first = wrapper.querySelector('.swiper-slide');
        if (!first) return;
        const clone = first.cloneNode(true);
        clone.dataset.qaClone = 'true';
        wrapper.appendChild(clone);
        const container = wrapper.closest('.tm_swiper-container');
        if (container && !container.querySelector('.swiper-pagination')) {
          const pagination = document.createElement('div');
          pagination.className = 'swiper-pagination';
          container.appendChild(pagination);
        }
        wrapper.dataset.qaMultislide = 'true';
        observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });

    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('.tm_swiper-container.swiper-initialized');

    const before = await page.evaluate(() => {
      const root = document.querySelector('.tm_swiper-container');
      const swiper = root?.swiper;
      return swiper ? {
        slideCount: root.querySelectorAll('.swiper-slide[data-qa-clone="true"]').length,
        speed: swiper.params.speed,
        autoplayEnabled: Boolean(swiper.params.autoplay && swiper.params.autoplay !== false && swiper.autoplay?.running),
        realIndex: swiper.realIndex,
        documentWidth: document.documentElement.clientWidth,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      } : null;
    });
    assert(before, `${reducedMotion}: TOP Swiper instance missing`);
    assert(before.slideCount >= 1, `${reducedMotion}: synthetic second rendered Theme slide missing`);

    await page.waitForTimeout(4300);
    const after = await page.evaluate(() => {
      const root = document.querySelector('.tm_swiper-container');
      const swiper = root?.swiper;
      return swiper ? {
        speed: swiper.params.speed,
        autoplayRunning: Boolean(swiper.autoplay?.running),
        realIndex: swiper.realIndex,
        documentWidth: document.documentElement.clientWidth,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      } : null;
    });
    assert(after, `${reducedMotion}: TOP Swiper instance disappeared`);
    assert(after.documentWidth === before.documentWidth, `${reducedMotion}: document width shifted ${before.documentWidth} -> ${after.documentWidth}`);
    assert(after.scrollX === before.scrollX && after.scrollY === before.scrollY, `${reducedMotion}: autoplay changed page scroll (${before.scrollX},${before.scrollY}) -> (${after.scrollX},${after.scrollY})`);
    assert(!after.horizontalOverflow, `${reducedMotion}: slider introduced horizontal overflow`);

    if (reducedMotion === 'reduce') {
      assert(before.speed === 0 && after.speed === 0, `reduced-motion: expected zero-duration transition, got ${before.speed}/${after.speed}`);
      assert(before.autoplayEnabled === false && after.autoplayRunning === false, 'reduced-motion: TOP slider autoplay must remain stopped');
      assert(after.realIndex === before.realIndex, `reduced-motion: TOP slider advanced ${before.realIndex} -> ${after.realIndex}`);
    } else {
      assert(before.speed === 1000 && after.speed === 1000, `no-preference: expected existing 1000ms fade, got ${before.speed}/${after.speed}`);
      assert(before.autoplayEnabled === true, 'no-preference: existing TOP autoplay unexpectedly disabled');
      assert(after.realIndex !== before.realIndex, `no-preference: TOP slider did not advance from ${before.realIndex}`);
    }

    await context.close();
    return { before, after };
  } finally {
    await browser.close();
  }
}

await exercise('no-preference');
await exercise('reduce');
console.log('PASS Budokan TOP slider preserves existing autoplay for no-preference and stops autoplay/motion for prefers-reduced-motion without page geometry drift.');
