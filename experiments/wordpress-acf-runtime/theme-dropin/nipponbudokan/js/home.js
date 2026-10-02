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
  const topCalendar = function () {
    const root = document.querySelector('.top_events-01');
    const el = root ? root.querySelector('#top_calendar') : null;
    if (!root || !el || typeof FullCalendar === 'undefined') {
      return;
    }
    const cfg = window.nipponbudokanTopCal || {};
    const label = root.querySelector('.te_cal_label');
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
        : [],
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

  const aboutCardsSlider = function () {
    const root = document.querySelector('.top_about-01');
    const el = root ? root.querySelector('.ta_cards_swiper') : null;
    if (!root || !el || typeof Swiper === 'undefined') {
      return;
    }
    const mq = window.matchMedia('(min-width: 768px)');
    let swiper = null;
    const create = function () {
      if (swiper || mq.matches) {
        return;
      }
      const slideCount = el.querySelectorAll('.swiper-slide').length;
      if (slideCount < 2) {
        return;
      }
      const prefersReducedMotion = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const bar = root.querySelector('.ta_scroll_bar');
      const track = root.querySelector('.ta_scroll');
      const moveBar = function (progress) {
        if (!bar || !track) {
          return;
        }
        const max = Math.max(0, track.clientWidth - bar.offsetWidth);
        bar.style.transform = 'translate3d(' + (progress * max) + 'px, 0, 0)';
      };
      swiper = new Swiper(el, {
        slidesPerView: 'auto',
        spaceBetween: 20,
        centeredSlides: true,
        watchOverflow: true,
        speed: prefersReducedMotion ? 0 : 300,
        resistanceRatio: 0.85,
        on: {
          progress: function (instance, progress) {
            moveBar(progress);
          }
        }
      });
    };
    const destroy = function () {
      if (!swiper) {
        return;
      }
      swiper.destroy(true, true);
      swiper = null;
      const bar = root.querySelector('.ta_scroll_bar');
      if (bar) {
        bar.style.transform = '';
      }
    };
    const sync = function () {
      if (mq.matches) {
        destroy();
      } else {
        create();
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', sync);
    } else if (mq.addListener) {
      mq.addListener(sync);
    }
    sync();
  };

  const noticeSlider = function () {
    const root = document.querySelector('.top_notice-01');
    const el = root ? root.querySelector('.tn_swiper') : null;
    if (!root || !el || typeof Swiper === 'undefined') {
      return;
    }
    const slideCount = el.querySelectorAll('.swiper-slide').length;
    if (slideCount < 2) {
      return;
    }
    const prefersReducedMotion = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    new Swiper(el, {
      slidesPerView: 1,
      spaceBetween: 0,
      speed: prefersReducedMotion ? 0 : 300,
      autoHeight: false,
      watchOverflow: true,
      navigation: {
        nextEl: root.querySelector('.tn_next'),
        prevEl: root.querySelector('.tn_prev')
      }
    });
  };

  const topNewsTabs = function () {
    const root = document.querySelector('.top_news-01');
    if (!root) {
      return;
    }
    const tabs = root.querySelectorAll('[data-news-filter]');
    const panels = root.querySelectorAll('[data-news-panel]');
    const mores = root.querySelectorAll('[data-news-more]');
    const select = function (tab) {
      const id = tab.getAttribute('data-news-filter');
      const archive = tab.getAttribute('data-news-archive');
      tabs.forEach(function (item) {
        const on = item === tab;
        const li = item.closest('.news_tabs_item');
        if (li) {
          li.classList.toggle('is-active', on);
        }
        item.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-news-panel') !== id;
      });
      if (archive) {
        mores.forEach(function (link) {
          link.href = archive;
        });
      }
    };
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        select(tab);
      });
    });
  };

  const topEventFilter = function () {
    const root = document.querySelector('.top_events-01');
    if (!root) {
      return;
    }
    const select = root.querySelector('#te_event_cat');
    const panels = root.querySelectorAll('[data-event-panel]');
    const more = root.querySelector('[data-event-more]');
    if (!select) {
      return;
    }
    const apply = function () {
      const option = select.options[select.selectedIndex];
      const id = select.value;
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-event-panel') !== id;
      });
      if (more && option) {
        const archive = option.getAttribute('data-event-archive');
        if (archive) {
          more.href = archive;
        }
      }
    };
    select.addEventListener('change', apply);
  };

  //newsSlider();
  $(topCalendar);
  $(aboutCardsSlider);
  noticeSlider();
  topNewsTabs();
  topEventFilter();

})(jQuery);
