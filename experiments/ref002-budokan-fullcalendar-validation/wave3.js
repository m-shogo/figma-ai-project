(() => {
  const MOBILE_QUERY = '(max-width: 767px)';
  const AUTHORED_SP_SCROLL_LEFT = 279;

  function syncIndicator(scroller, indicator) {
    if (!scroller || !indicator) return;
    const maxScroll = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
    const maxThumbTravel = indicator.clientWidth - 109.932;
    const ratio = Math.min(1, Math.max(0, scroller.scrollLeft / maxScroll));
    indicator.style.setProperty('--about-scroll-thumb-x', `${ratio * maxThumbTravel}px`);
    document.documentElement.dataset.aboutScrollLeft = String(Math.round(scroller.scrollLeft * 1000) / 1000);
  }

  function initializeAboutScroller() {
    const scroller = document.querySelector('[data-ref002-about-scroller]');
    const indicator = document.querySelector('.about-scroll-indicator');
    if (!scroller || !indicator) return;

    const mobile = window.matchMedia(MOBILE_QUERY).matches;
    if (!mobile) {
      document.documentElement.dataset.aboutScrollMode = 'pc-grid';
      return;
    }

    scroller.scrollTo({ left: AUTHORED_SP_SCROLL_LEFT, behavior: 'auto' });
    syncIndicator(scroller, indicator);
    requestAnimationFrame(() => {
      scroller.scrollLeft = AUTHORED_SP_SCROLL_LEFT;
      syncIndicator(scroller, indicator);
    });

    scroller.addEventListener('scroll', () => syncIndicator(scroller, indicator), { passive: true });
    document.documentElement.dataset.aboutScrollMode = 'sp-native-scroll-snap';
  }

  window.addEventListener('DOMContentLoaded', initializeAboutScroller, { once: true });
})();
