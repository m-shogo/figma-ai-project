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
      // With delay: 0, Swiper may already have queued a slideNext on the
      // next animation frame. Disable the instance to reject that call
      // before it reaches loopFix; stop alone cannot cancel every frame.
      swiper.disable();
      // Autoplay.stop alone does not interrupt a long in-flight transition.
      swiper.setTransition(0);
      swiper.setTranslate(position);
    };
    const resume = function () {
      if (!swiper || reduced.matches) return;
      clearResume();
      swiper.enable();
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
            beforeResize: function (instance) {
              // Core resize recalculates snapGrid from spaceBetween. Supply
              // the current CSS gap before that calculation, not after it.
              instance.params.spaceBetween = parseFloat(window.getComputedStyle(grid).columnGap) || 0;
            },
            resize: function (instance) {
              // Core can internally realign the current panel on resize.
              // Keep user-initiated autoplay stopped and public moves disabled.
              if (userPaused) {
                instance.autoplay.stop();
                instance.disable();
              }
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

  // TOP Course: one semantic list; Swiper enhances only the narrow layout.
  const initCourse = function (root) {
    const viewport = root.querySelector('[data-course-viewport]');
    const list = root.querySelector('[data-course-list]');
    const cards = Array.from(root.querySelectorAll('[data-course-card]'));
    const controls = root.querySelector('[data-course-controls]');
    if (!viewport || !list || !controls || cards.length < 2 || typeof Swiper !== 'function') return;
    const prev = controls.querySelector('[data-course-prev]');
    const next = controls.querySelector('[data-course-next]');
    const dots = Array.from(controls.querySelectorAll('[data-course-dot]'));
    if (!prev || !next || dots.length !== cards.length) return;
    const desktop = window.matchMedia('(min-width: 67.5rem)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let swiper = null;
    let active = 0;
    const update = function (instance) {
      active = instance.activeIndex;
      dots.forEach((dot, i) => {
        if (i === active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      prev.setAttribute('aria-disabled', String(instance.isBeginning));
      next.setAttribute('aria-disabled', String(instance.isEnd));
    };
    const reset = function () {
      const instance = swiper || viewport.swiper;
      if (instance && !instance.destroyed) instance.destroy(true, true);
      swiper = null;
      viewport.classList.remove('swiper');
      list.classList.remove('swiper-wrapper');
      cards.forEach(card => card.classList.remove('swiper-slide'));
      controls.hidden = true;
    };
    const refresh = function () {
      if (desktop.matches) { reset(); return; }
      if (swiper) { swiper.params.speed = reduced.matches ? 0 : 300; return; }
      viewport.classList.add('swiper');
      list.classList.add('swiper-wrapper');
      cards.forEach(card => card.classList.add('swiper-slide'));
      try {
        swiper = new Swiper(viewport, {
          slidesPerView: 'auto',
          centeredSlides: true,
          spaceBetween: 20 * parseFloat(getComputedStyle(document.documentElement).fontSize) / 16,
          initialSlide: active,
          loop: false,
          speed: reduced.matches ? 0 : 300,
          a11y: { enabled: false },
          on: { init: update, slideChange: update, resize: update }
        });
        controls.hidden = false;
        update(swiper);
      } catch (error) { reset(); }
    };
    prev.addEventListener('click', () => { if (swiper && !swiper.isBeginning) swiper.slidePrev(); });
    next.addEventListener('click', () => { if (swiper && !swiper.isEnd) swiper.slideNext(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { if (swiper) swiper.slideTo(i); }));
    list.addEventListener('focusin', event => {
      const index = cards.indexOf(event.target.closest('[data-course-card]'));
      if (swiper && index >= 0 && index !== swiper.activeIndex) swiper.slideTo(index, 0);
    });
    desktop.addEventListener('change', refresh);
    reduced.addEventListener('change', refresh);
    refresh();
  };
  // About: frontmost card is a visual selection, not an invented destination.
  const initAboutCards = function (root) {
    const buttons = Array.from(root.querySelectorAll('[data-about-select]'));
    buttons.forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => {
        buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      });
    });
  };
  $(function () {
    document.querySelectorAll('[data-about-cards]').forEach(initAboutCards);
    document.querySelectorAll('[data-course]').forEach(initCourse);
    document.querySelectorAll('.jwsnj_topMv').forEach(initMvLoop);
  });
  //newsSlider();

})(jQuery);
