'use strict';

(function () {
  const header = document.getElementById('global_header');
  if (!header) return;

  let pendingTabScroll = null;

  const headerIsStickyAndVisible = function () {
    const style = window.getComputedStyle(header);
    const rect = header.getBoundingClientRect();
    return (
      style.position === 'sticky' &&
      window.scrollY > 0 &&
      rect.bottom > 0 &&
      rect.top < window.innerHeight
    );
  };

  document.addEventListener('keydown', function (event) {
    if (
      event.key !== 'Tab' ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      !headerIsStickyAndVisible()
    ) {
      pendingTabScroll = null;
      return;
    }

    pendingTabScroll = {
      x: window.scrollX,
      y: window.scrollY,
    };
  }, true);

  document.addEventListener('focusin', function (event) {
    const stored = pendingTabScroll;
    pendingTabScroll = null;

    if (!stored || !(event.target instanceof Node) || !header.contains(event.target)) {
      return;
    }

    if (window.scrollX !== stored.x || window.scrollY !== stored.y) {
      window.scrollTo(stored.x, stored.y);
    }
  }, true);
})();
