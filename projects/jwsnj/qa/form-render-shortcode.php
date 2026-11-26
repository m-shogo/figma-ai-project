<?php
// Disposable test-only shortcode. No real address or external request.
if (wp_get_environment_type() !== 'local' || !str_contains(home_url(), '127.0.0.1:')) return;
add_shortcode('jwsnj_qa_render_count', function () {
  static $calls = 0;
  return '<span id="qa-render-count" data-count="' . (++$calls) . '"></span>';
});
add_shortcode('jwsnj_qa_postal', function () {
  return '<div class="h-adr"><span class="p-country-name" hidden>Japan</span><label>Postal QA<input class="p-postal-code" type="text"></label></div>';
});
