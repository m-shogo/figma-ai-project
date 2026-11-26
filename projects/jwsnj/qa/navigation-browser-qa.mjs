import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const { chromium, firefox, webkit } = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json')('playwright');
const url = process.argv[2];
assert.match(url, /^http:\/\/127\.0\.0\.1:/);
mkdirSync('form-qa-results', { recursive: true });

for (const [engineName, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' });
    await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    assert.equal((await page.goto(url, { waitUntil: 'load' })).status(), 200);
    const hamburger = page.locator('#gh_menu');
    const nav = page.locator('#global_navigation');
    const parent = nav.locator('.gnl_item-02._hasChild').first();
    const button = parent.locator('.gnl_button-02').first();
    const wrapper = parent.locator('.gnl_wrapper-02').first();
    const child = wrapper.locator('a').first();
    const overlay = page.locator('#overlay');
    const footer = page.locator('#global_footer .gfl_item-02._hasChild').first();
    const footerButton = footer.locator('.gfl_button-02').first();
    const footerWrapper = footer.locator('.gfl_wrapper-02').first();
    await parent.waitFor({ state: 'attached' });
    await page.waitForFunction(() => document.getElementById('global_navigation').inert);
    const waitState = async (open, desktop = false) => {
      await page.waitForFunction(({ open, desktop }) => {
        const body = document.body;
        const nav = document.getElementById('global_navigation');
        const menu = document.getElementById('gh_menu');
        return body.classList.contains('_open-menu') === open &&
          body.classList.contains('_contentFixed') === open &&
          body.classList.contains('_open-bg') === open &&
          menu.getAttribute('aria-expanded') === String(open) &&
          nav.inert === (!open && !desktop);
      }, { open, desktop });
    };
    await waitState(false);
    assert.equal(await wrapper.evaluate(el => el.inert), true);
    // Real scroll, keyboard open, nested disclosure, Escape restores focus and scroll.
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForFunction(() => window.scrollY > 100);
    const scroll = await page.evaluate(() => window.scrollY);
    await hamburger.focus();
    await page.keyboard.press('Enter');
    await waitState(true);
    assert.equal(await overlay.evaluate(el => getComputedStyle(el).visibility), 'visible');
    await button.focus();
    await page.keyboard.press('Space');
    assert.equal(await button.getAttribute('aria-expanded'), 'true');
    assert.equal(await wrapper.evaluate(el => el.inert), false);
    await child.focus();
    assert.equal(await child.evaluate(el => document.activeElement === el), true);
    await page.keyboard.press('Escape');
    await waitState(false);
    assert.equal(await hamburger.evaluate(el => document.activeElement === el), true);
    await page.waitForFunction(y => Math.abs(window.scrollY - y) <= 2, scroll);
    await hamburger.click();
    await waitState(true);
    await page.locator('#gn_close').click();
    await waitState(false);
    // Cross the actual CSS/JS breakpoint while open, then return to mobile.
    await hamburger.click();
    await waitState(true);
    await page.setViewportSize({ width: 1080, height: 900 });
    await waitState(false, true);
    assert.equal(await hamburger.isVisible(), false);
    assert.equal(await wrapper.evaluate(el => el.inert), false);
    await parent.locator('.gnl_link-02').hover();
    await page.waitForFunction(() => document.querySelector('.gnl_button-02').getAttribute('aria-expanded') === 'true');
    assert.notEqual(await wrapper.evaluate(el => getComputedStyle(el).clipPath), 'none');
    await page.setViewportSize({ width: 1079, height: 900 });
    await waitState(false);
    assert.equal(await hamburger.isVisible(), true);
    await page.setViewportSize({ width: 768, height: 900 });
    assert.equal(await footerWrapper.evaluate(el => el.inert), false);
    await page.setViewportSize({ width: 767, height: 900 });
    await page.waitForFunction(() => document.querySelector('.gfl_wrapper-02').inert);
    await footerButton.focus();
    await page.keyboard.press('Enter');
    assert.equal(await footerButton.getAttribute('aria-expanded'), 'true');
    assert.equal(await footerWrapper.evaluate(el => el.inert), false);
    await page.keyboard.press('Enter');
    assert.equal(await footerButton.getAttribute('aria-expanded'), 'false');
    assert.equal(await footerWrapper.evaluate(el => el.inert), true);
    await page.screenshot({ path: 'form-qa-results/nav-' + engineName + '-767.png', fullPage: true });
    // Mobile long text: check real text box, not only absence of a page scrollbar.
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await waitState(false);
      await hamburger.click();
      await waitState(true);
      if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
      const geometry = await parent.evaluate(el => {
        const link = el.querySelector('.gnl_link-02');
        const toggle = el.querySelector('.gnl_button-02');
        const child = el.querySelector('.gnl_wrapper-02 li:last-child a');
        const label = child.querySelector('span');
        const range = document.createRange();
        range.selectNodeContents(label);
        const rects = Array.from(range.getClientRects());
        const row = child.getBoundingClientRect();
        return {
          parentRight: link.getBoundingClientRect().right,
          buttonLeft: toggle.getBoundingClientRect().left,
          childLines: rects.length,
          textFits: rects.every(rect => rect.left >= row.left - 1 && rect.right <= row.right + 1),
          navFits: document.getElementById('global_navigation').scrollWidth <= window.innerWidth + 1
        };
      });
      assert.ok(geometry.parentRight <= geometry.buttonLeft + 1, 'parent/toggle overlap');
      assert.ok(geometry.childLines >= 2 && geometry.textFits && geometry.navFits, JSON.stringify(geometry));
      await page.screenshot({ path: 'form-qa-results/nav-' + engineName + '-' + width + '-long.png' });
      await hamburger.click();
      await waitState(false);
      console.log(JSON.stringify({ engine: engineName, width, longMenu: 'PASS', ...geometry }));
    }
    assert.deepEqual(errors, [], 'uncaught JS errors');
    console.log(JSON.stringify({ engine: engineName, navigationRuntime: 'PASS', keyboard: true, scrollRestore: true, resize: [1080, 1079, 768, 767], footer: true }));
    // Touch-enabled context, real Playwright taps, actual WP menu links.
    const touch = await browser.newPage({ viewport: { width: 1380, height: 900 }, hasTouch: true, reducedMotion: 'reduce' });
    await touch.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
    await touch.goto(url, { waitUntil: 'load' });
    // Report an unavailable browser capability separately from a site failure.
    // Never override navigator.maxTouchPoints or mark unsupported touch as PASS.
    await touch.waitForFunction(() => window.jQuery?.isReady);
    const capabilities = await touch.evaluate(() => ({
      maxTouchPoints: navigator.maxTouchPoints,
      touchEvent: 'ontouchstart' in window,
      coarse: matchMedia('(any-pointer: coarse)').matches
    }));
    console.log(JSON.stringify({ engine: engineName, touchCapabilities: capabilities }));
    if (capabilities.maxTouchPoints === 0 && engineName === 'firefox') {
      console.log(JSON.stringify({ engine: engineName, touchMenu: 'DEFERRED_ENV', reason: 'requested hasTouch but navigator.maxTouchPoints is zero' }));
      await touch.close();
      continue;
    }
    assert.ok(capabilities.maxTouchPoints > 0, 'touch capability required in this engine');
    await touch.waitForFunction(() => document.documentElement.classList.contains('_device-touch'));
    const parents = touch.locator('#global_navigation .gnl_item-02._hasChild');
    const first = parents.nth(0);
    const second = parents.nth(1);
    const firstLink = first.locator('.gnl_link-02');
    const secondLink = second.locator('.gnl_link-02');
    const touchOverlay = touch.locator('#overlay');
    let navigations = 0;
    touch.on('framenavigated', frame => { if (frame === touch.mainFrame()) navigations++; });
    await firstLink.tap();
    await touch.waitForFunction(() => document.querySelector('.gnl_item-02._hasChild').classList.contains('_touchOpen'));
    assert.equal(navigations, 0);
    assert.equal(await touchOverlay.evaluate(el => getComputedStyle(el).visibility), 'visible');
    await secondLink.tap();
    assert.equal(await first.evaluate(el => el.classList.contains('_touchOpen')), false);
    assert.equal(await second.evaluate(el => el.classList.contains('_touchOpen')), true);
    await touch.touchscreen.tap(10, 500);
    await touch.waitForFunction(() => !document.querySelector('._touchOpen') && !document.body.classList.contains('_open-bg'));
    await firstLink.tap();
    await touch.waitForFunction(() => document.body.classList.contains('_open-bg'));
    await touch.setViewportSize({ width: 375, height: 900 });
    await touch.waitForFunction(() => !document.querySelector('._touchOpen') && !document.body.classList.contains('_open-bg') && document.getElementById('global_navigation').inert);
    await touch.locator('#gh_menu').tap();
    await touch.waitForFunction(() => document.body.classList.contains('_open-menu'));
    await touch.locator('#gh_menu').tap();
    await touch.waitForFunction(() => !document.body.classList.contains('_open-menu'));
    await touch.setViewportSize({ width: 1380, height: 900 });
    await touch.waitForFunction(() => !document.getElementById('global_navigation').inert);
    await firstLink.tap();
    await touch.waitForFunction(() => document.body.classList.contains('_open-bg'));
    await Promise.all([touch.waitForNavigation({ waitUntil: 'load' }), firstLink.tap()]);
    assert.equal(navigations, 1);
    console.log(JSON.stringify({ engine: engineName, touchMenu: 'PASS', firstTap: 'open', secondTap: 'navigate', outside: 'close', resize: 'close' }));
    await touch.close();
  } finally {
    await browser.close();
  }
}
