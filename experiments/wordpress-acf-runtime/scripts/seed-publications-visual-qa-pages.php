<?php
/**
 * Local page shells for publication visual QA.
 *
 * The actual issue data is seeded by seed-budo-*.php and
 * seed-shodou-publication-qa.php. This file only creates fixed pages and assigns
 * the already-existing production templates so real browser QA exercises the
 * same routing layer as production.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    exit(2);
}
if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed publication QA pages outside local WordPress.');
}

$pages = array(
    'budo_back' => array(
        'slug' => 'qa-publications-budo-back',
        'title' => '月刊「武道」バックナンバーのご案内',
        'template' => 'page-publications-budo-back.php',
    ),
    'budo_latest' => array(
        'slug' => 'qa-publications-budo-latest',
        'title' => '月刊「武道」最新号のご案内',
        'template' => 'page-publications-budo-latest.php',
    ),
    'shodou_back' => array(
        'slug' => 'qa-publications-shodou-back',
        'title' => '月刊「書写書道」バックナンバーのご案内',
        'template' => 'page-publications-shodou-back.php',
    ),
    'shodou_latest' => array(
        'slug' => 'qa-publications-shodou-latest',
        'title' => '月刊「書写書道」最新号のご案内',
        'template' => 'page-publications-shodou-latest.php',
    ),
);

$ids = array();
foreach ($pages as $key => $page) {
    $existing = get_page_by_path($page['slug'], OBJECT, 'page');
    $post_id = wp_insert_post(array(
        'ID' => $existing ? (int) $existing->ID : 0,
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_name' => $page['slug'],
        'post_title' => $page['title'],
        'post_content' => '',
    ), true);

    if (is_wp_error($post_id)) {
        WP_CLI::error($post_id->get_error_message());
    }

    update_post_meta($post_id, '_wp_page_template', $page['template']);
    $ids[$key] = (int) $post_id;
}

update_option('budokan_publication_visual_qa_pages', $ids, false);
flush_rewrite_rules(false);
WP_CLI::success('Seeded publication visual QA pages: ' . wp_json_encode($ids));
