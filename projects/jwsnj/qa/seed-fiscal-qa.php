<?php
// Only disposable QA. Posts straddle the existing fiscal-year boundaries.
if (wp_get_environment_type() !== 'local' || !str_contains(home_url(), '127.0.0.1:')) throw new RuntimeException('local fixture only');
foreach ([
  'FiscalQAOutsideBefore' => '2024-03-31 12:00:00',
  'FiscalQAInsideApril' => '2024-04-01 12:00:00',
  'FiscalQAInsideMarch' => '2025-03-31 12:00:00',
  'FiscalQAOutsideAfter' => '2025-04-01 12:00:00',
] as $title => $date) {
  $id = wp_insert_post(['post_title' => $title, 'post_content' => 'Local QA', 'post_status' => 'publish', 'post_type' => 'post', 'post_date' => $date], true);
  if (is_wp_error($id) || !$id) throw new RuntimeException('fiscal fixture failed');
}
update_option('posts_per_page', 1);
