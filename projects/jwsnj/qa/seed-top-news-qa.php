<?php
// TOP fixture only. Run after the other tests in a disposable database.
if (wp_get_environment_type() !== 'local' ||
  !str_contains(home_url(), '127.0.0.1:') ||
  getenv('JWSNJ_TOP_QA_DISPOSABLE') !== '1') {
  throw new RuntimeException('disposable TOP fixture only');
}
if (!function_exists('update_field')) {
  throw new RuntimeException('registered post selection fields required');
}

$save = static function ($key, $data) {
  $id = (int) get_option($key, 0);
  if ($id && (get_post_type($id) !== $data['post_type'] ||
    get_post_meta($id, '_jwsnj_top_news_qa', true) !== '1')) {
    throw new RuntimeException('refusing to overwrite non-fixture content');
  }
  if ($id) {
    $data['ID'] = $id;
    $id = wp_update_post(wp_slash($data), true);
  } else {
    $id = wp_insert_post(wp_slash($data), true);
  }
  if (!$id || is_wp_error($id)) {
    throw new RuntimeException('TOP fixture save failed');
  }
  update_post_meta($id, '_jwsnj_top_news_qa', '1');
  update_option($key, $id, false);
  return $id;
};
foreach (['page_on_front' => 'jwsnj_top_news_qa_home', 'page_for_posts' => 'jwsnj_top_news_qa_archive'] as $option => $key) {
  $current = (int) get_option($option);
  if ($current && ($current !== (int) get_option($key) ||
    get_post_meta($current, '_jwsnj_top_news_qa', true) !== '1')) {
    throw new RuntimeException('refusing to replace existing Reading assignment');
  }
}
$home = $save('jwsnj_top_news_qa_home', ['post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'TOP QA Home']);
$archive = $save('jwsnj_top_news_qa_archive', ['post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'TOP QA Archive']);
$category = get_term_by('slug', 'jwsnj-top-news-qa', 'category');
if ($category && get_term_meta($category->term_id, '_jwsnj_top_news_qa', true) !== '1') {
  throw new RuntimeException('refusing to reuse non-fixture category');
}
if (!$category) {
  $term = wp_insert_term('カテゴリー', 'category', ['slug' => 'jwsnj-top-news-qa']);
  if (is_wp_error($term)) {
    throw new RuntimeException('category fixture failed');
  }
  $category = get_term($term['term_id'], 'category');
  update_term_meta($category->term_id, '_jwsnj_top_news_qa', '1');
}
$ids = [];
$now = current_datetime();
for ($i = 5; $i >= 0; $i--) {
  $date = $now->modify('-' . (5 - $i) . ' seconds');
  $title = 'NJ補習授業校　お便り　No' . $i;
  if ($i === 2) {
    $title .= '　長い記事タイトルの折り返し確認 LongEditableNewsWithoutSpaces1234567890LongEditableNewsWithoutSpaces1234567890';
  }
  $id = $save('jwsnj_top_news_qa_post_' . $i, [
    'post_type' => 'post', 'post_status' => 'publish', 'post_title' => $title,
    'post_content' => '隔離された検証用記事',
    'post_date' => $date->format('Y-m-d H:i:s'),
    'post_date_gmt' => $date->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s'),
    'post_category' => [(int) $category->term_id],
  ]);
  // Existing registered field only; no ACF schema or production settings.
  update_field('field_6503bf1ec8d65', $i === 1 ? 'none' : 'post', $id);
  $ids[] = $id;
}
update_option('page_on_front', $home);
update_option('page_for_posts', $archive);
update_option('show_on_front', 'page');
$query = new WP_Query(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 5,
  'ignore_sticky_posts' => true, 'orderby' => 'date', 'order' => 'DESC', 'fields' => 'ids']);
if (array_map('intval', $query->posts) !== array_slice($ids, 0, 5)) {
  throw new RuntimeException('unexpected TOP fixture order; do not hide other posts');
}
echo wp_json_encode(['topNewsSeed' => 'PASS', 'home' => $home, 'archive' => $archive, 'posts' => $ids]) . PHP_EOL;
