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
    rootClass.add('_device-mobile'); //スマホならつけるクラス
  } else if (_ua.Tablet) {
    rootClass.add('_device-tablet'); //タブレットならつけるクラス
  } else {
    rootClass.add('_device-pc'); //スマホ・タブレット以外ならつけるクラス
  }
  if (navigator.platform.indexOf('Win') !== -1) {
    rootClass.add('_os-win'); //Windowsならつけるクラス
  } else if (navigator.platform.toLowerCase().indexOf('mac') > -1) {
    rootClass.add('_os-mac'); //Windows以外ならつけるクラス
  }
  if (ua.indexOf('iPhone') > 0) {
    rootClass.add('_mobile-iphone'); //iPhoneならつけるクラス
  } else if (ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0) {
    rootClass.add('_mobile-android'); //Androidのスマホならつけるクラス
  } else if (ua.indexOf('iPad') > 0) {
    rootClass.add('_mobile-ipad'); //iPadならつけるクラス
  }
  if (isOpera) {
    rootClass.add('_browser-opera'); //オペラならつけるクラス
  } else if (isIE) {
    rootClass.add('_browser-ie'); //IEならつけるクラス
  } else if (isChrome) {
    rootClass.add('_browser-chrome'); //Chromeならつけるクラス
  } else if (isSafari) {
    rootClass.add('_browser-safari'); //Safariならつけるクラス
  } else if (isEdge) {
    rootClass.add('_browser-edge'); //Edgeならつけるクラス
  } else if (isFirefox) {
    rootClass.add('_browser-firefox'); //Firefoxならつけるクラス
  }
}

// ==========================================================================
// CSS遅延読み込み（class="async"をrel="stylesheet"に置換）
// ==========================================================================
// {
//   const webFonts = document.querySelectorAll('.async');
//   for (let i = 0, l = webFonts.length; i < l; i++) {
//     webFonts[i].rel = 'stylesheet';
//   }
// }

// ==========================================================================
//【CSS】カスタムプロパティvw https://www.6666666.jp/html/20220127/
// ==========================================================================
const setVw = function () {
  const vw = document.documentElement.clientWidth / 100;
  document.documentElement.style.setProperty('--vw', `${vw}px`);
};
window.addEventListener('DOMContentLoaded', setVw);
window.addEventListener('resize', setVw);

(function ($) {
  // Match the CSS layout owners; do not infer rem boundaries from innerWidth.
  const headerDesktop = window.matchMedia('(min-width: 67.5rem)');
  const footerDesktop = window.matchMedia('(min-width: 48rem)');
  // ==========================================================================
  // ターゲットが特定位置を過ぎたらclass付与（ヘッダー追従）https://terkel.jp/archives/2011/05/jquery-floating-widget-plugin/
  // ==========================================================================
  $.fn.floatingWidget = function () {
    return this.each(function () {
      const $this = $(this),
        $parent = $this.offsetParent(),
        $body = $('body'),
        $window = $(window),
        top =
          $this.offset().top -
          parseFloat($this.css('marginTop').replace(/auto/, 0)),
        // bottom = $parent.offset().top + $parent.height() - $this.outerHeight(true),
        floatingClass = '_fixed';
      // pinnedBottomClass = '_bottom';
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

  // ==========================================================================
  // グローバルナビゲーションカレント制御
  // ==========================================================================
//   const globalNavCurrent = function () {
//     const nav = $('#global_navigation'); // 第二階層をデフォルトで折りたたみ
//     let condIndex =
//       /(http[s]?:\/\/(?:[\w-_]+\.?){1,6}(?::\d+)?\/?)|\/[0-9]*\/[0-9]*\/[\w]*\.html?|\/[\w]*\.html?/; // index 除去条件
//     let path = location.href.replace(condIndex, '/'); // URL
//     const checks = [path];

//     // 文字列末尾から 1 ディレクトリずつ削り、URL を収集
//     while (path && '/' !== path) {
//       path = path.replace(/[^/]*\/?$/, '');
//       checks.push(path);
//     }

//     // メニューの href 属性値をすべて取得
//     let href = $('a', nav).map(function () {
//       return $(this).attr('href').replace(condIndex, '/');
//     });

//     // URL と href 属性値の一致を判定
//     // 一致した a 要素には class 属性値「current」を付与
//     checkStart: for (let i = 0; i < checks.length; i++) {
//       for (let j = 0; j < href.length; j++) {
//         if (checks[i] === href[j]) {
//           $('a', nav)
//             .eq(j)
//             .addClass('_current')
//             .parents('li')
//             .addClass('_parent');
//           break checkStart;
//         }
//       }
//     }
//   };

  // ==========================================================================
  // モジュールナビゲーション開閉制御
  // ==========================================================================
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

  // ==========================================================================
  // ドロップダウンナビゲーション開閉制御
  // ==========================================================================
  // News category overlay: keep native details as the no-JS fallback.
  const newsCategoryDisclosure = function () {
    document.querySelectorAll('.jwsnj_newsArchive_filterMenu').forEach(details => {
      const summary = details.querySelector('summary');
      const panel = details.querySelector('ul');
      if (!summary || !panel) return;
      let closeTimer;
      const setOpen = open => {
        window.clearTimeout(closeTimer);
        if (open) {
          details.open = true;
          // Commit the closed visual state before starting the transition.
          panel.getBoundingClientRect();
          panel.inert = false;
          details.dataset.open = 'true';
          summary.setAttribute('aria-expanded', 'true');
        } else {
          if (panel.contains(document.activeElement)) summary.focus({ preventScroll: true });
          details.dataset.open = 'false';
          summary.setAttribute('aria-expanded', 'false');
          panel.inert = true;
          // Keep native details open until the closing transition has finished.
          const duration = getComputedStyle(panel).transitionDuration.split(',')[0].trim();
          const ms = parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
          if (ms > 0 && details.open) {
            closeTimer = window.setTimeout(() => { details.open = false; }, ms);
          } else {
            details.open = false;
          }
        }
      };
      details.dataset.motion = 'true';
      details.dataset.open = String(details.open);
      summary.setAttribute('aria-expanded', String(details.open));
      panel.inert = !details.open;
      summary.addEventListener('click', event => {
        event.preventDefault();
        setOpen(details.dataset.open !== 'true');
      });
      details.addEventListener('keydown', event => {
        if (event.key === 'Escape' && details.dataset.open === 'true') {
          event.preventDefault();
          setOpen(false);
          summary.focus({ preventScroll: true });
        }
      });
      document.addEventListener('pointerdown', event => {
        if (details.dataset.open === 'true' && !details.contains(event.target)) setOpen(false);
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

  // ==========================================================================
  // ローカルナビゲーションカレント制御
  // ==========================================================================
//   const localNavCurrent = () => {
//     const $nav = $('#local_navigation');

//     // index.html などを除去するためのパターン
//     const urlPattern =
//       /(http[s]?:\/\/(?:[\w-_]+\.?){1,6}(?::\d+)?\/?)|\/[0-9]*\/[0-9]*\/[\w-]+\.(?:html?)?/;

//     // URL文字列を正規化
//     const normalize = (url) => {
//       return (
//         url
//           .replace(urlPattern, '/') // ドメイン / index.html などを除去
//           .replace(/\/$/, '') || '/'
//       ); // 末尾 / を揃える
//     };

//     // 現在ページの階層リストを生成
//     const getCurrentPathHierarchy = () => {
//       let path = normalize(
//         `${location.protocol}//${location.host}${location.pathname}`,
//       );
//       const hierarchy = [path];
//       while (path && path !== '/') {
//         path = path.replace(/[^/]*\/?$/, '').replace(/\/$/, '') || '/';
//         hierarchy.push(path);
//       }
//       return hierarchy;
//     };

//     // ナビ内リンクを抽出して正規化
//     const getNavLinks = () =>
//       $('a', $nav)
//         .toArray()
//         .map((el) => {
//           const $link = $(el);
//           const raw = $link.attr('href') || '';
//           if (!raw || raw.startsWith('#') || raw.startsWith('javascript:'))
//             return null;
//           return { element: $link, href: normalize(raw) };
//         })
//         .filter(Boolean); // null を除外

//     // クラス付与
//     const setCurrentState = ($el) => {
//       $el
//         .addClass('_current')
//         .parents('li')
//         .addClass('_parent')
//         .closest('.lnl_wrapper')
//         .css('display', 'block')
//         .prevAll('button')
//         .addClass('_open');
//     };

//     // メイン処理
//     const hierarchy = getCurrentPathHierarchy();
//     const links = getNavLinks();

//     let best = null;
//     let depth = 0;
//     for (const { element, href } of links) {
//       if (hierarchy.includes(href)) {
//         const d = href.split('/').filter(Boolean).length;
//         if (d > depth) {
//           best = element;
//           depth = d;
//         }
//       }
//     }
//     if (best) setCurrentState(best);
//   };

  // ==========================================================================
  // スムーススクロール制御（ヘッダー分の高さは「const header = $('#global_header').height() * 2.5;」で調整）
  // ==========================================================================
  const pageScroll = function () {
    $(document).ready(function () {
      //URLのハッシュ値を取得
      const urlHash = location.hash;
      //ハッシュ値があればページ内スクロール
      if ('' !== urlHash) {
        // Do not move the page before validating the CMS fragment.
        setTimeout(function () {
          //ロード時の処理を待ち、時間差でスクロール実行
          scrollToAnker(urlHash);
        }, 300);
      }

      //通常のクリック時
      $('a[href^="#"]')
        .not(
          'ul[class*="tab-head"] a[href^="#"], .lnl_title , .frm_repeat_buttons a',
        )
        .on('click', function () {
          //ページ内リンク先を取得
          const href = $(this).attr('href');
          //リンク先が#か空だったらhtmlに
          const hash = href === '#' || href === '' ? 'html' : href;
          //スクロール実行
          scrollToAnker(hash);
          //リンク無効化
          return false;
        });

      // 関数：スムーススクロール
      // 指定したアンカー(#ID)へアニメーションでスクロール
      function scrollToAnker(hash) {
        // Resolve literal HTML IDs, not jQuery/CSS selectors.
        // Percent-encoded Japanese or punctuation-bearing IDs remain valid.
        let element = document.documentElement;
        if (hash !== 'html') {
          try {
            element = document.getElementById(decodeURIComponent(hash.slice(1)));
          } catch {
            return;
          }
        }
        const target = $(element);
        // A missing/deleted CMS anchor must not throw or move the viewport.
        if (!target.length) return;
        const $header = $('#global_header');
        const header = ($header.length ? $header.innerHeight() : 0) + 30;
        // The offset may be unavailable for detached/unrendered CMS content.
        const offset = target.offset();
        if (!offset || !Number.isFinite(offset.top)) return;
        const position = Math.max(0, offset.top - header);
        const scroller = $('body,html').stop();
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          scroller.scrollTop(position);
        } else {
          scroller.animate({ scrollTop: position }, 300);
        }
      }
    });
  };

  // ==========================================================================
  // SP用メニュー＆PCメガメニュー設定
  // ==========================================================================
  const toggleMenu = function () {
    const $body = $('body');
    // グローバルナビゲーション
    const $menuButton = $('#gh_menu');
    const $globalNavigation = $('#global_navigation');
    let scrollPosition = null;
    const syncScrollLock = (isOpen) => {
      if (isOpen && scrollPosition === null) {
        // The legacy tablet layout can scroll horizontally as well as vertically.
        scrollPosition = { x: window.scrollX, y: window.scrollY };
        $body.addClass('_contentFixed').css({ left: -scrollPosition.x, top: -scrollPosition.y });
      } else if (!isOpen && scrollPosition !== null) {
        $body.removeClass('_contentFixed').css({ left: '', top: '' });
        window.scrollTo(scrollPosition.x, scrollPosition.y);
        scrollPosition = null;
      }
    };
    const syncBackdrop = () => {
      const touchOpen = document.querySelector('.global_navigation [class*="gnl_item"]._touchOpen');
      $body.toggleClass('_open-bg', $body.hasClass('_open-menu') || $body.hasClass('_open-search') || !!touchOpen);
    };
    const syncMobileMenu = () => {
      const isOpen = $body.hasClass('_open-menu');
      $menuButton.attr('aria-expanded', String(isOpen));
      $menuButton.attr('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
      // Move focus out before hiding the navigation on close or a desktop-to-SP resize.
      const hiddenForMobile = !isOpen && !headerDesktop.matches;
      const navigation = document.getElementById('global_navigation');
      if (hiddenForMobile && navigation && navigation.contains(document.activeElement)) {
        $menuButton.trigger('focus');
      }
      // The desktop navigation remains available even when the mobile disclosure is closed.
      $globalNavigation.attr('inert', hiddenForMobile ? '' : null);
      syncScrollLock(isOpen && !headerDesktop.matches);
      syncBackdrop();
    };
    const closeMobileMenu = (restoreFocus = false) => {
      const wasOpen = $body.hasClass('_open-menu');
      $body.removeClass('_open-menu');
      syncMobileMenu();
      if (restoreFocus && wasOpen) $menuButton.trigger('focus');
    };
    $menuButton.on('click', function () {
      if (headerDesktop.matches) return;
      $body.toggleClass('_open-menu');
      syncMobileMenu();
    });
    $('#gn_close').on('click', function () {
      closeMobileMenu(true);
    });
    $(document).on('keydown', function (event) {
      if (event.key === 'Escape' && $body.hasClass('_open-menu')) {
        closeMobileMenu(true);
      }
    });
    syncMobileMenu();
    // Collapsed accordion submenus must not be keyboard-focusable on SP.
    // Only the direct child wrapper belongs to this disclosure: a nested wrapper
    // may be present, but must remain controlled by its own menu item.
    const syncSubmenuFocusability = (item, prefix, desktopMedia) => {
      const wrapper = Array.from(item.children).find(child =>
        child.matches(`[class*="${prefix}_wrapper"]`)
      );
      if (!wrapper) return;
      const collapsed = !desktopMedia.matches && item.getAttribute('data-open') !== 'true';
      if (collapsed && wrapper.contains(document.activeElement)) {
        const trigger = item.querySelector(`[class*="${prefix}_button"]`);
        if (trigger) trigger.focus();
      }
      wrapper.inert = collapsed;
    };
    const globalNavItems = document.querySelectorAll('[class*="gnl_item"]._hasChild');
    globalNavItems.forEach(item => {
        const itemButton = item.querySelector('[class*="gnl_button"]');
        if (!itemButton) return;
        itemButton.setAttribute('aria-expanded', String(item.getAttribute('data-open') === 'true'));
        syncSubmenuFocusability(item, 'gnl', headerDesktop);
        itemButton.addEventListener('click', function () {
            const isOpen = item.getAttribute('data-open') !== 'true';
            item.setAttribute('data-open', String(isOpen));
            itemButton.setAttribute('aria-expanded', String(isOpen));
            syncSubmenuFocusability(item, 'gnl', headerDesktop);
        });
        // The desktop top-level submenu also opens on hover via CSS.
        if (item.classList.contains('gnl_item-02')) {
          const syncDesktopHoverState = () => {
            if (!headerDesktop.matches) return;
            const isOpen = item.matches(':hover') || item.matches(':focus-within') ||
              item.getAttribute('data-open') === 'true' || item.classList.contains('_touchOpen');
            itemButton.setAttribute('aria-expanded', String(isOpen));
          };
          item.addEventListener('mouseenter', syncDesktopHoverState);
          item.addEventListener('mouseleave', syncDesktopHoverState);
          item.addEventListener('focusin', syncDesktopHoverState);
          item.addEventListener('focusout', () => {
            // focusout fires before focus settles on the next item; defer only the state read.
            queueMicrotask(syncDesktopHoverState);
          });
        }
    });

    const footerNavItems = document.querySelectorAll('[class*="gfl_item"]._hasChild');
    footerNavItems.forEach(item => {
        const itemButton = item.querySelector('[class*="gfl_button"]');
        if (!itemButton) return;
        itemButton.setAttribute('aria-expanded', String(item.getAttribute('data-open') === 'true'));
        syncSubmenuFocusability(item, 'gfl', footerDesktop);
        itemButton.addEventListener('click', function () {
            const isOpen = item.getAttribute('data-open') !== 'true';
            item.setAttribute('data-open', String(isOpen));
            itemButton.setAttribute('aria-expanded', String(isOpen));
            syncSubmenuFocusability(item, 'gfl', footerDesktop);
        });
    });

    // ==========================================================================
    // タッチデバイス：メガメニュー親リンクの1回目タップで遷移防止（global_navigationのメガメニューレイアウトのみ）
    // - touchstartでpreventDefaultする
    // - 2回目タップ（メニュー表示中）は遷移許可（preventDefaultしない）
    // ==========================================================================
    // MARK: header_breakpoint
    // メガメニューのタッチ展開状態クラス（touchMegaMenuSupport とブレークポイント跨ぎ処理の両方から参照）
    const touchOpenClass = '_touchOpen';
    // すべてのタッチ用メガメニューを閉じる（resize 時は toggleMenu スコープからも呼ぶ）
    const closeAllTouchMenus = () => {
      const touchOpenItems = document.querySelectorAll(`.global_navigation [class*="gnl_item"].${touchOpenClass}`);
      touchOpenItems.forEach((el) => {
        el.classList.remove(touchOpenClass);
        const button = el.querySelector('[class*="gnl_button"]');
        if (button) button.setAttribute('aria-expanded', String(el.getAttribute('data-open') === 'true'));
      });
      syncBackdrop();
    };

    const touchMegaMenuSupport = function () {
      const hasTouch = navigator.maxTouchPoints > 0; // タッチデバイスかどうかを判定
      if (hasTouch) {
        document.documentElement.classList.add('_device-touch');
      }

      const isPcLayout = () => headerDesktop.matches; // PCレイアウトかどうかを判定

      if (!hasTouch) return; // タッチデバイスでない場合は処理しない

      const touchParentItems = document.querySelectorAll('.global_navigation [class*="gnl_item"]._hasChild');

      touchParentItems.forEach((li) => {
        li.addEventListener('touchstart', (e) => {
            if (!isPcLayout()) return; // PCレイアウトでない場合は処理しない

            // サブメニュー内のタップは通常の遷移を許可
            if (e.target.closest('[class*="gnl_wrapper"]')) return;

            // 親リンク（gnl_title内のgnl_link）をタップした時のみ処理
            const link = e.target.closest('[class*="gnl_title"] [class*="gnl_link"]');
            if (!link) return; // リンクが見つからない場合は処理しない

            // メニューがすでに開いている＝2回目タップ→遷移許可（preventDefaultしない）
            if (li.classList.contains(touchOpenClass)) return;

            // 別のメニューが開いている場合はいったん閉じる
            const openItem = document.querySelector(
              `.global_navigation [class*="gnl_item"].${touchOpenClass}`
            );
            if (openItem && openItem !== li) {
              closeAllTouchMenus();
            }

            // 1回目タップ：遷移を防ぎ、メニューを開く（オーバーレイも表示）
            e.preventDefault();
            li.classList.add(touchOpenClass);
            const disclosure = li.querySelector('[class*="gnl_button"]');
            if (disclosure) disclosure.setAttribute('aria-expanded', 'true');
            syncBackdrop();
          },
          { passive: false }
        );
      });

      // 枠外タップでメニューを閉じる
      document.addEventListener('touchstart',(e) => {
          if (!isPcLayout()) return;
          const touchedInParentItem = e.target.closest('.global_navigation [class*="gnl_item"]._hasChild');
          if (!touchedInParentItem) {
            closeAllTouchMenus();
          }
        },
        { passive: true }
      );
    };
    touchMegaMenuSupport();

    // PCタッチ操作で展開したメガメニューもEscapeで閉じ、親リンクへフォーカスを戻す。
    $(document).on('keydown', function (event) {
      if (event.key !== 'Escape' || !headerDesktop.matches) return;
      const expanded = document.querySelector(`.global_navigation [class*="gnl_item"].${touchOpenClass}`);
      if (!expanded) return;
      const trigger = expanded.querySelector('[class*="gnl_title"] [class*="gnl_link"]');
      closeAllTouchMenus();
      if (trigger) trigger.focus();
    });

    // ブレークポイントを跨いだときに不要なクラスを削除
    let lastHeaderDesktop = headerDesktop.matches;
    const syncResponsiveMenu = function () {
      const isPcOrOver = headerDesktop.matches;
      if (lastHeaderDesktop !== isPcOrOver) {
        closeAllTouchMenus();
        closeMobileMenu();
        // PC hover state may outlive its media query when switching to the SP layout.
        globalNavItems.forEach((item) => {
          const button = item.querySelector('[class*="gnl_button"]');
          if (button) button.setAttribute('aria-expanded', String(item.getAttribute('data-open') === 'true'));
        });
      }
      // Reconcile closed accordion focusability even on resizes within a layout.
      globalNavItems.forEach(item => syncSubmenuFocusability(item, 'gnl', headerDesktop));
      footerNavItems.forEach(item => syncSubmenuFocusability(item, 'gfl', footerDesktop));
      lastHeaderDesktop = isPcOrOver;
    };
    $(window).on('load resize', syncResponsiveMenu);
    headerDesktop.addEventListener('change', syncResponsiveMenu);
    footerDesktop.addEventListener('change', syncResponsiveMenu);

    // 検索
    $('#search').on('click', function () {
      const isOpen = !$body.hasClass('_open-search');
      $body.toggleClass('_open-search', isOpen);
      syncBackdrop();
    });

    $('#gns_close, #overlay').on('click', function () {
      $body.removeClass('_open-search');
      // Also dismiss touch-open PC mega menus when the backdrop is clicked.
      closeAllTouchMenus();
      // Restore keyboard focus to the trigger when the mobile menu is dismissed externally.
      closeMobileMenu(true);
    });


  };

  // ==========================================================================
  // Class付与
  // ==========================================================================
  const addCss = function () {
    // .global_contents内の新窓リンクにclass追加
    const notIcon = $(
      '[class*="module_card-"] a, .global_contents p a.icon-none, .top_banner-01 a',
    );
    $('.global_contents a:not([class])[target="_blank"]')
      .not(notIcon)
      .each(function () {
        $(this).addClass('icon-blank');
      });

    // エディタ内の表にclass追加
    $('.gc_main table:not([class])').each(function () {
      $(this).addClass('module_table-01');
    });

    // WordPressページネーションのclass付け替え
    // $('ul.page-numbers')
    //   .addClass('module_pager-01')
    //   .removeClass('page-numbers');
    // $('.module_pager-01 li.current')
    //   .prev('li')
    //   .addClass('current_prev')
    //   .prev('li')
    //   .addClass('current_prev2');
    // $('.module_pager-01 li.current')
    //   .next('li')
    //   .addClass('current_next')
    //   .next('li')
    //   .addClass('current_next2');
  };

  // ==========================================================================
  // タグ追加・削除
  // ==========================================================================
  const initHTML = function () {
    // Remove only unadorned empty paragraphs; editor IDs/classes/ARIA must survive.
    $('.gc_main p').each(function () {
      if (!this.attributes.length && $(this).html().replace(/\s|&nbsp;/g, '').length === 0) {
        $(this).remove();
      }
    });

    // Wrap each table once, even when initialization is replayed.
    $('.module_table-01').each(function () {
      if (!$(this).parent().hasClass('module_table-wrap')) {
        $(this).wrap('<div class="module_table-wrap"></div>');
      }
    });
    const syncTableOverflow = function () {
      $('.module_table-wrap').each(function () {
        const $wrapperWidth = $(this).width();
        const $innerWidth = $(this).find('.module_table-01').width();
        if ($wrapperWidth < $innerWidth) {
          $(this).addClass('_scroll');
        } else {
          $(this).removeClass('_scroll');
        }
      });
    };
    $(window).off('load.jwsnjTableWrap resize.jwsnjTableWrap').on('load.jwsnjTableWrap resize.jwsnjTableWrap', syncTableOverflow);
    syncTableOverflow();

    // Keep the existing password button decoration without nested duplicate wrappers.
    $('.module_password form input[type="submit"]').each(function () {
      if (!$(this).parent().hasClass('mp_submit-inner')) {
        $(this).wrap('<span class="mp_submit-wrap"><span class="mp_submit-inner"></span></span>');
      }
    });
  };

  // ==========================================================================
  // モジュールモーダル設定 http://www.humaan.com/modaal/
  // ==========================================================================
  const moduleModal = function () {
    $('[class*="module_gallery"] a').modaal({
      type: 'image',
    });
  };

  // ==========================================================================
  // モジュールアコーディオン設定
  // ==========================================================================
//   const moduleAccordion = function () {
//     $('.module_accordion-01 > li').each(function () {
//       const $list = $(this);
//       const $button = $(this).find('.head');
//       $list.find('.body').hide();
//       $button.on('click', function () {
//         if ($list.hasClass('_open')) {
//           $list.removeClass('_open');
//           $list.find('.body').slideUp(300);
//         } else {
//           // 項目を開いたときに他の項目を閉じる場合は下記を追加
//           // $('.module_faqList-01 > li').removeClass('_open').find('.body').slideUp(300);
//           $list.addClass('_open');
//           $list.find('.body').slideDown(300);
//         }
//       });
//     });
//   };

  // ==========================================================================
  // pageTop
  // ==========================================================================


  // ==========================================================================
  // メニューオープン時文言変更
  // ==========================================================================
  // const menuTextChange = function () {
  //     let menuText = $("#menuButton").children(".menuText");
  //     $("#menuButton").on("click", function () {
  //         if ($("body").hasClass("_open-menu")) {
  //             menuText.text("CLOSE");
  //         } else {
  //             menuText.text("MENU");
  //         }
  //     });

  //     $(window).on("load resize", function () {
  //         menuText.text("MENU");
  //     });
  // };

  // ==========================================================================
  // .wp-lightbox-containerをラップ
  // ==========================================================================
  const lightboxWrap = function () {
    $('.block-editor_wrap figure.wp-lightbox-container img').each(function () {
      if (!$(this).parent().hasClass('lightbox_wrap')) {
        $(this).wrap('<div class="lightbox_wrap"></div>');
      }
    });
  };

  // ==========================================================================
  // タブ
  // ==========================================================================
  // const tab = function () {
  //   document.addEventListener('DOMContentLoaded', () => {
  //     document
  //       .querySelectorAll('.module_tab-wrapper')
  //       .forEach((tabWrapper, wrapperIndex) => {
  //         const panels = tabWrapper.querySelectorAll('.tab-panel');
  //         const buttonsContainer = tabWrapper.querySelector('.tab-buttons');

  //         panels.forEach((panel, index) => {
  //           // タイトルを取得（未指定なら Tab 1, 2...）
  //           const title = panel.dataset.title || `Tab ${index + 1}`;

  //           // ユニークIDを生成（日本語は slugify して短縮）
  //           const slug = title
  //             .toLowerCase()
  //             .normalize('NFKD') // 濁点など除去
  //             .replace(/[^\w\s-]/g, '') // 記号除去
  //             .trim()
  //             .replace(/\s+/g, '-') // 空白→ハイフン
  //             .slice(0, 20); // 長すぎるIDを防止

  //           const tabId = `tab-${wrapperIndex + 1}-${slug || index + 1}`;
  //           panel.id = tabId;

  //           // ボタン生成
  //           const button = document.createElement('button');
  //           button.className = 'tab-button';
  //           button.setAttribute('data-tab', tabId);
  //           button.setAttribute('type', 'button');
  //           button.innerText = title;

  //           button.addEventListener('click', () => {
  //             panels.forEach((p) => (p.style.display = 'none'));
  //             tabWrapper
  //               .querySelectorAll('.tab-button')
  //               .forEach((b) => b.classList.remove('active'));
  //             panel.style.display = '';
  //             button.classList.add('active');
  //           });

  //           buttonsContainer.appendChild(button);
  //         });

  //         // 初期状態：最初のパネルを表示
  //         if (panels.length > 0) {
  //           panels.forEach((p) => (p.style.display = 'none'));
  //           panels[0].style.display = '';
  //           const firstButton = buttonsContainer.querySelector('.tab-button');
  //           if (firstButton) firstButton.classList.add('active');
  //         }
  //       });
  //   });
  // };

  // ==========================================================================
  // アーカイブナビゲーション
  // ==========================================================================
//   const archiveNavigation = function () {
//     $('#anl_button').on('click', function () {
//       $(this).toggleClass('active');
//       $(this).next('.anl_list').slideToggle(300);
//     });
//   };

  // ==========================================================================
  // 実行
  // ==========================================================================
  $('#global_header').floatingWidget();
//   globalNavCurrent();
  moduleNavToggle();
  dropdownNavToggle();
  newsCategoryDisclosure();
//   localNavCurrent();
  pageScroll();
  toggleMenu();
  addCss();
  initHTML();
  moduleModal();
//   moduleAccordion();
  // menuTextChange();
  lightboxWrap();
  // tab();
//   archiveNavigation();
})(jQuery);
