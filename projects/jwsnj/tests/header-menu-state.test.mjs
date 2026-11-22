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
  assert.equal((header.match(/wp_nav_menu\\s*\\(/g) || []).length, 2);
  for (const location of ['global-nav', 'sub-nav']) {
    assert.match(header, new RegExp("'theme_location'\\\\s*=>\\\\s*'" + location + "'"));
    assert.match(registrations, new RegExp("'" + location + "'\\\\s*=>"));
  }
  assert.doesNotMatch(header, /'menu'\\s*=>/);
  assert.equal((header.match(/'fallback_cb'\\s*=>\\s*false/g) || []).length, 2);
  assert.match(header, /Custom_Global_Walker_Nav_Menu/);
  assert.match(header, /Custom_Header_Sub_Walker_Nav_Menu/);
});
