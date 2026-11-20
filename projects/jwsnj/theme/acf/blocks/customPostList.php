<?php
// 投稿タイプとタクソノミーの対応マッピング
$post_type_taxonomy_map = [
    'post' => [
        'taxonomy' => 'category',
        'field' => 'block_category'
    ],
    'event' => [
        'taxonomy' => 'event_cat',
        'field' => 'block_event_cat'
    ],
];

// 基本設定の取得
$post_type = get_field('block_post_type') ?: 'post';
$posts_per_page = get_field('block_posts_per_page');

// タクソノミーとタームの取得
$taxonomy = '';
$terms = [];

if (isset($post_type_taxonomy_map[$post_type])) {
    $taxonomy = $post_type_taxonomy_map[$post_type]['taxonomy'];
    $field = $post_type_taxonomy_map[$post_type]['field'];
    $raw_terms = get_field($field);

    // タームを配列に正規化
    if (!empty($raw_terms)) {
        if (!is_array($raw_terms)) {
            $raw_terms = [$raw_terms];
        }
        foreach ($raw_terms as $term) {
            if (is_object($term) && isset($term->term_id)) {
                $terms[] = (int)$term->term_id;
            } elseif (is_array($term) && isset($term['term_id'])) {
                $terms[] = (int)$term['term_id'];
            } elseif (is_numeric($term)) {
                $terms[] = (int)$term;
            }
        }
    }
}

// クエリの構築
$args = [
    'post_type' => $post_type,
    'post_status' => 'publish',
    'posts_per_page' => $posts_per_page ?: -1,
];

// タームによる絞り込み
if (!empty($terms)) {
    $args['tax_query'] = [[
        'taxonomy' => $taxonomy,
        'field' => 'term_id',
        'terms' => $terms,
        'operator' => 'IN',
        'include_children' => true,
    ]];
}

$query = new WP_Query($args);

// 投稿タイプに応じた出力処理
switch ($post_type) {
    case 'post':
        if ($query->have_posts()) {
            global $wp_query;
            $main_query = $wp_query;
            $wp_query = $query;
            get_template_part('template-parts/_list-news', null, array('props' => 'customPostList'));
            $wp_query = $main_query;
        } else {
            echo '<p>該当する投稿はございません。</p>';
        }
        break;

    case 'event':
        if ($query->have_posts()) {
            global $wp_query;
            $main_query = $wp_query;
            $wp_query = $query;
            get_template_part('template-parts/_list-card', null, array('props' => 'customPostList'));
            $wp_query = $main_query;
        } else {
            echo '<p>該当する投稿はございません。</p>';
        }
        break;
}

wp_reset_postdata();
