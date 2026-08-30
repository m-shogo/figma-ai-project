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
  const topCalendar = function () {
    const root = document.querySelector('.top_events-01');
    const el = root ? root.querySelector('#top_calendar') : null;
    if (!root || !el || typeof FullCalendar === 'undefined') {
      return;
    }
    const cfg = window.nipponbudokanTopCal || {};
    const label = root.querySelector('.te_cal_label');
    const sampleColors = ['#e8dcc8', '#c5dce8', '#c8e0c8'];
    const sampleEvents = function () {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      return [
        { title: 'イベント名', start: y + '-' + m + '-04', backgroundColor: sampleColors[0], borderColor: sampleColors[0], textColor: '#333' },
        { title: 'イベント名', start: y + '-' + m + '-11', backgroundColor: sampleColors[1], borderColor: sampleColors[1], textColor: '#333' },
        { title: 'イベント名', start: y + '-' + m + '-16', backgroundColor: sampleColors[2], borderColor: sampleColors[2], textColor: '#333' },
        { title: 'イベント名', start: y + '-' + m + '-22', backgroundColor: sampleColors[0], borderColor: sampleColors[0], textColor: '#333' }
      ];
    };
    const hasGoogle = Boolean(cfg.googleCalendarApiKey && cfg.googleCalendarId);
    const calendar = new FullCalendar.Calendar(el, {
      locale: 'ja',
      firstDay: 1,
      initialView: 'dayGridMonth',
      headerToolbar: false,
      height: 'auto',
      googleCalendarApiKey: hasGoogle ? cfg.googleCalendarApiKey : undefined,
      events: hasGoogle
        ? { googleCalendarId: cfg.googleCalendarId }
        : sampleEvents(),
      datesSet: function (info) {
        if (!label) {
          return;
        }
        const month = info.view.currentStart.getMonth() + 1;
        label.textContent = month + '月';
      }
    });
    calendar.render();
    const prev = root.querySelector('.te_cal_prev');
    const next = root.querySelector('.te_cal_next');
    if (prev) {
      prev.addEventListener('click', function () {
        calendar.prev();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        calendar.next();
      });
    }
    root.querySelectorAll('.te_cal_view').forEach(function (button) {
      button.addEventListener('click', function () {
        const view = button.getAttribute('data-view');
        if (!view) {
          return;
        }
        calendar.changeView(view);
        root.querySelectorAll('.te_cal_view').forEach(function (item) {
          const on = item === button;
          item.classList.toggle('is-active', on);
          item.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });
  };

  topSlider();
  //newsSlider();
  $(topCalendar);

})(jQuery);
