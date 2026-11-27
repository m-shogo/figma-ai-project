<?php
// Explicitly opted-in disposable WordPress only; never seed the school site.
if (
  wp_get_environment_type() !== 'local' ||
  !str_contains(home_url(), '127.0.0.1:') ||
  getenv('JWSNJ_PARTS_QA_DISPOSABLE') !== '1'
) {
  throw new RuntimeException('disposable parts fixture only');
}

$content = file_get_contents(__DIR__ . '/fixtures/parts-catalog-native.html');
if ($content === false || trim($content) === '') {
  throw new RuntimeException('parts fixture missing');
}

$registry = WP_Block_Type_Registry::get_instance();
$names = [];
$check = function ($blocks) use (&$check, &$names, $registry) {
  foreach ($blocks as $block) {
    $name = $block['blockName'];
    if ($name !== null) {
      if (!str_starts_with($name, 'core/') || !$registry->is_registered($name)) {
        throw new RuntimeException('unexpected or unregistered block: ' . $name);
      }
      $names[$name] = ($names[$name] ?? 0) + 1;
    } elseif (trim($block['innerHTML']) !== '') {
      throw new RuntimeException('unexpected freeform content');
    }
    $check($block['innerBlocks']);
  }
};
$check(parse_blocks($content));
foreach (['core/heading', 'core/paragraph', 'core/list', 'core/list-item', 'core/buttons', 'core/button', 'core/details'] as $required) {
  if (empty($names[$required])) {
    throw new RuntimeException('missing block: ' . $required);
  }
}

$page = (int) get_option('jwsnj_native_parts_qa_page_id', 0);
if ($page && (
  get_post_type($page) !== 'page' ||
  get_post_meta($page, '_jwsnj_native_parts_qa', true) !== '1'
)) {
  throw new RuntimeException('refusing to overwrite a non-fixture page');
}
$data = [
  'post_type' => 'page',
  'post_status' => 'publish',
  'post_title' => 'JWSNJ Native Parts QA',
  'post_content' => wp_slash($content),
];
if ($page) {
  $data['ID'] = $page;
  $page = wp_update_post($data, true);
} else {
  $page = wp_insert_post($data, true);
}
if (is_wp_error($page) || !$page) {
  throw new RuntimeException('parts fixture save failed');
}
update_post_meta($page, '_jwsnj_native_parts_qa', '1');
update_option('jwsnj_native_parts_qa_page_id', $page, false);
if (get_post_field('post_content', $page, 'raw') !== $content) {
  throw new RuntimeException('parts fixture content changed on save');
}
echo wp_json_encode(['nativePartsSeed' => 'PASS', 'page' => $page, 'registeredBlocks' => $names]) . PHP_EOL;
