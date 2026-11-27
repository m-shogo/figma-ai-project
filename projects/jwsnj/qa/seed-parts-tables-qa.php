<?php
// Only the explicitly opted-in disposable WordPress instance.
if (
  wp_get_environment_type() !== 'local' ||
  !str_contains(home_url(), '127.0.0.1:') ||
  getenv('JWSNJ_PARTS_QA_DISPOSABLE') !== '1'
) {
  throw new RuntimeException('disposable table fixture only');
}
$content = file_get_contents(__DIR__ . '/fixtures/parts-catalog-tables.html');
if ($content === false || trim($content) === '') {
  throw new RuntimeException('table fixture missing');
}
$registry = WP_Block_Type_Registry::get_instance();
$counts = [];
foreach (parse_blocks($content) as $block) {
  $name = $block['blockName'];
  if ($name === null && trim($block['innerHTML']) === '') {
    continue;
  }
  if (!in_array($name, ['core/heading', 'flexible-table-block/table'], true) || !$registry->is_registered($name)) {
    throw new RuntimeException('unexpected or unregistered table block');
  }
  $counts[$name] = ($counts[$name] ?? 0) + 1;
}
if (($counts['flexible-table-block/table'] ?? 0) !== 3) {
  throw new RuntimeException('missing table variants');
}
$id = (int) get_option('jwsnj_parts_tables_qa_page_id', 0);
if ($id && (get_post_type($id) !== 'page' || get_post_meta($id, '_jwsnj_parts_tables_qa', true) !== '1')) {
  throw new RuntimeException('refusing to overwrite a non-fixture page');
}
$data = [
  'post_type' => 'page',
  'post_status' => 'publish',
  'post_title' => 'JWSNJ Tables QA',
  'post_content' => wp_slash($content),
];
if ($id) {
  $data['ID'] = $id;
  $id = wp_update_post($data, true);
} else {
  $id = wp_insert_post($data, true);
}
if (is_wp_error($id) || !$id) {
  throw new RuntimeException('table fixture save failed');
}
update_post_meta($id, '_jwsnj_parts_tables_qa', '1');
update_option('jwsnj_parts_tables_qa_page_id', $id, false);
if (get_post_field('post_content', $id, 'raw') !== $content) {
  throw new RuntimeException('table fixture content changed on save');
}
echo wp_json_encode(['partsTableSeed' => 'PASS', 'page' => $id, 'registeredBlocks' => $counts]) . PHP_EOL;
