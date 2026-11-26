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
  // Continuous marquee (Human 2026-11-26), not a slide-by-slide carousel.
  // The original grid stays the only semantic content owner.
  const initMvLoop = function (root) {
    const track = root.querySelector('.jwsnj_topMv_track');
    const grid = track?.querySelector('.jwsnj_topMv_grid.is-complete');
    const toggle = root.querySelector('.jwsnj_topMv_toggle');
    if (!grid || !toggle || root.classList.contains('is-loop-prepared')) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prepare = async function () {
      if (reduced.matches || root.classList.contains('is-loop-prepared')) return;
      const copy = grid.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('inert', '');
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      copy.querySelectorAll('img').forEach(img => img.removeAttribute('fetchpriority'));
      track.append(copy);
      root.classList.add('is-loop-prepared');
      try {
        // Do not start while visible slots are still blank. Hidden SP slots
        // remain lazy; a failed visible image leaves the original still intact.
        const visible = [...track.querySelectorAll('img')].filter(img => img.getClientRects().length);
        await Promise.all(visible.map(img => {
          img.loading = 'eager';
          return img.decode();
        }));
      } catch (error) {
        copy.remove();
        root.classList.remove('is-loop-prepared');
        return;
      }
      root.classList.add('is-loop-running');
      toggle.hidden = false;
    };
    toggle.addEventListener('click', function () {
      const paused = root.classList.toggle('is-loop-paused');
      toggle.textContent = paused ? '写真の動きを再開' : '写真の動きを停止';
    });
    reduced.addEventListener('change', prepare);
    prepare();
  };
  $(function () {
    document.querySelectorAll('.jwsnj_topMv').forEach(initMvLoop);
  });
  //newsSlider();

})(jQuery);
