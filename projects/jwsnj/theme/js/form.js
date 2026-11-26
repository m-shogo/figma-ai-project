'use strict';
(function ($) {
  // Legacy CF7 adapter. Formidable owns its own upload controls.
  const initLegacyFiles = function () {
    $('.wpcf7 .file input[type="file"]').each(function () {
      const input = this;
      const $input = $(input);
      const $wrap = $input.closest('.file');
      if ($wrap.find('input[type="file"]').length !== 1 || $input.data('jwsnjFileReady')) return;
      const $label = $wrap.find('label').filter(function () {
        return input.id && this.htmlFor === input.id;
      });
      // Only enhance the existing, separately associated plain-text label.
      if ($label.length !== 1 || $label.children().length) return;
      $input.data('jwsnjFileReady', true);
      const initialText = $label.text();
      const $clear = $('<button>', {
        type: 'button',
        class: 'clear-file',
        'aria-label': '選択したファイルを取り消す',
        text: '✕'
      }).insertAfter($label);
      const sync = function () {
        const names = Array.from(input.files || [], file => file.name);
        $label.toggleClass('_changed', names.length > 0).text(names.length ? names.join('、') : initialText);
        $clear.prop('hidden', names.length === 0);
      };
      $input.on('change', sync);
      $clear.on('click', function () {
        $input.val('').trigger('change');
      });
      // Keep plugin validation state on the same associated label.
      $wrap.closest('.wpcf7').on('wpcf7invalid', function () {
        $label.toggleClass('wpcf7-not-valid', $input.hasClass('wpcf7-not-valid'));
      });
      sync();
    });
  };

  // Older optional consent control: do not disable an unrelated submit button.
  const initConsent = function () {
    const $agree = $('#check_agree');
    const $submit = $('#button_submit');
    if ($agree.length !== 1 || $submit.length !== 1 || !$agree[0].form ||
      $agree[0].form !== $submit[0].form || $agree.data('jwsnjConsentReady')) return;
    $agree.data('jwsnjConsentReady', true);
    const sync = function () {
      const disabled = !$agree.prop('checked');
      $submit.prop('disabled', disabled).closest('.form_button-01').toggleClass('_disabled', disabled);
    };
    $agree.on('change', sync);
    sync();
  };

  const initFormidable = function () {
    $('.frm_forms .frm_form_field select').each(function () {
      const $select = $(this);
      if (!$select.parent().hasClass('frm_select')) $select.wrap('<div class="frm_select" />');
    });
    $('.frm_forms .frm_required').each(function () {
      const required = $(this).text().includes('*');
      $(this).parents('.frm_primary_label').toggleClass('required', required).toggleClass('any', !required);
    });

    // Keep the existing editor-configured YubinBango class transfer.
    $('.frm_forms .set-class').each(function () {
      const $address = $(this);
      const classes = $address.attr('class') || '';
      const transfer = classes.slice(classes.indexOf('set-class'));
      $address.find('input').addClass(transfer);
      $address.removeClass(transfer);
    });
  };

  $(function () {
    initLegacyFiles();
    initConsent();
    initFormidable();
  });
})(jQuery);
