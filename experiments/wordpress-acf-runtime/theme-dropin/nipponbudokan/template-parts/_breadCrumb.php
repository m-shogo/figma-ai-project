<?php

/**
 * パンくずナビゲーション コンポーネント
 */

// 基本クラス
class BreadcrumbTrail
{
  private $items = [];
  private $position = 1;

  public function __construct()
  {
    // トップページへのリンクを常に最初に追加
    $this->addItem('TOP', home_url('/'));
  }

  public function addItem($name, $url = null)
  {
    $this->items[] = [
      'name' => $name,
      'url' => $url,
      'position' => $this->position++
    ];
    return $this;
  }

  public function render()
  {
    $html = '<ul class="module_breadCrumb-01" itemprop="Breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">';

    foreach ($this->items as $item) {
      $html .= '<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';

      if ($item['url']) {
        $html .= '<a itemscope itemtype="https://schema.org/Thing" itemprop="item" itemid="' . esc_url($item['url']) . '" href="' . esc_url($item['url']) . '">';
        $html .= '<span itemprop="name">' . esc_html($item['name']) . '</span>';
        $html .= '</a>';
      } else {
        $html .= '<span itemprop="name">' . esc_html($item['name']) . '</span>';
      }

      $html .= '<meta itemprop="position" content="' . $item['position'] . '" />';
      $html .= '</li>';
    }

    $html .= '</ul>';
    return $html;
  }
}

// パンくず作成用関数
function get_breadcrumb_trail()
{
  $trail = new BreadcrumbTrail();

  if (is_front_page()) {
    // フロントページの場合はTOPのみ
    return $trail;
  }

  if (is_home()) {
    // 投稿一覧ページ
    $post_top_id = get_option('page_for_posts');
    $trail->addItem(get_the_title($post_top_id));
    return $trail;
  }

  // ===========================================
  // 個別指定（必要であれば追加）
  // ===========================================
  // ---------- テンプレートが「XXX.php」の場合 ----------
  // if (is_page_template('XXX.php')) {

  // Case1：特定のアーカイブ一覧が親の場合
  //$link = get_post_type_archive_link('hoge'); // 一覧のリンク先
  //$trail->addItem('タイトル', $link); // タイトル

  // Case2：特定の固定ページが親の場合
  //$page = get_page_by_path('hoge_page'); // スラッグから固定ページのIDを取得
  //$link = get_permalink($page->ID);

  // パンくず末尾に追加・固定ページタイトルの場合
  //$trail->addItem(get_the_title());

  // パンくず末尾に追加・アーカイブタイトルの場合
  //$trail->addItem(post_type_archive_title('', false));

  //return $trail;
  // }

  // ---------- 投稿タイプ「hoge」のアーカイブページの場合 ----------
  // if (is_post_type_archive('hoge')) {
  // }

  // ---------- タクソノミー「hoge_cat」のシングルページの場合 ----------
  // if (is_tax('hoge_cat', 'hoge')) {
  // }

  // ---------- 親ページが「hoge」の場合 ----------
  // if (is_parent('hoge')) {
  // }

  // ---------- 投稿タイプ「hoge」のシングルページの場合 ----------
  // if (is_singular('hoge')) {
  // }

  // ---------- 投稿タイプ「hoge」のシングルページ かつ タクソノミー「hoge_cat」のターム「fuga」が付与されている場合 ----------
  // if (is_singular('news') && has_term('fuga', 'hoge_cat')) {
  // }

  // ===========================================
  // デフォルト設定
  // ===========================================
  if (is_page() && !get_post()->post_parent) {
    // 親なし固定ページ
    $trail->addItem(get_the_title());
    return $trail;
  }

  if (is_page()) {
    // 親ありの固定ページ - 親階層も表示
    $ancestors = array_reverse(get_post_ancestors(get_the_ID()));
    foreach ($ancestors as $ancestor) {
      $trail->addItem(get_the_title($ancestor), get_permalink($ancestor));
    }
    $trail->addItem(get_the_title());
    return $trail;
  }

  if (is_singular('post')) {
    // 投稿詳細ページ
    $post_top_id = get_option('page_for_posts');
    $trail->addItem(get_the_title($post_top_id), get_permalink($post_top_id));

    // カテゴリがある場合は最初のカテゴリを表示
    // $categories = get_the_category();
    // if (!empty($categories)) {
    //   $category = $categories[0];

    //   // 親カテゴリがある場合
    //   $parents = get_category_parents($category->term_id, false, '|', true);
    //   if ($parents && !is_wp_error($parents)) {
    //     $parent_categories = explode('|', $parents);
    //     $parent_categories = array_filter($parent_categories);

    //     foreach ($parent_categories as $parent_category) {
    //       $cat_obj = get_term_by('name', $parent_category, 'category');
    //       if ($cat_obj) {
    //         $trail->addItem($cat_obj->name, get_term_link($cat_obj));
    //       }
    //     }
    //   } else {
    //     // 親カテゴリがない場合
    //     $trail->addItem($category->name, get_term_link($category));
    //   }
    // }

    $trail->addItem(get_the_title());
    return $trail;
  }

  if (is_singular()) {
    // その他の投稿タイプ
    $post_type = get_post_type();
    $post_type_obj = get_post_type_object($post_type);
    $trail->addItem($post_type_obj->label, get_post_type_archive_link($post_type));

    // タクソノミーがあれば表示
    $taxonomies = get_object_taxonomies($post_type, 'objects');
    if (!empty($taxonomies)) {
      $taxonomy = reset($taxonomies);
      $terms = get_the_terms(get_the_ID(), $taxonomy->name);

      if (!empty($terms)) {
        $term = reset($terms);
        $trail->addItem($term->name, get_term_link($term));
      }
    }

    $trail->addItem(get_the_title());
    return $trail;
  }

  if (is_category()) {
    // カテゴリアーカイブ
    $post_top_id = get_option('page_for_posts');
    $trail->addItem(get_the_title($post_top_id), get_permalink($post_top_id));

    $category = get_queried_object();

    // 親カテゴリがある場合
    if ($category->parent) {
      $parents = get_category_parents($category->term_id, false, '|', true);
      if ($parents && !is_wp_error($parents)) {
        $parent_categories = explode('|', $parents);
        $parent_categories = array_filter($parent_categories);
        array_pop($parent_categories); // 現在のカテゴリを除外

        foreach ($parent_categories as $parent_category) {
          $cat_obj = get_term_by('name', $parent_category, 'category');
          if ($cat_obj) {
            $trail->addItem($cat_obj->name, get_term_link($cat_obj));
          }
        }
      }
    }

    $trail->addItem(single_cat_title('', false));
    return $trail;
  }

  if (is_tax()) {
    // タクソノミーアーカイブ
    $term = get_queried_object();
    $taxonomy = get_taxonomy($term->taxonomy);
    $post_type = $taxonomy->object_type[0];
    $post_type_obj = get_post_type_object($post_type);

    $trail->addItem($post_type_obj->label, get_post_type_archive_link($post_type));

    // 親タームがある場合
    if ($term->parent) {
      $ancestors = get_ancestors($term->term_id, $term->taxonomy);
      $ancestors = array_reverse($ancestors);

      foreach ($ancestors as $ancestor_id) {
        $ancestor = get_term($ancestor_id, $term->taxonomy);
        $trail->addItem($ancestor->name, get_term_link($ancestor));
      }
    }

    $trail->addItem(single_term_title('', false));
    return $trail;
  }

  if (is_search()) {
    // 検索結果ページ
    $trail->addItem(get_search_query() ? '"' . get_search_query() . '"の検索結果' : '検索キーワードが未入力です');
    return $trail;
  }

  if (is_404()) {
    // 404ページ
    $trail->addItem('404');
    return $trail;
  }

  if (is_date()) {
    // 日付アーカイブ
    $post_type = get_post_type() ?: 'post';

    if ($post_type === 'post') {
      $post_top_id = get_option('page_for_posts');
      $trail->addItem(get_the_title($post_top_id), get_permalink($post_top_id));
    } else {
      $post_type_obj = get_post_type_object($post_type);
      $trail->addItem($post_type_obj->label, get_post_type_archive_link($post_type));
    }

    $year = get_query_var('year');
    $month = get_query_var('monthnum');
    $day = get_query_var('day');
    $is_fiscal_year = get_query_var('is_fiscal_year');

    // 年度別アーカイブで year がクリアされている場合、URLから取得
    if (!$year) {
      $url_path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
      $segments = explode('/', $url_path);
      foreach ($segments as $segment) {
        if (preg_match('/^\d{4}$/', $segment)) {
          $year = $segment;
          break;
        }
      }
    }

    if ($year) {
      $year_url = $post_type === 'post'
        ? get_year_link($year)
        : get_custom_post_type_year_link($post_type, $year);

      $year_label = $is_fiscal_year ? $year . '年度' : $year . '年';
      $trail->addItem($year_label, $month || $day ? $year_url : null);

      if ($month) {
        $month_url = $post_type === 'post'
          ? get_month_link($year, $month)
          : $year_url . $month . '/';

        $trail->addItem($month . '月', $day ? $month_url : null);

        if ($day) {
          $trail->addItem($day . '日');
        }
      }
    }

    return $trail;
  }

  if (is_post_type_archive()) {
    // カスタム投稿タイプのアーカイブ
    $trail->addItem(post_type_archive_title('', false));
    return $trail;
  }

  // 何にも当てはまらない場合
  $trail->addItem(wp_get_document_title());
  return $trail;
}

// 実行
$breadcrumb = get_breadcrumb_trail();
echo '<nav class="module_breadCrumb"><div class="mb_inner global_inner">' . $breadcrumb->render() . '</div></nav>';
