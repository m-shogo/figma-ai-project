"use strict";
(function ($) {
  // 再有効化時: front-page.php 等に .news_swiper-container の HTML が必要
  const newsSlider = function () {
    $(window).on('load', function () {
      const newsSliderContainer = document.querySelector('.news_swiper-container');
      if (!newsSliderContainer) {
        return;
      }
      const slideCount = newsSliderContainer.querySelectorAll('.swiper-slide').length;
      const canLoop = slideCount > 1;
      const news_swiper = new Swiper('.news_swiper-container', {
        slidesPerView: 1.2,
        spaceBetween: 25,
        centeredSlides: true,
        loop: canLoop,
        speed: 1000,
        watchOverflow: true,
        navigation: {
          nextEl: '.news_swiper-container .swiper-button-next',
          prevEl: '.news_swiper-container .swiper-button-prev'
        },
        breakpoints: {
          1000: {
            slidesPerView: 4,
            spaceBetween: 40,
            centeredSlides: false
          }
        }
      });
    });
  };

  // ==========================================================================
  // 実行
  // ==========================================================================
  // MV photo grid has no autoplay until its motion contract is implemented.
  //newsSlider();

})(jQuery);

/* TOP Course: progressive enhancement of native scroll-snap, no autoplay. */
(function () {
  const section = document.querySelector('[data-course]');
  if (!section) return;
  const list = section.querySelector('[data-course-list]');
  const controls = section.querySelector('[data-course-controls]');
  const cards = Array.from(section.querySelectorAll('[data-course-card]'));
  if (!list || !controls || cards.length < 2 || typeof list.scrollTo !== 'function') return;
  const prev = controls.querySelector('[data-course-prev]');
  const next = controls.querySelector('[data-course-next]');
  const dots = Array.from(controls.querySelectorAll('[data-course-dot]'));
  if (!prev || !next || dots.length !== cards.length) return;
  const desktop = window.matchMedia('(min-width: 67.5rem)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let frame = 0;
  const center = element => {
    const box = element.getBoundingClientRect();
    return box.left + box.width / 2;
  };
  const update = () => {
    frame = 0;
    if (desktop.matches) return;
    const middle = center(list);
    active = cards.reduce((best, card, i) =>
      Math.abs(center(card) - middle) < Math.abs(center(cards[best]) - middle) ? i : best, 0);
    dots.forEach((dot, i) => {
      if (i === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    prev.disabled = active === 0;
    next.disabled = active === cards.length - 1;
  };
  const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
  const go = index => {
    if (desktop.matches) return;
    const target = Math.max(0, Math.min(cards.length - 1, index));
    list.scrollTo({left: list.scrollLeft + center(cards[target]) - center(list), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    schedule();
  };
  const mode = () => {
    controls.hidden = desktop.matches;
    if (desktop.matches) {
      list.removeAttribute('tabindex');
      list.removeAttribute('data-enhanced');
    } else {
      list.setAttribute('tabindex', '0');
      list.setAttribute('data-enhanced', '');
      schedule();
    }
  };
  prev.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
  list.addEventListener('scroll', schedule, {passive: true});
  desktop.addEventListener('change', mode);
  window.addEventListener('resize', schedule, {passive: true});
  mode();
})();
