<?php
global $post;
// ページタイトルと説明文を取得
$page_acf_title = function_exists('get_field') ? get_field('page_title') : null;
$page_acf_description = function_exists('get_field') ? get_field('page_description') : null;

// サイトの基本情報を取得
$site_name = get_bloginfo('name');
$document_title_default = wp_get_document_title();
$site_description_default = get_bloginfo('description');

// 表示するタイトルを決定
if (is_front_page() || is_home()) {
    $ogp_title = $page_acf_title ? $page_acf_title : $site_name;
} else {
    $ogp_title = $page_acf_title ? $page_acf_title : $document_title_default;
}
// 表示する説明文を決定
$ogp_description = $page_acf_description ? $page_acf_description : $site_description_default;

// 共通の設定
$ogp_type = is_singular() ? 'article' : 'website';
$ogp_scheme = is_ssl() ? 'https://' : 'http://';
$ogp_url = $ogp_scheme . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
$ogp_image = get_template_directory_uri() . '/images/common/ogp.webp'; // デフォルト画像 URL
$ogp_locale = get_locale();

// Twitterアカウント情報（任意）
$twitter_site = ''; // サイトのTwitterアカウント「例：@your_twitter_account」
$twitter_creator = ''; // 投稿者のTwitterアカウント（あれば）「例：@creator_account」

// 個別ページの設定
if (is_singular() && $post) {
    // 投稿ページや固定ページの説明文の設定
    if (!$page_acf_description) {
        $excerpt = $post->post_excerpt ?: wp_strip_all_tags($post->post_content);
        if (empty($excerpt)) {
            // $excerptが空の場合、サイトの説明文を使用
            $ogp_description = $site_description_default;
        } else {
            // 抜粋を160文字にトリミング
            $ogp_description = mb_substr(str_replace(["\r\n", "\n", "\r"], ' ', $excerpt), 0, 160, 'UTF-8') . '...';
        }
    }
    if (has_post_thumbnail()) {
        $thumbnail_src = wp_get_attachment_image_src(get_post_thumbnail_id($post->ID), 'full');
        if ($thumbnail_src) {
            $ogp_image = esc_url($thumbnail_src[0]);
        }
    }
}

// メタタグ出力
echo "\n<meta property=\"og:type\" content=\"" . esc_attr($ogp_type) . "\">";
echo "\n<meta property=\"og:url\" content=\"" . esc_url($ogp_url) . "\">";
echo "\n<meta property=\"og:title\" content=\"" . esc_attr($ogp_title) . "\">";
echo "\n<meta property=\"og:description\" content=\"" . esc_attr($ogp_description) . "\">";
echo "\n<meta property=\"og:image\" content=\"" . esc_url($ogp_image) . "\">";
echo "\n<meta property=\"og:site_name\" content=\"" . esc_attr($site_name) . "\">";
echo "\n<meta property=\"og:locale\" content=\"" . esc_attr($ogp_locale) . "\">";

// Twitterカード用メタタグ
echo "\n<meta name=\"twitter:card\" content=\"summary_large_image\">";
echo "\n<meta name=\"twitter:title\" content=\"" . esc_attr($ogp_title) . "\">";
echo "\n<meta name=\"twitter:description\" content=\"" . esc_attr($ogp_description) . "\">";
echo "\n<meta name=\"twitter:image\" content=\"" . esc_url($ogp_image) . "\">";
if (!empty($twitter_site)) {
    echo "\n<meta name=\"twitter:site\" content=\"{$twitter_site}\">";
}
if (!empty($twitter_creator)) {
    echo "\n<meta name=\"twitter:creator\" content=\"{$twitter_creator}\">";
}
