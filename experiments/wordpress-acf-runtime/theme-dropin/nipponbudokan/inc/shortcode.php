<?php

/**
 * --------------------------------------------------------------------------------
 * 
 * ショートコードの設定
 * 
 * --------------------------------------------------------------------------------
 */

// 見出し
function module_title($atts, $content = null)
{
    extract(shortcode_atts(array('type' => '', 'id' => '',), $atts));

    if (empty($id)) {
        switch ($type) {
            case 'h5':
                return '<h5 class="module_title-04"><span>' . $content . '</span></h5>';
            case 'h4':
                return '<h4 class="module_title-03"><span>' . $content . '</span></h4>';
            case 'h3':
                return '<h3 class="module_title-02"><span>' . $content . '</span></h3>';
            case 'h2':
                return '<h2 class="module_title-01"><span>' . $content . '</span></h2>';
        }
    } else {
        switch ($type) {
            case 'h5':
                return '<h5 id="' . esc_attr($id) . '" class="module_title-04"><span>' . $content . '</span></h5>';
            case 'h4':
                return '<h4 id="' . esc_attr($id) . '" class="module_title-03"><span>' . $content . '</span></h4>';
            case 'h3':
                return '<h3 id="' . esc_attr($id) . '" class="module_title-02"><span>' . $content . '</span></h3>';
            case 'h2':
                return '<h2 id="' . esc_attr($id) . '" class="module_title-01"><span>' . $content . '</span></h2>';
        }
    }
}
add_shortcode('ttl', 'module_title');

// 区切り線
function module_line($atts, $content = null)
{
    extract(shortcode_atts(array('line' => '',), $atts));

    return '<hr class="module_line-01">';
}
add_shortcode('line', 'module_line');

// ボタン
function module_link($atts, $content = null)
{
    extract(shortcode_atts(array('type' => '', 'href' => '',), $atts));

    switch ($type) {
        case 'btn01':
            return '<p class="module_button"><a href="' . esc_attr($href) . '" class="module_button-01"><span>' . $content . '</span></a></p>';
        case 'external01':
            return '<p class="module_button"><a href="' . esc_attr($href) . '" class="module_button-01" target="_blank"><span>' . $content . '</span></a></p>';
        case 'btn02':
            return '<p class="module_button _left _small"><a href="' . esc_attr($href) . '" class="module_button-02"><span>' . $content . '</span></a></p>';
        case 'external02':
            return '<p class="module_button _left _small"><a href="' . esc_attr($href) . '" class="module_button-02" target="_blank"><span>' . $content . '</span></a></p>';
    }
}
add_shortcode('btn', 'module_link');

// Youtube
function module_youtube($atts, $content = null)
{
    extract(shortcode_atts(array('id' => '',), $atts));

    return '<div class="module_movie"><iframe src="https://www.youtube.com/embed/' . esc_attr($id) . '?rel=0&showinfo=0" frameborder="0" allowfullscreen></iframe></div>';
}
add_shortcode('movie', 'module_youtube');

// GoogleMap
function module_googleMap($atts, $content = null)
{
    extract(shortcode_atts(array('src' => '',), $atts));

    return '<div class="module_map"><iframe src="' . esc_attr($src) . '" width="800" height="450" frameborder="0" style="border:0" allowfullscreen></iframe></div>';
}
add_shortcode('map', 'module_googleMap');

// 余白
function module_space($atts, $content = null)
{
    extract(shortcode_atts(array('space' => '',), $atts));

    switch ($space) {
        case 'space-S':
            return '<div class="module_space-S"></div>';
        case 'space-M':
            return '<div class="module_space-M"></div>';
        case 'space-L':
            return '<div class="module_space-L"></div>';
    }
}
add_shortcode('space', 'module_space');

// エンティティ
function module_entity($atts, $content = null)
{
    return '' . esc_html(antispambot($content)) . '';
}
add_shortcode('entity', 'module_entity');

// ==========================================================================
// ショートコードで最新記事一覧を表示
// ==========================================================================
function shortcode_post($atts)
{
    ob_start();
    extract(shortcode_atts(array(
        "num" => '',    //最新記事リストの取得数
        "cat" => '',    //表示する記事のカテゴリー指定
        "term" => '',    //表示する記事のカテゴリー指定
        "post_type" => '',    //表示する記事のカテゴリー指定
        "format" => ''    //表示する記事のフォーマット指定（news,card等）
    ), $atts));
    global $post;
    $old_post = $post;
    $retHtml = '';

    if (!empty($term)) {
        $arg = array(
            'has_password' => false,
            'posts_per_page' => $num,
            'order_by' => 'date',
            'order' => 'DESC',
            'post_type'      => $post_type,  // カスタム投稿タイプ名
            'tax_query'      => array(
                array(
                    'taxonomy' => '' . $post_type . '_cat',  // カスタムタクソノミー名
                    'field'    => 'slug',  // ターム名を term_id,slug,name のどれで指定するか
                    'terms'    => array($term) // タクソノミーに属するタームid
                )
            )
        );
    } elseif (!empty($cat)) {
        $arg = array(
            'has_password' => false,
            'posts_per_page' => $num,
            'order_by' => 'date',
            'order' => 'DESC',
            'post_type'      => $post_type,  // カスタム投稿タイプ名
            'category_name' => $cat,
        );
    } else {
        $arg = array(
            'has_password' => false,
            'posts_per_page' => $num,
            'order_by' => 'date',
            'order' => 'DESC',
            'post_type'      => $post_type,  // カスタム投稿タイプ名
        );
    }
    $post = $old_post;
    $posts = get_posts($arg);
    if ($posts): {
            if ($format === "card") {
                $retHtml .= include locate_template('list-card.php');
            } else {
                $retHtml .= include locate_template('list-news.php');
            }
        }
    endif;
    return ob_get_clean();
}
add_shortcode('post', 'shortcode_post');
// 通常投稿
//絞る時はcat=""にスラッグ名 複数の場合cat="info, code"カンマで区切る
//[post format="list" post_type="post" cat="" num="3"]

// カスタム投稿
//絞る時はterm=""にスラッグ名 複数の場合term="info, code"カンマで区切る
//[post format="card" post_type="event" term="" num="3"]
