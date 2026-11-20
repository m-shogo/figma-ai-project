"use strict";
(function ($) {
  // ==========================================================================
  // トップスライダー設定
  // ==========================================================================
  const topSlider = function () {
    $(window).on('load', function () {
      const topSliderContainer = document.querySelector('.tm_swiper-container');
      if (!topSliderContainer) {
        return;
      }
      // スライド1枚のときは loop / autoplay / pagination を無効化（Swiper 14 対応）
      const slideCount = topSliderContainer.querySelectorAll('.swiper-slide').length;
      const canLoop = slideCount > 1;
      const tm_swiper = new Swiper('.tm_swiper-container', {
        effect: 'fade',
        fadeEffect: {
          crossFade: true
        },
        loop: canLoop,
        speed: 1000,
        watchOverflow: true,
        autoplay: canLoop ? {
          delay: 3000,
          disableOnInteraction: false
        } : false,
        pagination: canLoop ? {
          el: '.tm_swiper-container .swiper-pagination',
          clickable: true
        } : false
      });
    });
  };
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
  topSlider();
  //newsSlider();

})(jQuery);
