<?php

/**
 * --------------------------------------------------------------------------------
 * 
 * 検索の設定
 * 
 * --------------------------------------------------------------------------------
 */

// ==========================================================================
// WordPress標準のサイト内検索を無効化
// ==========================================================================
// function search_404($query)
// {
// if (is_search()) {
// // 404ページを返す
// $query->set_404();
// // 404コードを返す
// status_header(404);
// // キャッシュの無効化
// nocache_headers();
// }
// }
//add_filter( 'parse_query', 'search_404' );

// ==========================================================================
// カスタムフィールドの内容を検索対象にする
// ==========================================================================
function cf_search_join($join)
{
    global $wpdb;
    if (is_search()) {
        $join .= ' LEFT JOIN ' . $wpdb->postmeta . ' AS cf_pm ON ' . $wpdb->posts . '.ID = cf_pm.post_id ';
    }
    return $join;
}
add_filter('posts_join', 'cf_search_join');

function cf_search_where($where)
{
    global $wpdb;
    if (is_search()) {
        $excluded_meta_keys = ['_oembed_%'];

        $excluded_conditions = array_map(function ($key) {
            return "cf_pm.meta_key NOT LIKE '" . esc_sql($key) . "'";
        }, $excluded_meta_keys);

        $excluded_sql = implode(" AND ", $excluded_conditions);

        $where = preg_replace(
            "/\(\s*" . $wpdb->posts . ".post_title\s+LIKE\s*(\'[^\']+\')\s*\)/",
            "(" . $wpdb->posts . ".post_title LIKE $1 OR " . $wpdb->posts . ".post_content LIKE $1) 
          OR (" . "cf_pm.meta_value LIKE $1 AND $excluded_sql)",
            $where
        );
    }
    return $where;
}
add_filter('posts_where', 'cf_search_where');

function cf_search_distinct($where)
{
    if (is_search()) {
        return "DISTINCT";
    }

    return $where;
}
add_filter('posts_distinct', 'cf_search_distinct');

// ==========================================================================
// 検索結果の検索ワードに色付ける$explanation = highLight(get_field('publication_explanation'));
// 出力するものにhighLight()で囲む
// ==========================================================================
// function highLight($text)
// {
//   if (is_search()) {
//     $sr = get_query_var('s');
//     $keys = explode(" ", $sr);
//     $text = preg_replace('/(' . implode('|', $keys) . ')/iu', '<span class="_highLight">' . $sr . '</span>', $text);
//   }
//   return $text;
// }
