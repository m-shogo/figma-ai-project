<?php

/**
 * Disposable Budokan Global/Footer Navigation disclosure runtime fixture.
 *
 * QA-only: creates real WordPress menus with parent/child hierarchy and assigns
 * them to the existing human-editable Theme Locations. No production menu
 * ownership or data model is created by this script.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan Global/Footer disclosure QA outside a local WordPress environment.');
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan Global/Footer disclosure fixture requires the nipponbudokan theme.');
}

function budokan_disclosure_qa_page(string $slug, string $title): int
{
    $matches = get_posts(array(
        'post_type' => 'page',
        'post_status' => 'any',
        'name' => $slug,
        'posts_per_page' => 1,
        'orderby' => 'ID',
        'order' => 'ASC',
        'no_found_rows' => true,
    ));

    $payload = array(
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_title' => $title,
        'post_name' => $slug,
        'post_content' => '<!-- wp:paragraph --><p>Global/Footer disclosure runtime QA fixture.</p><!-- /wp:paragraph -->',
    );

    if ($matches) {
        $payload['ID'] = (int) $matches[0]->ID;
        $result = wp_update_post($payload, true);
    } else {
        $result = wp_insert_post($payload, true);
    }

    if (is_wp_error($result)) {
        WP_CLI::error($result->get_error_message());
    }

    return (int) $result;
}

function budokan_disclosure_qa_menu(string $menu_name, string $parent_title, string $child_title, string $parent_url, string $child_url): int
{
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

    $parent_id = wp_update_nav_menu_item($menu_id, 0, array(
        'menu-item-title' => $parent_title,
        'menu-item-url' => $parent_url,
        'menu-item-type' => 'custom',
        'menu-item-status' => 'publish',
    ));
    if (is_wp_error($parent_id)) {
        WP_CLI::error($parent_id->get_error_message());
    }

    $child_id = wp_update_nav_menu_item($menu_id, 0, array(
        'menu-item-title' => $child_title,
        'menu-item-url' => $child_url,
        'menu-item-type' => 'custom',
        'menu-item-parent-id' => (int) $parent_id,
        'menu-item-status' => 'publish',
    ));
    if (is_wp_error($child_id)) {
        WP_CLI::error($child_id->get_error_message());
    }

    return $menu_id;
}

$page_id = budokan_disclosure_qa_page('qa-budokan-global-footer-disclosure', 'Global Footer Disclosure QA');
update_post_meta($page_id, '_wp_page_template', 'templates/template-oneColumn.php');

$global_menu_id = budokan_disclosure_qa_menu(
    'global-nav-qa',
    'Global Disclosure QA',
    'Global Child QA',
    home_url('/qa-global-parent/'),
    home_url('/qa-global-child/')
);
$footer_menu_id = budokan_disclosure_qa_menu(
    'footer-nav-qa',
    'Footer Disclosure QA',
    'Footer Child QA',
    home_url('/qa-footer-parent/'),
    home_url('/qa-footer-child/')
);

$locations = get_theme_mod('nav_menu_locations', array());
$locations['global-nav'] = $global_menu_id;
$locations['footer-nav'] = $footer_menu_id;
set_theme_mod('nav_menu_locations', $locations);

update_option('budokan_global_footer_disclosure_qa_page_id', $page_id, false);
flush_rewrite_rules(false);

WP_CLI::success(sprintf(
    'Seeded Budokan Global/Footer disclosure QA page #%d with global menu #%d and footer menu #%d.',
    $page_id,
    $global_menu_id,
    $footer_menu_id
));
