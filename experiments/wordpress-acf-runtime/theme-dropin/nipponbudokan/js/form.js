"use strict";
(function ($) {
  // ==========================================================================
  // input[type="date"]に翌日の日付を入力し、それ以前は選択させない
  // ==========================================================================
  // const inputDate = function () {
  //   $('input[type="date"]').each(function () {
  //     const date = new Date();
  //     const yyyy = date.getFullYear();
  //     const mm = ("0" + (date.getMonth() + 1)).slice(-2);
  //     const dd = ("0" + date.getDate()).slice(-2);
  //     // const tomorrow = ("0" + (date.getDate() + 1)).slice(-2);
  //
  //     document.getElementById("_today").value = yyyy + '-' + mm + '-' + dd;
  //     $(this).attr('min', yyyy + '-' + mm + '-' + dd);
  //   });
  // };
  // ==========================================================================
  // ファイル選択装飾
  // ==========================================================================
  const inputFIle = function () {
    const $file = $('input[type="file"]');
    const $fileWrap = $('.file');
    $file.each(function () {
      $(this).closest($fileWrap).append('<button type="button" class="clear-file">✕</button>')
    });
    $file.on('change', function () {
      let file = $(this).prop('files')[0];
      $(this).closest($fileWrap).find('label').addClass('_changed').html(file.name);
    });
    $('.clear-file').on('click', function () {
      $(this).closest($fileWrap).find($file).value = "";
      $(this).closest($fileWrap).find('label').removeClass('_changed').html('');
    });
    const wpcf7Elm = document.querySelector('.wpcf7');
    if (wpcf7Elm != null) {
      wpcf7Elm.addEventListener('wpcf7invalid', function () {
        $('.wpcf7-file').each(function () {
          const $wpcf7Label = $(this).closest('.file').find('label');
          if ($(this).hasClass('wpcf7-not-valid')) {
            $wpcf7Label.addClass('wpcf7-not-valid');
          } else {
            $wpcf7Label.removeClass('wpcf7-not-valid');
          }
        });
      }, false);
    }
  };
  // ==========================================================================
  // 住所自動入力
  // ==========================================================================
  const autoAddress = function () {
    $(window).on('load', function () {
      $('#zip').keyup(function () {
        AjaxZip3.zip2addr('zip', '', 'pref', 'city', 'address-other');
      });
    });
  };
  // ==========================================================================
  // フォームの送信ボタンを無効化
  // ==========================================================================
  const inputClass = function () {
    $(window).on('load', function () {
      const $submit = $('#button_submit');
      $submit.prop('disabled', true).closest('.form_button-01').addClass('_disabled');
      $('#check_agree').on('change', function () {
        if ($(this).prop('checked')) {
          $submit.prop('disabled', false).closest('.form_button-01').removeClass('_disabled');
        } else {
          $submit.prop('disabled', true).closest('.form_button-01').addClass('_disabled');
        }
      });
    });
  };

  // ==========================================================================
  // formidable Forms 装飾用
  // ==========================================================================

  const formidable = function () {
    $(window).on('load', function () {

      // selectボックスに下向き矢印追加
      const $select = $('.frm_form_field select');
      $select.each(function () {
        $(this).wrap('<div class="frm_select" />');
      });

      // 必須ラベル設置
      const $needLabel = $(".frm_required");
      $needLabel.each(function () {
        const $status = $(this).text();
        const $parentsLabel = $(this).parents(".frm_primary_label");
        if ( $status.indexOf("*") != -1 ) {
          $parentsLabel.addClass("required");
        }
        else{
          $parentsLabel.addClass("any");
        }
      });
    });
  };

  // ==========================================================================
  // formidable Forms 郵便番号自動挿入
  // ==========================================================================

  const setClass = function () {
    $(window).on('load', function () {
      const $address = $(".set-class");
      $address.each(function () {
        const $addressClass = $(this).attr("class");
        const $setClass = $addressClass.substr($addressClass.indexOf('set-class'));
        $(this).find("input").addClass($setClass);
        $(this).removeClass($setClass);
      });
    });
  };

  // ==========================================================================
  // 実行
  // ==========================================================================
  // inputDate();
  inputFIle();
  autoAddress();
  inputClass();
  formidable();
  setClass();

})(jQuery);