<?php
// Local QA only. Use the actual registered menu locations and existing theme walkers.
if (wp_get_environment_type() !== 'local' || !str_contains(home_url(), '127.0.0.1:')) throw new RuntimeException('local fixture only');
$page = wp_insert_post([
  'post_type' => 'page',
  'post_status' => 'publish',
  'post_title' => 'Navigation QA',
  'post_content' => str_repeat('<p>長文とスクロール位置を確認する検証用の本文です。This is a local navigation fixture.</p>', 60),
], true);
if (is_wp_error($page) || !$page) throw new RuntimeException('fixture page failed');
$locations = get_theme_mod('nav_menu_locations', []);
foreach (['global-nav', 'sub-nav', 'footer-nav'] as $location) {
  $menu = wp_create_nav_menu('Navigation QA ' . $location);
  if (is_wp_error($menu)) throw new RuntimeException($menu->get_error_message());
  $add = function ($title, $parent = 0) use ($menu, $page) {
    $id = wp_update_nav_menu_item($menu, 0, [
      'menu-item-title' => $title,
      'menu-item-url' => get_permalink($page),
      'menu-item-type' => 'custom',
      'menu-item-status' => 'publish',
      'menu-item-parent-id' => $parent,
    ]);
    if (is_wp_error($id) || !$id) throw new RuntimeException('menu item failed');
    return $id;
  };
  $parent = $add('検証用の長い親メニュー Navigation');
  if ($location !== 'sub-nav') {
    $add('子メニュー Child', $parent);
    $add('長い子メニューの折り返し検証 Long label', $parent);
  }
  $add('別のメニュー');
  $locations[$location] = $menu;
}
set_theme_mod('nav_menu_locations', $locations);
update_option('jwsnj_navigation_qa_page_id', $page);
