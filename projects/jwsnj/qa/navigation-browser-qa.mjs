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
    const closeGeometry = await hamburger.evaluate(el => {
      const icon = el.querySelector('.icon');
      const label = el.querySelector('.text');
      const box = el.getBoundingClientRect();
      const cross = icon.getBoundingClientRect();
      const style = getComputedStyle(el);
      const before = getComputedStyle(icon, '::before');
      const after = getComputedStyle(icon, '::after');
      const angles = [before, after].map(stroke => {
        const matrix = new DOMMatrix(stroke.transform);
        return Math.round(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI);
      });
      return {
        button: [box.width, box.height],
        stroke: [parseFloat(before.width), parseFloat(before.height)],
        centered: Math.abs(box.x + box.width / 2 - cross.x - cross.width / 2) <= 1 &&
          Math.abs(box.y + box.height / 2 - cross.y - cross.height / 2) <= 1,
        background: style.backgroundColor,
        strokeColors: [before.backgroundColor, after.backgroundColor],
        focus: style.outlineColor,
        focusStyle: style.outlineStyle,
        label: getComputedStyle(label).display,
        angles
      };
    });
    assert.ok(closeGeometry.button.every(value => Math.abs(value - 60) <= 1), JSON.stringify(closeGeometry));
    assert.ok(Math.abs(closeGeometry.stroke[0] - 24) <= 1 && Math.abs(closeGeometry.stroke[1] - 1.5) <= 0.25);
    assert.equal(closeGeometry.centered, true);
    assert.equal(closeGeometry.background, 'rgb(40, 172, 95)');
    assert.deepEqual(closeGeometry.strokeColors, ['rgb(255, 255, 255)', 'rgb(255, 255, 255)']);
    assert.equal(closeGeometry.focus, 'rgb(255, 255, 255)');
    assert.equal(closeGeometry.focusStyle, 'solid');
    assert.equal(closeGeometry.label, 'none');
    assert.deepEqual(closeGeometry.angles, [45, -45]);
    await hamburger.screenshot({ path: 'form-qa-results/nav-' + engineName + '-close-control.png' });
    console.log(JSON.stringify({ engine: engineName, closeControl: 'PASS', ...closeGeometry }));
    await button.focus();
    await page.keyboard.press('Space');
    assert.equal(await button.getAttribute('aria-expanded'), 'true');
    assert.equal(await wrapper.evaluate(el => el.inert), false);
    await child.focus();
    assert.equal(await child.evaluate(el => document.activeElement === el), true);
    await page.keyboard.press('Escape');
    await waitState(false);
    assert.equal(await hamburger.evaluate(el => document.activeElement === el), true);
    assert.notEqual(await hamburger.locator('.text').evaluate(el => getComputedStyle(el).display), 'none');
    await page.waitForFunction(y => Math.abs(window.scrollY - y) <= 2, scroll);
    await hamburger.click();
    await waitState(true);
    await page.locator('#gn_close').click();
    await waitState(false);
    // Cross the actual CSS/JS breakpoint with the SP submenu explicitly collapsed.
    await hamburger.click();
    await waitState(true);
    if (await button.getAttribute('aria-expanded') === 'true') await button.click();
    assert.equal(await parent.getAttribute('data-open'), 'false');
    assert.equal(await wrapper.evaluate(el => el.inert), true);
    await page.setViewportSize({ width: 1080, height: 900 });
    await waitState(false, true);
    assert.equal(await hamburger.isVisible(), false);
    assert.equal(await wrapper.evaluate(el => el.inert), false);
    const desktopLink = parent.locator('.gnl_link-02').first();
    const arrow = desktopLink.locator('.gnl_arrow');
    const arrowGlyph = () => arrow.evaluate(el => getComputedStyle(el, '::before').content);
    assert.equal(await arrow.getAttribute('aria-hidden'), 'true');
    const iconFaces = await page.evaluate(async () => (await document.fonts.load('400 14px "Font Awesome 6 Pro"', String.fromCodePoint(0xf107, 0xf106))).map(font => font.status));
    assert.ok(iconFaces.length > 0 && iconFaces.every(status => status === 'loaded'), 'actual bundled FA Regular must load');
    assert.equal(await nav.locator('.gnl_item-02._noChild .gnl_arrow').count(), 0);
    for (const width of [1080, 1380]) {
      await page.setViewportSize({ width, height: 900 });
      // The legacy full-width flyout can cover the page body. Move into the header's left padding instead.
      await page.mouse.move(1, 1);
      await page.evaluate(() => document.activeElement?.blur());
      await page.waitForFunction(() => {
        const item = document.querySelector('.gnl_item-02._hasChild');
        return !item.matches(':hover, :focus-within') &&
          getComputedStyle(item.querySelector('.gnl_arrow'), '::before').content.includes(String.fromCodePoint(0xf107));
      });
      const typography = await desktopLink.evaluate(el => {
        const style = getComputedStyle(el);
        const icon = el.querySelector('.gnl_arrow');
        const iconStyle = getComputedStyle(icon);
        const label = el.querySelector('span');
        return {
          size: style.fontSize, weight: style.fontWeight, lineHeight: style.lineHeight,
          family: style.fontFamily, gap: style.columnGap, tracking: style.letterSpacing,
          iconSize: iconStyle.fontSize, iconWeight: iconStyle.fontWeight, iconFamily: iconStyle.fontFamily,
          noOverlap: label.getBoundingClientRect().right <= icon.getBoundingClientRect().left + 1
        };
      });
      assert.deepEqual([typography.size, typography.weight, typography.lineHeight, typography.gap], ['15px', '500', '22.5px', '8px']);
      assert.match(typography.family, /Zen Kaku Gothic New/);
      assert.match(typography.iconFamily, /Font Awesome 6 Pro/);
      assert.deepEqual([typography.iconSize, typography.iconWeight], ['14px', '400']);
      assert.equal(typography.noOverlap, true);
      await desktopLink.hover();
      await page.waitForFunction(() => document.querySelector('.gnl_button-02').getAttribute('aria-expanded') === 'true');
      assert.ok((await arrowGlyph()).includes(String.fromCodePoint(0xf106)));
      assert.equal(await desktopLink.evaluate(el => getComputedStyle(el).color), 'rgb(40, 172, 95)');
      assert.notEqual(await wrapper.evaluate(el => getComputedStyle(el).clipPath), 'none');
      const measureOpen = () => wrapper.evaluate(el => {
        const style = getComputedStyle(el);
        const panel = el.getBoundingClientRect();
        const links = [...el.querySelectorAll('a')];
        const rects = links.flatMap(link => {
          const range = document.createRange();
          range.selectNodeContents(link.querySelector('span'));
          return [...range.getClientRects()].map(rect => ({rect, link}));
        });
        return {
          duration: style.transitionDuration, track: style.gridTemplateRows,
          state: el.closest('.gnl_item-02').getAttribute('data-open'),
          lines: rects.length, panelHeight: panel.height,
          fullyHit: rects.length > 0 && rects.every(({rect, link}) =>
            rect.top >= panel.top - 1 && rect.bottom <= panel.bottom + 1 &&
            link.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)))
        };
      });
      const hovered = await measureOpen();
      assert.equal(hovered.duration, '0s', JSON.stringify(hovered));
      assert.equal(hovered.state, 'false');
      assert.ok(hovered.fullyHit, JSON.stringify(hovered));
      // The legacy full-width flyout can cover the page body. Move into the header's left padding instead.
      await page.mouse.move(1, 1);
      await desktopLink.focus();
      assert.ok((await arrowGlyph()).includes(String.fromCodePoint(0xf106)));
      const focused = await measureOpen();
      assert.equal(focused.duration, '0s');
      assert.ok(focused.fullyHit, JSON.stringify(focused));
      await page.screenshot({ path: 'form-qa-results/nav-' + engineName + '-' + width + '-parent.png' });
      console.log(JSON.stringify({ engine: engineName, width, desktopParent: 'PASS', ...typography, hovered, focused }));
    }
    // Figma PC344:900/SP442:2764: actual theme CSS on native heading/paragraph markup.
    for (const width of [375, 768, 1380]) {
      await page.setViewportSize({ width, height: 900 });
      const headingSpacing = await page.evaluate(() => {
        const fixture = document.createElement('div');
        fixture.className = 'block-editor_wrap';
        fixture.style.cssText = 'width:min(calc(100% - 40px),960px);margin-inline:auto';
        document.body.append(fixture);
        const data = [];
        for (const display of ['flow-root', 'flex']) {
          const group = document.createElement('div');
          group.style.cssText = 'display:' + display + ';flex-direction:column';
          group.innerHTML = '<h2 class="wp-block-heading">長い大見出し 長い大見出し Long editable heading</h2><p class="wp-block-paragraph">本文</p><h3 class="wp-block-heading">中見出し</h3><p>本文</p><h4 class="wp-block-heading">小見出し</h4><p class="wp-block-paragraph">本文</p>';
          fixture.append(group);
          for (const heading of group.querySelectorAll('h2,h3,h4')) {
            const p = heading.nextElementSibling;
            data.push({display, tag:heading.tagName, gap:p.getBoundingClientRect().top - heading.getBoundingClientRect().bottom, font:getComputedStyle(heading).fontSize, paragraphTop:getComputedStyle(p).marginTop});
          }
        }
        fixture.id = 'heading-spacing-qa';
        return data;
      });
      const expected = width < 768 ? {H2:32,H3:24,H4:20} : {H2:40,H3:30,H4:20};
      for (const item of headingSpacing) {
        assert.ok(Math.abs(item.gap - expected[item.tag]) <= 1, JSON.stringify(item));
        assert.equal(item.paragraphTop, '0px');
      }
      if (width !== 768) await page.locator('#heading-spacing-qa').screenshot({path:'form-qa-results/nav-' + engineName + '-' + width + '-heading-spacing.png'});
      await page.locator('#heading-spacing-qa').evaluate(el => el.remove());
      console.log(JSON.stringify({engine:engineName,width,headingSpacing:'PASS',data:headingSpacing}));
    }
    // Actual WordPress menu with a long label in a short desktop viewport.
    for (const width of [1080, 1380]) {
      await page.setViewportSize({ width, height: 240 });
      await page.mouse.move(1, 1);
      await desktopLink.focus();
      const inner = wrapper.locator('.gnl_inner-02');
      // Extend only this disposable fixture's last label to exercise overflowing CMS content.
      const last = inner.locator('a').last();
      const label = last.locator('span').first();
      const original = await label.textContent();
      await label.evaluate(el => { el.textContent = (el.textContent + ' 長いメニュー項目 Long editable menu label ').repeat(12); });
      const size = await inner.evaluate(el => ({
        scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
        top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom,
        overflow: getComputedStyle(el).overflowY
      }));
      assert.equal(size.overflow, 'auto');
      assert.ok(size.scrollHeight > size.clientHeight && size.bottom <= 241, JSON.stringify(size));
      await last.focus();
      await inner.evaluate(el => { el.scrollTop = el.scrollHeight; });
      const reachable = await last.evaluate(el => {
        const panel = el.closest('.gnl_inner-02');
        const box = panel.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(el.querySelector('span'));
        const rects = [...range.getClientRects()];
        const final = rects.at(-1);
        return {
          scrollTop: panel.scrollTop,
          focused: document.activeElement === el,
          finalHit: !!final && final.bottom <= box.bottom + 1 &&
            el.contains(document.elementFromPoint(final.left + final.width / 2, final.top + final.height / 2))
        };
      });
      assert.ok(reachable.scrollTop > 0 && reachable.focused && reachable.finalHit, JSON.stringify(reachable));
      await page.screenshot({ path: 'form-qa-results/nav-' + engineName + '-' + width + '-short-flyout.png' });
      await label.evaluate((el, text) => { el.textContent = text; }, original);
      await inner.evaluate(el => { el.scrollTop = 0; });
      console.log(JSON.stringify({ engine: engineName, width, shortDesktopFlyout: 'PASS', size, reachable }));
    }
    await page.setViewportSize({ width: 1079, height: 900 });
    await waitState(false);
    assert.equal(await hamburger.isVisible(), true);
    assert.equal(await arrow.evaluate(el => getComputedStyle(el).display), 'none');
    // Check the responsive WP page first; explicitly reproduce the remaining legacy
    // body min-width policy on this disposable fixture for the horizontal-scroll cases.
    for (const [width, legacyWidth] of [[375, false], [900, false], [1079, false], [900, true], [1079, true]]) {
      await page.setViewportSize({ width, height: 900 });
      await waitState(false);
      await page.evaluate(legacy => {
        if (legacy) document.body.style.minWidth = '1280px';
        else document.body.style.removeProperty('min-width');
      }, legacyWidth);
      const geometry = () => page.evaluate(() => {
        const header = document.getElementById('global_header').getBoundingClientRect();
        const body = document.body.getBoundingClientRect();
        return {
          x: window.scrollX, y: window.scrollY,
          bodyLeft: body.left, bodyTop: body.top, bodyWidth: body.width,
          headerLeft: header.left, headerRight: header.right,
          viewport: window.innerWidth, client: document.documentElement.clientWidth,
          gutter: getComputedStyle(document.documentElement).scrollbarGutter
        };
      });
      await page.evaluate(() => window.scrollTo(120, 400));
      await page.waitForFunction(() => window.scrollY > 100);
      const before = await geometry();
      if (legacyWidth) assert.ok(before.x > 0, JSON.stringify(before));
      await hamburger.evaluate(el => el.focus({ preventScroll: true }));
      await page.keyboard.press('Enter');
      await waitState(true);
      const opened = await geometry();
      assert.ok(Math.abs(opened.bodyLeft - before.bodyLeft) <= 2, JSON.stringify({before, opened}));
      assert.ok(Math.abs(opened.bodyTop - before.bodyTop) <= 2, JSON.stringify({before, opened}));
      assert.ok(Math.abs(opened.headerRight - before.headerRight) <= 2, JSON.stringify({before, opened}));
      await page.keyboard.press('Escape');
      await waitState(false);
      await page.waitForFunction(({x,y}) => Math.abs(window.scrollX - x) <= 2 && Math.abs(window.scrollY - y) <= 2, before);
      const after = await geometry();
      assert.ok(Math.abs(after.bodyLeft - before.bodyLeft) <= 2 && Math.abs(after.bodyWidth - before.bodyWidth) <= 2);
      console.log(JSON.stringify({engine: engineName, width, legacyWidth, scrollLockGeometry: 'PASS', before, opened, after}));
    }
    await page.evaluate(() => { document.body.style.removeProperty('min-width'); window.scrollTo(0, 400); });
    // Desktop footer is always expanded, including a previously collapsed mobile branch.
    await page.setViewportSize({ width: 767, height: 900 });
    await footerButton.scrollIntoViewIfNeeded();
    if (await footerButton.getAttribute('aria-expanded') !== 'true') await footerButton.click();
    await footerButton.click();
    assert.equal(await footer.getAttribute('data-open'), 'false');
    assert.equal(await footerWrapper.evaluate(el => el.inert), true);
    assert.ok(await footerWrapper.evaluate(el => el.getBoundingClientRect().height <= 1));
    for (const width of [768, 1080, 1380]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(() => !document.querySelector('.gfl_wrapper-02').inert);
      const geometry = await footer.evaluate(el => {
        const wrapper = el.querySelector('.gfl_wrapper-02');
        const panel = wrapper.getBoundingClientRect();
        const links = [...wrapper.querySelectorAll('a')];
        const buttons = [...el.querySelectorAll('button')];
        return {
          height: panel.height,
          duration: getComputedStyle(wrapper).transitionDuration,
          links: links.length,
          allInside: links.every(link => {
            const box = link.getBoundingClientRect();
            return box.height > 0 && box.top >= panel.top - 1 && box.bottom <= panel.bottom + 1;
          }),
          buttonsHidden: buttons.every(button => getComputedStyle(button).display === 'none')
        };
      });
      assert.ok(geometry.height > 0 && geometry.links > 0 && geometry.allInside && geometry.buttonsHidden, JSON.stringify(geometry));
      assert.equal(geometry.duration, '0s');
      console.log(JSON.stringify({engine: engineName, width, footerDesktop: 'PASS', ...geometry}));
    }
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
    // Figma category overlay, actual WordPress category route and real CSS/JS.
    await page.goto(new URL('/?cat=1', url).href, { waitUntil: 'load' });
    const filter = page.locator('.jwsnj_newsArchive_filterMenu');
    const summary = filter.locator('summary');
    const options = filter.locator('ul');
    await page.waitForFunction(() => document.querySelector('.jwsnj_newsArchive_filterMenu')?.dataset.motion === 'true');
    assert.equal(await page.locator('#global_navigation form[role="search"]').count(), 0);
    for (const width of [375, 768, 1380]) {
      await page.setViewportSize({width, height: 900});
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await summary.scrollIntoViewIfNeeded();
      const measure = () => filter.evaluate(el => ({
        top: el.closest('.jwsnj_newsArchive_filter').nextElementSibling.getBoundingClientRect().top + window.scrollY,
        height: document.documentElement.scrollHeight,
        width: el.getBoundingClientRect().width,
        position: getComputedStyle(el.querySelector('ul')).position
      }));
      const before = await measure();
      await summary.focus();
      await page.keyboard.press('Enter');
      assert.equal(await summary.getAttribute('aria-expanded'), 'true');
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.jwsnj_newsArchive_filterMenu ul')).opacity === '1');
      const opened = await measure();
      assert.deepEqual(opened, before);
      assert.equal(opened.position, 'absolute');
      assert.equal(await options.evaluate(el => getComputedStyle(el).transitionDuration), '0.3s, 0.3s');
      await options.locator('a').first().focus();
      await page.keyboard.press('Escape');
      assert.equal(await summary.getAttribute('aria-expanded'), 'false');
      assert.equal(await options.evaluate(el => el.inert), true);
      assert.equal(await summary.evaluate(el => el === document.activeElement), true);
      await page.waitForFunction(() => !document.querySelector('.jwsnj_newsArchive_filterMenu').open);
      assert.deepEqual(await measure(), before);
      await summary.click();
      await summary.click();
      await summary.click();
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.jwsnj_newsArchive_filterMenu ul')).opacity === '1');
      assert.equal(await summary.getAttribute('aria-expanded'), 'true');
      await page.screenshot({path:'form-qa-results/news-' + engineName + '-' + width + '-category.png'});
      await page.locator('.jwsnj_newsArchive_filterLabel').click();
      await page.waitForFunction(() => !document.querySelector('.jwsnj_newsArchive_filterMenu').open);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await summary.click();
      await summary.click();
      assert.equal(await filter.evaluate(el => el.open), false);
      console.log(JSON.stringify({engine:engineName,width,newsCategoryOverlay:'PASS',before,opened}));
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
    if (capabilities.maxTouchPoints === 0 && ['firefox', 'webkit'].includes(engineName)) {
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
