import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../theme/js/table-scroll-hint.js', import.meta.url), 'utf8');

function fixture({ stacked = false, existing = false, narrow = true, overflow = true, caption = false, named = false } = {}) {
  const attrs = new Map(named ? [['tabindex','-1'],['aria-label','既存名']] : []);
  const hintAttrs = new Map();
  let initialized = existing ? 1 : 0;
  let calls = 0;
  const table = { classList: { contains: name => stacked && name === 'is-stacked-on-mobile' } };
  const hint = { setAttribute: (key, value) => hintAttrs.set(key, value) };
  const figure = {
    classList: { contains: name => existing && name === 'scroll-hint' },
    style: { cssText: 'overflow-x:auto' },
    clientWidth: 335, scrollWidth: overflow ? 960 : 335,
    querySelector: selector => selector === ':scope > table' ? table :
      selector === ':scope > figcaption' ? (caption ? {} : null) :
      selector === ':scope > .scroll-hint-icon-wrap' && initialized ? hint : null,
    hasAttribute: key => attrs.has(key), getAttribute: key => attrs.get(key),
    setAttribute: (key,value) => attrs.set(key,value), removeAttribute: key => attrs.delete(key)
  };
  const media = { matches: narrow };
  let resize = () => {};
  const window = {
    matchMedia: () => media, getComputedStyle: () => ({ overflowX: 'auto' }),
    addEventListener: (name, fn) => { if (name === 'resize') resize = fn; },
    ScrollHint: function(element, options) {
      assert.equal(element, figure); assert.equal(options.i18n.scrollable, 'スクロールできます');
      calls++; initialized++; element.style.cssText = 'overflow:auto;position:relative';
    }
  };
  const document = { readyState: 'complete', querySelectorAll: selector => {
    assert.match(selector, /\.is-scroll-on-mobile$/); return [figure];
  } };
  vm.runInNewContext(source, { window, document });
  return { attrs, hintAttrs, figure, media, resize: () => resize(), calls: () => calls };
}

test('only overflowing mobile tables initialize once and restore plugin inline styling', () => {
  const f = fixture();
  assert.equal(f.calls(), 1); assert.equal(f.attrs.get('tabindex'), '0');
  assert.equal(f.attrs.get('aria-label'), '横スクロール可能な表');
  assert.equal(f.hintAttrs.get('aria-hidden'), 'true');
  assert.equal(f.figure.style.cssText, 'overflow-x:auto');
  f.resize(); assert.equal(f.calls(), 1);
  f.media.matches = false; f.resize();
  assert.equal(f.attrs.has('tabindex'), false); assert.equal(f.attrs.has('aria-label'), false);
});
test('stacked, pre-enhanced and non-overflowing tables are not initialized', () => {
  for (const config of [{stacked:true},{existing:true},{overflow:false},{narrow:false}]) {
    const f = fixture(config); assert.equal(f.calls(), 0);
  }
  const f = fixture({narrow:false}); f.media.matches = true; f.resize();
  assert.equal(f.calls(), 1);
});
test('caption and editor-provided focus or label remain authoritative', () => {
  const caption = fixture({caption:true}); assert.equal(caption.attrs.has('aria-label'), false);
  const f = fixture({named:true}); f.media.matches = false; f.resize();
  assert.equal(f.attrs.get('tabindex'), '-1'); assert.equal(f.attrs.get('aria-label'), '既存名');
});
