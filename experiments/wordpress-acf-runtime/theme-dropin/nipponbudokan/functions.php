<?php

/**
 * フロントのスタイル・JS設定
 */
if (locate_template('inc/front.php') !== '') {
    require_once locate_template('inc/front.php');
}

/**
 * 管理画面の設定
 */
if (locate_template('inc/admin.php') !== '') {
    require_once locate_template('inc/admin.php');
}

/**
 * カスタム投稿タイプ・タクソノミーの設定
 */
if (locate_template('inc/custom.php') !== '') {
    require_once locate_template('inc/custom.php');
}

/**
 * パーマリンクの設定
 */
if (locate_template('inc/permalink.php') !== '') {
    require_once locate_template('inc/permalink.php');
}

/**
 * カスタムフィールドの設定
 */
if (locate_template('inc/field.php') !== '') {
    require_once locate_template('inc/field.php');
}

/**
 * エディターの設定
 */
if (locate_template('inc/editor.php') !== '') {
    require_once locate_template('inc/editor.php');
}

/**
 * フォームの設定
 */
if (locate_template('inc/form.php') !== '') {
    require_once locate_template('inc/form.php');
}

/**
 * 検索の設定
 */
if (locate_template('inc/search.php') !== '') {
    require_once locate_template('inc/search.php');
}

/**
 * ショートコードの設定
 */
if (locate_template('inc/shortcode.php') !== '') {
    require_once locate_template('inc/shortcode.php');
}

/**
 * メニューの設定
 */
if (locate_template('inc/menu.php') !== '') {
    require_once locate_template('inc/menu.php');
}

/**
 * Modaal 0.4.4はclose時のfocus復帰をscroll-lock解除前に行うため、
 * 深い位置の画像モーダルを閉じると背景が移動するブラウザがある。
 * 既存Modaal/common.jsのownershipを保ったまま、focus復帰だけpreventScrollで補正する。
 */
function nipponbudokan_enqueue_modaal_scroll_stability() {
    $path = get_theme_file_path('/js/modaal-scroll-stability.js');
    wp_enqueue_script(
        'modaal-scroll-stability-script',
        get_theme_file_uri('/js/modaal-scroll-stability.js'),
        array('common-script'),
        file_exists($path) ? filemtime($path) : null,
        array('strategy' => 'defer', 'in_footer' => false)
    );
}
add_action('wp_enqueue_scripts', 'nipponbudokan_enqueue_modaal_scroll_stability', 20);
