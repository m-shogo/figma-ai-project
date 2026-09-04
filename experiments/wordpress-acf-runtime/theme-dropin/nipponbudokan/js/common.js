'use strict';
// ==========================================================================
// OSやブラウザを判定してbodyにclassを付与
// ==========================================================================
const ua = navigator.userAgent.toLowerCase(),
  ver = navigator.appVersion.toLowerCase(),
  rootClass = document.documentElement.classList;
//ブラウザ判定
const isMSIE = ua.indexOf('msie') > -1 && ua.indexOf('opera') === -1, // IE(11以外)
  isIE6 = isMSIE && ver.indexOf('msie 6.') > -1, // IE6
  isIE7 = isMSIE && ver.indexOf('msie 7.') > -1, // IE7
  isIE8 = isMSIE && ver.indexOf('msie 8.') > -1, // IE8
  isIE9 = isMSIE && ver.indexOf('msie 9.') > -1, // IE9
  isIE10 = isMSIE && ver.indexOf('msie 10.') > -1, // IE10
  isIE11 = ua.indexOf('trident/7') > -1, // IE11
  isIE = isMSIE || isIE11, // IE
  isEdge = ua.indexOf('edge') > -1, // Edge
  isChrome = ua.indexOf('chrome') > -1 && ua.indexOf('edge') === -1, // Google Chrome
  isFirefox = ua.indexOf('firefox') > -1, // Firefox
  isSafari = ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1, // Safari
  isOpera = ua.indexOf('opera') > -1; // Opera
{
  //デバイス判定
  const _ua = (function (u) {
    return {
      Tablet:
        (u.indexOf('windows') !== -1 &&
          u.indexOf('touch') !== -1 &&
          u.indexOf('tablet pc') === -1) ||
        u.indexOf('ipad') !== -1 ||
        (u.indexOf('android') !== -1 && u.indexOf('mobile') === -1) ||
        (u.indexOf('firefox') !== -1 && u.indexOf('tablet') !== -1) ||
        u.indexOf('kindle') !== -1 ||
        u.indexOf('silk') !== -1 ||
        u.indexOf('playbook') !== -1,
      Mobile:
        (u.indexOf('windows') !== -1 && u.indexOf('phone') !== -1) ||
        u.indexOf('iphone') !== -1 ||
        u.indexOf('ipod') !== -1 ||
        (u.indexOf('android') !== -1 && u.indexOf('mobile') !== -1) ||
        (u.indexOf('firefox') !== -1 && u.indexOf('mobile') !== -1) ||
        u.indexOf('blackberry') !== -1,
    };
  })(window.navigator.userAgent.toLowerCase());

  if (_ua.Mobile) {
    rootClass.add('_device-mobile');
  } else if (_ua.Tablet) {
    rootClass.add('_device-tablet');
  } else {
    rootClass.add('_device-pc');
  }
  if (navigator.platform.indexOf('Win') !== -1) {
    rootClass.add('_os-win');
  } else if (navigator.platform.toLowerCase().indexOf('mac') > -1) {
    rootClass.add('_os-mac');
  }
  if (ua.indexOf('iPhone') > 0) {
    rootClass.add('_mobile-iphone');
  } else if (ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0) {
    rootClass.add('_mobile-android');
  } else if (ua.indexOf('iPad') > 0) {
    rootClass.add('_mobile-ipad');
  }
  if (isOpera) {
    rootClass.add('_browser-opera');
  } else if (isIE) {
    rootClass.add('_browser-ie');
  } else if (isChrome) {
    rootClass.add('_browser-chrome');
  } else if (isSafari) {
    rootClass.add('_browser-safari');
  } else if (isEdge) {
    rootClass.add('_browser-edge');
  } else if (isFirefox) {
    rootClass.add('_browser-firefox');
  }
}

const setVw = function () {
  const vw = document.documentElement.clientWidth / 100;
  document.documentElement.style.setProperty('--vw', `${vw}px`);
};
window.addEventListener('DOMContentLoaded', setVw);
window.addEventListener('resize', setVw);

(function ($) {
  $.fn.floatingWidget = function () {
    return this.each(function () {
      const $this = $(this),
        $parent = $this.offsetParent(),
        $body = $('body'),
        $window = $(window),
        top =
          $this.offset().top -
          parseFloat($this.css('marginTop').replace(/auto/, 0)),
        floatingClass = '_fixed';
      if ($parent.height() > $this.outerHeight(true)) {
        $window.on('load scroll', function () {
          let y = $window.scrollTop();
          if (y > top) {
            $body.addClass(floatingClass);
          } else {
            $body.removeClass(floatingClass);
          }
        });
      }
    });
  };

  const moduleNavToggle = function () {
    const moduleNavItems = document.querySelectorAll('[class*="mm_item"]._hasChild');
    moduleNavItems.forEach(item => {
        const itemButton = item.querySelector('[class*="mm_button"]');
        if (!itemButton) return;
        itemButton.addEventListener('click', function () {
            if (item.getAttribute('data-open') === 'true') {
                item.setAttribute('data-open', 'false');
            } else {
                item.setAttribute('data-open', 'true');
            }
        });
    });
  };

  const dropdownNavToggle = function () {
    const dropdownNavItems = document.querySelectorAll('[class*="mdd_item"]._hasChild');
    dropdownNavItems.forEach(item => {
        const itemButton = item.querySelector('[class*="mdd_button"]');
        if (!itemButton) return;
        itemButton.addEventListener('click', function () {
            if (item.getAttribute('data-open') === 'true') {
                item.setAttribute('data-open', 'false');
            } else {
                item.setAttribute('data-open', 'true');
            }
        });
    });
  };

  const pageScroll = function () {
    $(document).ready(function () {
      const urlHash = location.hash;
      if ('' !== urlHash) {
        $('body,html').stop().scrollTop(1);
        setTimeout(function () {
          scrollToAnker(urlHash);
        }, 300);
      }

      $('a[href^="#"]')
        .not(
          'ul[class*="tab-head"] a[href^="#"], .lnl_title , .frm_repeat_buttons a',
        )
        .on('click', function () {
          const href = $(this).attr('href');
          const hash = href === '#' || href === '' ? 'html' : href;
          scrollToAnker(hash);
          return false;
        });

      function scrollToAnker(hash) {
        const target = $(hash);
        const header = $('#global_header').innerHeight() + 30;
        const position = target.offset().top - header;
        $('body,html').stop().animate({ scrollTop: position }, 300);
      }
    });
  };

  const toggleMenu = function () {
    const $body = $('body');
    const $nav = $('#global_navigation');
    const $searchBlock = $nav.children('.gn_search');
    const $searchButton = $('#gh_search');
    const searchDuration = 300;
    const $searchPanel = $('<div id="gh_searchPanel" class="gh_searchPanel" hidden />');
    $body.append($searchPanel);

    const searchPanelHeight = function () {
      const raw = window.getComputedStyle($searchPanel.get(0)).getPropertyValue('--_search-panel-height');
      const parsed = parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : 180;
    };

    const restoreSearchToNav = function () {
      $searchPanel.stop(true, true).hide().attr('hidden', true).css({ height: '' });
      if ($searchBlock.length && $searchBlock.parent()[0] !== $nav[0]) {
        $nav.append($searchBlock);
      }
    };

    const closeMenuUi = function () {
      $body.removeClass('_open-menu');
      $('#gh_menu').attr('aria-expanded', 'false');
    };

    const closeSearchUi = function (immediate, onDone) {
      $searchButton.attr('aria-expanded', 'false');
      const finish = function () {
        restoreSearchToNav();
        $body.removeClass('_open-search');
        $body.trigger('nb:overlaychange');
        if (typeof onDone === 'function') {
          onDone();
        }
      };
      if (immediate || !$searchPanel.is(':visible')) {
        finish();
        return;
      }
      $searchPanel.stop(true, true).animate({ height: 0 }, searchDuration, 'swing', finish);
    };

    const closeOverlays = function (immediate) {
      closeMenuUi();
      closeSearchUi(immediate, function () {
        if (!$body.hasClass('_open-menu')) {
          $body.removeClass('_open-bg');
        }
        $body.trigger('nb:overlaychange');
      });
    };

    $('#gh_menu').on('click', function () {
      const opening = !$body.hasClass('_open-menu');
      closeSearchUi(true);
      closeAllTouchMenusKeepBg();
      if (opening) {
        $body.addClass('_open-menu _open-bg');
      } else {
        closeMenuUi();
        $body.removeClass('_open-bg');
      }
      $(this).attr('aria-expanded', opening ? 'true' : 'false');
    });
    $('#gn_close').on('click', function () {
      closeOverlays(true);
    });
    const globalNavItems = document.querySelectorAll('[class*="gnl_item"]._hasChild');
    globalNavItems.forEach(item => {
        const itemButton = item.querySelector(':scope > [class*="gnl_title"] > [class*="gnl_button"]');
        if (!itemButton) return;
        itemButton.addEventListener('click', function (e) {
            e.stopPropagation();
            if (item.getAttribute('data-open') === 'true') {
                item.setAttribute('data-open', 'false');
            } else {
                item.setAttribute('data-open', 'true');
            }
        });
    });

    const footerNavItems = document.querySelectorAll('[class*="gfl_item"]._hasChild');
    footerNavItems.forEach(item => {
        const itemButton = item.querySelector('[class*="gfl_button"]');
        if (!itemButton) return;
        itemButton.addEventListener('click', function () {
            if (item.getAttribute('data-open') === 'true') {
                item.setAttribute('data-open', 'false');
            } else {
                item.setAttribute('data-open', 'true');
            }
        });
    });

    // PC layout begins at the same 768px boundary as global_header.css.
    const headerBreakpointMin = 768;
    const touchOpenClass = '_touchOpen';
    const closeAllTouchMenusKeepBg = () => {
      const touchOpenItems = document.querySelectorAll(`.global_header .gn_mega [class*="gnl_item"].${touchOpenClass}`);
      touchOpenItems.forEach((el) => el.classList.remove(touchOpenClass));
    };
    const closeAllTouchMenus = () => {
      closeAllTouchMenusKeepBg();
      if (!$body.hasClass('_open-menu') && !$body.hasClass('_open-search')) {
        $body.removeClass('_open-bg');
      }
    };

    const touchMegaMenuSupport = function () {
      const hasTouch = navigator.maxTouchPoints > 0;
      if (hasTouch) {
        document.documentElement.classList.add('_device-touch');
      }

      const isPcLayout = () => window.innerWidth >= headerBreakpointMin;

      if (!hasTouch) return;

      const touchParentItems = document.querySelectorAll('.global_header .gn_mega [class*="gnl_item"]._hasChild');

      touchParentItems.forEach((li) => {
        li.addEventListener('touchstart', (e) => {
            if (!isPcLayout()) return;
            if (e.target.closest('[class*="gnl_wrapper"]')) return;

            const onParentRow = e.target.closest('[class*="gnl_title"]');
            if (!onParentRow) return;
            if (li.classList.contains(touchOpenClass)) return;

            const openItem = document.querySelector(
              `.global_header .gn_mega [class*="gnl_item"].${touchOpenClass}`
            );
            if (openItem && openItem !== li) {
              closeAllTouchMenus();
            }

            e.preventDefault();
            li.classList.add(touchOpenClass);
            $body.addClass('_open-bg');
          },
          { passive: false }
        );
      });

      document.addEventListener('touchstart',(e) => {
          if (!isPcLayout()) return;
          const touchedInParentItem = e.target.closest('.global_header .gn_mega [class*="gnl_item"]._hasChild');
          if (!touchedInParentItem) {
            closeAllTouchMenus();
          }
        },
        { passive: true }
      );
    };
    touchMegaMenuSupport();

    let lastWidthForBreakpoint = null;
    $(window).on('load resize', function () {
      const currentWidth = $(window).width();
      const wasPcOrOver = lastWidthForBreakpoint !== null && lastWidthForBreakpoint >= headerBreakpointMin;
      const isPcOrOver = currentWidth >= headerBreakpointMin;
      if (lastWidthForBreakpoint !== null && wasPcOrOver !== isPcOrOver) {
        closeAllTouchMenus();
        closeOverlays(true);
        $body.removeClass('_contentFixed');
      }
      lastWidthForBreakpoint = currentWidth;
    });

    $searchButton.attr('aria-expanded', 'false');
    $searchButton.on('click', function () {
      const opening = !$body.hasClass('_open-search');
      closeAllTouchMenusKeepBg();
      closeMenuUi();
      if (opening) {
        $searchPanel.append($searchBlock);
        $body.addClass('_open-search _open-bg');
        $searchButton.attr('aria-expanded', 'true');
        $searchPanel
          .css({ display: 'flex', height: 0, overflow: 'hidden' })
          .removeAttr('hidden')
          .stop(true, true)
          .animate({ height: searchPanelHeight() }, searchDuration, 'swing', function () {
            $searchBlock.find('.ms_input').trigger('focus');
          });
      } else {
        closeSearchUi(false, function () {
          if (!$body.hasClass('_open-menu')) {
            $body.removeClass('_open-bg');
          }
        });
      }
    });

    $('#gns_close, #overlay').on('click', function () {
      closeOverlays(false);
    });

    $(document).on('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (!$body.hasClass('_open-menu') && !$body.hasClass('_open-search')) return;
      closeOverlays(false);
    });

    $(window).on('load resize', function () {
      const w = $(window).width();
      if (w < 768) {
        $('html').addClass('_sp').removeClass('_pc _tablet');
      } else if (w < 1024) {
        $('html').addClass('_tablet').removeClass('_pc _sp');
      } else {
        $('html').addClass('_pc').removeClass('_tablet _sp');
      }
    });
  };

  const addCss = function () {
    const notIcon = $(
      '[class*="module_card-"] a, .global_contents p a.icon-none, .top_banner-01 a',
    );
    $('.global_contents a:not([class])[target="_blank"]')
      .not(notIcon)
      .each(function () {
        $(this).addClass('icon-blank');
      });

    $('.gc_main table:not([class])').each(function () {
      $(this).addClass('module_table-01');
    });
  };

  const initHTML = function () {
    $('.gc_main p').each(function () {
      let txt = $(this);
      if (txt.html().replace(/\s|&nbsp;/g, '').length === 0) {
        txt.remove();
      }
    });

    $('.module_table-01').wrap('<div class="module_table-wrap"></div>');
    $(window).on('load resize', function () {
      $('.module_table-wrap').each(function () {
        const $wrapperWidth = $(this).width();
        const $innerWidth = $(this).find('.module_table-01').width();
        if ($wrapperWidth < $innerWidth) {
          $(this).addClass('_scroll');
        } else {
          $(this).removeClass('_scroll');
        }
      });
    });

    $('.module_password form input[type="submit"]').wrap(
      '<span class="mp_submit-wrap"><span class="mp_submit-inner"></span></span>',
    );
  };

  const moduleModal = function () {
    $('[class*="module_gallery"] a').modaal({
      type: 'image',
    });
  };

  const contentFixed = function () {
    const $body = $('body');
    let scrollpos = 0;
    const apply = function () {
      const shouldLock = $body.hasClass('_open-menu') || $body.hasClass('_open-search');
      const locked = $body.hasClass('_contentFixed');
      if (shouldLock && !locked) {
        scrollpos = $(window).scrollTop();
        $body.addClass('_contentFixed').css({ top: -scrollpos });
      } else if (!shouldLock && locked) {
        $body.removeClass('_contentFixed').css({ top: 0 });
        window.scrollTo(0, scrollpos);
      }
    };
    $('#gh_menu, #gh_search, #gn_close, #overlay').on('click', function () {
      window.setTimeout(apply, 0);
    });
    $body.on('nb:overlaychange', apply);
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape') {
        window.setTimeout(apply, 0);
      }
    });
    const headerBreakpointMin = 768;
    let lastWidthForContentFixedBreakpoint = null;
    $(window).on('load resize', function () {
      const currentWidth = $(window).width();
      const wasPcOrOver = lastWidthForContentFixedBreakpoint !== null && lastWidthForContentFixedBreakpoint >= headerBreakpointMin;
      const isPcOrOver = currentWidth >= headerBreakpointMin;
      if (lastWidthForContentFixedBreakpoint !== null && wasPcOrOver !== isPcOrOver) {
        apply();
      }
      lastWidthForContentFixedBreakpoint = currentWidth;
    });
  };

  const pageTop = function () {
    const gf_pageTop = $('#js_gf_pageTop');
    gf_pageTop.show();
    gf_pageTop.find('a').on('click', function (e) {
      e.preventDefault();
      $('body,html').stop().animate({ scrollTop: 0 }, 300);
    });
  };

  const lightboxWrap = function () {
    $('.block-editor_wrap figure.wp-lightbox-container img').each(function () {
      $(this).wrap('<div class="lightbox_wrap"></div>');
    });
  };

  const tab = function () {
    document.addEventListener('DOMContentLoaded', () => {
      document
        .querySelectorAll('.module_tab-wrapper')
        .forEach((tabWrapper, wrapperIndex) => {
          const panels = tabWrapper.querySelectorAll('.tab-panel');
          const buttonsContainer = tabWrapper.querySelector('.tab-buttons');

          panels.forEach((panel, index) => {
            const title = panel.dataset.title || `Tab ${index + 1}`;
            const slug = title
              .toLowerCase()
              .normalize('NFKD')
              .replace(/[^\w\s-]/g, '')
              .trim()
              .replace(/\s+/g, '-')
              .slice(0, 20);

            const tabId = `tab-${wrapperIndex + 1}-${slug || index + 1}`;
            panel.id = tabId;

            const button = document.createElement('button');
            button.className = 'tab-button';
            button.setAttribute('data-tab', tabId);
            button.setAttribute('type', 'button');
            button.innerText = title;

            button.addEventListener('click', () => {
              panels.forEach((p) => (p.style.display = 'none'));
              tabWrapper
                .querySelectorAll('.tab-button')
                .forEach((b) => b.classList.remove('active'));
              panel.style.display = '';
              button.classList.add('active');
            });

            buttonsContainer.appendChild(button);
          });

          if (panels.length > 0) {
            panels.forEach((p) => (p.style.display = 'none'));
            panels[0].style.display = '';
            const firstButton = buttonsContainer.querySelector('.tab-button');
            if (firstButton) firstButton.classList.add('active');
          }
        });
    });
  };

  moduleNavToggle();
  dropdownNavToggle();
  pageScroll();
  toggleMenu();
  addCss();
  initHTML();
  moduleModal();
  contentFixed();
  pageTop();
  lightboxWrap();
  tab();
})(jQuery);
