<?php
// Adapter for the SPEC course fields. Presentation stays in _top-course-view.php.
// Field group JSON is not committed here: Project Guard W9 still needs
// an explicit Human-Approved: acf-json trailer.
$rows = function_exists('get_field') ? get_field('top_course-01') : [];
$items = [];
foreach (is_array($rows) ? $rows : [] as $row) {
  if (!is_array($row)) {
    continue;
  }
  $title = is_string($row['title'] ?? null) ? trim($row['title']) : '';
  if ($title === '') {
    continue;
  }
  $raw_id = $row['img'] ?? 0;
  $image_id = (is_int($raw_id) || is_string($raw_id))
    ? filter_var($raw_id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]])
    : 0;
  $image = ($image_id && function_exists('wp_attachment_is_image') && wp_attachment_is_image($image_id))
    ? wp_get_attachment_image($image_id, 'large', false, [
      'loading' => 'lazy',
      'decoding' => 'async',
      'sizes' => '(min-width: 67.5rem) 293px, 251px',
    ])
    : '';
  $items[] = [
    'title' => $title,
    'text' => is_string($row['text'] ?? null) ? trim($row['text']) : '',
    'url' => is_string($row['url'] ?? null) ? trim($row['url']) : '',
    'new_tab' => in_array('はい', (array) ($row['target'] ?? []), true),
    'image_html' => $image,
  ];
}
get_template_part('template-parts/_top-course-view', null, ['items' => $items]);
