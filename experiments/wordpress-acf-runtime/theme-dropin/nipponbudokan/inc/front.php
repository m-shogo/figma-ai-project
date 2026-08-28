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
function my_enqueue_scripts() {
    // JavaScript
    wp_enqueue_script('swiper-script', get_theme_file_uri('/js/swiper-bundle.min.js'), array(), '14.0.1', ['strategy' => 'defer','in_footer' => false]);
    wp_enqueue_script('modaal-script', get_theme_file_uri('/js/modaal.min.js'), array('jquery'), '0.4.4', ['strategy' => 'defer','in_footer' => false]);
    wp_enqueue_script('common-script', get_theme_file_uri('/js/common.js'), array('jquery','swiper-script','modaal-script'), filemtime(get_theme_file_path('/js/common.js')), ['strategy' => 'defer','in_footer' => false]);

    if (is_front_page()) {
        wp_enqueue_script('fullcalendar-script', get_theme_file_uri('/js/fullcalendar.min.js'), array(), '6.1.15', ['strategy' => 'defer', 'in_footer' => false]);
        wp_enqueue_script('fullcalendar-gcal-script', get_theme_file_uri('/js/fullcalendar-google-calendar.min.js'), array('fullcalendar-script'), '6.1.15', ['strategy' => 'defer', 'in_footer' => false]);
        wp_enqueue_script('home-script', get_theme_file_uri('/js/home.js'), array('common-script', 'fullcalendar-gcal-script'), filemtime(get_theme_file_path('/js/home.js')), ['strategy' => 'defer', 'in_footer' => false]);
        $gcal = apply_filters('nipponbudokan_google_calendar', array(
            'apiKey' => '',
            'calendarId' => '',
        ));
        wp_localize_script('home-script', 'nipponbudokanTopCal', array(
            'googleCalendarApiKey' => isset($gcal['apiKey']) ? (string) $gcal['apiKey'] : '',
            'googleCalendarId' => isset($gcal['calendarId']) ? (string) $gcal['calendarId'] : '',
        ));
    }

    if (is_page_template('templates/template-form.php')) {
        wp_enqueue_script('formidable-script', get_theme_file_uri('/js/form.js'), array('jquery'), filemtime(get_theme_file_path('/js/form.js')), ['strategy' => 'defer', 'in_footer' => false]);

        // コンテンツ内に郵便番号フィールド（p-postal-code）がある場合のみ yubinbango を読み込む
        $content = apply_filters('the_content', get_the_content());
        if (str_contains($content, 'p-postal-code')) {
            wp_enqueue_script('yubinbango-script', get_theme_file_uri('/js/yubinbango.js'), array(), null, ['strategy' => 'defer', 'in_footer' => false]);
        }
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
    // wp_enqueue_style('fontawesome-style', get_theme_file_uri('/css/all.min.css'), array(), '6.7.2', 'all');
    wp_enqueue_style('flexible-table-block'); // プラグインで登録済みのスタイルをenqueue（テンプレートでテーブルクラスを直接使用しているため必要）
    wp_enqueue_style('common-style', get_theme_file_uri('/css/style.css'), array(), filemtime(get_theme_file_path('/css/style.css')), 'all');
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
  wp_enqueue_style(
    'editor-style',
    get_theme_file_uri('/css/editor-style.css'),
    [],
    filemtime(get_theme_file_path('/css/editor-style.css')),
    'all'
  );
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
  if (is_page()) {
    $page      = get_post(get_the_ID());
    $classes[] = $page->post_name;

    $parent_id = $page->post_parent;
    if (0 == $parent_id) {
      $classes[] = get_post($parent_id)->post_name;
    } else {
      $progenitor_detail = get_ancestors($page->ID, 'page', 'post_type');
      $progenitor_id = array_pop($progenitor_detail);
      $classes[]     = get_post($progenitor_id)->post_name . '-child';
    }
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

    if (is_year()) {
      $url = $_SERVER["REQUEST_URI"];
      $year_parts = array_filter(explode("/", $url), 'strlen');
      if (!is_paged()) {
        $date_name = end($year_parts) . $year_suffix . single_term_title('', false);
      } else {
        $year_parts = array_reverse($year_parts);
        $date_name = $year_parts[2] . $year_suffix . single_term_title('', false);
      }
    } elseif (is_month()) {
      $year_val = get_query_var('year');
      if (!$year_val) {
        $url_path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
        $segments = explode('/', $url_path);
        foreach ($segments as $seg) {
          if (preg_match('/^\d{4}$/', $seg)) {
            $year_val = $seg;
            break;
          }
        }
      }
      $date_name = $year_val . $year_suffix . get_query_var('monthnum') . '月';
    } else {
      $year_val = get_query_var('year');
      if (!$year_val) {
        $url_path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
        $segments = explode('/', $url_path);
        foreach ($segments as $seg) {
          if (preg_match('/^\d{4}$/', $seg)) {
            $year_val = $seg;
            break;
          }
        }
      }
      $date_name = $year_val . $year_suffix . get_query_var('monthnum') . '月' . get_query_var('day') . '日';
    }
    //日付アーカイブページかつ、投稿タイプアーカイブページでもある場合
    //    if (is_post_type_archive()) {
    //      return $date_name."".post_type_archive_title('',false);
    //    }
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

    // 投稿タイプのラベルを取得
    if ($post_type === 'post') {
      $post_type_label = get_the_title(get_option('page_for_posts'));
    } else {
      $post_type_label = get_post_type_object($post_type)->label;
    }

    $year = get_query_var('year');
    if (empty($year)) {
      $url = $_SERVER["REQUEST_URI"];
      $year_parts = array_filter(explode("/", $url), 'strlen');
      if (!is_paged()) {
        $year_val = end($year_parts);
      } else {
        $year_parts = array_reverse($year_parts);
        $year_val = $year_parts[2];
      }
    } else {
      $year_val = $year;
    }
    $title['title'] = $post_type_label . ' ' . $year_val . $year_suffix;
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
      $y = get_query_var('year');
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
  // 外部リンクとして開く拡張子の一覧
  $extensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'zip', 'docm', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'mp4', 'mp3', 'webm', 'mov', 'avi'];
  $pattern = '/\.(' . implode('|', $extensions) . ')$/i';

  return preg_replace_callback(
    '/<a\s([^>]*)href=["\']([^"\']*)["\']([^>]*)>/i',
    function ($matches) use ($pattern) {
      $href = $matches[2];
      $path = parse_url($href, PHP_URL_PATH);

      // hrefのパスが対象の拡張子に一致する場合のみ処理
      if ($path && preg_match($pattern, $path)) {
        $before = $matches[1];
        $after  = $matches[3];

        // 既にtargetが設定されている場合はスキップ
        if (stripos($before . $after, 'target=') === false) {
          $after .= ' target="_blank" rel="noreferrer external"';
        }
        return '<a ' . $before . 'href="' . $href . '"' . $after . '>';
      }
      return $matches[0];
    },
    $content
  );
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