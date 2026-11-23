// Footer contract checks: only the approved WordPress Footer sitemap menu renders.
// Run: node --test projects/jwsnj/tests/footer-menu-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const footer = readFileSync(new URL('../theme/template-parts/_footer.php', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../theme/inc/menu.php', import.meta.url), 'utf8');
const css = readFileSync(new URL('../theme/css/layout/global_footer.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../theme/js/common.js', import.meta.url), 'utf8');

test('footer has one accessible sitemap landmark using footer-nav', () => {
  assert.equal((footer.match(/wp_nav_menu\s*\(/g) || []).length, 1);
  assert.match(footer, /<nav\s+class="gf_menu"\s+aria-label="フッターナビゲーション">/);
  assert.doesNotMatch(footer, /'menu'\s*=>/); // WordPress admin location mapping owns selection.
  assert.match(footer, /'theme_location'\s*=>\s*'footer-nav'/);
  assert.match(footer, /'fallback_cb'\s*=>\s*false/);
  assert.match(footer, /'walker'\s*=>\s*new Custom_Footer_Walker_Nav_Menu\(\)/);
  assert.match(footer, /<\/nav>/);
  assert.match(menu, /'footer-nav'\s*=>/);
});

test('footer does not duplicate header-specific sub-navigation', () => {
  assert.doesNotMatch(footer, /gf_subMenu|gf_links-02|Custom_Footer_Sub_Walker_Nav_Menu/);
  assert.doesNotMatch(footer, /'theme_location'\s*=>\s*'sub-nav'/);
  assert.doesNotMatch(css, /\.gf_subMenu|\.gf_links-02/);
});

test('footer preserves safe WordPress site identity and page top', () => {
  assert.match(footer, /esc_url\(home_url\('\/'\)\)/);
  assert.match(footer, /esc_html\(get_bloginfo\('name'\)\)/);
  assert.match(footer, /id="js_gf_pageTop"/);
  assert.match(footer, /esc_html\(wp_date\('Y'\)\)/);
});


test('footer page-top link retains a readable name and visible keyboard focus', () => {
  // CSS hides the inner span, so the anchor itself must supply the accessible name.
  assert.match(footer, /<a href="#" aria-label="ページトップへ戻る"><span>ページトップへ戻る<\/span><\/a>/);
  const pageTop = css.slice(css.indexOf('.gf_pageTop {'), css.indexOf('@media (calc(768'));
  assert.match(pageTop, /&:focus-visible\s*\{/);
  assert.match(pageTop, /outline:\s*2px solid var\(--color-text\)/);
  assert.match(pageTop, /span\s*\{\s*display:\s*none;/);
});


test('footer page-top initializes visibility on restored scroll and avoids animation queues', () => {
  const match = source.match(/  const pageTop = function \(\) \{[\s\S]*?\n  \};/);
  assert.ok(match, 'pageTop implementation must exist');
  const simulate = (initialScrollY) => {
    const win = {};
    let currentScrollY = initialScrollY;
    let onScroll;
    let onPageShow;
    const calls = [];
    const control = {
      toggle(value) { calls.push(['toggle', value]); return this; },
      stop(clearQueue, jumpToEnd) { calls.push(['stop', clearQueue, jumpToEnd]); return this; },
      fadeIn() { calls.push(['fadeIn']); return this; },
      fadeOut() { calls.push(['fadeOut']); return this; },
    };
    const $ = (selector) => selector === win
      ? { scrollTop: () => currentScrollY, on(name, callback) {
        if (name === 'scroll') onScroll = callback;
        else if (name === 'pageshow') onPageShow = callback;
        else assert.fail('unexpected event: ' + name);
      } }
      : control;
    new Function('$', 'window', match[0] + '\npageTop();')($, win);
    return { calls, scrollTo(y) { currentScrollY = y; onScroll(); }, restoreTo(y) { currentScrollY = y; onPageShow(); } };
  };
  const top = simulate(0);
  assert.deepEqual(top.calls, [['toggle', false]]);
  top.scrollTo(100);
  assert.deepEqual(top.calls.slice(-2), [['stop', true, true], ['fadeIn']]);
  top.scrollTo(0);
  assert.deepEqual(top.calls.slice(-2), [['stop', true, true], ['fadeOut']]);
  const restored = simulate(420);
  assert.deepEqual(restored.calls, [['toggle', true]]);
  top.restoreTo(420);
  assert.deepEqual(top.calls.at(-1), ['toggle', true]);
});


test('Footer accordion buttons have visible focus without affecting layout', () => {
  const block = css.slice(css.indexOf('.gfl_button-02,'), css.indexOf('.gfl_wrapper-02,'));
  assert.match(block, /&:focus-visible\s*\{\s*outline: 2px solid var\(--color-primary\)/);
  assert.doesNotMatch(block, /white-space:\s*nowrap/);
});


test('Footer accordion transitions respect reduced-motion preference', () => {
  const block = css.slice(css.indexOf('/* Accessibility: do not animate accordion'), css.indexOf('/* MARK: hover */'));
  assert.match(block, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(block, /\.gfl_wrapper-02/);
  assert.match(block, /transition-duration: 0s/);
});
