<?php
/**
 * Local/disposable QA page for the public tankoubon list owner.
 * Requires seed-tankoubon-list-qa.php to have already created posts/terms.
 */
if (!defined('WP_CLI') || !WP_CLI) {
    exit(2);
}
if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed tankoubon list page QA outside local WordPress.');
}

function nbk_qa_ensure_page($slug, $title, $parent_id = 0) {
    $existing = get_page_by_path($slug, OBJECT, 'page');
    $post_id = wp_insert_post(array(
        'ID'          => $existing ? $existing->ID : 0,
        'post_type'   => 'page',
        'post_status' => 'publish',
        'post_name'   => $slug,
        'post_title'  => $title,
        'post_parent' => (int) $parent_id,
    ), true);
    if (is_wp_error($post_id)) {
        WP_CLI::error($post_id->get_error_message());
    }
    return (int) $post_id;
}

$publications_id = nbk_qa_ensure_page('publications', '刊行物');
$budo_id = nbk_qa_ensure_page('budo', '武道刊行物', $publications_id);
$books_id = nbk_qa_ensure_page('books', '日本武道館発行の単行本', $budo_id);
update_post_meta($books_id, '_wp_page_template', 'page-publications-budo-books.php');

$template = get_page_template_slug($books_id);
if ($template !== 'page-publications-budo-books.php') {
    WP_CLI::error('Tankoubon list QA page template assignment failed.');
}

update_option('budokan_tankoubon_list_qa_page_id', $books_id, false);
WP_CLI::success('Seeded tankoubon list QA page: ' . $books_id);
