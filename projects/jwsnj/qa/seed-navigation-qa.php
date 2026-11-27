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
    $child = $add('子メニュー Child', $parent);
    if ($location === 'footer-nav') {
      $add('孫メニュー Grandchild', $child);
    }
    $add('長い子メニューの折り返し検証 Long label with several extra words and Japanese 日本語と英語が混在する長文のメニュー', $parent);
    $other = $add('別の親メニュー');
    $add('別の親の子メニュー', $other);
  }
  $add('別のメニュー');
  $locations[$location] = $menu;
}
set_theme_mod('nav_menu_locations', $locations);
update_option('jwsnj_navigation_qa_page_id', $page);

// Exercise the actual WordPress footer renderer with no assigned menu and an empty
// assigned menu, then restore the seeded menu before the cross-engine browser tests.
$render_footer = function () {
  ob_start();
  get_template_part('template-parts/_footer');
  return ob_get_clean();
};
$assert_footer = function ($markup, $expected, $case) {
  if (substr_count($markup, 'class="gf_links-wrap"') !== $expected ||
      substr_count($markup, 'class="gf_menu"') !== $expected ||
      substr_count($markup, 'id="gf_links-01"') !== $expected ||
      !str_contains($markup, 'class="gf_logo"') ||
      !str_contains($markup, 'class="gf_bottom"')) {
    throw new RuntimeException('Footer render contract failed: ' . $case);
  }
  echo wp_json_encode(['footerRuntime' => 'PASS', 'case' => $case, 'landmarks' => $expected]) . PHP_EOL;
};
$empty_menu = wp_create_nav_menu('Navigation QA empty footer');
if (is_wp_error($empty_menu)) throw new RuntimeException($empty_menu->get_error_message());
try {
  $unassigned = $locations;
  unset($unassigned['footer-nav']);
  set_theme_mod('nav_menu_locations', $unassigned);
  $assert_footer($render_footer(), 0, 'unassigned');
  $empty = $locations;
  $empty['footer-nav'] = $empty_menu;
  set_theme_mod('nav_menu_locations', $empty);
  $assert_footer($render_footer(), 0, 'assigned-empty');
} finally {
  set_theme_mod('nav_menu_locations', $locations);
  wp_delete_nav_menu($empty_menu);
}
$assert_footer($render_footer(), 1, 'assigned-populated');
