<meta content="IE=Edge" http-equiv="X-UA-Compatible">
<meta content="width=device-width" name="viewport">
<meta content="telephone=no, email=no, address=no" name="format-detection">
<link href='//www.google-analytics.com' rel='preconnect dns-prefetch'>
<!-- Google Fonts -->
<!-- fonts -->
<?php $font_base = get_template_directory_uri() . '/fonts/'; ?>
<link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>NotoSansJP-Regular.woff2">
<?php if (false): ?>
    <!-- FVなどで優先的に読み込ませたいフォントがある場合はif文から外してください -->
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>NotoSansJP-Medium.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>NotoSansJP-SemiBold.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>NotoSansJP-Bold.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>NotoSerifJP-Regular.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>NotoSerifJP-Medium.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>NotoSerifJP-SemiBold.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>NotoSerifJP-Bold.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>Roboto-Regular.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>Roboto-Medium.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>Roboto-SemiBold.woff2">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="<?php echo $font_base; ?>Roboto-Bold.woff2">
<?php endif; ?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&family=Noto+Serif+JP:wght@200..900&family=Roboto:wght@100..900&display=swap" fetchpriority="high">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&family=Noto+Serif+JP:wght@200..900&family=Roboto:wght@100..900&display=swap" media="print" onload='this.media="all"'>
<link rel="preload" as="style" href="<?php echo esc_url(get_theme_file_uri('/css/all.min.css?ver=6.7.2')); ?>" fetchpriority="high">
<link rel="stylesheet" href="<?php echo esc_url(get_theme_file_uri('/css/all.min.css?ver=6.7.2')); ?>" media="print" onload='this.media="all"'>
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
    $display_title = $page_acf_title ? $page_acf_title : $site_name;
} else {
    $display_title = $page_acf_title ? $page_acf_title : $document_title_default;
}

// 表示する説明文を決定
$display_description = $page_acf_description ? $page_acf_description : $site_description_default;

// 投稿ページや固定ページの説明文の設定
if (is_singular() && $post && !$page_acf_description) {
    $excerpt = $post->post_excerpt ?: wp_strip_all_tags($post->post_content);
    if (empty($excerpt)) {
        // $excerptが空の場合、サイトの説明文を使用
        $display_description = $site_description_default;
    } else {
        // 抜粋を160文字にトリミング
        $display_description = mb_substr(str_replace(["\r\n", "\n", "\r"], ' ', $excerpt), 0, 160, 'UTF-8') . '...';
    }
}
?>
<title><?php echo esc_html($display_title); ?></title>
<meta name="title" content="<?php echo esc_attr($display_title); ?>">
<meta name="description" content="<?php echo esc_attr($display_description); ?>">
<meta itemprop="name" content="<?php echo esc_attr($display_title); ?>">
<meta itemprop="description" content="<?php echo esc_attr($display_description); ?>">

<script>
    (function() {
        const MOBILE_BREAKPOINT = 768;

        function getOrCreateViewportMeta() {
            let meta = document.querySelector("meta[name='viewport']");
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', 'viewport');
                document.head.appendChild(meta);
            }
            return meta;
        }

        function setViewport() {
            const meta = getOrCreateViewportMeta();
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                // 小さな画面 → デバイス幅にフィット（レスポンシブ）
                meta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
            } else {
                // 大きな画面 → 固定幅 1280px を基準に表示
                meta.setAttribute('content', 'width=1280');
            }
        }

        // リサイズ連打対策（デバウンス）
        let timer = null;

        function onResize() {
            clearTimeout(timer);
            timer = setTimeout(setViewport, 150);
        }

        window.addEventListener('DOMContentLoaded', setViewport, false);
        window.addEventListener('resize', onResize, false);
        window.addEventListener('orientationchange', setViewport, false);
    })();
</script>

<!-- OGP指定 -->
<?php get_template_part('template-parts/_ogp-meta'); ?>

<!-- favicon指定 -->
<link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/images/favicon/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="<?php echo get_template_directory_uri(); ?>/images/favicon/favicon.svg">
<link rel="shortcut icon" href="<?php echo get_template_directory_uri(); ?>/images/favicon/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="<?php echo get_template_directory_uri(); ?>/images/favicon/apple-touch-icon.png">
<meta name="apple-mobile-web-app-title" content="サンプルサイト" />
<link rel="manifest" href="<?php echo get_template_directory_uri(); ?>/images/favicon/site.webmanifest">

<meta name="theme-color" content="#ffffff">
<style>
    <?php include(get_theme_file_path('/css/project/top_mainVisual.css')); ?>
    <?php include(get_theme_file_path('/css/add.css')); ?>
</style>
<script type="module" src="http://localhost:5173/@vite/client"></script>