<?php

/**
 * Disposable Budokan Modaal interaction runtime fixture.
 * QA-only: exercises the Theme's existing module_gallery -> Modaal 0.4.4 ownership.
 */
if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}
if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan modal QA outside a local WordPress environment.');
}
$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan modal fixture requires the nipponbudokan theme.');
}

$slug = 'qa-budokan-modal-interaction';
$existing = get_posts(array(
    'post_type' => 'page', 'post_status' => 'any', 'name' => $slug,
    'posts_per_page' => 1, 'orderby' => 'ID', 'order' => 'ASC', 'no_found_rows' => true,
));
$theme_uri = get_template_directory_uri();
$image_url = esc_url($theme_uri . '/images/top/mv-sample.webp');
$content = sprintf(
    '<div class="qa-modal-fixture" style="min-height:2200px;padding-top:900px"><p>Modal interaction runtime QA fixture.</p><div class="module_gallery-01"><a class="qa-modal-trigger" href="%1$s"><img src="%1$s" alt="Modal QA" width="320" height="180"></a></div><div style="height:900px" aria-hidden="true"></div></div>',
    $image_url
);
$payload = array(
    'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'Modal Interaction QA',
    'post_name' => $slug, 'post_content' => $content,
);
if ($existing) {
    $payload['ID'] = (int) $existing[0]->ID;
    $page_id = wp_update_post($payload, true);
} else {
    $page_id = wp_insert_post($payload, true);
}
if (is_wp_error($page_id)) WP_CLI::error($page_id->get_error_message());
update_post_meta((int) $page_id, '_wp_page_template', 'templates/template-oneColumn.php');
update_option('budokan_modal_qa_page_id', (int) $page_id, false);
flush_rewrite_rules(false);
WP_CLI::success(sprintf('Seeded Budokan modal interaction QA page #%d.', (int) $page_id));
