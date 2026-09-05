'use strict';

/**
 * PC touch mega-menu uses `_touchOpen` as a visual interaction owner while the
 * ordinary disclosure button uses `data-open`. Keep both owners intact and
 * expose their effective open state through the existing button semantics.
 */
(() => {
  const itemSelector = '.global_header .gn_mega [class*="gnl_item"]._hasChild';
  const buttonSelector = ':scope > [class*="gnl_title"] > [class*="gnl_button"]';

  const sync = (item) => {
    const button = item.querySelector(buttonSelector);
    if (!button) return;
    const expanded =
      item.classList.contains('_touchOpen') || item.getAttribute('data-open') === 'true';
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  };

  const init = () => {
    const items = document.querySelectorAll(itemSelector);
    items.forEach((item) => {
      sync(item);
      new MutationObserver(() => sync(item)).observe(item, {
        attributes: true,
        attributeFilter: ['class', 'data-open'],
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
