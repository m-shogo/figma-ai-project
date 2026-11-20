"use strict";
(function ($) {
  // ==========================================================================
  // タグ追加・削除
  // ==========================================================================
  const initHTML = function () {
    $('body').append('<p class="admin_pageTop"><a href="#">TOP</a></p>');
  };
  // ==========================================================================
  // ページトップに移動
  // ==========================================================================
  const pageTop = function () {
    const $button = $('.admin_pageTop');
    $button.hide();
    $(window).scroll(function() {
      if($(this).scrollTop() > 100) {
        $button.fadeIn();
      } else {
        $button.fadeOut();
      }
    });
    $button.on('click', function () {
      $('body,html').animate({scrollTop: 0}, 300);
      return false;
    });
  };
  // ==========================================================================
  // 実行
  // ==========================================================================
  initHTML();
  pageTop();

})(jQuery);