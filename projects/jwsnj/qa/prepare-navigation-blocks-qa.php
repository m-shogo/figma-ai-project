<?php
// Read-only QA snippet generator. Run via WP-CLI with local dummy attachment IDs.
// Never registers blocks/fields, creates pages, or modifies post content.
if (
  wp_get_environment_type() !== 'local' ||
  !str_contains(home_url(), '127.0.0.1:') ||
  getenv('JWSNJ_PARTS_QA_DISPOSABLE') !== '1'
) {
  throw new RuntimeException('explicit local parts QA only');
}
if (!function_exists('acf_get_field')) {
  throw new RuntimeException('ACF fields unavailable');
}
$input = $args ?? [];
if (count($input) !== 2) {
  throw new RuntimeException('supply two local dummy image attachment IDs');
}
$images = [];
foreach ($input as $value) {
  $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
  if (!$id || !wp_attachment_is_image($id)) {
    throw new RuntimeException('invalid local QA image attachment');
  }
  $images[] = $id;
}
$source = file_get_contents(__DIR__ . '/fixtures/parts-catalog-owner-reference.html');
$blocks = parse_blocks($source);
$output = [];
foreach (['large', 'small'] as $variant) {
  $name = 'navigation-' . $variant;
  $block_name = 'acf/' . $name;
  if (!WP_Block_Type_Registry::get_instance()->is_registered($block_name)) {
    throw new RuntimeException('existing block not registered: ' . $block_name);
  }
  $schema = json_decode(file_get_contents(__DIR__ . '/../theme/acf/json/group_custom_block_navigation_' . $variant . '.json'), true, 512, JSON_THROW_ON_ERROR);
  $group = $schema['fields'][0];
  $field = acf_get_field($group['key']);
  if (!$field || $field['name'] !== $name || $field['type'] !== 'repeater') {
    throw new RuntimeException('existing ACF repeater unavailable: ' . $name);
  }
  $match = array_values(array_filter($blocks, static fn($b) => $b['blockName'] === $block_name));
  if (count($match) !== 1) {
    throw new RuntimeException('Human source block not unique: ' . $name);
  }
  $attrs = $match[0]['attrs'];
  $data = $attrs['data'];
  if (($data['_' . $name] ?? '') !== $group['key']) {
    throw new RuntimeException('repeater key mismatch');
  }
  $count = (int) $data[$name];
  for ($i = 0; $i < $count; ++$i) {
    foreach ($group['sub_fields'] as $sub) {
      $key = $name . '_' . $i . '_' . $sub['name'];
      $actual = acf_get_field($sub['key']);
      if (!$actual || $actual['name'] !== $sub['name'] || ($data['_' . $key] ?? '') !== $sub['key']) {
        throw new RuntimeException('field mismatch: ' . $key);
      }
      if ($sub['name'] === 'image' && !empty($data[$key])) {
        $data[$key] = $images[$i % 2];
      }
      if ($sub['name'] === 'url') {
        $data[$key] = '#jwsnj-navigation-qa-target';
      }
    }
  }
  // Explicit missing destination and long text; preserve all field keys.
  $extra = ['image' => '', 'title' => 'リンク未設定・画像なし', 'text' => '検証用長文 LongEditableLabelWithoutSpaces1234567890LongEditableLabelWithoutSpaces1234567890', 'url' => '', 'target' => ''];
  foreach ($group['sub_fields'] as $sub) {
    $key = $name . '_' . $count . '_' . $sub['name'];
    $data[$key] = $extra[$sub['name']];
    $data['_' . $key] = $sub['key'];
  }
  $data[$name] = $count + 1;
  $attrs['data'] = $data;
  $output[] = '<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">ナビゲーション' . ($variant === 'large' ? '大' : '小') . '</h3><!-- /wp:heading -->';
  $output[] = '<!-- wp:' . $block_name . ' ' . serialize_block_attributes($attrs) . ' /-->';
}
$output[] = '<!-- wp:heading {"anchor":"jwsnj-navigation-qa-target","level":3} --><h3 class="wp-block-heading" id="jwsnj-navigation-qa-target">QAリンク確認先</h3><!-- /wp:heading -->';
echo implode("\n\n", $output) . PHP_EOL;
