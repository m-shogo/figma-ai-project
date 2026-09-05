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
  const dropdownNavToggle = function () {
    const dropdownNavItems = document.querySelectorAll('[class*="mdd_item"]._hasChild');
    dropdownNavItems.forEach(item => {
        const itemButton = item.querySelector('[class*="mdd_button"]');
        if (!itemButton) return;
        const syncExpanded = function () {
          itemButton.setAttribute(
            'aria-expanded',
            item.getAttribute('data-open') === 'true' ? 'true' : 'false',
          );
        };
        syncExpanded();
        itemButton.addEventListener('click', function () {
            if (item.getAttribute('data-open') === 'true') {
                item.setAttribute('data-open', 'false');
            } else {
                item.setAttribute('data-open', 'true');
            }
            syncExpanded();
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
//       $('a', nav)
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
  // スムーススクロール制御
  // ==========================================================================
  const pageScroll = function () {
    $(document).ready(function () {
      // URLのハッシュ値を取得。初期ハッシュはブラウザが既に対象へ移動するため、
      // ページ上端へ戻さず、レイアウト安定後にヘッダー分だけ位置を補正する。
      const urlHash = location.hash;
      if ('' !== urlHash) {
        setTimeout(function () {
          scrollToAnker(urlHash, false);
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
          //スクロール実行。対象が存在しない場合は現在位置を維持する。
          scrollToAnker(hash, true);
          //リンク無効化
          return false;
        });

      // 関数：スムーススクロール
      // 指定したアンカー(#ID)へ移動。通常クリックのみアニメーションする。
      function scrollToAnker(hash, animate) {
        const target = $(hash);
        if (!target.length) return false;
        const targetOffset = target.offset();
        if (!targetOffset) return false;
        const header = $('#global_header').innerHeight() + 30;
        const position = Math.max(0, targetOffset.top - header);
        if (animate) {
          $('body,html').stop().animate({ scrollTop: position }, 300);
        } else {
          $('body,html').stop().scrollTop(position);
        }
        return true;
      }
    });
  };

  // ==========================================================================
  // SP用メニュー＆PCメガメニュー設定
  // ==========================================================================
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

    // グローバルナビゲーション（PCは右から / 検索は別パネル）
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

    // ==========================================================================
    // タッチデバイス：メガメニュー親リンクの1回目タップで遷移防止（global_navigationのメガメニューレイアウトのみ）
    // - touchstartでpreventDefaultする
    // - 2回目タップ（メニュー表示中）は遷移許可（preventDefaultしない）
    // ==========================================================================
    // PCレイアウトとみなす最小幅（toggleMenu / contentFixed のブレークポイント跨ぎで共通）
    // MARK: header_breakpoint
    const headerBreakpointMin = 768;
    // メガメニューのタッチ展開状態クラス（touchMegaMenuSupport とブレークポイント跨ぎ処理の両方から参照）
    const touchOpenClass = '_touchOpen';
    // すべてのタッチ用メガメニューを閉じる（resize 時は toggleMenu スコープからも呼ぶ）
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
      const hasTouch = navigator.maxTouchPoints > 0; // タッチデバイスかどうかを判定
      if (hasTouch) {
        document.documentElement.classList.add('_device-touch');
      }

      const isPcLayout = () => window.innerWidth >= headerBreakpointMin; // PCレイアウトかどうかを判定

      if (!hasTouch) return; // タッチデバイスでない場合は処理しない

      const touchParentItems = document.querySelectorAll('.global_header .gn_mega [class*="gnl_item"]._hasChild');

      touchParentItems.forEach((li) => {
        li.addEventListener('touchstart', (e) => {
            if (!isPcLayout()) return; // PCレイアウトでない場合は処理しない

            // サブメニュー内のタップは通常の遷移を許可
            if (e.target.closest('[class*="gnl_wrapper"]')) return;

            // 親行のタップで開く（メガ L2 はリンクではない）
            const onParentRow = e.target.closest('[class*="gnl_title"]');
            if (!onParentRow) return;

            // メニューがすでに開いている＝2回目タップ→遷移許可（preventDefaultしない）
            if (li.classList.contains(touchOpenClass)) return;

            // 別のメニューが開いている場合はいったん閉じる
            const openItem = document.querySelector(
              `.global_header .gn_mega [class*="gnl_item"].${touchOpenClass}`
            );
            if (openItem && openItem !== li) {
              closeAllTouchMenus();
            }

            // 1回目タップ：遷移を防ぎ、メニューを開く（オーバーレイも表示）
            e.preventDefault();
            li.classList.add(touchOpenClass);
            $body.addClass('_open-bg');
          },
          { passive: false }
        );
      });

      // 枠外タップでメニューを閉じる
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

    // ブレークポイントを跨いだときに不要なクラスを削除
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

    // // グローバルメニューの動き
    // $('.global_navigation .gn_links-01 > li._hasChild').on({
    //   mouseenter: function () {
    //     const height = $(this).find('.gnl_inner').outerHeight(true);
    //     if ($('html').hasClass('_pc')) {
    //       $body.addClass('_open-bg');
    //       $(this).find('.gnl_wrapper').first().css({
    //         height: 0,
    //         visibility: 'inherit',
    //         opacity: '1',
    //         'pointer-events': 'auto',
    //       });
    //       $(this)
    //         .find('.gnl_wrapper')
    //         .first()
    //         .stop(true, true)
    //         .animate({ height: height }, 400, 'swing');
    //     }
    //     //ここにはマウスを離したときの動作を記述
    //   },
    //   mouseleave: function () {
    //     if ($('html').hasClass('_pc')) {
    //       $body.removeClass('_open-bg');
    //       $(this)
    //         .find('.gnl_wrapper')
    //         .animate({ height: 0 }, 400, 'swing')
    //         .queue(function () {
    //           $(this).removeAttr('style');
    //           $(this).dequeue();
    //         });
    //     }
    //   },
    // });

    // 検索：メニューを閉じて、既存 .gn_search を上から下ろす（Figma 2295:8023）
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

    // アーカイブ用のローカルナビゲーションを開閉式にする
    // $('body:not(.page) #local_navigation .ln_links-01 > li > .lnl_title').on(
    //   'click',
    //   function () {
    //     $(this).next().toggleClass('_open').slideToggle(400);
    //     $(this).toggleClass('_open');
    //     return false;
    //   },
    // );
    // // アーカイブナビゲーション
    // $('.an_links-01 > li > .anl_title').on('click', function () {
    //   $(this).next().toggleClass('_open').slideToggle(300);
    //   $(this).toggleClass('_open');
    // });
    // // アーカイブナビゲーション枠外クリック時に閉じる
    // $(document).on('touchstart click', function (event) {
    //   if (!$(event.target).closest('.an_links-01').length) {
    //     $('.an_links-01 > li > .anl_title')
    //       .removeClass('_open')
    //       .next('.anl_wrapper')
    //       .removeClass('_open')
    //       .slideUp(400)
    //       .find('.anl_button, .anl_wrapper')
    //       .removeClass('_open')
    //       .siblings('.anl_wrapper')
    //       .slideUp(400);
    //   } else {
    //   }
    // });
    // ウィンドウ幅によってクラス付与
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
    // 空のpタグ削除
    $('.gc_main p').each(function () {
      let txt = $(this);
      if (txt.html().replace(/\s|&nbsp;/g, '').length === 0) {
        txt.remove();
      }
    });

    // 表にスクロール用ラッパー要素とclass追加
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

    // パスワード保護フォームinputにラッパー要素追加（疑似要素追加用）
    $('.module_password form input[type="submit"]').wrap(
      '<span class="mp_submit-wrap"><span class="mp_submit-inner"></span></span>',
    );
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
  // メニューオープン時背景のスクロール禁止
  // ==========================================================================
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
    // MARK: header_breakpoint
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

  // ==========================================================================
  // pageTop
  // ==========================================================================
  const pageTop = function () {
    const gf_pageTop = $('#js_gf_pageTop');
    // Figma: copyright bar 内に常時表示（fixed 浮遊ボタンではない）
    gf_pageTop.show();
    gf_pageTop.find('a').on('click', function (e) {
      e.preventDefault();
      $('body,html').stop().animate({ scrollTop: 0 }, 300);
    });
  };

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
      $(this).wrap('<div class="lightbox_wrap"></div>');
    });
  };

  // ==========================================================================
  // タブ
  // ==========================================================================
  const tab = function () {
    document.addEventListener('DOMContentLoaded', () => {
      document
        .querySelectorAll('.module_tab-wrapper')
        .forEach((tabWrapper, wrapperIndex) => {
          const panels = tabWrapper.querySelectorAll('.tab-panel');
          const buttonsContainer = tabWrapper.querySelector('.tab-buttons');

          panels.forEach((panel, index) => {
            // タイトルを取得（未指定なら Tab 1, 2...）
            const title = panel.dataset.title || `Tab ${index + 1}`;

            // ユニークIDを生成（日本語は slugify して短縮）
            const slug = title
              .toLowerCase()
              .normalize('NFKD') // 濁点など除去
              .replace(/[^\w\s-]/g, '') // 記号除去
              .trim()
              .replace(/\s+/g, '-') // 空白→ハイフン
              .slice(0, 20); // 長すぎるIDを防止

            const tabId = `tab-${wrapperIndex + 1}-${slug || index + 1}`;
            panel.id = tabId;

            // ボタン生成
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

          // 初期状態：最初のパネルを表示
          if (panels.length > 0) {
            panels.forEach((p) => (p.style.display = 'none'));
            panels[0].style.display = '';
            const firstButton = buttonsContainer.querySelector('.tab-button');
            if (firstButton) firstButton.classList.add('active');
          }
        });
    });
  };

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
  // Header is position:sticky in CSS. Do not toggle body._fixed on scroll
  // (that forced position:fixed and needed min-width padding-top on the wrapper).
  // $('#global_header').floatingWidget();
//   globalNavCurrent();
  moduleNavToggle();
  dropdownNavToggle();
//   localNavCurrent();
  pageScroll();
  toggleMenu();
  addCss();
  initHTML();
  moduleModal();
//   moduleAccordion();
  contentFixed();
  pageTop();
  // menuTextChange();
  lightboxWrap();
  tab();
//   archiveNavigation();
})(jQuery);