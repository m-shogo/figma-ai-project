<?php

/**
 * --------------------------------------------------------------------------------
 * 
 * フロントのスタイル・JS設定
 * 
 * --------------------------------------------------------------------------------
 */

// ==========================================================================
// CSS・JS読み込み
// ※特定の条件下で読み込みたい場合は、一番最後の引数（無名関数の戻り値）に条件を記載（CSS・JS共通）
// ==========================================================================

// JavaScript
// class EnqueueScript
// {
//   private $handle;
//   private $src;
//   private $deps;
//   private $ver;
//   private $in_footer;
//   private $attribute;
//   private ?Closure $conditional_branch_to_load; // 型指定

//   public function __construct(
//     $handle = '',
//     $src = false,
//     $deps = [],
//     $ver = false,
//     $in_footer = false,
//     $attribute = false,
//     ?Closure $conditional_branch_to_load = null
//   ) {
//     $this->handle = $handle;
//     $this->src = $src;
//     $this->deps = $deps;
//     $this->ver = $ver;
//     $this->in_footer = $in_footer;
//     $this->attribute = $attribute;
//     $this->enqueue_styles();
//     $this->add_attribute();
//     $this->conditional_branch_to_load = $conditional_branch_to_load;
//   }

//   private function enqueue_styles()
//   {
//     add_action('wp_enqueue_scripts', function () {
//       if (is_callable($this->conditional_branch_to_load)) {
//         if (($this->conditional_branch_to_load)($this)) { // 直接呼び出し
//           wp_enqueue_script($this->handle, $this->src, $this->deps, $this->ver, $this->in_footer);
//         }
//       } else {
//         wp_enqueue_script($this->handle, $this->src, $this->deps, $this->ver, $this->in_footer);
//       }
//     });
//   }

//   private function add_attribute()
//   {
//     if (empty($this->attribute)) {
//       return false;
//     }

//     add_action('script_loader_tag', function ($tag, $handle) {
//       if ($handle === $this->handle) {
//         return str_replace(' src=', " $this->attribute src=", $tag);
//       }
//       return $tag;
//     }, 10, 2);
//   }
// }

// CSS
// class EnqueueStyle
// {
//   private $handle;
//   private $src;
//   private $deps;
//   private $ver;
//   private $media;
//   private ?Closure $conditional_branch_to_load; // 型指定

//   public function __construct(
//     $handle = '',
//     $src = false,
//     $deps = [],
//     $ver = false,
//     $media = 'all',
//     ?Closure $conditional_branch_to_load = null // 型指定
//   ) {
//     $this->handle = $handle;
//     $this->src = $src;
//     $this->deps = $deps;
//     $this->ver = $ver;
//     $this->media = $media;
//     $this->enqueue_styles();
//     $this->conditional_branch_to_load = $conditional_branch_to_load;
//   }

//   private function enqueue_styles()
//   {
//     add_action('wp_enqueue_scripts', function () {
//       if (is_callable($this->conditional_branch_to_load)) {
//         if (($this->conditional_branch_to_load)($this)) {
//           wp_enqueue_style($this->handle, $this->src, $this->deps, $this->ver, $this->media);
//         }
//       } else {
//         wp_enqueue_style($this->handle, $this->src, $this->deps, $this->ver, $this->media);
//       }
//     });
//   }
// }

// jQueryのバージョン指定
function replace_default_jquery() {
  // デフォルトの jQuery を登録解除
  wp_deregister_script('jquery');

  // カスタム jQuery を登録
  wp_register_script('jquery', get_stylesheet_directory_uri() . '/js/jquery-3.7.1.min.js', [], null, true);

  // カスタム jQuery をキューに追加
  wp_enqueue_script('jquery');
}
add_action('wp_enqueue_scripts', 'replace_default_jquery');

// ==========================================================================
// JavaScript、CSSの読み込み
// ==========================================================================
// JavaScript
// new EnqueueScript('swiper-script', get_theme_file_uri('/js/swiper-bundle.min.js'), [], null, true, 'defer');
// new EnqueueScript('modaal-script', get_theme_file_uri('/js/modaal.min.js'), [], '0.4.4', true, 'defer');
// new EnqueueScript('common-script', get_theme_file_uri('/js/common.js'), array('jquery'), '1.0.0', true, 'defer');
// new EnqueueScript('home-script', get_theme_file_uri('/js/home.js'), array('jquery'), '1.0.0', true, 'defer', function () {
    //     return is_front_page();
    // });
require_once __DIR__ . '/css-assets.php';

function my_enqueue_scripts() {
    // JavaScript
    wp_enqueue_script('swiper-script', get_theme_file_uri('/js/swiper-bundle.min.js'), array(), '14.0.1', ['strategy' => 'defer','in_footer' => false]);
    wp_enqueue_script('modaal-script', get_theme_file_uri('/js/modaal.min.js'), array('jquery'), '0.4.4', ['strategy' => 'defer','in_footer' => false]);
    wp_enqueue_script('common-script', get_theme_file_uri('/js/common.js'), array('jquery','swiper-script','modaal-script'), filemtime(get_theme_file_path('/js/common.js')), ['strategy' => 'defer','in_footer' => false]);
    // Existing MIT ScrollHint bundle; enhancement is limited to editor-selected mobile tables.
    wp_enqueue_script('jwsnj-scroll-hint', get_theme_file_uri('/js/scroll-hint.min.js'), array(), '1.2.8', ['strategy' => 'defer', 'in_footer' => false]);
    wp_enqueue_script('jwsnj-table-scroll-hint', get_theme_file_uri('/js/table-scroll-hint.js'), array('jwsnj-scroll-hint'), filemtime(get_theme_file_path('/js/table-scroll-hint.js')), ['strategy' => 'defer', 'in_footer' => false]);

    if(is_front_page()){
        wp_enqueue_script('home-script', get_theme_file_uri('/js/home.js'), array('common-script'), filemtime(get_theme_file_path('/js/home.js')), ['strategy' => 'defer','in_footer' => false]);
    }

    if (is_page_template('templates/template-form.php')) {
        wp_enqueue_script('formidable-script', get_theme_file_uri('/js/form.js'), array('jquery'), filemtime(get_theme_file_path('/js/form.js')), ['strategy' => 'defer', 'in_footer' => false]);

        // Register here; enqueue only when the template actually renders a postal field.
        wp_register_script('yubinbango-script', get_theme_file_uri('/js/yubinbango.js'), ['formidable-script'], filemtime(get_theme_file_path('/js/yubinbango.js')), ['strategy' => 'defer', 'in_footer' => true]);
    }
    // new EnqueueScript('yubinbango-script', get_theme_file_uri('/js/yubinbango.js'), array(), null, true, 'defer', function () {
    //   return is_page_template('page-form.php');
    // });
    // new EnqueueScript('formidable-script', get_theme_file_uri('/js/form.js'), array('jquery'), '1.0.0', true, 'defer', function () {
    //   return is_page_template('page-form.php');
    // });

    // CSS
    wp_enqueue_style('css-style', get_stylesheet_uri(), array(), null);
    wp_enqueue_style('swiper-style', get_theme_file_uri('/css/swiper-bundle.min.css'), array(), '14.0.1', 'all');
    wp_enqueue_style('modaal-style', get_theme_file_uri('/css/modaal.min.css'), array(), '0.4.4', 'all');
    // Figmaで使用しているGoogle Fonts。必要weightだけを読み込み、既存ローカルfontをfallbackとして保持する。
    wp_enqueue_style(
        'jwsnj-google-fonts',
        'https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap',
        array(),
        null,
        'all'
    );
    // Figmaの共通アイコン用。Themeに同梱済みの正規Font Awesome Pro 6.7.2を再利用する。
    wp_enqueue_style('fontawesome-style', get_theme_file_uri('/css/all.min.css'), array(), '6.7.2', 'all');
    wp_enqueue_style('flexible-table-block'); // プラグインで登録済みのスタイルをenqueue（テンプレートでテーブルクラスを直接使用しているため必要）
    wp_enqueue_style('jwsnj-scroll-hint', get_theme_file_uri('/css/scroll-hint.css'), array(), filemtime(get_theme_file_path('/css/scroll-hint.css')), 'all');
    jwsnj_enqueue_css_entry('common-style', '/css/style.css', ['jwsnj-google-fonts']);
    // new EnqueueStyle('css-style', get_stylesheet_uri(), array(), null);
    // new EnqueueStyle('swiper-style', get_theme_file_uri('/css/swiper-bundle.min.css'), array(), null, 'all');
    // new EnqueueStyle('modaal-style', get_theme_file_uri('/css/modaal.min.css'), array(), '0.4.4', 'all');
    // // new EnqueueStyle('fontawesome-style', get_theme_file_uri('/css/all.min.css'), array(), '6.7.2', 'all');
    // new EnqueueStyle('flexible-table-block'); // プラグインで登録済みのスタイルをenqueue（テンプレートでテーブルクラスを直接使用しているため必要）
    // new EnqueueStyle('common-style', get_theme_file_uri('/css/style.css'), array(), filemtime(get_theme_file_path('/css/style.css')), 'all');
}
add_action('wp_enqueue_scripts', 'my_enqueue_scripts');

// ==========================================================================
// ビジュアルエディタ用CSSの設定
// ==========================================================================
add_action('enqueue_block_editor_assets', function () {
  // ブロックエディタ用CSSの読み込み（<link>タグとして出力）
  jwsnj_enqueue_css_entry('editor-style', '/css/editor-style.css');
});

// ==========================================================================
// global-stylesのインラインCSS出力を排除する
// ==========================================================================
remove_action( 'wp_enqueue_scripts', 'wp_enqueue_global_styles' );
remove_action( 'wp_footer', 'wp_enqueue_global_styles', 5 );
add_action('wp_footer', function() {
  wp_dequeue_style( 'core-block-supports');
}, 5);

// WP 6.9.1以降、block-style-variation-styles は未登録の global-styles を依存にすると Notice になる。
// 実体CSSは出さず、空ハンドルだけ先に登録して依存関係を満たす。
add_action('wp_default_styles', function ($wpStyles) {
  if (!isset($wpStyles->registered['global-styles'])) {
    $wpStyles->add('global-styles', false);
  }
});

// ==========================================================================
// コアブロックのスタイルを「分割読み込み」ではなく「結合された外部ファイル」で読み込む
// false = wp-block-library として1つの外部CSSで読み込み（インライン化されにくい）
// true  = ページ内のブロックに応じて必要な分だけ読み込み（WP 6.9+ ではインラインになりやすい）
// 参考: https://developer.wordpress.org/reference/hooks/should_load_separate_core_block_assets/
// ==========================================================================
add_filter('should_load_separate_core_block_assets', '__return_false');

// ==========================================================================
// ビジュアルエディタ用CSSキャッシュクリア
// https://qiita.com/m_t_of/items/22d5227000a9b2602729
// ==========================================================================
// function extend_tiny_mce_before_init($mce_init)
// {
//   $mce_init['cache_suffix'] = 'v=' . time();
//   return $mce_init;
// }
//add_filter( 'tiny_mce_before_init', 'extend_tiny_mce_before_init' );

// ==========================================================================
// 絵文字用スクリプト・スタイルの削除
// ==========================================================================
function disable_emoji()
{
  remove_action('wp_head', 'print_emoji_detection_script', 7);
  remove_action('admin_print_scripts', 'print_emoji_detection_script');
  remove_action('wp_print_styles', 'print_emoji_styles');
  remove_action('admin_print_styles', 'print_emoji_styles');
  remove_filter('the_content_feed', 'wp_staticize_emoji');
  remove_filter('comment_text_rss', 'wp_staticize_emoji');
  remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
}

add_action('init', 'disable_emoji');

// ==========================================================================
// WordPressヘッダーの不要なdns-prefetchを削除する
// https://on-ze.com/archives/6018
// ==========================================================================
remove_action('wp_head', 'wp_resource_hints', 2);


// ==========================================================================
// headに出力される不要なコードの削除
// https://cocorograph.co/knowledge/how-to-delete-wordpress-unnecessary-tags/
// ==========================================================================
// generatorを非表示にする
remove_action('wp_head', 'wp_generator');
// EditURIを非表示にする
remove_action('wp_head', 'rsd_link');
// wlwmanifestを非表示にする
remove_action('wp_head', 'wlwmanifest_link');
// 短縮URLを非表示にする
remove_action('wp_head', 'wp_shortlink_wp_head');
// 投稿の RSS フィードリンクを非表示にする
remove_action('wp_head', 'feed_links', 2);
// コメントフィードを非表示にする
remove_action('wp_head', 'feed_links_extra', 3);

// ==========================================================================
// パスワード保護ページを一覧から除外
// ==========================================================================
function not_password_output($query)
{
  if (!is_admin() && $query->is_main_query()) {
    if ($query->is_archive() || $query->is_category() || $query->is_home()) {
      $query->set('has_password', false);
    }
  }
}
add_action('pre_get_posts', 'not_password_output');

// ==========================================================================
// カテゴリスラッグクラスをbodyクラスに含める
// ==========================================================================
function add_page_slug_class_name($classes)
{
  if (!is_page()) return $classes;
  $page = get_queried_object();
  if (!($page instanceof WP_Post) || $page->post_type !== 'page') return $classes;

  $slugs = [$page->post_name];
  if ($page->post_parent) {
    $ancestors = get_ancestors($page->ID, 'page', 'post_type');
    $root_id = end($ancestors);
    $root = $root_id ? get_post($root_id) : null;
    if ($root instanceof WP_Post && $root->post_name !== '') {
      $slugs[] = $root->post_name . '-child';
    }
  }
  foreach ($slugs as $slug) {
    if ($slug !== '' && !in_array($slug, $classes, true)) $classes[] = $slug;
  }
  return $classes;
}
add_filter('body_class', 'add_page_slug_class_name');

// ==========================================================================
// 自動で設定されるファビコンを削除 WordPress5.4以降
// ==========================================================================
function wp_favicon_delete()
{
  exit;
}
add_action("do_faviconico", "wp_favicon_delete");

// ==========================================================================
// body id取得
// ==========================================================================
function my_body_id()
{
  $post_obj =  $GLOBALS['wp_the_query']->get_queried_object();
  $slug = '';
  if (is_front_page()) {
    $slug = 'top';
    if (is_page() && get_post(get_the_ID())->post_name) {
      $slug = $post_obj->post_name;
    }
  } elseif (is_category()) {
    $slug = $post_obj->taxonomy . '-' . $post_obj->category_nicename;
  } elseif (is_tax()) {
    $slug = $post_obj->taxonomy . '-' . $post_obj->slug;
  } elseif (is_tag()) {
    $slug = $post_obj->slug;
  } elseif (is_year()) {
    $nendo = preg_replace('/[^0-9a-zA-Z]/', '', get_archive_title());
    $slug = 'archive-' . $nendo;
  } elseif (is_singular()) {
    $slug = $post_obj->post_name;
  } elseif (is_home()) {
    $slug = 'archive-' . $post_obj->post_name;
  } elseif (is_archive()) {
    $slug = 'archive-' . get_post_type();
  } elseif (is_search()) {
    $slug  = $GLOBALS['wp_the_query']->posts ? 'search-results' : 'search-no-results';
  } elseif (is_404()) {
    $slug = 'error404';
  }
  $body_id = esc_attr($slug);
  echo ($body_id) ? 'id="' . $body_id . '"' : '';
}

// ==========================================================================
// echo get_archive_title(); 余計な文字を削除
// https://wemo.tech/1161
// ==========================================================================
// Use the resolved WordPress date query, including the original fiscal year.
function jwsnj_archive_year()
{
  $year = get_query_var('year') ?: get_query_var('jwsnj_fiscal_year');
  if (!$year) {
    $packed = (string) get_query_var('m');
    if (preg_match('/^\d{4}(?:\d{2}){0,3}$/D', $packed)) $year = substr($packed, 0, 4);
  }
  return preg_match('/^[1-9]\d{3}$/D', (string) $year) ? (int) $year : 0;
}

function get_archive_title()
{
  if (is_tag()) {
    return single_tag_title("", false);
  }
  if (get_post_type() === 'post' && is_home()) { //投稿トップ
    return single_post_title('', false);
  } elseif (get_post_type() === 'post' && is_single() && is_singular('post') && !is_date()) { // シングルタイトル
    $postType_name = esc_html(get_post_type_object(get_post_type())->labels->singular_name);
    return $postType_name;
  } elseif (get_post_type() === 'post' && is_category()) { // カテゴリトップのタイトル
    return single_term_title('', false);
  }
  if (get_post_type() && !is_date() && !is_tax()) { // カスタム投稿まとめ
    $postType_name = esc_html(get_post_type_object(get_post_type())->label);
    return $postType_name;
  } elseif (get_post_type() && is_tax()) { // カテゴリトップのタイトル
    return single_term_title('', false);
  }
  //アーカイブページじゃない場合、 false を返す
  //if (!is_archive()) return false;
  //日付アーカイブページなら
  if (is_date()) {
    $post_type = get_post_type() ?: 'post';
    $is_fiscal = in_array($post_type, get_fiscal_year_post_types(), true);
    $year_suffix = $is_fiscal ? '年度' : '年';

    $year = jwsnj_archive_year();
    if (!$year) return false;
    $date_name = $year . $year_suffix;
    if (is_year()) return $date_name . single_term_title('', false);
    $date_name .= get_query_var('monthnum') . '月';
    if (!is_month()) $date_name .= get_query_var('day') . '日';
    return $date_name;
  }
  //投稿タイプのアーカイブページなら
  if (is_post_type_archive()) {
    return post_type_archive_title('', false);
  }
  //投稿者アーカイブページなら
  if (is_author()) {
    return "投稿者" . get_queried_object()->data->display_name;
  }
  //それ以外(カテゴリ・タグ・タクソノミーアーカイブページ)
  return single_term_title('', false);
}

// ==========================================================================
// <title>変更 年度表示
// https://wp-doctor.jp/blog/2019/09/03/%E3%83%AF%E3%83%BC%E3%83%89%E3%83%97%E3%83%AC%E3%82%B9%E3%81%AEtitle%E3%82%BF%E3%82%B0%E3%81%AE%E4%B8%AD%E8%BA%AB%E3%82%92%E7%89%B9%E5%AE%9A%E3%81%AE%E6%9D%A1%E4%BB%B6%E4%B8%8B%E3%81%A7/
// ==========================================================================
function wp_custom_title_output($title)
{
  if (is_year()) {
    $post_type = get_post_type() ?: 'post';
    $is_fiscal = in_array($post_type, get_fiscal_year_post_types(), true);
    $year_suffix = $is_fiscal ? '年度' : '年';

    // An unassigned posts page must not resolve get_the_title(0) to the first result.
    $post_type_label = '';
    if ($post_type === 'post') {
      $posts_page_id = (int) get_option('page_for_posts');
      if ($posts_page_id > 0) $post_type_label = get_the_title($posts_page_id);
    } else {
      $post_type_object = get_post_type_object($post_type);
      if ($post_type_object) $post_type_label = $post_type_object->label;
    }

    $year_val = jwsnj_archive_year();
    if (!$year_val) return $title;
    $title['title'] = trim($post_type_label . ' ' . $year_val . $year_suffix);
  }
  return $title;
}
add_filter('document_title_parts', 'wp_custom_title_output');

// ==========================================================================
// カスタム投稿タイプの年別アーカイブURLを取得
// パーマリンク構造に応じて /date/ の有無を自動判定
// ==========================================================================
function get_custom_post_type_year_link($post_type, $year)
{
  $permalink_structure = get_option('permalink_structure');
  $base = home_url() . '/' . $post_type . '/';

  // %post_id% を含む場合、数字のみのURLは投稿IDと競合するため /date/ を付与
  if (strpos($permalink_structure, '%post_id%') !== false) {
    return $base . 'date/' . $year . '/';
  }
  return $base . $year . '/';
}

// ==========================================================================
// 年度別アーカイブを使用する投稿タイプ
// ==========================================================================
function get_fiscal_year_post_types()
{
  return [
    'post',
    'event',
  ];
}

// ==========================================================================
// 年度別アーカイブ作成
// ==========================================================================
function custom__pre_get_posts($query)
{
  if (is_admin() || ! $query->is_main_query()) {
    return $query;
  }

  if (is_year()) {
    $fiscal_year_types = get_fiscal_year_post_types();
    $post_type = get_query_var('post_type') ?: 'post';

    if (in_array($post_type, $fiscal_year_types, true)) {
      $y = $query->get('year');
      $packed = (string) $query->get('m');
      if (!$y && preg_match('/^[1-9]\d{3}$/D', $packed)) $y = $packed;
      if (!preg_match('/^[1-9]\d{3}$/D', (string) $y)) return $query;
      $query->set('jwsnj_fiscal_year', (int) $y);
      if ($packed === (string) $y) $query->set('m', '');
      $date_from = $y . '-04-01';
      $date_to = ($y + 1) . '-03-31 23:59:59';
      $query->set('date_query', array(
        array(
          'after' => $date_from,
          'before' => $date_to,
          'inclusive' => true,
        ),
      ));
      $query->set('year', ''); //元々あった年指定を削除
      $query->set('is_fiscal_year', true); // 年度別アーカイブフラグ
    }
  }
  return $query;
}
add_action('pre_get_posts', 'custom__pre_get_posts');

// ==========================================================================
// 年度別アーカイブリスト作成
// ==========================================================================
function get_archives_by_fiscal_year($args = '')
{
  global $wpdb;

  $defaults = array(
    'post_type' => 'post',
    'post_status' => 'publish',
    'limit' => '',
  );

  $r = wp_parse_args($args, $defaults);

  $post_type = isset($r['post_type']) ? $r['post_type'] : 'post';
  $limit = isset($r['limit']) ? absint($r['limit']) : '';

  if (!empty($limit)) {
    $limit = 'LIMIT ' . $limit;
  } else {
    $limit = '';
  }

  $sql = $wpdb->prepare(
    "SELECT YEAR(ADDDATE(post_date, INTERVAL -3 MONTH)) AS `year`, COUNT(ID) AS `posts`
         FROM $wpdb->posts
         WHERE post_type = %s AND post_status = 'publish'
         GROUP BY YEAR(ADDDATE(post_date, INTERVAL -3 MONTH))
         ORDER BY post_date DESC
         $limit",
    $post_type
  );

  $arcresults = (array) $wpdb->get_results($sql);
  return $arcresults;
}

// ==========================================================================
// 年別アーカイブリストを表示（年度を使用しない場合は下記使用）
// ==========================================================================
function get_archives_by_year($post_type = 'post')
{
  $cat = get_the_category();
  $cat_id = '';
  $cat_slug = '';
  if (isset($cat[0]->cat_ID)) {
    $cat_id = $cat[0]->cat_ID;
  }
  if (isset($cat[0]->slug)) {
    $cat_slug = $cat[0]->slug;
  }
  $year = NULL; // 年の初期化
  $args = array( // クエリの作成
    'post_type' => $post_type, // 投稿タイプの指定
    'orderby' => 'date', // 日付順で表示
    'posts_per_page' => -1 // すべての投稿を表示
  );
  $the_query = new WP_Query($args);
  if ($the_query->have_posts()) { // 投稿があれば表示
    while ($the_query->have_posts()) : $the_query->the_post(); // ループの開始
      if ($year != get_the_date('Y')) { // 同じ年でなければ表示
        $year = get_the_date('Y'); // 年の取得
        $postTopId = get_option('page_for_posts');
        echo '<li><a class="lnl_title mm_title-01" href="' . get_permalink($postTopId) . '' . $year . '/' . '"><span>' . $year . '年</span></a></li>'; // 年別アーカイブリストの表示
      }
    endwhile; // ループの終了
    wp_reset_postdata(); // クエリのリセット
  }
}

// ==========================================================================
// 指定したスラッグのページが親かどうか判定
// ==========================================================================
function is_parent($slug)
{
  global $post;
  $result = false;

  if (!empty($post->post_parent)) {
    $post_data = get_post($post->post_parent);
    if ($slug == $post_data->post_name) {
      $result = true;
    }
  }

  return $result;
}

// ==========================================================================
// メールアドレスっぽい文字列を検出してエンティティ化
// ==========================================================================
function obfuscate_emails_in_content($content)
{
  // メールアドレスっぽい文字列を検出してエンティティ化
  return preg_replace_callback(
    '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/',
    function ($matches) {
      return antispambot($matches[0]);
    },
    $content
  );
}
add_filter('the_content', 'obfuscate_emails_in_content');

// ==========================================================================
// 特定の拡張子のリンクを外部リンクとして出力（target="_blank"を付与）
// ==========================================================================
function add_blank_target_to_file_links($content)
{
  // Work on real anchor attributes, not matching text inside data attributes.
  $extensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'zip', 'docm', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'mp4', 'mp3', 'webm', 'mov', 'avi'];
  $pattern = '/\.(' . implode('|', $extensions) . ')$/i';
  $tags = new WP_HTML_Tag_Processor($content);

  while ($tags->next_tag(['tag_name' => 'A'])) {
    $href = $tags->get_attribute('href');
    if (!is_string($href) || $href === '' || $tags->get_attribute('target') !== null) {
      continue;
    }
    $path = wp_parse_url($href, PHP_URL_PATH);
    if (!is_string($path) || !preg_match($pattern, $path)) {
      continue;
    }

    // Keep editor-supplied rel tokens (nofollow, sponsored, etc.).
    $rel = $tags->get_attribute('rel');
    $tokens = is_string($rel) ? preg_split('/[\x09-\x0d\x20]+/', trim($rel), -1, PREG_SPLIT_NO_EMPTY) : [];
    $tokens = is_array($tokens) ? $tokens : [];
    foreach (['noreferrer', 'external'] as $token) {
      if (!in_array($token, array_map('strtolower', $tokens), true)) {
        $tokens[] = $token;
      }
    }
    $tags->set_attribute('target', '_blank');
    $tags->set_attribute('rel', implode(' ', $tokens));
  }

  return $tags->get_updated_html();
}
add_filter('the_content', 'add_blank_target_to_file_links');

// ==========================================================================
// head内ページタイトル自動出力制限
// ==========================================================================
add_filter('document_title_separator', function() {
  return '|';
});
remove_theme_support('title-tag');
remove_action('wp_head', '_wp_render_title_tag', 1);
remove_action('wp_head', 'wp_title', 1);

// ==========================================================================
// テーマ内の CSS を読み、<style> へ埋め込む用に先頭の @charset だけ除いて出力する。
// ==========================================================================
function include_inline_css($relative_path)
{
  $file_path = get_theme_file_path($relative_path);
  if (!is_readable($file_path)) {
    return;
  }

  $css = file_get_contents($file_path);
  // HTML の style 要素内では @charset は使えないため、先頭の宣言だけ取り除く
  $css = preg_replace('/^\s*@charset\s+["\'][^"\']+["\'];\s*/i', '', $css);

  echo $css;
}