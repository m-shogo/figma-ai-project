<?php
// This is a disposable QA page, never an ACF adapter or production data.
if (
  wp_get_environment_type() !== 'local' ||
  !str_contains(home_url(), '127.0.0.1:') ||
  getenv('JWSNJ_PARTS_QA_DISPOSABLE') !== '1'
) {
  throw new RuntimeException('disposable in-page fixture only');
}

$id = '学校:案内.1';
$links = [
  [rawurlencode($id), 'ページ内リンク 最小幅304px'],
  ['qa-inpage-second', 'ページ内リンクページ内リンクページ内リンク LongEditableLabelWithoutSpaces1234567890LongEditableLabelWithoutSpaces1234567890'],
  ['qa-inpage-missing', '存在しないリンク先'],
  ['%ZZ', '不正なエンコード'],
  ['', 'ページ先頭'],
];
$html = '<ul class="module_inPageLink-01" id="qa-inpage-links">';
foreach ($links as [$fragment, $label]) {
  $html .= '<li class="inPageLink"><a href="#' . esc_attr($fragment) . '"><div class="title">' . esc_html($label) . '</div></a></li>';
}
$html .= '</ul>';
$paragraph = "<!-- wp:paragraph -->\n<p>検証専用の長文です。ページ内リンクの到達位置とヘッダーの重なりを確認します。</p>\n<!-- /wp:paragraph -->\n";
$heading = static function ($anchor, $label) {
  return '<!-- wp:heading ' . wp_json_encode(['anchor' => $anchor], JSON_UNESCAPED_UNICODE) . " -->\n" .
    '<h2 class="wp-block-heading" id="' . esc_attr($anchor) . '">' . esc_html($label) . "</h2>\n<!-- /wp:heading -->\n";
};
$content = "<!-- wp:html -->\n" . $html . "\n<!-- /wp:html -->\n" .
  str_repeat($paragraph, 18) . $heading($id, '日本語と記号のアンカー') .
  str_repeat($paragraph, 18) . $heading('qa-inpage-second', '二番目のアンカー') .
  str_repeat($paragraph, 20);
$page = (int) get_option('jwsnj_inpage_qa_page_id', 0);
if ($page && (get_post_type($page) !== 'page' || get_post_meta($page, '_jwsnj_inpage_qa', true) !== '1')) {
  throw new RuntimeException('refusing to overwrite a non-fixture page');
}
$data = [
  'post_type' => 'page',
  'post_status' => 'publish',
  'post_title' => 'JWSNJ In-page Link QA',
  'post_content' => wp_slash($content),
];
if ($page) {
  $data['ID'] = $page;
  $page = wp_update_post($data, true);
} else {
  $page = wp_insert_post($data, true);
}
if (is_wp_error($page) || !$page) {
  throw new RuntimeException('in-page fixture save failed');
}
update_post_meta($page, '_jwsnj_inpage_qa', '1');
update_option('jwsnj_inpage_qa_page_id', $page, false);
if (get_post_field('post_content', $page, 'raw') !== $content) {
  throw new RuntimeException('in-page fixture content changed');
}
echo wp_json_encode(['inPageFixture' => 'PASS', 'page' => $page]) . PHP_EOL;
