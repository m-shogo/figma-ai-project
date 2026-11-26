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

test('Header and Footer use CSS-equivalent media conditions rather than fixed pixel comparisons', () => {
  const footerCss = readFileSync(new URL('../theme/css/layout/global_footer.css', import.meta.url), 'utf8');
  assert.match(headerCss, /calc\(1080\s*\*/);
  assert.match(navigationCss, /calc\(1080\s*\*/);
  assert.match(footerCss, /calc\(768\s*\*/);
  assert.match(source, /const headerDesktop = window\.matchMedia\('\(min-width: 67\.5rem\)'\)/);
  assert.match(source, /const footerDesktop = window\.matchMedia\('\(min-width: 48rem\)'\)/);
  assert.match(source, /!isOpen && !headerDesktop\.matches/);
  assert.match(source, /headerDesktop\.addEventListener\('change', syncResponsiveMenu\)/);
  assert.match(source, /footerDesktop\.addEventListener\('change', syncResponsiveMenu\)/);
  assert.match(source, /headerDesktop\.addEventListener\('change', syncResponsiveLock\)/);
  assert.doesNotMatch(source, /headerBreakpointMin|window\.innerWidth\s*[<>]/);
});

test('closing the mobile menu releases the scroll lock on all close paths', () => {
  // Execute the actual contentFixed implementation with a minimal jQuery event stub.
  const match = source.match(/  const contentFixed = function \(\) \{[\s\S]*?\n  \};/);
  assert.ok(match, 'contentFixed implementation must exist');

  const listeners = new Map();
  const classes = new Set();
  const restoredScrollY = [];
  const win = { innerWidth: 1079, scrollTo: (_x, y) => restoredScrollY.push(y) };
  const headerDesktop = { matches: false, addEventListener: (event, handler) => listeners.set('media:' + event, handler) };
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

  new Function('$', 'window', 'document', 'headerDesktop', match[0] + '\ncontentFixed();')($, win, doc, headerDesktop);

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
  headerDesktop.matches = true;
  fire('media:change');
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
  assert.match(source, /const hiddenForMobile = !isOpen && !headerDesktop\.matches/);
  assert.match(source, /\$globalNavigation\.attr\('inert', hiddenForMobile \? '' : null\)/);
  assert.match(source, /if \(restoreFocus && wasOpen\) \$menuButton\.trigger\('focus'\)/);
  assert.match(source, /event\.key === 'Escape' && \$body\.hasClass\('_open-menu'\)/);
  assert.match(source, /closeMobileMenu\(true\)/);
});


test('Header and Footer WordPress disclosure buttons expose descriptive accessibility state', () => {
  const menu = readFileSync(new URL('../theme/inc/menu.php', import.meta.url), 'utf8');
  const global = menu.split('class Custom_Global_Walker_Nav_Menu')[1].split('class Custom_Header_Sub_Walker_Nav_Menu')[0];
  const footer = menu.split('class Custom_Footer_Walker_Nav_Menu')[1].split('class Custom_')[0];
  for (const walker of [global, footer]) {
    assert.match(walker, /type="button" aria-expanded="false" aria-controls="/);
    assert.match(walker, /aria-label="/);
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
  const region = source.slice(source.indexOf('let lastHeaderDesktop = headerDesktop.matches'), source.indexOf('// // グローバルメニューの動き'));
  assert.match(region, /closeAllTouchMenus\(\)/);
  assert.match(region, /syncMobileMenu\(\)/);
  assert.match(region, /globalNavItems\.forEach\(\(item\) => \{/);
  assert.match(region, /button\.setAttribute\('aria-expanded', String\(item\.getAttribute\('data-open'\) === 'true'\)\)/);
});


test('desktop touch-open mega-menu closes on Escape and restores parent-link focus', () => {
  const region = source.slice(source.indexOf('touchMegaMenuSupport();'), source.indexOf('let lastHeaderDesktop = headerDesktop.matches'));
  assert.match(region, /event\.key !== 'Escape' \|\| !headerDesktop\.matches/);
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


test('mobile menu open-state clip-path follows exactly the 1080px desktop breakpoint', () => {
  const openRule = navigationCss.slice(navigationCss.indexOf('body._open-menu {'), navigationCss.indexOf('body._open-bg {'));
  assert.match(openRule, /@media \(calc\(1080 \* \(1 \/ 16 \* 1rem\)\) <= width\)/);
  assert.doesNotMatch(openRule, /@media \(calc\(768 \*/);
  assert.match(openRule, /clip-path: unset;/);
});


test('Header mobile close and hamburger toggle retain backdrop ownership for search and PC touch menus', () => {
  const section = source.slice(source.indexOf('const toggleMenu = function'), source.indexOf('const globalNavItems ='));
  assert.match(section, /const touchOpen = document\.querySelector\('\.global_navigation \[class\*="gnl_item"\]\._touchOpen'\)/);
  assert.match(section, /if \(!\$body\.hasClass\('_open-search'\) && !touchOpen\) \$body\.removeClass\('_open-bg'\)/);
  assert.match(section, /\$body\.toggleClass\('_open-menu'\)/);
  assert.match(section, /if \(\$body\.hasClass\('_open-menu'\) \|\| \$body\.hasClass\('_open-search'\)\) \$body\.addClass\('_open-bg'\)/);
});


test('collapsed Header/Footer accordion links are inert only below their own desktop breakpoints', () => {
  const match = source.match(/    const syncSubmenuFocusability = \(item, prefix, desktopMedia\) => \{[\s\S]*?\n    \};/);
  assert.ok(match, 'focusability helper must exist');
  const win = { innerWidth: 375 };
  const doc = { activeElement: null };
  const sync = new Function('window', 'document', match[0] + '\nreturn syncSubmenuFocusability;')(win, doc);
  const headerDesktop = { matches: false };
  const footerDesktop = { matches: false };
  const wrapper = { inert: false };
  let state = null;
  const item = {
    children: [{ matches: selector => { assert.match(selector, /_wrapper/); return true; }, contains: target => target === wrapper, set inert(value) { wrapper.inert = value; }, get inert() { return wrapper.inert; } }],
    querySelector: () => ({ focus: () => {} }),
    getAttribute: () => state,
  };
  sync(item, 'gnl', headerDesktop);
  assert.equal(wrapper.inert, true, 'closed Header SP menu must block invisible links');
  state = 'true';
  sync(item, 'gnl', headerDesktop);
  assert.equal(wrapper.inert, false, 'opened Header SP menu links stay usable');
  state = null;
  headerDesktop.matches = true;
  sync(item, 'gnl', headerDesktop);
  assert.equal(wrapper.inert, false, 'Header PC flyout allows keyboard focus');
  win.innerWidth = 767;
  sync(item, 'gfl', footerDesktop);
  assert.equal(wrapper.inert, true, 'Footer collapsed mobile links stay inert');
  footerDesktop.matches = true;
  sync(item, 'gfl', footerDesktop);
  assert.equal(wrapper.inert, false, 'Footer desktop sitemap links are always available');
  assert.match(source, /globalNavItems\.forEach\(item => syncSubmenuFocusability/);
  assert.match(source, /footerNavItems\.forEach\(item => syncSubmenuFocusability/);
});


test('accordion focusability is scoped to the direct submenu wrapper, never a nested descendant', () => {
  const helper = source.match(/    const syncSubmenuFocusability = \(item, prefix, desktopMedia\) => \{[\s\S]*?\n    \};/);
  assert.ok(helper);
  assert.match(helper[0], /Array\.from\(item\.children\)\.find/);
  assert.match(helper[0], /child\.matches/);
  assert.doesNotMatch(helper[0], /const wrapper = item\.querySelector\(/);
});


test('collapsing a focused submenu moves keyboard focus to its disclosure before inert', () => {
  const match = source.match(/    const syncSubmenuFocusability = \(item, prefix, desktopMedia\) => \{[\s\S]*?\n    \};/);
  assert.ok(match);
  const win = { innerWidth: 375 };
  let focusedTrigger = false;
  const wrapper = { inert: false };
  const doc = { activeElement: wrapper };
  const item = {
    children: [{ matches: () => true, contains: target => target === wrapper, set inert(value) { assert.equal(focusedTrigger, true); wrapper.inert = value; } }],
    getAttribute: () => 'false',
    querySelector: () => ({ focus() { focusedTrigger = true; doc.activeElement = this; } }),
  };
  new Function('window', 'document', match[0] + '\nreturn syncSubmenuFocusability;')(win, doc)(item, 'gnl', { matches: false });
  assert.equal(focusedTrigger, true);
  assert.equal(wrapper.inert, true);
});


test('Header accordion and mega-menu transitions respect reduced-motion preference', () => {
  const block = navigationCss.slice(navigationCss.indexOf('/* Reduced motion keeps'), navigationCss.indexOf('/* Desktop mega-menu states:'));
  assert.match(block, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(block, /\.gnl_wrapper-02/);
  assert.match(block, /transition-duration: 0s/);
});


test('Header search toggles independently and preserves the backdrop for other open menus', () => {
  const region = source.slice(source.indexOf("$('#search').on('click'"), source.indexOf("$('#gns_close, #overlay').on('click'"));
  assert.match(region, /const isOpen = !\$body\.hasClass\('_open-search'\)/);
  assert.match(region, /\$body\.toggleClass\('_open-search', isOpen\)/);
  assert.match(region, /const touchOpen = document\.querySelector/);
  assert.match(region, /\$body\.toggleClass\('_open-bg', isOpen \|\| \$body\.hasClass\('_open-menu'\) \|\| !!touchOpen\)/);
});


test('backdrop owns visibility/background transitions and the open state cannot reset reduced motion', () => {
  const overlay = navigationCss.slice(navigationCss.indexOf('#overlay {'), navigationCss.indexOf('/* modifier */'));
  const open = navigationCss.slice(navigationCss.indexOf('body._open-bg {'));
  assert.match(overlay, /transition: visibility var\(--transition-duration\), background-color var\(--transition-duration\)/);
  assert.match(overlay, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*transition-duration: 0s/);
  assert.match(open, /#overlay\s*\{\s*visibility: visible;\s*background-color:/);
  assert.doesNotMatch(open, /transition(?:-duration|-property)?:/);
});


test('Header WordPress disclosure controls point to a unique direct submenu wrapper', () => {
  const menu = readFileSync(new URL('../theme/inc/menu.php', import.meta.url), 'utf8');
  const walker = menu.slice(menu.indexOf('class Custom_Global_Walker_Nav_Menu'), menu.indexOf('class Custom_Header_Sub_Walker_Nav_Menu'));
  assert.match(walker, /\$submenu_id = 'gnl-submenu-' \. absint\(\$item->ID\)/);
  assert.match(walker, /aria-controls="' \. esc_attr\(\$submenu_id\)/);
  assert.match(walker, /<div id="' \. esc_attr\(\$submenu_id\)/);
});


test('Header chrome respects reduced-motion preference at hamburger and desktop widths', () => {
  const block = headerCss.slice(headerCss.indexOf('/* Header height and hamburger icon'), headerCss.indexOf('/* modifire */'));
  assert.match(block, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(block, /\.gh_menu \.icon::before/);
  assert.match(block, /\.gh_menu \.icon::after/);
  assert.match(block, /transition-duration: 0s/);
});


test('Header navigation focus exits before inert is applied on mobile close or resize', () => {
  const match = source.match(/    const syncMobileMenu = \(\) => \{[\s\S]*?\n    \};/);
  assert.ok(match);
  const win = { innerWidth: 1080 };
  const headerDesktop = { matches: true };
  const focusedLink = {};
  const doc = { activeElement: focusedLink, getElementById: () => ({ contains: node => node === focusedLink }) };
  const classes = new Set();
  const attrs = [];
  const menuButton = { attr(name, value) { attrs.push(['menu', name, value]); }, trigger(name) { attrs.push(['focus', name]); doc.activeElement = this; } };
  const navigation = { attr(name, value) { attrs.push(['navigation', name, value]); } };
  const body = { hasClass: name => classes.has(name) };
  const sync = new Function('$body', '$menuButton', '$globalNavigation', 'window', 'document', 'headerDesktop', match[0] + '\nreturn syncMobileMenu;')(body, menuButton, navigation, win, doc, headerDesktop);
  sync();
  assert.equal(attrs.some(x => x[0] === 'focus'), false, 'desktop nav remains focusable');
  attrs.length = 0;
  headerDesktop.matches = false;
  sync();
  const focusIndex = attrs.findIndex(x => x[0] === 'focus');
  const inertIndex = attrs.findIndex(x => x[0] === 'navigation' && x[1] === 'inert');
  assert.ok(focusIndex >= 0 && inertIndex > focusIndex, 'move focus before applying inert');
  assert.equal(attrs[inertIndex][2], '');
  attrs.length = 0;
  classes.add('_open-menu');
  sync();
  assert.deepEqual(attrs.at(-1), ['navigation', 'inert', null], 'open SP menu must not be inert');
});


test('Header navigation does not retain empty CODIA class rules', () => {
  assert.doesNotMatch(navigationCss, /^[ \t]*\.[A-Za-z][\w-]*\s*\{\s*\}[ \t]*$/m);
});

test('mobile navigation uses visible viewport height with legacy fallback and permits long labels to shrink', () => {
  assert.match(navigationCss,/height: calc\(100vh - var\(--header-height-SP\)\);\s*height: calc\(100dvh - var\(--header-height-SP\)\);/);
  const links=navigationCss.slice(navigationCss.indexOf('.gnl_link-02,'),navigationCss.indexOf('.gnl_button-02,'));
  assert.match(links,/min-width:\s*0/);
  assert.match(links,/overflow-wrap:\s*anywhere/);
});


test('desktop mega-menu tracks use shrinkable minmax to contain long CMS labels', () => {
  assert.match(navigationCss, /\.gnl_list-02\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
});


test('global normalize preserves keyboard focus instead of suppressing UA outlines', () => {
    const css = readFileSync(new URL('../theme/css/base/normalize.css', import.meta.url), 'utf8');
    assert.doesNotMatch(css, /outline:\s*none/);
    assert.match(css, /:focus-visible\s*\{\s*outline: 2px solid currentColor/);
});


test('hamburger animates only its background and moving strokes', () => {
  assert.match(headerCss, /transition: background-color var\(--transition-duration\)/);
  assert.match(headerCss, /transition: top var\(--transition-duration\), transform var\(--transition-duration\)/);
  assert.doesNotMatch(headerCss, /transition:\s*var\(--transition-duration\)/);
});


test('secondary navigation keeps PC and SP declarations on matching owners', () => {
  const block = navigationCss.slice(navigationCss.indexOf('  .gn_subMenu {'), navigationCss.indexOf('  .gn_search {'));
  assert.match(block, /\.gn_subMenu\s*\{\s*@media \(calc\(1080[^{}]+\{\s*display: flex/);
  assert.match(block, /&\.menu\s*\{\s*display: grid;\s*grid-template-columns: repeat\(2, 1fr\);\s*@media \(calc\(1080[^{}]+\{\s*display: flex/);
  assert.match(block, /\.menu-item\s*\{\s*border-bottom: calc\(1 \* var\(--to-rem-func\)\) solid var\(--color-gray-border\);\s*@media \(calc\(1080[^{}]+\{\s*border-bottom: none/);
  assert.match(block, /padding-inline: calc\(20 \* var\(--to-rem-func\)\);\s*@media \(calc\(1080[^{}]+\{\s*padding-block: 0;\s*padding-inline: 0/);
  assert.match(block, /&:nth-child\(odd\)\s*\{[^{}]*@media \(calc\(1080[^{}]+\{\s*border-right: none/);
  const desktop = navigationCss.slice(navigationCss.indexOf('/* MARK: header_breakpoint */'));
  assert.doesNotMatch(desktop, /\.gn_links-02\s*\{/);
});
