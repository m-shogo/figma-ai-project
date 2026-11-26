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
    assert.deepEqual(errors, [], 'uncaught JS errors');
    console.log(JSON.stringify({ engine: engineName, navigationRuntime: 'PASS', keyboard: true, scrollRestore: true, resize: [1080, 1079, 768, 767], footer: true }));
  } finally {
    await browser.close();
  }
}
