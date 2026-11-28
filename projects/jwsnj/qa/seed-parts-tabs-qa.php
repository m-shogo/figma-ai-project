<?php
// Adapt only the Human's native tabs sample inside the disposable WP instance.
if (
  wp_get_environment_type() !== 'local' ||
  !str_contains(home_url(), '127.0.0.1:') ||
  getenv('JWSNJ_PARTS_QA_DISPOSABLE') !== '1'
) {
  throw new RuntimeException('disposable tabs fixture only');
}
$source = file_get_contents(__DIR__ . '/fixtures/parts-catalog-owner-reference.html');
if ($source === false) {
  throw new RuntimeException('Human parts source unavailable');
}
$matches = array_values(array_filter(parse_blocks($source), static fn($block) => $block['blockName'] === 'core/tabs'));
if (count($matches) !== 1) {
  throw new RuntimeException('expected exactly one native tabs sample');
}
$tabs = $matches[0];
unset($tabs['attrs']['metadata']);
$content = serialize_block($tabs);
$attachment = (int) get_option('jwsnj_gallery_qa_media_preschool', 0);
if (!$attachment || get_post_meta($attachment, '_jwsnj_gallery_qa_media', true) !== '1' || !wp_attachment_is_image($attachment)) {
  throw new RuntimeException('existing disposable gallery media required');
}
$image_url = wp_get_attachment_image_url($attachment, 'large');
if (!$image_url || substr_count($content, 'https://placehold.jp/600x400.png') !== 1 || substr_count($content, 'href="/"') !== 1) {
  throw new RuntimeException('fixture source changed');
}
$content = str_replace(
  ['https://placehold.jp/600x400.png', 'href="/"', '<h2 class="wp-block-heading">見出しブロック</h2>'],
  [esc_url($image_url), 'href="#jwsnj-tabs-qa-target"', '<h2 class="wp-block-heading" id="jwsnj-tabs-qa-target">見出しブロック</h2>'],
  $content
);
$registry = WP_Block_Type_Registry::get_instance();
$counts = [];
$check = function ($blocks) use (&$check, &$counts, $registry) {
  foreach ($blocks as $block) {
    $name = $block['blockName'];
    if ($name === null && trim($block['innerHTML']) === '') {
      continue;
    }
    if (!$name || !$registry->is_registered($name) ||
        (!str_starts_with($name, 'core/') && $name !== 'flexible-table-block/table')) {
      throw new RuntimeException('unexpected or unregistered tabs block: ' . $name);
    }
    $counts[$name] = ($counts[$name] ?? 0) + 1;
    $check($block['innerBlocks']);
  }
};
$check(parse_blocks($content));
foreach (['core/tabs', 'core/tab-list', 'core/tab-panels', 'core/tab-panel', 'core/list', 'core/image', 'flexible-table-block/table'] as $name) {
  if (empty($counts[$name])) {
    throw new RuntimeException('missing block: ' . $name);
  }
}
if ($counts['core/tab-panel'] !== 3) {
  throw new RuntimeException('expected three tabs');
}
$id = (int) get_option('jwsnj_parts_tabs_qa_page_id', 0);
if ($id && (get_post_type($id) !== 'page' || get_post_meta($id, '_jwsnj_parts_tabs_qa', true) !== '1')) {
  throw new RuntimeException('refusing to overwrite non-fixture page');
}
$data = ['post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'JWSNJ Native Tabs QA', 'post_content' => wp_slash($content)];
if ($id) {
  $data['ID'] = $id;
  $id = wp_update_post($data, true);
} else {
  $id = wp_insert_post($data, true);
}
if (is_wp_error($id) || !$id) {
  throw new RuntimeException('tabs fixture save failed');
}
update_post_meta($id, '_jwsnj_parts_tabs_qa', '1');
update_option('jwsnj_parts_tabs_qa_page_id', $id, false);
if (get_post_field('post_content', $id, 'raw') !== $content) {
  throw new RuntimeException('tabs fixture save mismatch');
}
echo wp_json_encode(['partsTabsSeed' => 'PASS', 'page' => $id, 'registeredBlocks' => $counts]) . PHP_EOL;
