<?php

/**
 * --------------------------------------------------------------------------------
 * 
 * カスタム投稿タイプ・タクソノミーの設定
 * 
 * --------------------------------------------------------------------------------
 */

// ==========================================================================
// カスタムポストの設定
// ==========================================================================
function add_custom_post()
{
  register_post_type(
    'news', /* post-type */
    array(
      'labels' => array(
        'name' => __('総務課'),
        'all_items' => __('お知らせ一覧')
      ),
      'public' => true,
      'menu_icon' => 'dashicons-groups',
      'menu_position' => 5,
      'has_archive' => 'news',
      'rewrite' => true,
      'capability_type' => 'soumu',
      'capabilities' => array(
        'edit_posts' => 'edit_soumu', //-------------記事の投稿と編集
        'publish_posts' => 'publish_soumu', //----------記事の公開
        'edit_published_posts' => 'edit_published_soumu', //---公開した記事の編集
        'delete_posts' => 'delete_soumu', //-----------記事の削除
        'delete_published_posts' => 'delete_published_soumu' //-公開した記事の削除
      ),
      'supports' => array('title', 'editor', 'thumbnail', 'custom-fields', 'excerpt', 'page-attributes')
      /* ここまで */
    )
  );
  register_post_type(
    'budo-video', /* post-type */
    array(
      'labels' => array(
        'name' => __('YouTube'),
        'all_items' => __('YouTube一覧')
      ),
      'public' => true,
      'menu_icon' => 'dashicons-format-aside',
      'menu_position' => 11,
      'has_archive' => 'budo-video',
      'rewrite' => true,
      'capability_type' => 'soumu',
      'capabilities' => array(
        'edit_posts' => 'edit_soumu', //-------------記事の投稿と編集
        'publish_posts' => 'publish_soumu', //----------記事の公開
        'edit_published_posts' => 'edit_published_soumu', //---公開した記事の編集
        'delete_posts' => 'delete_soumu', //-----------記事の削除
        'delete_published_posts' => 'delete_published_soumu' //-公開した記事の削除
      ),
      'supports' => array('title', 'editor', 'thumbnail', 'custom-fields', 'excerpt')
      /* ここまで */
    )
  );
  register_post_type(
    'shosyashodou', /* post-type */
    array(
      'labels' => array(
        'name' => __('教育文化課'),
        'all_items' => __('お知らせ一覧')
      ),
      'public' => true,
      'menu_icon' => 'dashicons-groups',
      'menu_position' => 6,
      'has_archive' => 'shosyashodou',
      'rewrite' => true,
      'capability_type' => 'shosyashodou',
      'capabilities' => array(
        'edit_posts' => 'edit_shosyashodou', //-------------記事の投稿と編集
        'publish_posts' => 'publish_shosyashodou', //----------記事の公開
        'edit_published_posts' => 'edit_published_shosyashodou', //---公開した記事の編集
        'delete_posts' => 'delete_shosyashodou', //-----------記事の削除
        'delete_published_posts' => 'delete_published_shosyashodou' //-公開した記事の削除
      ),
      'supports' => array('title', 'editor', 'thumbnail', 'custom-fields', 'excerpt', 'page-attributes')
      /* ここまで */
    )
  );
  register_post_type(
    'shodou-book', /* post-type */
    array(
      'labels' => array(
        'name' => __('月刊書写書道'),
        'all_items' => __('月刊書写書道一覧')
      ),
      'public' => true,
      'menu_position' => 7,
      'menu_icon' => 'dashicons-book',
      'has_archive' => 'shodou-book',
      'rewrite' => true,
      'supports' => array('title', 'editor', 'thumbnail', 'custom-fields', 'excerpt')
      /* ここまで */
    )
  );
  register_post_type(
    'budo-book', /* post-type */
    array(
      'labels' => array(
        'name' => __('月刊「武道」'),
        'all_items' => __('月刊「武道」一覧')
      ),
      'public' => true,
      'menu_icon' => 'dashicons-book',
      'menu_position' => 8,
      'has_archive' => 'budo-book',
      'rewrite' => true,
      'supports' => array('title', 'editor', 'thumbnail', 'custom-fields', 'excerpt')
      /* ここまで */
    )
  );
  register_post_type(
    'budo-news', /* post-type */
    array(
      'labels' => array(
        'name' => __('武道ニュース'),
        'all_items' => __('武道ニュース一覧')
      ),
      'public' => true,
      'menu_icon' => 'dashicons-format-aside',
      'menu_position' => 9,
      'has_archive' => 'budo-news',
      'rewrite' => true,
      'supports' => array('title', 'editor', 'thumbnail', 'custom-fields', 'excerpt')
      /* ここまで */
    )
  );
  register_post_type(
    'tankoubon', /* post-type */
    array(
      'labels' => array(
        'name' => __('単行本'),
        'all_items' => __('単行本一覧')
      ),
      'public' => true,
      'menu_position' => 10,
      'menu_icon' => 'dashicons-book-alt',
      'has_archive' => 'tankoubon',
      'rewrite' => true,
      'supports' => array('title', 'editor', 'thumbnail', 'custom-fields', 'excerpt')
      /* ここまで */
    )
  );
}
add_action('init', 'add_custom_post');

// ==========================================================================
// カスタムタクソノミーの設定
// ==========================================================================
function add_custom_taxonomy()
{
  register_taxonomy(
    'item', /* タクソノミーの名前 */
    'news', /* books投稿で設定する */
    array(
      'hierarchical' => true, /* 親子関係が必要なければ false */
      'update_count_callback' => '_update_post_term_count',
      'label' => '総務課のカテゴリー',
      'singular_label' => '総務課のカテゴリー',
      'public' => true,
      'show_ui' => true
    )
  );
  register_taxonomy(
    'news', /* タクソノミーの名前 */
    'shosyashodou', /* books投稿で設定する */
    array(
      'hierarchical' => true, /* 親子関係が必要なければ false */
      'update_count_callback' => '_update_post_term_count',
      'label' => '教育文化課のカテゴリー',
      'singular_label' => '教育文化課のカテゴリー',
      'public' => true,
      'show_ui' => true
    )
  );
  register_taxonomy(
    'book', /* タクソノミーの名前 */
    'tankoubon', /* books投稿で設定する */
    array(
      'hierarchical' => true, /* 親子関係が必要なければ false */
      'update_count_callback' => '_update_post_term_count',
      'label' => '単行本のカテゴリー',
      'singular_label' => '単行本のカテゴリー',
      'public' => true,
      'show_ui' => true
    )
  );
}
add_action('init', 'add_custom_taxonomy');

// ==========================================================================
// 特定の投稿タイプのエディターを非表示にする
// ==========================================================================
// add_action('init', function () {
//   // エディターを無効化するカスタム投稿タイプのリスト
//   $post_types_without_editor = array(
//     'XXXXX', // カスタム投稿名
//   );

//   // 各投稿タイプに対してエディターを削除
//   foreach ($post_types_without_editor as $post_type) {
//     remove_post_type_support($post_type, 'editor');
//   }
// }, 99);

// ==========================================================================
// フロントページのエディターを非表示にする
// ==========================================================================
add_action('admin_init', function () {
  // フロントページのIDを取得
  $front_page_id = get_option('page_on_front');

  // 現在の編集画面がフロントページか判定
  global $pagenow;
  if ($pagenow === 'post.php' && isset($_GET['post']) && intval($_GET['post']) === intval($front_page_id)) {
    remove_post_type_support('page', 'editor');
  }
});

// ==========================================================================
// 投稿タイプ表示件数指定
// ==========================================================================
function hwl_home_pagesize($query)
{
  if (is_admin() || !$query->is_main_query())
    return;
  // if (is_post_type_archive('post')) {
  //   $query->set('posts_per_page', 10);
  //   return;
  // }
  // if (is_post_type_archive('event')) {
  //   $query->set('posts_per_page', 9);
  //   return;
  // }
}
add_action('pre_get_posts', 'hwl_home_pagesize', 1);

// ==========================================================================
// 「投稿」の名称変更
// ==========================================================================
function change_post_menu_label()
{
  global $menu;
  global $submenu;
  $name = '新着情報';
  if (isset($menu[5])) {
    $menu[5][0] = $name;
  }
  if (isset($submenu['edit.php'][5])) {
    $submenu['edit.php'][5][0] = $name . '一覧';
  }
  if (isset($submenu['edit.php'][10])) {
    $submenu['edit.php'][10][0] = '新しい' . $name;
  }
  if (isset($submenu['edit.php'][16])) {
    $submenu['edit.php'][16][0] = 'タグ';
  }
}

function change_post_object_label()
{
  global $wp_post_types;
  $name = '新着情報';
  $labels = &$wp_post_types['post']->labels;
  $labels->name = $name;
  $labels->singular_name = $name;
  $labels->add_new = _x('追加', $name);
  $labels->add_new_item = $name . 'の新規追加';
  $labels->edit_item = $name . 'の編集';
  $labels->new_item = '新規新' . $name;
  $labels->view_item = $name . 'を表示';
  $labels->search_items = $name . 'を検索';
  $labels->not_found = '記事が見つかりませんでした';
  $labels->not_found_in_trash = 'ゴミ箱に記事は見つかりませんでした';
}

add_action('init', 'change_post_object_label');
add_action('admin_menu', 'change_post_menu_label');

// ==========================================================================
// WordPress 投稿が0件でもpost_typeを取得
// ==========================================================================
function get_current_post_type()
{
  $post_type = get_post_type();

  if (empty($post_type)) {
    // 投稿が 0 件の時
    if (is_category()) {
      $tax = get_taxonomy('category');
      $post_type = $tax->object_type[0];
    } else
        if (is_tax()) {
      // category, taxonomy get_query_var( 'post_type' ) は常に null
      // 投稿が 1件 でもあれば　get_post_type() で取得可能
      $term = get_query_var('taxonomy');
      $tax = get_taxonomy($term);
      $post_type = $tax->object_type[0];
    } else
          if (is_archive()) {
      // 投稿が 0 件の時 get_post_type() は false を返すので get_query_var() で取得する
      $post_type = get_query_var('post_type');
    } else
            if (is_home()) {
      // 投稿の一覧で投稿が0件の時は 'post' を設定
      $post_type = 'post';
    }
  }
  return $post_type;
}

// ==========================================================================
// エスケープ除外用変数（特定のHTMLタグとそれぞれのタグで許可される属性を定義）
// 【使い方例】
// $allowed_html = get_allowed_html();
// $user_input = '<a href="https://example.com" onclick="alert(1)">Click me!</a>';
// $sanitized_output = wp_kses($user_input, $allowed_html);
// ==========================================================================
function get_allowed_html()
{
  return array(
    'a' => array(
      'href' => array(),
      'title' => array()
    ),
    'br' => array(),
    'em' => array(),
    'strong' => array()
  );
}

// ==========================================================================
// カスタム投稿のスラッグからラベルを取得する
// ==========================================================================
function get_post_type_label_by_slug($slug)
{
  $post_types = get_post_types(array(), 'objects'); // 全ての投稿タイプオブジェクトを取得
  foreach ($post_types as $post_type) {

    if (is_array($post_type->rewrite) && $post_type->rewrite['slug'] === $slug) {
      return $post_type->label; // その投稿タイプのラベルを返す
    }
  }
  return null; // マッチするものがなければnullを返す
}

// ==========================================================================
// 特定のカスタム投稿タイプに「固定表示」機能を追加＆表示件数の指定（通常のアーカイブページのみ）
// ==========================================================================
/**
 * カスタム投稿タイプに「先頭固定表示」機能を追加するクラス
 *
 * 通常の投稿における「この投稿を先頭に固定表示」と同等の機能を
 * カスタム投稿タイプのアーカイブページで実現します。
 *
 * 【機能概要】
 * - 投稿編集画面のサイドバーに「先頭に固定する」チェックボックスを追加
 * - クイック編集からも固定表示の切り替えが可能
 * - アーカイブページで固定投稿を先頭に表示（ページネーション対応）
 *
 * 【対象ページ】
 * - カスタム投稿タイプのアーカイブページのみ
 * - タクソノミーアーカイブ、年別アーカイブは対象外
 *
 * 【使用方法】
 * new CustomStickyPosts('post_type_name');           // デフォルト9件/ページ
 * new CustomStickyPosts('post_type_name', 12);       // 12件/ページ
 */
class CustomStickyPosts
{
  /** @var string 固定表示フラグ用メタキー（投稿単位） */
  private const META_KEY = '_is_sticky';

  /** @var string 対象の投稿タイプ */
  private $post_type;

  /** @var int 1ページあたりの表示件数 */
  private $posts_per_page;

  /** @var array|null 固定投稿IDのキャッシュ（同一リクエスト内で再利用） */
  private $sticky_posts_cache = null;

  /** @var int 現在のページ番号 */
  private $current_paged = 1;

  /** @var WP_Query|null the_postsフィルターで処理する対象クエリ */
  private $target_query = null;

  /**
   * コンストラクタ
   *
   * @param string $post_type      対象のカスタム投稿タイプ名
   * @param int    $posts_per_page 1ページあたりの表示件数（デフォルト: 9）
   */
  public function __construct($post_type, $posts_per_page = 9)
  {
    $this->post_type = $post_type;
    $this->posts_per_page = $posts_per_page;
    $this->init();
  }

  /**
   * WordPressのアクション・フィルターを登録
   *
   * @return void
   */
  private function init()
  {
    // ========================================
    // 投稿編集画面
    // ========================================
    add_action('add_meta_boxes', [$this, 'add_sticky_meta_box']);
    add_action("save_post_{$this->post_type}", [$this, 'save_sticky_status']);

    // ========================================
    // フロントエンド（アーカイブページ）
    // ========================================
    add_action('pre_get_posts', [$this, 'modify_archive_query']);
    add_filter('the_posts', [$this, 'merge_sticky_posts'], 10, 2);
    add_filter('found_posts', [$this, 'adjust_pagination'], 10, 2);

    // ========================================
    // 管理画面一覧（クイック編集）
    // ========================================
    add_filter("manage_{$this->post_type}_posts_columns", [$this, 'add_sticky_column']);
    add_action("manage_{$this->post_type}_posts_custom_column", [$this, 'render_sticky_column'], 10, 2);
    add_action('admin_head', [$this, 'hide_sticky_column_css']);
    add_action('quick_edit_custom_box', [$this, 'add_quick_edit_sticky_field'], 10, 2);
    add_action('admin_footer', [$this, 'quick_edit_javascript']);
    add_action('save_post', [$this, 'save_quick_edit_sticky']);
  }

  // ============================================================================
  // 投稿編集画面: メタボックス関連
  // ============================================================================

  /**
   * 投稿編集画面のサイドバーに「先頭に固定する」メタボックスを追加
   *
   * @return void
   */
  public function add_sticky_meta_box()
  {
    add_meta_box(
      'sticky_meta_box',
      '先頭に固定する',
      [$this, 'render_sticky_meta_box'],
      $this->post_type,
      'side',
      'high'
    );
  }

  /**
   * メタボックスの内容（チェックボックス）を出力
   *
   * @param WP_Post $post 現在編集中の投稿オブジェクト
   * @return void
   */
  public function render_sticky_meta_box($post)
  {
    wp_nonce_field('sticky_meta_box', 'sticky_meta_box_nonce');
    $is_sticky = get_post_meta($post->ID, self::META_KEY, true);
?>
    <label>
      <input type="checkbox" name="sticky" value="1" <?php checked($is_sticky, '1'); ?>>
      <?php esc_html_e('先頭固定表示', 'textdomain'); ?>
    </label>
  <?php
  }

  /**
   * 投稿保存時に固定表示状態をメタデータとして保存
   *
   * @param int $post_id 保存される投稿のID
   * @return void
   */
  public function save_sticky_status($post_id)
  {
    // 自動保存時はスキップ
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
      return;
    }
    // 権限チェック
    if (!current_user_can('edit_post', $post_id)) {
      return;
    }
    // nonceチェック（CSRF対策）
    if (!isset($_POST['sticky_meta_box_nonce']) || !wp_verify_nonce($_POST['sticky_meta_box_nonce'], 'sticky_meta_box')) {
      return;
    }

    $is_sticky = isset($_POST['sticky']) ? 1 : 0;
    update_post_meta($post_id, self::META_KEY, $is_sticky);
  }

  // ============================================================================
  // フロントエンド: アーカイブページのクエリ制御
  // ============================================================================

  /**
   * 処理対象のアーカイブページかどうかを判定
   *
   * 以下の条件をすべて満たす場合にtrueを返す:
   * - フロントエンド（管理画面ではない）
   * - メインクエリである
   * - 対象投稿タイプのアーカイブページ
   * - タクソノミーアーカイブではない
   * - 年別アーカイブではない
   *
   * @param WP_Query $query クエリオブジェクト
   * @return bool 対象アーカイブページの場合true
   */
  private function is_target_archive($query)
  {
    return !is_admin() &&
      $query->is_main_query() &&
      is_post_type_archive($this->post_type) &&
      !is_tax() &&
      !is_year();
  }

  /**
   * アーカイブページのメインクエリを変更
   *
   * 固定投稿を除外し、後のthe_postsフィルターで先頭にマージするための準備を行う
   * 2ページ目以降はオフセットを調整してページネーションを正しく機能させる
   * ※ここでは表示順は変えない
   *
   * @param WP_Query $query クエリオブジェクト
   * @return void
   */
  public function modify_archive_query($query)
  {
    if (!$this->is_target_archive($query)) {
      return;
    }

    $this->current_paged = get_query_var('paged') ?: 1;
    $sticky_posts = $this->get_sticky_posts();

    // 固定投稿を通常クエリから除外（後でマージするため）
    $query->set('post__not_in', $sticky_posts);
    $query->set('posts_per_page', $this->posts_per_page);

    // 2ページ目以降: 固定投稿分を考慮してオフセットを調整
    if ($this->current_paged > 1) {
      $offset = ($this->current_paged - 1) * $this->posts_per_page - count($sticky_posts);
      $query->set('offset', max(0, $offset));
    }

    // the_postsフィルターで処理する対象クエリとして保存
    $this->target_query = $query;
  }

  /**
   * 固定投稿を通常の投稿リストの先頭にマージ
   *
   * modify_archive_queryで保存した対象クエリに対してのみ実行される
   * クエリオブジェクトの参照比較により、別のクエリでの誤実行を防止
   * 
   * pre_get_posts では投稿配列そのものを操作できないため、
   * the_posts フィルターで最終的な配列を組み替える
   *
   * @param array    $posts 取得された投稿の配列
   * @param WP_Query $query クエリオブジェクト
   * @return array マージ後の投稿配列
   */
  public function merge_sticky_posts($posts, $query)
  {
    // 対象クエリでなければ処理しない（参照比較で厳密にチェック）
    if (
      $query !== $this->target_query ||
      !$query->is_post_type_archive($this->post_type)
    ) {
      return $posts;
    }

    // 多重実行防止のためリセット
    $this->target_query = null;

    $sticky_posts_ids = $this->get_sticky_posts();

    if (empty($sticky_posts_ids)) {
      return $posts;
    }

    // 現在のページに表示すべき固定投稿を取得
    $sticky_posts = get_posts([
      'post_type' => $this->post_type,
      'post__in' => $sticky_posts_ids,
      'orderby' => 'post__in',
      'posts_per_page' => $this->posts_per_page,
      'offset' => ($this->current_paged - 1) * $this->posts_per_page,
    ]);

    // 固定投稿 + 通常投稿をマージし、表示件数で切り詰め
    return array_slice(
      array_merge($sticky_posts, $posts),
      0,
      $this->posts_per_page
    );
  }

  /**
   * ページネーションの総投稿数を調整
   *
   * 固定投稿はクエリから除外されているため、
   * ページネーション計算のために固定投稿数を加算する
   *
   * @param int      $found_posts 見つかった投稿の総数
   * @param WP_Query $query       クエリオブジェクト
   * @return int 調整後の総数
   */
  public function adjust_pagination($found_posts, $query)
  {
    if ($this->is_target_archive($query)) {
      $found_posts += count($this->get_sticky_posts());
    }
    return $found_posts;
  }

  /**
   * 固定投稿のIDリストを取得（キャッシュ付き）
   *
   * 同一リクエスト内で複数回呼び出されるため、結果をキャッシュ
   * suppress_filtersで自身のフィルターによる無限ループを防止
   *
   * @return array 固定投稿のIDの配列
   */
  private function get_sticky_posts()
  {
    if ($this->sticky_posts_cache !== null) {
      return $this->sticky_posts_cache;
    }

    $this->sticky_posts_cache = get_posts([
      'post_type' => $this->post_type,
      'meta_key' => self::META_KEY,
      'meta_value' => '1',
      'posts_per_page' => -1,
      'fields' => 'ids',
      'suppress_filters' => true,
    ]);

    return $this->sticky_posts_cache;
  }

  // ============================================================================
  // 管理画面一覧: クイック編集機能
  // ============================================================================

  /**
   * 投稿一覧に固定表示ステータス列を追加
   *
   * この列はCSSで非表示にするが、クイック編集のJavaScriptが
   * 固定表示状態を取得するために必要
   *
   * @param array $columns 列の配列
   * @return array 列を追加した配列
   */
  public function add_sticky_column($columns)
  {
    $columns['sticky'] = '先頭固定ステータス';
    return $columns;
  }

  /**
   * 固定表示ステータス列の内容を出力
   *
   * data-sticky属性に固定状態を持たせ、JavaScriptから参照可能にする
   *
   * @param string $column_name 列名
   * @param int    $post_id     投稿ID
   * @return void
   */
  public function render_sticky_column($column_name, $post_id)
  {
    if ($column_name !== 'sticky') {
      return;
    }
    $is_sticky = get_post_meta($post_id, self::META_KEY, true);
    echo '<span class="sticky-status" data-sticky="' . esc_attr($is_sticky ? '1' : '0') . '"></span>';
  }

  /**
   * 固定表示ステータス列をCSSで非表示
   *
   * 列自体は必要だが、ユーザーに見せる必要はないため非表示にする
   *
   * @return void
   */
  public function hide_sticky_column_css()
  {
    $screen = get_current_screen();
    if ($screen && $screen->post_type === $this->post_type) {
      echo '<style>.column-sticky { display: none; }</style>';
    }
  }

  /**
   * クイック編集フォームに固定表示チェックボックスを追加
   *
   * @param string $column_name 列名
   * @param string $post_type   投稿タイプ
   * @return void
   */
  public function add_quick_edit_sticky_field($column_name, $post_type)
  {
    if ($column_name !== 'sticky' || $post_type !== $this->post_type) {
      return;
    }
    wp_nonce_field('quick_edit_sticky', 'quick_edit_sticky_nonce');
  ?>
    <fieldset class="inline-edit-col-right">
      <div class="inline-edit-col">
        <label class="inline-edit-sticky">
          <input type="checkbox" name="sticky" value="1">
          <span class="checkbox-title"><?php esc_html_e('この投稿を先頭に固定表示', 'textdomain'); ?></span>
        </label>
      </div>
    </fieldset>
  <?php
  }

  /**
   * クイック編集展開時にチェックボックスの状態を復元するJavaScript
   *
   * WordPressのinlineEditPost.editをオーバーライドして、
   * 投稿行のdata-sticky属性からチェック状態を取得・反映する
   *
   * @return void
   */
  public function quick_edit_javascript()
  {
    $screen = get_current_screen();
    if (!$screen || $screen->post_type !== $this->post_type) {
      return;
    }
  ?>
    <script>
      jQuery(function($) {
        var $inlineEdit = inlineEditPost.edit;
        inlineEditPost.edit = function(id) {
          $inlineEdit.apply(this, arguments);
          var postId = typeof id === 'object' ? parseInt(this.getId(id)) : id;
          var $row = $('#post-' + postId);
          var isSticky = $row.find('.sticky-status').data('sticky');
          var $editRow = $('#edit-' + postId);
          $editRow.find('input[name="sticky"]').prop('checked', isSticky === 1 || isSticky === '1');
        };
      });
    </script>
<?php
  }

  /**
   * クイック編集からの保存処理
   *
   * @param int $post_id 保存される投稿のID
   * @return void
   */
  public function save_quick_edit_sticky($post_id)
  {
    // 自動保存時はスキップ
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
      return;
    }
    // 権限チェック
    if (!current_user_can('edit_post', $post_id)) {
      return;
    }
    // 対象投稿タイプのみ処理
    if (get_post_type($post_id) !== $this->post_type) {
      return;
    }
    // nonceチェック（CSRF対策）
    if (!isset($_POST['quick_edit_sticky_nonce']) || !wp_verify_nonce($_POST['quick_edit_sticky_nonce'], 'quick_edit_sticky')) {
      return;
    }

    $is_sticky = isset($_POST['sticky']) ? 1 : 0;
    update_post_meta($post_id, self::META_KEY, $is_sticky);
  }
}

/**
 * カスタム投稿タイプに固定表示機能を追加
 *
 * 使用例:
 *   new CustomStickyPosts('event');        // 'event'投稿タイプ、9件/ページ
 *   new CustomStickyPosts('news', 12);     // 'news'投稿タイプ、12件/ページ
 *
 * @return void
 */
function initialize_custom_sticky_posts()
{
  new CustomStickyPosts('event');
  // new CustomStickyPosts('sample', 10); // 他の投稿タイプを追加する場合
}
// add_action('init', 'initialize_custom_sticky_posts');

// ==========================================================================
// 固定表示を考慮して投稿を取得する関数（サブループ用）
// ==========================================================================
/**
 * 固定表示投稿を先頭にして投稿を取得する（サブループ用）
 *
 * CustomStickyPostsクラスはメインクエリ専用のため、
 * サブループ（トップページの新着一覧など）ではこの関数を使用する
 *
 * 【使用例】
 * $posts = get_posts_with_sticky_first('news', 5);
 * $posts = get_posts_with_sticky_first('event', 10, ['tax_query' => [...]]);
 *
 * @param string $post_type       投稿タイプ
 * @param int    $posts_per_page  表示件数（デフォルト: 10）
 * @param array  $additional_args 追加のWP_Query引数（tax_queryなど）
 * @return array WP_Postオブジェクトの配列（固定投稿が先頭）
 */
function get_posts_with_sticky_first($post_type, $posts_per_page = 10, $additional_args = [])
{
  $meta_key = '_is_sticky';

  // 共通の引数・日付降順で取得（必要に応じて変更可）
  $base_args = [
    'post_type' => $post_type,
    'orderby' => 'date',
    'order' => 'DESC',
    'suppress_filters' => true,
  ];

  // 固定投稿を取得（表示件数で制限）
  $sticky_args = array_merge($base_args, $additional_args, [
    'posts_per_page' => $posts_per_page,
    'meta_key' => $meta_key,
    'meta_value' => '1',
  ]);
  $sticky_posts = get_posts($sticky_args);
  $sticky_count = count($sticky_posts);

  // 固定投稿がない場合は通常の取得のみ
  if ($sticky_count === 0) {
    $normal_args = array_merge($base_args, $additional_args, [
      'posts_per_page' => $posts_per_page,
    ]);
    return get_posts($normal_args);
  }

  // 固定投稿だけで表示件数に達している場合
  if ($sticky_count >= $posts_per_page) {
    return $sticky_posts;
  }

  // 通常投稿を取得（固定投稿を除外、残り件数分のみ）
  $sticky_ids = wp_list_pluck($sticky_posts, 'ID');
  $normal_args = array_merge($base_args, $additional_args, [
    'posts_per_page' => $posts_per_page - $sticky_count,
    'post__not_in' => $sticky_ids,
  ]);
  $normal_posts = get_posts($normal_args);

  // 固定投稿 + 通常投稿をマージ
  return array_merge($sticky_posts, $normal_posts);
}

// ==========================================================================
// post_typeによるリンクや属性を取得する関数
// ==========================================================================
/**
 * post_typeに基づいてURLとtarget属性を取得する関数
 * 
 * @param int|null $post_id 投稿ID（省略時は現在の投稿ID）
 * @return array URL、target属性を含む配列 ['url' => string, 'targetAttr' => string]
 */
function get_post_link_attributes($post_id = null)
{
  // 投稿IDが指定されていない場合は現在の投稿IDを取得
  if ($post_id === null) {
    $post_id = get_the_ID();
  }

  // ACFフィールド「投稿選択」からpost_typeを取得（ラジオボタンなので必ず値が入っている）
  $post_type = get_field('post_type', $post_id);

  // post_typeに応じてURLとtarget属性を設定
  $postType_url = '';
  $targetAttr = '';

  if ($post_type === 'url') {
    // リンクタイプ：外部リンクを使用
    $postType_url = get_field('postType_url', $post_id);
    // postType_targetがチェックされている場合は新しいタブで開く
    $postType_target = get_field('postType_target', $post_id);
    if ($postType_target) {
      $targetAttr = ' target="_blank" rel="noreferrer external"';
    }
  } elseif ($post_type === 'file') {
    // ファイルタイプ：PDFファイルのURLを取得
    $postType_file = get_field('postType_file', $post_id);
    if ($postType_file) {
      // 配列の場合はurlキーから取得、そうでなければそのまま使用
      $postType_url = is_array($postType_file) ? $postType_file['url'] : $postType_file;
      $targetAttr = ' target="_blank" rel="noreferrer external"';
    } else {
      // ファイルが設定されていない場合はパーマリンクを使用
      $postType_url = get_permalink($post_id);
    }
  } elseif ($post_type === 'none') {
    // リンクなし：URLを空で返す
    $postType_url = '';
  } else {
    // 記事タイプ（post）またはpost_typeが未設定の場合：パーマリンクを使用
    $postType_url = get_permalink($post_id);
  }

  // URLが空の場合かつリンクなし以外の場合はパーマリンクをフォールバック
  if (empty($postType_url) && $post_type !== 'none') {
    $postType_url = get_permalink($post_id);
  }
  return [
    'url' => $postType_url,
    'targetAttr' => $targetAttr
  ];
}

// ==========================================================================
// 記事詳細ページの前後ナビ用：ACF「投稿選択」が「記事」の投稿のみ取得
// ==========================================================================
/**
 * ACFフィールド post_type が post（記事）の投稿のみを対象に、前後の投稿を取得する
 *
 * @param string   $direction 取得方向（previous または next）
 * @param int|null $post_id     基準となる投稿ID（省略時は現在の投稿ID）
 * @return WP_Post|null 前後の投稿オブジェクト。該当がなければ null
 */
function get_adjacent_article_post($direction = 'previous', $post_id = null)
{
  // 投稿IDが指定されていない場合は現在の投稿IDを取得
  if ($post_id === null) {
    $post_id = get_the_ID();
  }

  $current_post = get_post($post_id);
  if (!$current_post) {
    return null;
  }

  // 前後の方向に応じて日付条件と並び順を設定
  $is_previous = $direction === 'previous';
  $date_query = [
    $is_previous ? 'before' : 'after' => $current_post->post_date,
    'inclusive' => false,
  ];

  $query = new WP_Query([
    'post_type' => $current_post->post_type,
    'post_status' => 'publish',
    'posts_per_page' => 1,
    'orderby' => 'date',
    'order' => $is_previous ? 'DESC' : 'ASC',
    'date_query' => [$date_query],
    'post__not_in' => [$post_id],
    'meta_query' => [
      [
        'key' => 'post_type',
        'value' => 'post',
        'compare' => '=',
      ],
    ],
  ]);

  if (!$query->have_posts()) {
    return null;
  }

  return $query->posts[0];
}
