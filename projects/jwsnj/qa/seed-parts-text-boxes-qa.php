<?php
// Isolated WordPress Group/Columns fixture; never modify the school database.
if (
  wp_get_environment_type() !== 'local' ||
  !str_contains(home_url(), '127.0.0.1:') ||
  getenv('JWSNJ_PARTS_QA_DISPOSABLE') !== '1'
) {
  throw new RuntimeException('disposable text box fixture only');
}
$content = file_get_contents(__DIR__ . '/fixtures/parts-catalog-text-boxes.html');
if ($content === false || trim($content) === '') {
  throw new RuntimeException('text box fixture missing');
}
$registry = WP_Block_Type_Registry::get_instance();
$styles = WP_Block_Styles_Registry::get_instance();
foreach (['core/columns' => 'jwsnj-background-boxes', 'core/group' => 'jwsnj-background-box'] as $name => $style) {
  if (!$styles->is_registered($name, $style)) {
    throw new RuntimeException('missing existing block style: ' . $style);
  }
}
$counts = [];
$check = function ($blocks) use (&$check, &$counts, $registry) {
  foreach ($blocks as $block) {
    $name = $block['blockName'];
    if ($name === null && trim($block['innerHTML']) === '') {
      continue;
    }
    if (!in_array($name, ['core/columns', 'core/column', 'core/group', 'core/heading', 'core/paragraph'], true) || !$registry->is_registered($name)) {
      throw new RuntimeException('unexpected block: ' . $name);
    }
    $counts[$name] = ($counts[$name] ?? 0) + 1;
    $check($block['innerBlocks']);
  }
};
$check(parse_blocks($content));
if ($counts !== ['core/columns' => 2, 'core/column' => 4, 'core/group' => 4, 'core/heading' => 4, 'core/paragraph' => 4]) {
  throw new RuntimeException('unexpected text box structure');
}
$id = (int) get_option('jwsnj_parts_text_boxes_qa_page_id', 0);
if ($id && (get_post_type($id) !== 'page' || get_post_meta($id, '_jwsnj_parts_text_boxes_qa', true) !== '1')) {
  throw new RuntimeException('refusing to overwrite non-fixture page');
}
$data = ['post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'JWSNJ Native Text Boxes QA', 'post_content' => wp_slash($content)];
if ($id) {
  $data['ID'] = $id;
  $id = wp_update_post($data, true);
} else {
  $id = wp_insert_post($data, true);
}
if (is_wp_error($id) || !$id) {
  throw new RuntimeException('text box fixture save failed');
}
update_post_meta($id, '_jwsnj_parts_text_boxes_qa', '1');
update_option('jwsnj_parts_text_boxes_qa_page_id', $id, false);
if (get_post_field('post_content', $id, 'raw') !== $content) {
  throw new RuntimeException('text box fixture save mismatch');
}
echo wp_json_encode(['partsTextBoxesSeed' => 'PASS', 'page' => $id, 'registeredBlocks' => $counts]) . PHP_EOL;
