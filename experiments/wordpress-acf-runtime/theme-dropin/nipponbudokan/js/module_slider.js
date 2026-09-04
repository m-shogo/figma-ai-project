'use strict';

function initModuleSliders() {
  if (typeof Swiper === 'undefined') {
    return;
  }

  document.querySelectorAll('.module_slider-01').forEach(function (root) {
    var stage = root.querySelector('.slider-stage');
    if (!stage || stage.swiper) {
      return;
    }
    var slideCount = stage.querySelectorAll('.swiper-slide').length;
    var navRoot = root.querySelector('.slider-nav');
    if (navRoot) {
      navRoot.hidden = slideCount < 2;
    }
    new Swiper(stage, {
      slidesPerView: 1,
      speed: 400,
      loop: slideCount > 1,
      watchOverflow: true,
      navigation: {
        nextEl: root.querySelector('.swiper-button-next'),
        prevEl: root.querySelector('.swiper-button-prev'),
        enabled: slideCount > 1,
        addIcons: false,
      },
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModuleSliders);
} else {
  initModuleSliders();
}

if (window.acf && typeof window.acf.addAction === 'function') {
  window.acf.addAction('render_block_preview/type=slider', initModuleSliders);
}
