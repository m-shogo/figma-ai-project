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
  // Swiper owns movement and loop ordering. Each slide is one responsive photo grid.
  const initMvLoop = function (root) {
    const viewport = root.querySelector('.jwsnj_topMv_viewport');
    const track = root.querySelector('.jwsnj_topMv_track');
    const grid = track?.querySelector('.jwsnj_topMv_grid.is-complete');
    const toggle = root.querySelector('.jwsnj_topMv_toggle');
    if (!viewport || !grid || !toggle || typeof Swiper !== 'function') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 67.5rem)');
    let swiper = null;
    let copies = [];
    let generation = 0;
    let userPaused = false;
    let resumeAfterTransition = null;

    const updateToggle = function () {
      toggle.textContent = userPaused ? '写真の動きを再開' : '写真の動きを停止';
    };
    const clearResume = function () {
      if (swiper && resumeAfterTransition) swiper.off('transitionEnd', resumeAfterTransition);
      resumeAfterTransition = null;
    };
    const reset = function () {
      generation++;
      clearResume();
      const instance = swiper || viewport.swiper;
      if (instance && !instance.destroyed) instance.destroy(true, true);
      swiper = null;
      copies.forEach(copy => copy.remove());
      copies = [];
      track.append(grid);
      grid.classList.remove('swiper-slide');
      track.classList.remove('swiper-wrapper');
      viewport.classList.remove('swiper');
      root.classList.remove('is-swiper-prepared', 'is-swiper-ready');
      toggle.hidden = true;
    };
    const pause = function () {
      if (!swiper) return;
      clearResume();
      const position = swiper.getTranslate();
      swiper.autoplay.stop();
      swiper.allowSlideNext = false;
      // Autoplay.stop alone does not interrupt a long in-flight transition.
      swiper.setTransition(0);
      swiper.setTranslate(position);
    };
    const resume = function () {
      if (!swiper || reduced.matches) return;
      clearResume();
      swiper.allowSlideNext = true;
      const target = -swiper.snapGrid[swiper.snapIndex];
      const distance = Math.abs(target - swiper.getTranslate());
      const step = swiper.size + Number(swiper.params.spaceBetween);
      const remaining = Math.max(1, Math.round(swiper.params.speed * distance / Math.max(1, step)));
      const instance = swiper;
      const startAutoplay = function () {
        clearResume();
        if (swiper === instance && !userPaused && !reduced.matches) instance.autoplay.start();
      };
      if (distance < 1) {
        instance.transitionEnd(false);
        startAutoplay();
        return;
      }
      // Complete the interrupted Swiper slide at the same speed, then
      // return control to the library's zero-delay autoplay.
      resumeAfterTransition = startAutoplay;
      instance.on('transitionEnd', startAutoplay);
      if (!instance.slideTo(instance.activeIndex, remaining, true)) startAutoplay();
    };
    const prepare = async function () {
      if (reduced.matches || root.classList.contains('is-swiper-prepared')) return;
      const current = ++generation;
      viewport.classList.add('swiper');
      track.classList.add('swiper-wrapper');
      grid.classList.add('swiper-slide');
      // Three panels satisfy loop mode without creating a second semantic owner.
      copies = Array.from({length: 2}, () => {
        const copy = grid.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.setAttribute('inert', '');
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        copy.querySelectorAll('img').forEach(img => img.removeAttribute('fetchpriority'));
        return copy;
      });
      root.classList.add('is-swiper-prepared');
      track.append(...copies);
      try {
        const visible = [...track.querySelectorAll('img')].filter(img => img.getClientRects().length);
        await Promise.all(visible.map(img => {
          img.loading = 'eager';
          return img.decode();
        }));
        if (current !== generation || reduced.matches) return;
        const gap = parseFloat(window.getComputedStyle(grid).columnGap) || 0;
        swiper = new Swiper(viewport, {
          slidesPerView: 1,
          slidesPerGroup: 1,
          spaceBetween: gap,
          loop: true,
          speed: desktop.matches ? 36000 : 18000,
          allowTouchMove: false,
          a11y: { enabled: false },
          autoplay: { delay: 0, waitForTransition: true, disableOnInteraction: false },
          on: {
            resize: function (instance) {
              // Swiper may snap to the current panel on resize. Keep autoplay
              // stopped if the user paused, and refresh the layout gap.
              instance.params.spaceBetween = parseFloat(window.getComputedStyle(grid).columnGap) || 0;
              if (userPaused) instance.autoplay.stop();
            }
          }
        });
        root.classList.add('is-swiper-ready');
        if (userPaused) pause();
        updateToggle();
        toggle.hidden = false;
      } catch (error) {
        if (current === generation) reset();
      }
    };
    toggle.addEventListener('click', function () {
      if (!swiper) return;
      userPaused = !userPaused;
      if (userPaused) pause();
      else resume();
      updateToggle();
    });
    const refresh = function () {
      reset();
      prepare();
    };
    reduced.addEventListener('change', refresh);
    desktop.addEventListener('change', refresh);
    prepare();
  };
  $(function () {
    document.querySelectorAll('.jwsnj_topMv').forEach(initMvLoop);
  });
  //newsSlider();

})(jQuery);
