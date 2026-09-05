'use strict';

(function ($) {
  const pageTopLink = document.querySelector('#js_gf_pageTop a');
  const headerLogoLink = document.querySelector('#global_header .gh_logo a');

  if (!pageTopLink || !headerLogoLink) {
    return;
  }

  pageTopLink.addEventListener('click', function (event) {
    // Keyboard-generated click events have detail=0. Pointer activation keeps
    // the existing Page Top focus behavior unchanged.
    if (event.detail !== 0) {
      return;
    }

    // common.js owns the 300ms Page Top animation. Reuse its jQuery animation
    // queue instead of duplicating the duration or introducing a second timer.
    $('body,html').promise().done(function () {
      headerLogoLink.focus({ preventScroll: true });
    });
  });
})(jQuery);
