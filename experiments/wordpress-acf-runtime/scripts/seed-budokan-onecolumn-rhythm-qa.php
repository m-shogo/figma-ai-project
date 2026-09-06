<?php
/** Disposable one-column page rhythm fixture. */
if (!defined('WP_CLI') || !WP_CLI) { exit(2); }
if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed outside local WordPress.');
}
$page = get_page_by_path('qa-budokan-onecolumn-rhythm');
$payload = array(
    'post_type' => 'page',
    'post_status' => 'publish',
    'post_title' => '研修センター',
    'post_name' => 'qa-budokan-onecolumn-rhythm',
    'post_content' => '<!-- wp:paragraph --><p>One-column runtime QA fixture.</p><!-- /wp:paragraph -->',
);
if ($page) { $payload['ID'] = (int) $page->ID; $id = wp_update_post($payload, true); }
else { $id = wp_insert_post($payload, true); }
if (is_wp_error($id)) { WP_CLI::error($id->get_error_message()); }
update_post_meta((int)$id, '_wp_page_template', 'templates/template-oneColumn.php');
update_option('budokan_onecolumn_rhythm_qa_page_id', (int)$id, false);
WP_CLI::success('Seeded one-column rhythm QA page.');
