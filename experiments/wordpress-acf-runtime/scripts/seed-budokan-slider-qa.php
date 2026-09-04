<?php

/**
 * Disposable Budokan ACF Slider interaction runtime fixture.
 *
 * QA-only. It renders the Theme's existing acf/slider block so the block's
 * own enqueue_assets callback is exercised in a real local WordPress page.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan slider QA outside a local WordPress environment.');
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan slider fixture requires the nipponbudokan theme.');
}

if (!function_exists('acf_register_block_type')) {
    WP_CLI::error('Budokan slider fixture requires ACF Pro block support.');
}

$slug = 'qa-budokan-slider-interaction';
$existing = get_posts(array(
    'post_type' => 'page',
    'post_status' => 'any',
    'name' => $slug,
    'posts_per_page' => 1,
    'orderby' => 'ID',
    'order' => 'ASC',
    'no_found_rows' => true,
));

$block = array(
    'blockName' => 'acf/slider',
    'attrs' => array(
        'name' => 'acf/slider',
        'data' => array(
            'slider_items' => 3,
            'slider_items_0_image' => '',
            'slider_items_0_caption' => 'スライド A',
            'slider_items_1_image' => '',
            'slider_items_1_caption' => 'スライド B',
            'slider_items_2_image' => '',
            'slider_items_2_caption' => 'スライド C',
        ),
        'mode' => 'preview',
    ),
    'innerBlocks' => array(),
    'innerHTML' => '',
    'innerContent' => array(),
);

$content = '<p>Slider interaction runtime QA fixture.</p>' . serialize_block($block);

$payload = array(
    'post_type' => 'page',
    'post_status' => 'publish',
    'post_title' => 'Slider Interaction QA',
    'post_name' => $slug,
    'post_content' => $content,
);

if ($existing) {
    $payload['ID'] = (int) $existing[0]->ID;
    $page_id = wp_update_post($payload, true);
} else {
    $page_id = wp_insert_post($payload, true);
}

if (is_wp_error($page_id)) {
    WP_CLI::error($page_id->get_error_message());
}

update_post_meta((int) $page_id, '_wp_page_template', 'templates/template-oneColumn.php');
update_option('budokan_slider_qa_page_id', (int) $page_id, false);
flush_rewrite_rules(false);

WP_CLI::success(sprintf('Seeded Budokan slider interaction QA page #%d.', (int) $page_id));
