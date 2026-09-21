<?php
/**
 * Local/disposable QA seed: tankoubon list query contract.
 *
 * Existing tankobon CPT + `book` taxonomy + existing ACF only. This fixture
 * deliberately covers multiple terms, multi-term membership, long/empty ACF,
 * and missing thumbnails without changing production schema or data.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    exit(2);
}
if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed tankoubon list QA outside local WordPress.');
}
if (!taxonomy_exists('book') || !post_type_exists('tankoubon')) {
    WP_CLI::error('Existing tankoubon CPT / book taxonomy contract is unavailable.');
}

$term_specs = array(
    'budo' => array('name' => 'QA 武道', 'slug' => 'qa-book-budo'),
    'judo' => array('name' => 'QA 柔道', 'slug' => 'qa-book-judo'),
    'other' => array('name' => 'QA その他', 'slug' => 'qa-book-other'),
);
$term_ids = array();
foreach ($term_specs as $key => $spec) {
    $term = term_exists($spec['slug'], 'book');
    if (!$term) {
        $term = wp_insert_term($spec['name'], 'book', array('slug' => $spec['slug']));
    }
    if (is_wp_error($term)) {
        WP_CLI::error($term->get_error_message());
    }
    $term_ids[$key] = (int) (is_array($term) ? $term['term_id'] : $term);
}

$field_keys = array(
    'book_author' => 'field_nbk_book_author',
    'book_desc' => 'field_nbk_book_desc',
    'book_info' => 'field_nbk_book_info',
    'book_price' => 'field_nbk_book_price',
);

$fixtures = array(
    array(
        'key' => 'latest',
        'slug' => 'qa-tankoubon-list-latest',
        'title' => 'QA 単行本一覧 最新刊',
        'date' => '2026-09-21 09:00:00',
        'terms' => array('budo'),
        'fields' => array('book_author' => 'QA 著者', 'book_desc' => '今月のおすすめ自動取得確認用', 'book_info' => 'A5判・200頁', 'book_price' => '2,200円'),
    ),
    array(
        'key' => 'multi',
        'slug' => 'qa-tankoubon-list-multi',
        'title' => 'QA 単行本一覧 複数カテゴリ所属',
        'date' => '2026-09-20 09:00:00',
        'terms' => array('budo', 'judo'),
        'fields' => array('book_author' => 'QA 共著', 'book_desc' => '複数taxonomy所属確認用', 'book_info' => '四六判・180頁', 'book_price' => '1,980円'),
    ),
    array(
        'key' => 'long',
        'slug' => 'qa-tankoubon-list-long',
        'title' => 'QA 単行本一覧 非常に長いタイトルがカード内で自然に折り返して横スクロールを起こさないことを確認するための投稿',
        'date' => '2026-09-19 09:00:00',
        'terms' => array('judo'),
        'fields' => array(
            'book_author' => '非常に長い著者・編者・監修者名を想定したQA文字列 日本武道館刊行物編集委員会ほか',
            'book_desc' => '一覧カードの長文折り返しと高さの自然な伸長を確認するための説明文です。固定高やnowrapを前提にしません。',
            'book_info' => 'A5判・上製・本文512頁・別冊付録128頁',
            'book_price' => '12,345円（税込）',
        ),
    ),
    array(
        'key' => 'empty',
        'slug' => 'qa-tankoubon-list-empty',
        'title' => 'QA 単行本一覧 空ACF・画像なし',
        'date' => '2026-09-18 09:00:00',
        'terms' => array('other'),
        'fields' => array('book_author' => '', 'book_desc' => '', 'book_info' => '', 'book_price' => ''),
    ),
);

$post_ids = array();
foreach ($fixtures as $fixture) {
    $existing = get_page_by_path($fixture['slug'], OBJECT, 'tankoubon');
    $post_id = wp_insert_post(array(
        'ID' => $existing ? $existing->ID : 0,
        'post_type' => 'tankoubon',
        'post_status' => 'publish',
        'post_name' => $fixture['slug'],
        'post_title' => $fixture['title'],
        'post_date' => $fixture['date'],
        'post_date_gmt' => get_gmt_from_date($fixture['date']),
    ), true);
    if (is_wp_error($post_id)) {
        WP_CLI::error($post_id->get_error_message());
    }

    $assigned_terms = array();
    foreach ($fixture['terms'] as $term_key) {
        $assigned_terms[] = $term_ids[$term_key];
    }
    $set_terms = wp_set_object_terms($post_id, $assigned_terms, 'book', false);
    if (is_wp_error($set_terms)) {
        WP_CLI::error($set_terms->get_error_message());
    }

    foreach ($fixture['fields'] as $field => $value) {
        update_field($field_keys[$field], $value, $post_id);
    }
    delete_post_thumbnail($post_id);
    $post_ids[$fixture['key']] = (int) $post_id;
}

$latest = get_posts(array(
    'post_type' => 'tankoubon',
    'post_status' => 'publish',
    'posts_per_page' => 1,
    'orderby' => 'date',
    'order' => 'DESC',
    'fields' => 'ids',
));
if (empty($latest) || (int) $latest[0] !== $post_ids['latest']) {
    WP_CLI::error('Latest tankoubon query contract did not return the newest fixture.');
}

$counts = array();
foreach ($term_ids as $key => $term_id) {
    $query = new WP_Query(array(
        'post_type' => 'tankoubon',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'no_found_rows' => true,
        'tax_query' => array(array(
            'taxonomy' => 'book',
            'field' => 'term_id',
            'terms' => array($term_id),
        )),
    ));
    $counts[$key] = count($query->posts);
    wp_reset_postdata();
}
if ($counts['budo'] !== 2 || $counts['judo'] !== 2 || $counts['other'] !== 1) {
    WP_CLI::error('Tankoubon taxonomy query contract counts are unexpected: ' . wp_json_encode($counts));
}

update_option('budokan_tankoubon_list_qa', array(
    'posts' => $post_ids,
    'terms' => $term_ids,
    'counts' => $counts,
    'latest' => $post_ids['latest'],
), false);
WP_CLI::success('Seeded and verified tankoubon list query fixtures.');
