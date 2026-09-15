<?php

/**
 * Disposable Budokan Local Navigation fixture (ACF page_local_nav).
 *
 *   wp eval-file /fixture/scripts/seed-budokan-local-nav-qa.php
 *
 * Menu 「ローカル：大会・イベント」(NOT a theme location), 3 levels:
 *   1) 武道 振興・普及事業
 *   2) 大会・イベント（リンク）
 *   3) 各ページリンク
 * PC Figma 2108:10846 shows level-2 heading + level-3 grid.
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
    $matches = get_posts(array(
        'post_type' => 'page',
        'post_status' => 'any',
        'name' => $slug,
        'post_parent' => $parent_id,
        'posts_per_page' => 1,
        'orderby' => 'ID',
        'order' => 'ASC',
        'no_found_rows' => true,
    ));
    $page = $matches ? $matches[0] : null;

    $payload = array(
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_title' => $title,
        'post_name' => $slug,
        'post_parent' => $parent_id,
        'post_content' => '<!-- wp:paragraph --><p>Local Navigation ACF QA fixture (Figma 2108:10846).</p><!-- /wp:paragraph -->',
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

$family_id = budokan_qa_upsert_page('qa-ln-budo-promotion', '武道 振興・普及事業');
$group_id = budokan_qa_upsert_page('qa-ln-tournament-events', '大会・イベント', $family_id);

$page_id = budokan_qa_upsert_page(
    'qa-local-nav-tournament',
    '全日本少年少女武道錬成大会',
    $group_id
);
delete_post_meta($page_id, '_wp_page_template');
// Default template = page.php (Local Nav shell). Not one-column templates.

$children = array(
    array('slug' => 'qa-ln-youth-budo', 'title' => '全日本少年少女武道錬成大会'),
    array('slug' => 'qa-ln-aikido', 'title' => '合気道'),
    array('slug' => 'qa-ln-judo', 'title' => '柔道'),
    array('slug' => 'qa-ln-jukendo', 'title' => '銃剣道'),
    array('slug' => 'qa-ln-karate', 'title' => '空手道'),
    array('slug' => 'qa-ln-kendo', 'title' => '剣道'),
    array('slug' => 'qa-ln-kyudo', 'title' => '弓道'),
    array('slug' => 'qa-ln-naginata', 'title' => 'なぎなた'),
    array('slug' => 'qa-ln-shorinji', 'title' => '少林寺拳法'),
    array('slug' => 'qa-ln-regional', 'title' => '地方青少年武道錬成大会'),
    array('slug' => 'qa-ln-kobudo', 'title' => '日本古武道演武大会'),
    array('slug' => 'qa-ln-kashima', 'title' => '鹿島古武道大会'),
    array('slug' => 'qa-ln-kagami', 'title' => '鏡開き式・武道始め'),
    array('slug' => 'qa-ln-wakashio', 'title' => '若潮杯争奪武道大会'),
    array('slug' => 'qa-ln-experience', 'title' => '日本武道館で武道を体験してみよう'),
);

$child_ids = array();
foreach ($children as $index => $child) {
    if ($index === 0) {
        $child_ids[] = $page_id;
        continue;
    }
    $child_ids[] = budokan_qa_upsert_page($child['slug'], $child['title'], $group_id);
}

$menu_name = 'ローカル：大会・イベント';
$menu = wp_get_nav_menu_object($menu_name);
if (!$menu) {
    foreach (wp_get_nav_menus() as $existing) {
        if ($existing->name === $menu_name) {
            $menu = $existing;
            break;
        }
    }
}

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

if (function_exists('nipponbudokan_sync_local_nav_menu_slug')) {
    nipponbudokan_sync_local_nav_menu_slug($menu_id);
}

$family_menu_id = wp_update_nav_menu_item($menu_id, 0, array(
    'menu-item-title' => '武道 振興・普及事業',
    'menu-item-object-id' => $family_id,
    'menu-item-object' => 'page',
    'menu-item-type' => 'post_type',
    'menu-item-status' => 'publish',
));
if (is_wp_error($family_menu_id)) {
    WP_CLI::error($family_menu_id->get_error_message());
}

$group_menu_id = wp_update_nav_menu_item($menu_id, 0, array(
    'menu-item-title' => '大会・イベント',
    'menu-item-object-id' => $group_id,
    'menu-item-object' => 'page',
    'menu-item-type' => 'post_type',
    'menu-item-parent-id' => (int) $family_menu_id,
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
foreach ($locations as $location => $assigned_id) {
    if ((int) $assigned_id === $menu_id) {
        unset($locations[$location]);
    }
}
set_theme_mod('nav_menu_locations', $locations);

if (function_exists('update_field')) {
    update_field('page_local_nav', (string) $menu_id, $page_id);
} else {
    update_post_meta($page_id, 'page_local_nav', (string) $menu_id);
}

update_option('budokan_local_nav_qa_page_id', $page_id, false);
flush_rewrite_rules(false);

$menu_obj = wp_get_nav_menu_object($menu_id);
WP_CLI::success(sprintf(
    'Seeded Local Nav QA: menu #%d (%s / %s) → page #%d (%s).',
    $menu_id,
    $menu_obj ? $menu_obj->name : $menu_name,
    $menu_obj ? $menu_obj->slug : 'local-?',
    $page_id,
    get_permalink($page_id)
));
