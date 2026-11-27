import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.env.CSS_QA_MODULE_ROOT + '/package.json');
const { chromium, firefox, webkit } = require('playwright');
const url = new URL(process.argv[2]);
assert.equal(url.hostname, '127.0.0.1', 'disposable runtime only');
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
        const root = page.locator('.block-editor_wrap');
        assert.equal(await root.count(), 1);
        const headings = root.locator('h2.wp-block-heading, h3.wp-block-heading, h4.wp-block-heading');
        assert.equal(await headings.count(), 4);
        const metrics = await headings.evaluateAll(elements => elements.map(el => ({
          tag: el.tagName,
          font: getComputedStyle(el).fontSize,
          gap: el.nextElementSibling.getBoundingClientRect().top - el.getBoundingClientRect().bottom
        })));
        assert.deepEqual(metrics.map(item => item.font), width >= 768 ? ['30px', '24px', '18px', '30px'] : ['24px', '22px', '18px', '24px']);
        assert.deepEqual(metrics.map(item => Math.round(item.gap)), width >= 768 ? [40, 30, 20, 40] : [32, 24, 20, 32]);
        // Actual registered Core separator with adjoining native blocks.
        const separator = root.locator('#qa-parts-separator + hr.wp-block-separator');
        assert.equal(await separator.count(), 1);
        const separatorGeometry = await separator.evaluate(async el => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const next = el.nextElementSibling;
          const icon = new Image();
          // Decode the exact computed artwork, not an invented replacement.
          const artwork = style.backgroundImage.match(/url\(["']?([^"')]+)/)?.[1];
          if (!artwork) throw new Error('separator artwork missing');
          icon.src = artwork;
          await icon.decode();
          return {
            height: rect.height, width: rect.width,
            headingWidth: el.previousElementSibling.getBoundingClientRect().width,
            headingGap: rect.top - el.previousElementSibling.getBoundingClientRect().bottom,
            nextGap: next.getBoundingClientRect().top - rect.bottom,
            padding: [style.paddingTop, style.paddingBottom],
            margin: [style.marginTop, style.marginBottom],
            origin: style.backgroundOrigin, clip: style.backgroundClip,
            artwork, icon: [icon.naturalWidth, icon.naturalHeight],
            fits: next.scrollWidth <= next.clientWidth + 1
          };
        });
        const desktop = width >= 768;
        assert.ok(Math.abs(separatorGeometry.height - (desktop ? 65 : 81)) <= 1, JSON.stringify(separatorGeometry));
        assert.ok(Math.abs(separatorGeometry.width - separatorGeometry.headingWidth) <= 1, JSON.stringify(separatorGeometry));
        assert.ok(Math.abs(separatorGeometry.headingGap - (desktop ? 40 : 32)) <= 1 && separatorGeometry.nextGap >= 0, JSON.stringify(separatorGeometry));
        assert.deepEqual(separatorGeometry.padding, desktop ? ['25px', '23px'] : ['32px', '32px']);
        assert.deepEqual(separatorGeometry.margin, ['0px', '0px']);
        assert.ok(separatorGeometry.origin.split(',').every(value => value.trim() === 'content-box'));
        assert.ok(separatorGeometry.clip.split(',').every(value => value.trim() === 'content-box'));
        assert.match(separatorGeometry.artwork, /ico_blossom\.svg/);
        assert.ok(separatorGeometry.icon.every(value => value > 0) && separatorGeometry.fits);
        if (width === 375 || width === 1380) {
          await root.locator('#qa-parts-separator').scrollIntoViewIfNeeded();
          await page.screenshot({ path: 'form-qa-results/native-separator-' + engineName + '-' + width + '.png' });
        }
        console.log(JSON.stringify({ nativeSeparator: 'PASS', engine: engineName, width, separatorGeometry }));
        // QA-only destinations; inspect markup and styles without opening files.
        const inlineLinks = root.locator('#qa-parts-file-links a');
        assert.equal(await inlineLinks.count(), 6);
        await page.waitForFunction(() => document.querySelectorAll('#qa-parts-file-links [data-jwsnj-file-icon]').length === 2);
        const linkMetrics = await inlineLinks.evaluateAll(elements => elements.map(el => {
          const style = getComputedStyle(el);
          const icon = getComputedStyle(el, '::after');
          return {
            href: el.getAttribute('href'), target: el.getAttribute('target'),
            rel: (el.getAttribute('rel') || '').split(/\s+/).filter(Boolean),
            color: style.color, icon: icon.content, mask: icon.maskImage,
            wrap: style.overflowWrap, duration: style.transitionDuration
          };
        }));
        assert.deepEqual(linkMetrics.map(link => link.target), [null, '_blank', '_blank', '_blank', '_blank', '_blank']);
        assert.ok(linkMetrics[2].rel.includes('nofollow') && linkMetrics[2].rel.includes('noreferrer') && linkMetrics[2].rel.includes('external'));
        assert.ok(linkMetrics[3].rel.includes('noreferrer') && linkMetrics[3].rel.includes('external'));
        assert.ok(linkMetrics.every(link => link.color === 'rgb(236, 107, 97)' && link.wrap === 'anywhere'));
        assert.match(linkMetrics[1].mask, /ico-blank\.svg/);
        assert.equal(linkMetrics[2].icon, '"\uf1c1"');
        assert.equal(linkMetrics[3].icon, '"\uf15c"');
        assert.ok(linkMetrics.slice(2, 4).every(link => link.mask === 'none'));
        assert.ok(linkMetrics.slice(4).every(link => link.mask.includes('ico-blank.svg')));
        for (let i = 0; i < 6; i++) {
          await inlineLinks.nth(i).focus();
          assert.ok(await inlineLinks.nth(i).evaluate(el => el === document.activeElement));
        }
        if (width === 375 || width === 1380) {
          await root.locator('#qa-parts-file-links').scrollIntoViewIfNeeded();
          await page.screenshot({ path: 'form-qa-results/native-file-links-' + engineName + '-' + width + '.png' });
        }
        console.log(JSON.stringify({ nativeFileLinks: 'PASS', engine: engineName, width, linkMetrics }));
        const lists = root.locator('ul.wp-block-list, ol.wp-block-list');
        assert.equal(await lists.count(), 4);
        assert.equal(await root.locator('ol.wp-block-list').getAttribute('start'), '10');
        assert.equal(await root.locator('ul.annotation-list').count(), 1);
        const buttons = root.locator('.wp-block-button__link');
        assert.equal(await buttons.count(), 2);
        await page.waitForFunction(el => el.getAttribute('data-jwsnj-file-icon') === 'pdf', await buttons.nth(1).elementHandle());
        assert.equal(await buttons.nth(1).evaluate(el => getComputedStyle(el, '::after').content), '"\uf1c1"');
        const fitting = await buttons.evaluateAll(elements => elements.every(el => {
          const host = el.closest('.wp-block-buttons').getBoundingClientRect();
          const rect = el.getBoundingClientRect();
          return rect.left >= host.left - 1 && rect.right <= host.right + 1 && rect.height >= 49;
        }));
        assert.ok(fitting, 'native button fits containing block');
        const details = root.locator('details.wp-block-details');
        assert.equal(await details.count(), 3);
        const states = [];
        for (let i = 0; i < 3; i++) {
          const item = details.nth(i);
          const summary = item.locator(':scope > summary.wp-block-details__summary');
          const body = item.locator(':scope > .wp-block-details__content');
          assert.equal(await summary.count(), 1);
          assert.equal(await body.locator('.wp-block-details__inner').count(), 1);
          const read = () => item.evaluate(el => {
            const box = el.getBoundingClientRect();
            const next = el.nextElementSibling.getBoundingClientRect();
            const summary = el.querySelector('summary');
            const title = summary.querySelector('.wp-block-details__title');
            const rail = summary.querySelector('.wp-block-details__button').getBoundingClientRect();
            const text = title.getBoundingClientRect();
            const body = el.querySelector('.wp-block-details__content').getBoundingClientRect();
            return {
              open: el.open, height: box.height, following: next.top - box.top,
              followingGap: next.top - box.bottom, scrollY: window.scrollY,
              titleFits: text.left >= box.left - 1 && text.right <= rail.left + 1,
              bodyFits: body.left >= box.left - 1 && body.right <= box.right + 1 && body.bottom <= box.bottom + 1,
              summaryHeight: summary.getBoundingClientRect().height,
              focus: summary === document.activeElement
            };
          });
          await summary.scrollIntoViewIfNeeded();
          const closed = await read();
          assert.equal(closed.open, false);
          assert.ok(closed.titleFits && closed.summaryHeight >= 74, JSON.stringify(closed));
          await summary.focus();
          await page.keyboard.press('Enter');
          await page.waitForFunction(el => el.open, await item.elementHandle());
          const opened = await read();
          assert.ok(opened.open && opened.focus && opened.titleFits && opened.bodyFits, JSON.stringify(opened));
          assert.ok(opened.height > closed.height && opened.following > closed.following, 'expanded body remains in normal flow');
          assert.ok(Math.abs(opened.followingGap - closed.followingGap) <= 1, JSON.stringify({ closed, opened }));
          if (i === 0) {
            await page.keyboard.press('Tab');
            assert.equal(await body.locator('a').evaluate(el => el === document.activeElement), true, 'expanded link is keyboard reachable');
          }
          if (width === 375 || width === 1380) {
            await item.screenshot({ path: 'form-qa-results/native-parts-' + engineName + '-' + width + '-details-' + i + '-open.png' });
          }
          await summary.focus();
          await page.keyboard.press('Space');
          await page.waitForFunction(el => !el.open, await item.elementHandle());
          const restored = await read();
          assert.equal(restored.open, false);
          assert.ok(restored.focus && Math.abs(restored.height - closed.height) <= 1 && Math.abs(restored.following - closed.following) <= 1, JSON.stringify({ closed, restored }));
          if (i === 0) {
            await page.keyboard.press('Tab');
            assert.equal(await body.locator('a').evaluate(el => el === document.activeElement), false, 'closed link is not tabbable');
          }
          states.push({ index: i, closed: closed.height, opened: opened.height, restored: restored.height });
        }
        // Native details state changes immediately, the intrinsic body must
        // occupy intermediate heights before either transition completes.
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        for (let i = 0; i < 3; i++) {
          const item = details.nth(i);
          const summary = item.locator(':scope > summary');
          const body = item.locator(':scope > .wp-block-details__content');
          const height = () => item.evaluate(el => el.getBoundingClientRect().height);
          const readMotion = () => item.evaluate(el => {
            const summary = el.querySelector(':scope > summary');
            const panel = el.querySelector(':scope > .wp-block-details__content');
            return {
              height: el.getBoundingClientRect().height,
              open: el.open, inert: panel.inert,
              focused: summary === document.activeElement,
              activeTag: document.activeElement?.tagName,
              activeInside: el.contains(document.activeElement),
              duration: getComputedStyle(el, '::details-content').transitionDuration,
              animations: el.getAnimations({ subtree: true }).map(a => ({
                state: a.playState, time: a.currentTime
              }))
            };
          });
          const supported = await item.evaluate(el => el.dataset.detailsMotion === 'true');
          assert.ok(supported, engineName + ' must support native motion in this CI browser');
          const durations = await item.evaluate(el => getComputedStyle(el, '::details-content').transitionDuration);
          assert.equal(durations, '0.3s, 0.3s');
          // Re-measure intrinsic endpoints immediately before each motion run.
          // Font/layout and scrollbars may have changed since the initial sweep.
          await page.emulateMedia({ reducedMotion: 'reduce' });
          const closed = await height();
          await summary.evaluate(el => el.click());
          await page.waitForFunction(el => el.open, await item.elementHandle());
          const expanded = await height();
          assert.ok(expanded > closed + 4, JSON.stringify({ engineName, width, i, closed, expanded }));
          await summary.evaluate(el => el.click());
          await page.waitForFunction(el => !el.open, await item.elementHandle());
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const intermediate = async (from, to) => {
            await page.waitForFunction(({ el, from, to }) => {
              const h = el.getBoundingClientRect().height;
              return h > Math.min(from, to) + 2 && h < Math.max(from, to) - 2;
            }, { el: await item.elementHandle(), from, to }, { timeout: 1000 });
          };
          const settled = async target => {
            try {
              await page.waitForFunction(({ el, target }) => Math.abs(el.getBoundingClientRect().height - target) <= 1,
                { el: await item.elementHandle(), target }, { timeout: 3000 });
            } catch (error) {
              console.error(JSON.stringify({ engineName, width, i, target, actual: await readMotion() }));
              throw error;
            }
          };
          // A near-end height is not a settled transition: WebKit can reverse
          // content-visibility while the opening transition is still running.
          // Record the real opening input time and require the authored duration
          // plus stable frames before exercising the ordinary closing contract.
          await item.evaluate(el => {
            el.addEventListener('keydown', () => {
              el.dataset.qaMotionStart = String(performance.now());
            }, { capture: true, once: true });
          });
          await summary.focus();
          await page.keyboard.press('Enter');
          await intermediate(closed, expanded);
          await settled(expanded);
          await item.evaluate(el => new Promise(resolve => {
            const start = Number(el.dataset.qaMotionStart);
            const duration = Math.max(...getComputedStyle(el, '::details-content').transitionDuration.split(',').map(value => {
              const v = value.trim();
              return parseFloat(v) * (v.endsWith('ms') ? 1 : 1000);
            }));
            let stable = 0;
            let last = NaN;
            const frame = now => {
              const height = el.getBoundingClientRect().height;
              stable = Math.abs(last - height) < 0.1 ? stable + 1 : 0;
              last = height;
              if (now - start >= duration && stable >= 2) {
                delete el.dataset.qaMotionStart;
                resolve();
              } else requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
          }));
          assert.equal(await item.evaluate(el => el.open), true);
          if (i === 0) await body.locator('a').focus();
          else await summary.focus();
          // Arm the sampler before pressing Escape. A driver round trip can
          // otherwise miss the entire 300ms transition on a busy runner.
          const samples = await item.evaluateHandle(el => {
            const panel = el.querySelector(':scope > .wp-block-details__content');
            const summary = el.querySelector(':scope > summary');
            const frames = [];
            const trace = { frames, done: false, before: {
              height: el.getBoundingClientRect().height, open: el.open,
              inert: panel.inert, focused: summary === document.activeElement,
              activeTag: document.activeElement?.tagName,
              activeInside: el.contains(document.activeElement)
            } };
            el.addEventListener('keydown', event => {
              if (event.key !== 'Escape') return;
              const start = performance.now();
              const sample = () => {
                frames.push({
                  ms: performance.now() - start,
                  height: el.getBoundingClientRect().height,
                  open: el.open, inert: panel.inert,
                  focused: summary === document.activeElement
                });
                if (performance.now() - start < 600) requestAnimationFrame(sample);
                else trace.done = true;
              };
              requestAnimationFrame(sample);
            }, { capture: true, once: true });
            return trace;
          });
          await page.keyboard.press('Escape');
          try {
            await page.waitForFunction(({ trace, from, to }) => trace.frames.some(frame =>
              frame.height > to + 2 && frame.height < from - 2 &&
              !frame.open && frame.inert && frame.focused
            ), { trace: samples, from: expanded, to: closed }, { timeout: 1000 });
          } catch (error) {
            console.error(JSON.stringify({ engineName, width, i, closed, expanded,
              closeTrace: await samples.evaluate(trace => ({ before: trace.before, frames: trace.frames, done: trace.done })), actual: await readMotion() }));
            throw error;
          } finally {
            await samples.dispose();
          }
          if (i === 0) {
            await page.keyboard.press('Tab');
            assert.equal(await body.locator('a').evaluate(el => el === document.activeElement), false);
          }
          await settled(closed);
          await page.waitForFunction(el => !el.inert, await body.elementHandle());
          // Reverse while in flight; separately verify the real closed state
          // (the previous same-task double click could coalesce native toggles).
          // Keep the ordinary closing intermediate-height assertion above.

          await summary.evaluate(el => el.click());
          await intermediate(closed, expanded);
          await summary.evaluate(el => el.click());
          await page.waitForFunction(el => !el.open, await item.elementHandle());
          const reversed = await readMotion();
          console.log(JSON.stringify({ nativeDetailsReverseTrace: true, engineName, width, i, reversed }));
          await summary.evaluate(el => el.click());
          await settled(expanded);
          assert.equal(await item.evaluate(el => el.open), true);
          assert.equal(await body.evaluate(el => el.inert), false);
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await summary.evaluate(el => el.click());
          await settled(closed);
          assert.equal(await item.evaluate(el => el.open), false);
          assert.equal(await item.evaluate(el => getComputedStyle(el, '::details-content').transitionDuration), '0s');
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          console.log(JSON.stringify({ nativeDetailsMotion: 'PASS', engine: engineName, width, index: i, closed, expanded }));
        }
        if (width === 375 || width === 1380) {
          await root.screenshot({ path: 'form-qa-results/native-parts-' + engineName + '-' + width + '-closed.png' });
        }
        // Core viewport visibility is independent of the Theme's 768px breakpoint.
        // Reuse the same live document when resizing; no synthetic CSS or reload.
        if (width === 1380) {
          const labels = ["これはデスクトップで非表示（タブレット、モバイルでは表示）","これはタブレットで非表示（モバイル、デスクトップでは表示）","これはモバイルで非表示（タブレット、デスクトップでは表示）","これはモバイル、タブレットで非表示（デスクトップでは表示）"];
          const hidden = [['desktop'], ['tablet'], ['mobile'], ['tablet', 'mobile']];
          for (const probeWidth of [375, 480, 481, 767, 768, 782, 783, 1023, 1024, 1380]) {
            await page.setViewportSize({ width: probeWidth, height: 900 });
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const device = probeWidth <= 480 ? 'mobile' : probeWidth <= 782 ? 'tablet' : 'desktop';
            // Capture the actual native style output, CSSOM and media-query state.
            // Do not infer the cause from a single computed display failure.
            const visibilityDiagnostics = await page.evaluate(() => {
              const rules = [];
              const visit = (list, parents = []) => {
                for (const rule of list) {
                  if (rule.selectorText?.includes('wp-block-hidden-')) {
                    rules.push({ selector: rule.selectorText, css: rule.cssText, parents });
                  }
                  if (rule.cssRules) visit(rule.cssRules, [...parents, rule.conditionText || rule.cssText.slice(0, 100)]);
                }
              };
              for (const sheet of document.styleSheets) {
                try { visit(sheet.cssRules); } catch (error) { /* cross-origin stylesheet */ }
              }
              return {
                innerWidth, clientWidth: document.documentElement.clientWidth,
                media: ['(width <= 480px)', '(480px < width <= 782px)', '(width > 782px)'].map(query => [query, matchMedia(query).matches]),
                styles: [...document.querySelectorAll('style')].filter(el => el.textContent.includes('wp-block-hidden-')).map(el => ({ id: el.id, text: el.textContent.slice(0, 12000) })),
                rules
              };
            });
            console.log(JSON.stringify({ nativeViewportDiagnostic: true, engine: engineName, probeWidth, ...visibilityDiagnostics }));
            const observed = [];
            for (let i = 0; i < labels.length; i++) {
              const paragraph = root.getByText(labels[i], { exact: true });
              assert.equal(await paragraph.count(), 1);
              const geometry = await paragraph.evaluate(el => ({
                classes: [...el.classList].filter(name => name.startsWith('wp-block-hidden-')).sort(),
                display: getComputedStyle(el).display,
                boxes: el.getClientRects().length,
                height: el.getBoundingClientRect().height
              }));
              const expectedHidden = hidden[i].includes(device);
              assert.deepEqual(geometry.classes, hidden[i].map(name => 'wp-block-hidden-' + name).sort());
              assert.equal(geometry.display === 'none', expectedHidden, JSON.stringify({ engineName, probeWidth, i, geometry }));
              assert.equal(geometry.boxes === 0 && geometry.height === 0, expectedHidden);
              assert.equal(await paragraph.isVisible(), !expectedHidden);
              observed.push({ label: i, ...geometry });
            }
            if (probeWidth === 375 || probeWidth === 1380) {
              await root.getByText(labels[probeWidth === 375 ? 0 : 3], { exact: true }).scrollIntoViewIfNeeded();
              await page.screenshot({ path: 'form-qa-results/native-visibility-' + engineName + '-' + probeWidth + '.png' });
            }
            console.log(JSON.stringify({ nativeViewportVisibility: 'PASS', engine: engineName, width: probeWidth, device, observed }));
          }
        }
        console.log(JSON.stringify({ nativePartsFrontend: 'PASS', engine: engineName, width, headings: metrics, details: states }));
      } catch (error) {
        await page.screenshot({ path: 'form-qa-results/native-parts-failure-' + engineName + '-' + width + '.png' }).catch(() => {});
        throw error;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
