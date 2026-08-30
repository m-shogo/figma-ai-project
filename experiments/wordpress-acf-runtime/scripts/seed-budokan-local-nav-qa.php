<?php

/**
 * Disposable Budokan Local Navigation runtime fixture.
 *
 * Run only through WP-CLI inside the repository's local Compose runtime:
 *   wp eval-file /fixture/scripts/seed-budokan-local-nav-qa.php
 *
 * This fixture intentionally models only hierarchy proven by current Figma:
 * - SP title: 武道 振興・普及事業
 * - PC subgroup title: 指導者研修・指導法研究
 * - three named PC child items
 * - fourth PC item remains the literal Figma placeholder
 *
 * It is QA data, not production navigation authority.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan Local Navigation outside a local WordPress environment.');
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan Local Navigation fixture requires the nipponbudokan theme.');
}

function budokan_qa_upsert_page(string $slug, string $title, int $parent_id = 0): int
{
    $page = get_page_by_path($slug, OBJECT, 'page');
    $payload = array(
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_title' => $title,
        'post_name' => $slug,
        'post_parent' => $parent_id,
        'post_content' => '<!-- wp:paragraph --><p>Local Navigation runtime QA fixture.</p><!-- /wp:paragraph -->',
    );

    if ($page) {
        $payload['ID'] = (int) $page->ID;
        $result = wp_update_post($payload, true);
    } else {
        $result = wp_insert_post($payload, true);
    }

    if (is_wp_error($result)) {
        WP_CLI::error($result->get_error_message());
    }

    return (int) $result;
}

$root_id = budokan_qa_upsert_page(
    'qa-budokan-promotion',
    '武道 振興・普及事業'
);
$group_id = budokan_qa_upsert_page(
    'qa-budokan-instructor-research',
    '指導者研修・指導法研究',
    $root_id
);

$children = array(
    array('slug' => 'qa-budokan-national-instructor', 'title' => '全国武道指導者研修会'),
    array('slug' => 'qa-budokan-regional-instructor', 'title' => '地域社会武道指導者研修会'),
    array('slug' => 'qa-budokan-school-budo-research', 'title' => '中学校武道授業指導法研究事業'),
    // Current PC Figma intentionally contains this placeholder. Do not replace it
    // with an inferred production destination until Human / WordPress authority exists.
    array('slug' => 'qa-budokan-local-nav-placeholder', 'title' => 'ローカルナビゲーション'),
);

$child_ids = array();
foreach ($children as $child) {
    $child_ids[] = budokan_qa_upsert_page($child['slug'], $child['title'], $group_id);
}

$current_page_id = $child_ids[1];
update_post_meta($current_page_id, '_wp_page_template', 'templates/template-oneColumnLocalNav.php');

$menu_name = 'sidebar-nav';
$menu = wp_get_nav_menu_object($menu_name);
if ($menu) {
    $menu_id = (int) $menu->term_id;
    $existing_items = wp_get_nav_menu_items($menu_id, array('post_status' => 'any')) ?: array();
    foreach ($existing_items as $existing_item) {
        wp_delete_post((int) $existing_item->ID, true);
    }
} else {
    $created = wp_create_nav_menu($menu_name);
    if (is_wp_error($created)) {
        WP_CLI::error($created->get_error_message());
    }
    $menu_id = (int) $created;
}

$root_menu_id = wp_update_nav_menu_item($menu_id, 0, array(
    'menu-item-title' => '武道 振興・普及事業',
    'menu-item-object-id' => $root_id,
    'menu-item-object' => 'page',
    'menu-item-type' => 'post_type',
    'menu-item-status' => 'publish',
));
if (is_wp_error($root_menu_id)) {
    WP_CLI::error($root_menu_id->get_error_message());
}

$group_menu_id = wp_update_nav_menu_item($menu_id, 0, array(
    'menu-item-title' => '指導者研修・指導法研究',
    'menu-item-object-id' => $group_id,
    'menu-item-object' => 'page',
    'menu-item-type' => 'post_type',
    'menu-item-parent-id' => (int) $root_menu_id,
    'menu-item-status' => 'publish',
));
if (is_wp_error($group_menu_id)) {
    WP_CLI::error($group_menu_id->get_error_message());
}

foreach ($children as $index => $child) {
    $item_id = wp_update_nav_menu_item($menu_id, 0, array(
        'menu-item-title' => $child['title'],
        'menu-item-object-id' => $child_ids[$index],
        'menu-item-object' => 'page',
        'menu-item-type' => 'post_type',
        'menu-item-parent-id' => (int) $group_menu_id,
        'menu-item-status' => 'publish',
    ));
    if (is_wp_error($item_id)) {
        WP_CLI::error($item_id->get_error_message());
    }
}

$locations = get_theme_mod('nav_menu_locations', array());
$locations['sidebar-nav'] = $menu_id;
set_theme_mod('nav_menu_locations', $locations);

update_option('budokan_local_nav_qa_page_id', $current_page_id, false);
flush_rewrite_rules(false);

WP_CLI::success(sprintf(
    'Seeded Budokan Local Navigation QA hierarchy in menu #%d; current page #%d.',
    $menu_id,
    $current_page_id
));
