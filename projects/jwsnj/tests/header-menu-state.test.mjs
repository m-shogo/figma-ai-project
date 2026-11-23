// Header menu regression checks for the current COMMON_UI_HEADER_FOOTER phase.
// Run: node --test projects/jwsnj/tests/header-menu-state.test.mjs
// No WordPress, DOM, third-party test library or external assets required.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const source = readFileSync(new URL('../theme/js/common.js', import.meta.url), 'utf8');
const headerCss = readFileSync(new URL('../theme/css/layout/global_header.css', import.meta.url), 'utf8');
const navigationCss = readFileSync(new URL('../theme/css/layout/global_navigation.css', import.meta.url), 'utf8');

test('Header script parses as JavaScript', () => {
  assert.doesNotThrow(() => new Script(source));
});

test('1080px is consistently desktop in CSS and JS', () => {
  assert.match(headerCss, /calc\(1080\s*\*/);
  assert.match(navigationCss, /calc\(1080\s*\*/);
  assert.match(source, /!isOpen && window\.innerWidth < headerBreakpointMin/);
  assert.match(source, /window\.innerWidth >= headerBreakpointMin/);
  assert.match(source, /currentWidth >= headerBreakpointMin/);
  assert.doesNotMatch(source, /currentWidth > headerBreakpointMin/);
});

test('closing the mobile menu releases the scroll lock on all close paths', () => {
  // Execute the actual contentFixed implementation with a minimal jQuery event stub.
  const match = source.match(/  const contentFixed = function \(\) \{[\s\S]*?\n  \};/);
  assert.ok(match, 'contentFixed implementation must exist');

  const listeners = new Map();
  const classes = new Set();
  const restoredScrollY = [];
  const win = { innerWidth: 1079, scrollTo: (_x, y) => restoredScrollY.push(y) };
  const doc = {};
  const body = {
    addClass(value) {
      value.split(' ').forEach((name) => classes.add(name));
      return this;
    },
    removeClass(value) {
      value.split(' ').forEach((name) => classes.delete(name));
      return this;
    },
    css() { return this; },
  };
  const $ = (selector) => {
    if (selector === 'body') return body;
    if (selector === win) {
      return {
        scrollTop: () => 133,
        on: (event, handler) => listeners.set('window:' + event, handler),
      };
    }
    const key = selector === doc ? 'document' : selector;
    return { on: (event, handler) => listeners.set(key + ':' + event, handler) };
  };
  const fire = (key, event = {}) => {
    const handler = listeners.get(key);
    assert.ok(handler, 'missing event handler: ' + key);
    handler(event);
  };

  new Function('$', 'window', 'document', match[0] + '\ncontentFixed();')($, win, doc);

  fire('#gh_menu:click');
  assert.equal(classes.has('_contentFixed'), true);
  fire('#gn_close, #gns_close, #overlay:click');
  assert.equal(classes.has('_contentFixed'), false);
  assert.equal(restoredScrollY.at(-1), 133);

  fire('#gh_menu:click');
  fire('document:keydown', { key: 'Escape' });
  assert.equal(classes.has('_contentFixed'), false);

  fire('window:load resize');
  fire('#gh_menu:click');
  win.innerWidth = 1080;
  fire('window:load resize');
  assert.equal(classes.has('_contentFixed'), false);

  // Reopening after a close must not inherit a stale lock state.
  fire('#gh_menu:click');
  assert.equal(classes.has('_contentFixed'), true);
  fire('#gn_close, #gns_close, #overlay:click');
  assert.equal(classes.has('_contentFixed'), false);
});

test('Header menus use registered WordPress locations without hard-coded menu names', () => {
  const header = readFileSync(new URL('../theme/template-parts/_header.php', import.meta.url), 'utf8');
  const registrations = readFileSync(new URL('../theme/inc/menu.php', import.meta.url), 'utf8');
  assert.equal(header.split('wp_nav_menu(').length - 1, 2);
  for (const location of ['global-nav', 'sub-nav']) {
    assert.ok(header.includes("'theme_location' => '" + location + "'"));
    assert.ok(registrations.includes("'" + location + "' =>"));
  }
  assert.equal(header.includes("'menu' =>"), false);
  assert.equal(header.split("'fallback_cb' => false").length - 1, 2);
  assert.ok(header.includes('Custom_Global_Walker_Nav_Menu'));
  assert.ok(header.includes('Custom_Header_Sub_Walker_Nav_Menu'));
});


test('mobile disclosure keeps accessibility state, focus restoration, and desktop navigation available', () => {
  const header = readFileSync(new URL('../theme/template-parts/_header.php', import.meta.url), 'utf8');
  assert.match(header, /<button[^>]*id="gh_menu"[^>]*aria-controls="global_navigation"[^>]*aria-expanded="false"/);
  assert.match(header, /<nav[^>]*id="global_navigation"[^>]*aria-label="グローバルナビゲーション"/);
  assert.match(header, /id="overlay"[^>]*aria-hidden="true"/);
  assert.match(source, /\$menuButton\.attr\('aria-expanded', String\(isOpen\)\)/);
  assert.match(source, /\$menuButton\.attr\('aria-label', isOpen \? 'メニューを閉じる' : 'メニューを開く'\)/);
  assert.match(source, /\$globalNavigation\.attr\('inert', !isOpen && window\.innerWidth < headerBreakpointMin \? '' : null\)/);
  assert.match(source, /if \(restoreFocus && wasOpen\) \$menuButton\.trigger\('focus'\)/);
  assert.match(source, /event\.key === 'Escape' && \$body\.hasClass\('_open-menu'\)/);
  assert.match(source, /closeMobileMenu\(true\)/);
});


test('Header and Footer WordPress disclosure buttons expose descriptive accessibility state', () => {
  const menu = readFileSync(new URL('../theme/inc/menu.php', import.meta.url), 'utf8');
  const global = menu.split('class Custom_Global_Walker_Nav_Menu')[1].split('class Custom_Header_Sub_Walker_Nav_Menu')[0];
  const footer = menu.split('class Custom_Footer_Walker_Nav_Menu')[1].split('class Custom_')[0];
  for (const walker of [global, footer]) {
    assert.match(walker, /type="button" aria-expanded="false" aria-label="/);
    assert.match(walker, /esc_attr\(\$title \. 'のサブメニューを開閉'\)/);
  }
  const disclosures = source.slice(source.indexOf('const globalNavItems ='), source.indexOf('const touchMegaMenuSupport ='));
  assert.equal(disclosures.split("itemButton.setAttribute('aria-expanded', String(item.getAttribute('data-open') === 'true'))").length - 1, 2);
  // Header click, Footer click, and shared PC hover/focus state reconciliation.
  assert.equal(disclosures.split("itemButton.setAttribute('aria-expanded', String(isOpen))").length - 1, 3);
  assert.equal(disclosures.split("item.setAttribute('data-open', String(isOpen))").length - 1, 2);
  assert.match(disclosures, /item\.addEventListener\('mouseenter', syncDesktopHoverState\)/);
  assert.match(disclosures, /item\.addEventListener\('mouseleave', syncDesktopHoverState\)/);
  assert.match(source, /if \(disclosure\) disclosure\.setAttribute\('aria-expanded', 'true'\)/);
  assert.match(source, /if \(button\) button\.setAttribute\('aria-expanded', String\(el\.getAttribute\('data-open'\) === 'true'\)\)/);
});


test('desktop mega-menu hover, focus and touch states do not leak into SP accordion', () => {
  const desktopFlyout = navigationCss.slice(navigationCss.indexOf('/* Desktop mega-menu states:'), navigationCss.indexOf('#overlay {'));
  assert.match(desktopFlyout, /@media \(calc\(1080 \* \(1 \/ 16 \* 1rem\)\) <= width\)/);
  assert.match(desktopFlyout, /&:hover,\s*&:focus-within,\s*&\._touchOpen\s*\{/);
  assert.match(desktopFlyout, /\.gnl_wrapper-02\s*\{\s*clip-path: inset/);
  assert.doesNotMatch(navigationCss.slice(0, navigationCss.indexOf('/* Desktop mega-menu states:')), /&:focus-within\s*\{\s*\.gnl_wrapper-02/);
});


test('Header breakpoint transitions clear stale top-level hover disclosure state', () => {
  const region = source.slice(source.indexOf('let lastWidthForBreakpoint = null'), source.indexOf('// // グローバルメニューの動き'));
  assert.match(region, /closeAllTouchMenus\(\)/);
  assert.match(region, /syncMobileMenu\(\)/);
  assert.match(region, /globalNavItems\.forEach\(\(item\) => \{/);
  assert.match(region, /button\.setAttribute\('aria-expanded', String\(item\.getAttribute\('data-open'\) === 'true'\)\)/);
});


test('desktop touch-open mega-menu closes on Escape and restores parent-link focus', () => {
  const region = source.slice(source.indexOf('touchMegaMenuSupport();'), source.indexOf('let lastWidthForBreakpoint = null'));
  assert.match(region, /event\.key !== 'Escape' \|\| window\.innerWidth < headerBreakpointMin/);
  assert.match(region, /document\.querySelector\(`.global_navigation/);
  assert.match(region, /const trigger = expanded\.querySelector\('\[class\*="gnl_title"\] \[class\*="gnl_link"\]'\)/);
  assert.match(region, /closeAllTouchMenus\(\)/);
  assert.match(region, /if \(trigger\) trigger\.focus\(\)/);
});


test('PC touch mega-menu cleanup preserves backdrop while mobile navigation or search owns it', () => {
  const closeBlock = source.slice(source.indexOf('const closeAllTouchMenus ='), source.indexOf('const touchMegaMenuSupport ='));
  assert.match(closeBlock, /if \(!\$body\.hasClass\('_open-search'\) && !\$body\.hasClass\('_open-menu'\)\) \$body\.removeClass\('_open-bg'\)/);
  assert.match(source, /\$\('#gns_close, #overlay'\)\.on\('click'/);
});


test('Header accordion buttons have visible focus without affecting text wrapping', () => {
  const block = navigationCss.slice(navigationCss.indexOf('.gnl_button-02,'), navigationCss.indexOf('.gnl_wrapper-02,'));
  assert.match(block, /&:focus-visible\s*\{\s*outline: 2px solid var\(--color-primary\)/);
  assert.doesNotMatch(block, /white-space:\s*nowrap/);
});


test('desktop Header disclosure state tracks mouse hover and keyboard focus-within', () => {
  const header = source.slice(source.indexOf('const globalNavItems ='), source.indexOf('const footerNavItems ='));
  assert.match(header, /item\.matches\(':hover'\)/);
  assert.match(header, /item\.matches\(':focus-within'\)/);
  assert.match(header, /item\.addEventListener\('focusin', syncDesktopHoverState\)/);
  assert.match(header, /item\.addEventListener\('focusout'/);
  assert.match(header, /queueMicrotask\(syncDesktopHoverState\)/);
});
