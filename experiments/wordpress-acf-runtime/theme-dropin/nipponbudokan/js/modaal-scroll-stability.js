'use strict';

(function ($) {
  const installStableFocusRestore = function () {
    $('[class*="module_gallery"] a').each(function () {
      const $trigger = $(this);
      const instance = $trigger.data('modaal');
      if (!instance || !instance.options || instance.options._nbStableFocusRestore) {
        return;
      }

      const originalBeforeClose = instance.options.before_close;
      instance.options.before_close = function (modal) {
        if (typeof originalBeforeClose === 'function') {
          originalBeforeClose.call(this, modal);
        }

        const focusTarget = this.lastFocus && this.lastFocus[0]
          ? this.lastFocus[0]
          : $trigger[0];
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        this.lastFocus = {
          focus: function () {
            if (!focusTarget || typeof focusTarget.focus !== 'function') {
              return;
            }

            try {
              focusTarget.focus({ preventScroll: true });
            } catch (error) {
              focusTarget.focus();
            }

            if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
              window.scrollTo(scrollX, scrollY);
            }
          },
        };
      };
      instance.options._nbStableFocusRestore = true;
    });
  };

  $(installStableFocusRestore);
})(jQuery);
