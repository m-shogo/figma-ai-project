<?php

/**
 * --------------------------------------------------------------------------------
 * 
 * 管理画面の設定
 * 
 * --------------------------------------------------------------------------------
 */

// ==========================================================================
// Adminbar非表示
// ==========================================================================
//add_filter( 'show_admin_bar', '__return_false' );

// ==========================================================================
// 通常投稿からカテゴリー・タグを削除
// ==========================================================================
function hide_taxonomy_from_menu()
{
  global $wp_taxonomies;
  // カテゴリーの非表示
  //  if ( !empty( $wp_taxonomies['category']->object_type ) ) {
  //    foreach ( $wp_taxonomies['category']->object_type as $i => $object_type ) {
  //      if ( $object_type == 'post' ) {
  //        unset( $wp_taxonomies['category']->object_type[$i] );
  //      }
  //    }
  //  }
  // タグの非表示
  if (!empty($wp_taxonomies['post_tag']->object_type)) {
    foreach ($wp_taxonomies['post_tag']->object_type as $i => $object_type) {
      if ($object_type == 'post') {
        unset($wp_taxonomies['post_tag']->object_type[$i]);
      }
    }
  }
  return true;
}
add_action('init', 'hide_taxonomy_from_menu');

// ==========================================================================
// カテゴリー選択を1つに制限
// https://www.nxworld.net/wordpress/wp-limit-category-select.html
// ==========================================================================
function limit_category_select()
{
?>
  <script type="text/javascript">
    jQuery(function($) {
      // 投稿画面のカテゴリー選択を制限
      const cat_checklist = $('.categorychecklist input[type="checkbox"]');
      cat_checklist.click(function() {
        $(this).parents('.categorychecklist').find('input[type="checkbox"]').prop('checked', false);
        $(this).prop('checked', true);
      });
      // クイック編集のカテゴリー選択を制限
      const quickedit_cat_checklist = $('.cat-checklist input[type="checkbox"]');
      quickedit_cat_checklist.click(function() {
        $(this).parents('.cat-checklist').find('input[type="checkbox"]').prop('checked', false);
        $(this).prop('checked', true);
      });
      // 管理画面にコメントを追加
      $('.categorychecklist, .cat-checklist').prepend('<li><p>カテゴリーは1つしか選択できません</p></li>');
    });
  </script>
<?php
}
//add_action( 'admin_print_footer_scripts', 'limit_category_select' );

// ==========================================================================
//管理画面以外でのみCSSの遅延読み込み
// ==========================================================================
// if (!is_login_page()) {
//   if (!is_admin()) {
//     add_filter('style_loader_tag', 'my_css_asynchronous', 10, 2);
//     //  add_action('wp_footer', 'add_link_rel_stylesheet', 11);

//     //link タグの属性を変更
//     function my_css_asynchronous($html, $handle)
//     {
//       if (!($handle == 'firstview' || $handle == 'fontello')) {
//         $html = preg_replace(array("| rel='.+?'\s*|", '| />|'), array(" class='async' ", ">"), $html);
//       }

//       return $html;
//     }
//   }
// }

// ==========================================================================
// ログイン画面の背景変更
// ==========================================================================
function login_custom()
{
  echo <<<HTML
  <style type="text/css">
    .login {
      background: #f8f8f9;
      background-size: cover;
    }
  </style>
  HTML;
}
// add_action('login_enqueue_scripts', 'login_custom');

// ==========================================================================
// ログイン画面のロゴ変更
// ==========================================================================
function login_logo()
{
  echo '<style type="text/css">.login h1 a {background-image: url(' . get_bloginfo('template_directory') . '/images/common/login-logo.webp);width:300px;height:55px;background-size:contain !important;}</style>';
}
// add_action('login_head', 'login_logo');

// ==========================================================================
// ログイン画面リンクURLをトップページに変更 ※テーマ内のlogin.cssを反映
// ==========================================================================
function custom_login_logo_url()
{
  return get_bloginfo('url');
}
// add_filter('login_headerurl', 'custom_login_logo_url');

// ==========================================================================
// 管理画面に任意のJS・CSSを追加
// ==========================================================================
function enqueue_admin_style_script()
{
  // CSS
  wp_enqueue_style('admin-style', get_template_directory_uri() . '/css/admin-style.css', array(), null, 'all');
  // font awesome
  wp_enqueue_style('fontawesome-style', get_template_directory_uri() . '/css/all.min.css', array(), '6.7.2', 'all');
  // JavaScript
  wp_enqueue_script('admin-script', get_template_directory_uri() . '/js/admin-script.js', array(), '1.0.0', true);
}
add_action('admin_enqueue_scripts', 'enqueue_admin_style_script');

// ==========================================================================
// CSS非同期読み込み設定（管理画面以外）
// ==========================================================================
//メインのCSS追加
function add_css_style()
{
  wp_enqueue_style('css-style', get_stylesheet_uri(), array(), null);
}

add_action('wp_enqueue_scripts', 'add_css_style', 5);

// check if current page is login-page or not
function is_login_page()
{
  return in_array($GLOBALS['pagenow'], array('wp-login.php', 'wp-register.php'));
}

// ==========================================================================
// 【管理画面】管理画面のメニュー、ダッシュボードを非表示にする - 必要ない項目を消す手順
// https://yumegori.com/wordpress-admin-menu-custmize
// ==========================================================================
// ダッシュボード
function remove_dashboard_widget()
{
  remove_meta_box('dashboard_site_health', 'dashboard', 'normal'); //サイトヘルスステータス
  //remove_meta_box( 'dashboard_right_now', 'dashboard', 'normal' ); //概要
  //remove_meta_box( 'dashboard_activity', 'dashboard', 'normal' ); //アクティビティ
  remove_meta_box('dashboard_quick_press', 'dashboard', 'side'); //クイックドラフト
  remove_meta_box('dashboard_primary', 'dashboard', 'side'); //WordPressニュース
  //remove_action( 'welcome_panel', 'wp_welcome_panel' ); //ようこそ
}
add_action('wp_dashboard_setup', 'remove_dashboard_widget');

// 標準メニュー（サイドバー）・サブメニュー
function remove_menus()
{
  remove_menu_page('edit-comments.php'); //コメント
  //remove_menu_page('edit.php'); // 通常投稿
}
add_action('admin_menu', 'remove_menus', 999);

// アドミンバーのメニューを消す
function remove_admin_bar_menus($wp_admin_bar)
{
  $wp_admin_bar->remove_menu('wp-logo'); //ロゴ
  $wp_admin_bar->remove_menu('about'); //ロゴ / WordPressについて
  $wp_admin_bar->remove_menu('wporg'); //ロゴ / WordPress.org
  $wp_admin_bar->remove_menu('documentation'); //ロゴ / ドキュメンテーション
  $wp_admin_bar->remove_menu('support-forums'); //ロゴ / サポート
  $wp_admin_bar->remove_menu('feedback'); //ロゴ / フィードバック
  $wp_admin_bar->remove_menu('updates'); //更新
  $wp_admin_bar->remove_menu('comments'); //コメント
  $wp_admin_bar->remove_menu('customize'); //カスタマイズ
}
add_action('admin_bar_menu', 'remove_admin_bar_menus', 999);

// ==========================================================================
// ユーザーごとに管理画面メニュー非表示
// ==========================================================================
//function remove_menus () {
//  global $menu;
//  var_dump($menu);// スラッグを検索（管理画面に表示される）
//  if (current_user_can('editor')) {
//    remove_menu_page('common_menu');// menu_slug=>common_menu 編集者はオプション非表示
//  }
//}
//add_action('admin_menu', 'remove_menus', 999);

// ==========================================================================
// 固定ページにカテゴリーを追加
// ==========================================================================
//function add_categories_for_pages() {
//  register_taxonomy_for_object_type('category', 'page');
//}
//
//add_action('init', 'add_categories_for_pages');
//function nobita_merge_page_categories_at_category_archive($query) {
//  if ($query->is_category == true && $query->is_main_query()) {
//    $query->set('post_type', array('post', 'page', 'nav_menu_item'));
//  }
//}
//
//add_action('pre_get_posts', 'nobita_merge_page_categories_at_category_archive');

// ==========================================================================
// 相対パス設定
// ==========================================================================
function delete_host_from_attachment_url($url)
{
  $regex = '/^http(s)?:\/\/[^\/\s]+(.*)$/';
  if (preg_match($regex, $url, $m)) {
    $url = $m[2];
  }

  return $url;
}

add_filter('wp_get_attachment_url', 'delete_host_from_attachment_url');

// ==========================================================================
// 管理画面のカスタムタクソノミー 親子関係の自動チェック機能（クラシックエディタ専用）
// ==========================================================================
function add_auto_check_all_hierarchical_taxonomies_classic()
{
  // ブロックエディタでは実行しない
  if (wp_is_block_theme() || use_block_editor_for_post_type(get_post_type())) return;

  $screen = get_current_screen();
  if ($screen->base !== 'post' || empty($screen->post_type)) return;

  $taxonomies = get_object_taxonomies($screen->post_type, 'objects');
  $hierarchical_taxonomies = array_filter($taxonomies, function ($tax) {
    return $tax->hierarchical && $tax->show_ui;
  });

  if (empty($hierarchical_taxonomies)) return;
?>
  <script>
    jQuery(document).ready(function($) {
      const taxonomies = <?php echo json_encode(array_keys($hierarchical_taxonomies)); ?>;

      taxonomies.forEach(function(taxonomy) {
        const selector = `#${taxonomy}-all`; // Classic Editor: IDに "-all" が付く
        const box = $(selector);

        if (box.length === 0) {
          //console.warn(`タクソノミーDOMが見つかりません: ${taxonomy}`);
          return;
        }

        //console.log(`ClassicEditorタクソノミー検出成功: ${taxonomy}`);

        // チェック時に処理を実行
        box.on('change', 'input[type="checkbox"]', function() {
          updateParentChildRelationships(box, taxonomy);
        });

        // 親を手動でチェックした場合
        box.on('click', 'li > label > input[type="checkbox"]', function() {
          const checkbox = $(this);
          const parentLi = checkbox.closest('li');
          const childrenUl = parentLi.find('> ul.children');
          if (childrenUl.length > 0) {
            const storageKey = `${taxonomy}_parent_checked_${checkbox.val()}`;
            localStorage.setItem(storageKey, checkbox.prop('checked'));
          }
        });

        // 初期実行
        updateParentChildRelationships(box, taxonomy);
      });

      function updateParentChildRelationships(box, taxonomy) {
        box.find('li').each(function() {
          const li = $(this);
          const parentCheckbox = li.find('> label > input[type="checkbox"]');
          const childrenUl = li.find('> ul.children');

          if (childrenUl.length > 0 && parentCheckbox.length > 0) {
            const childCheckboxes = childrenUl.find('input[type="checkbox"]');
            const checkedChildCount = childCheckboxes.filter(':checked').length;

            const storageKey = `${taxonomy}_parent_checked_${parentCheckbox.val()}`;
            const isExplicit = localStorage.getItem(storageKey) === 'true';

            if (checkedChildCount > 0) {
              if (!parentCheckbox.prop('checked')) {
                parentCheckbox.prop('checked', true);
                //console.log(`親自動チェック: ${parentCheckbox.val()}`);
              }
            } else if (!isExplicit) {
              if (parentCheckbox.prop('checked')) {
                parentCheckbox.prop('checked', false);
                //console.log(`親チェック外し（自動）: ${parentCheckbox.val()}`);
              }
            }
          }
        });
      }
    });
  </script>
<?php
}
// add_action('admin_footer-post.php', 'add_auto_check_all_hierarchical_taxonomies_classic');
// add_action('admin_footer-post-new.php', 'add_auto_check_all_hierarchical_taxonomies_classic');

// ==========================================================================
// 管理画面のカスタムタクソノミー 親子関係の自動チェック機能（ブロックエディタ専用）
// ==========================================================================
function add_auto_check_all_hierarchical_taxonomies()
{
  if (!wp_is_block_theme() && !use_block_editor_for_post_type(get_post_type())) return;

  $screen = get_current_screen();
  if ($screen->base !== 'post' || empty($screen->post_type)) return;

  $taxonomies = get_object_taxonomies($screen->post_type, 'objects');
  $hierarchical_taxonomies = array_filter($taxonomies, function ($tax) {
    return $tax->hierarchical && $tax->show_ui;
  });

  if (empty($hierarchical_taxonomies)) return;

  $taxonomy_slugs = array_keys($hierarchical_taxonomies);
?>
  <script>
    jQuery(document).ready(function($) {
      if (typeof wp !== 'undefined' && wp.domReady) {
        wp.domReady(function() {
          const taxonomies = <?php echo json_encode($taxonomy_slugs); ?>;

          taxonomies.forEach(function(taxonomy) {
            const selector = `.components-panel__body[data-taxonomy="${taxonomy}"] .editor-post-taxonomies__hierarchical-terms-list`;

            const wait = setInterval(() => {
              const box = document.querySelector(selector);
              if (box) {
                clearInterval(wait);
                // console.log(`タクソノミー検出成功: ${taxonomy}`);
                setupObserver(taxonomy, box);
              }
            }, 100);
            setTimeout(() => {
              clearInterval(wait);
              // console.warn(`タクソノミー検出タイムアウト: ${taxonomy}`);
            }, 5000);
          });
        });
      }

      function setupObserver(taxonomy, container) {
        const observer = new MutationObserver(() => {
          updateAllRelationships(taxonomy, container);
        });
        observer.observe(container, {
          childList: true,
          subtree: true
        });
        updateAllRelationships(taxonomy, container);
        // console.log(`MutationObserver 起動: ${taxonomy}`);
      }

      function updateAllRelationships(taxonomy, container) {
        const allChoices = container.querySelectorAll('.editor-post-taxonomies__hierarchical-terms-choice');
        allChoices.forEach(function(choice) {
          const checkbox = choice.querySelector('.components-checkbox-control__input');
          const childrenContainer = choice.querySelector('.editor-post-taxonomies__hierarchical-terms-subchoices');
          if (!checkbox) return;

          const storageKey = `${taxonomy}_parent_checked_${checkbox.value}`;
          const isExplicit = localStorage.getItem(storageKey) === 'true';

          if (childrenContainer) {
            const childCheckboxes = childrenContainer.querySelectorAll('.components-checkbox-control__input');
            const checkedChildCount = Array.from(childCheckboxes).filter(cb => cb.checked).length;

            if (checkedChildCount > 0) {
              if (!checkbox.checked) {
                // console.log(`親自動チェック: ${checkbox.value}`);
                checkbox.click();
              }
              localStorage.setItem(storageKey, 'true');
            } else if (!isExplicit) {
              if (checkbox.checked) {
                // console.log(`親チェック外し（自動）: ${checkbox.value}`);
                checkbox.click();
              }
              localStorage.removeItem(storageKey);
            }
          }
        });
      }

      function checkAncestorCheckboxes(checkbox, taxonomy) {
        // console.log(`checkAncestorCheckboxes 開始 [taxonomy=${taxonomy}] checkbox value=${checkbox?.value}`);

        const currentChoice = checkbox.closest('.editor-post-taxonomies__hierarchical-terms-choice');
        if (!currentChoice) {
          // console.warn('checkbox の親 choice が見つかりません');
          return;
        }

        const parentChoice = currentChoice.parentElement?.closest('.editor-post-taxonomies__hierarchical-terms-choice');
        if (!parentChoice) {
          // console.log('これ以上親はいません（最上位）');
          return;
        }

        const parentCheckbox = parentChoice.querySelector('.components-checkbox-control__input');
        if (!parentCheckbox) {
          // console.warn('親 choice に checkbox が見つかりません');
          return;
        }

        if (!parentCheckbox.checked) {
          parentCheckbox.click();
          const storageKey = `${taxonomy}_parent_checked_${parentCheckbox.value}`;
          localStorage.setItem(storageKey, 'true');
          // console.log(`親 checkbox をクリック（value=${parentCheckbox.value}）`);
          checkAncestorCheckboxes(parentCheckbox, taxonomy);
        } else {
          // console.log(`親 checkbox はすでに checked（value=${parentCheckbox.value}）`);
        }
      }

      document.addEventListener('change', function(e) {
        if (!e.target.matches('.components-checkbox-control__input')) return;

        const checkbox = e.target;
        // console.log(`change イベント：value=${checkbox.value} checked=${checkbox.checked}`);

        const choice = checkbox.closest('.editor-post-taxonomies__hierarchical-terms-choice');
        if (!choice) {
          // console.warn('checkbox の親 choice が見つかりません');
          return;
        }

        const container = choice.closest('.editor-post-taxonomies__hierarchical-terms-list');
        if (!container) {
          // console.warn('checkbox のタクソノミー container が見つかりません');
          return;
        }

        let taxonomy = null;
        const label = container.getAttribute('aria-label');
        if (label) {
          taxonomy = label
            .trim()
            .toLowerCase()
            .replace(/[Ａ-Ｚａ-ｚ]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角英字→半角
            .replace(/[^\w\-]/g, '_'); // 空白や記号をアンダースコア
        }
        if (!taxonomy) {
          // console.warn('taxonomy を aria-label から取得できませんでした');
          return;
        }

        // console.log(`タクソノミー識別：taxonomy=${taxonomy}`);

        const childrenContainer = choice.querySelector('.editor-post-taxonomies__hierarchical-terms-subchoices');
        const storageKey = `${taxonomy}_parent_checked_${checkbox.value}`;

        if (!childrenContainer) {
          if (checkbox.checked) {
            localStorage.setItem(storageKey, 'true');
            // console.log('明示チェック保存');
          } else {
            localStorage.removeItem(storageKey);
            // console.log('明示チェック解除');
          }
        }

        if (checkbox.checked) {
          // console.log(`checkAncestorCheckboxes 呼び出し`);
          checkAncestorCheckboxes(checkbox, taxonomy);
        }

        if (childrenContainer) {
          updateAllRelationships(taxonomy, container);
        }
      });
    });
  </script>
<?php
}
add_action('admin_footer-post.php', 'add_auto_check_all_hierarchical_taxonomies');
add_action('admin_footer-post-new.php', 'add_auto_check_all_hierarchical_taxonomies');

// ==========================================================================
// 特定のテンプレートでエディタを完全に非表示にする
// ==========================================================================
/**
 * エディタを無効にするテンプレートのリストを取得する関数
 * 
 * @return array エディタを無効にするテンプレートの配列
 */
//----- エディタを無効にするテンプレートのリストを取得する関数 -----
function get_templates_without_editor()
{
  return array(
    'original-XXX.php',
  );
}

//----- 固定ページで、かつ指定されたテンプレートが選択されている場合にエディタを無効にする -----
function remove_editor_for_specific_template($use_block_editor, $post)
{
  if ($post->post_type === 'page') {
    $template = get_page_template_slug($post->ID);
    if (in_array($template, get_templates_without_editor())) {
      return false;
    }
  }

  return $use_block_editor;
}
// add_filter('use_block_editor_for_post', 'remove_editor_for_specific_template', 10, 2);

//----- クラシックエディタも含めてエディタ自体を非表示にする-----
function remove_editor_init()
{
  // 管理画面かどうか確認
  if (!is_admin()) return;

  // 現在の画面が投稿/ページ編集画面かチェック
  global $pagenow;
  if (!in_array($pagenow, ['post.php', 'post-new.php'])) return;

  // GETパラメータからpost_idを取得
  $post_id = isset($_GET['post']) ? $_GET['post'] : (isset($_POST['post_ID']) ? $_POST['post_ID'] : null);
  if (!$post_id) return;

  // テンプレートを確認
  $template = get_page_template_slug($post_id);
  if (in_array($template, get_templates_without_editor())) {
    // エディタ用スタイルを削除
    remove_post_type_support('page', 'editor');

    // 管理画面にメッセージを表示
    add_action('admin_notices', function () use ($template) {
      echo '<div class="notice notice-info"><p>このテンプレート（' . esc_html($template) . '）ではエディタが無効になっています。コンテンツはテンプレートに固定されています。</p></div>';
    });
  }
}
// add_action('admin_init', 'remove_editor_init');

// ==========================================================================
// SVGファイルのアップロードを許可
// ==========================================================================
function add_file_types_to_uploads($file_types)
{

  $new_filetypes        = array();
  $new_filetypes['svg'] = 'image/svg+xml';
  $file_types           = array_merge($file_types, $new_filetypes);

  return $file_types;
}

add_action('upload_mimes', 'add_file_types_to_uploads');
