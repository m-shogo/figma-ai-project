<?php
add_action('after_setup_theme', function () {
    register_nav_menus(array(
        // 例 'メニューの位置を示す固有名称' => 'このメニューの位置の名称'
        'global-nav' => 'グローバルメニュー',
        'mega-nav' => 'メガメニュー',
        'sub-nav' => 'サブメニュー',
        'footer-nav' => 'フッターメニュー',
        'sidebar-nav' => 'サイドバーメニュー',
        'dropdown-nav' => 'ドロップダウンメニュー'
    ));
});

/**
 * Local Navigation menus are not theme locations.
 * Editors name them 「ローカル：…」; slug is kept as local-*.
 * Per-page assignment is ACF `page_local_nav` (Human 2026-09-11).
 */
function nipponbudokan_is_local_nav_menu($menu)
{
    $menu = is_object($menu) ? $menu : wp_get_nav_menu_object($menu);
    if (!$menu) {
        return false;
    }
    if (strpos((string) $menu->slug, 'local-') === 0) {
        return true;
    }
    return (bool) preg_match('/^ローカル[:：]/u', (string) $menu->name);
}

function nipponbudokan_get_local_nav_menu_choices()
{
    $assigned = array_filter(array_map('intval', (array) get_nav_menu_locations()));
    $choices = array();
    foreach (wp_get_nav_menus() as $menu) {
        if (!nipponbudokan_is_local_nav_menu($menu)) {
            continue;
        }
        if (in_array((int) $menu->term_id, $assigned, true)) {
            continue;
        }
        $choices[(string) $menu->term_id] = $menu->name;
    }
    return $choices;
}

function nipponbudokan_get_page_local_nav_menu_id($post_id = 0)
{
    $post_id = $post_id ? (int) $post_id : (int) get_queried_object_id();
    if ($post_id < 1 || !function_exists('get_field')) {
        return 0;
    }
    return absint(get_field('page_local_nav', $post_id));
}

function nipponbudokan_sync_local_nav_menu_slug($menu_id)
{
    static $syncing = false;
    if ($syncing) {
        return;
    }
    $menu = wp_get_nav_menu_object((int) $menu_id);
    if (!$menu || !preg_match('/^ローカル[:：]\s*(.+)$/u', (string) $menu->name, $matches)) {
        return;
    }
    if (strpos((string) $menu->slug, 'local-') === 0 && strpos((string) $menu->slug, '%') === false) {
        return;
    }
    $rest = sanitize_title($matches[1]);
    // Japanese titles become percent-encoded; keep a stable ASCII slug instead.
    if ($rest === '' || strpos($rest, '%') !== false || !preg_match('/^[a-z0-9_-]+$/', $rest)) {
        $slug = 'local-menu-' . (int) $menu_id;
    } else {
        $slug = 'local-' . $rest;
    }
    if ((string) $menu->slug === $slug) {
        return;
    }
    $syncing = true;
    wp_update_term((int) $menu_id, 'nav_menu', array('slug' => $slug));
    $syncing = false;
}
add_action('wp_create_nav_menu', 'nipponbudokan_sync_local_nav_menu_slug', 20);
add_action('wp_update_nav_menu', 'nipponbudokan_sync_local_nav_menu_slug', 20);

add_filter('acf/load_field/name=page_local_nav', function ($field) {
    $field['choices'] = nipponbudokan_get_local_nav_menu_choices();
    $field['allow_null'] = 1;
    if (!isset($field['placeholder']) || $field['placeholder'] === '') {
        $field['placeholder'] = 'なし';
    }
    return $field;
});

/**
 * global-nav 未設定時の sample（赤ハンバーガー。中身は WP メニューが正）
 */
function nipponbudokan_hamburger_nav_fallback()
{
    echo '<div class="gn_container-01" id="gn_container-01"><ul id="gn_links-01" class="menu gn_links-01">';
    echo '<li class="gnl_item-02 _noChild"><div class="gnl_title-02"><a class="gnl_link-02 module_textLink" href="#"><span>日本武道館について</span></a></div></li>';
    echo '<li class="gnl_item-02 _hasChild"><div class="gnl_title-02"><a class="gnl_link-02 module_textLink" href="#"><span>事業案内</span></a></div></li>';
    echo '<li class="gnl_item-02 _hasChild"><div class="gnl_title-02"><a class="gnl_link-02 module_textLink" href="#"><span>刊行物について</span></a></div></li>';
    echo '<li class="gnl_item-02 _hasChild"><div class="gnl_title-02"><a class="gnl_link-02 module_textLink" href="#"><span>研修センターについて</span></a></div></li>';
    echo '</ul></div>';
}

/**
 * mega-nav 未設定時の sample（Figma Header PC 4項目）
 */
function nipponbudokan_global_nav_fallback()
{
    $items = array(
        '日本武道館について',
        '事業案内',
        '刊行物',
        '研修センター',
    );
    echo '<div class="gn_container-01" id="gn_container-01"><ul id="gn_links-01" class="menu gn_links-01">';
    foreach ($items as $label) {
        echo '<li class="gnl_item-02 _hasChild"><div class="gnl_title-02"><span class="gnl_link-02"><span>' . esc_html($label) . '</span></span></div></li>';
    }
    echo '</ul></div>';
}

/**
 * footer-nav 未設定時の sample（Figma footer_subpage 2列）
 */
function nipponbudokan_footer_nav_fallback()
{
    $items = array(
        '日本武道館について',
        'よくあるご質問',
        '武道振興・普及事業',
        'お問い合わせ',
        '書道普及・奨励事業',
        'パンフレットのご案内',
        '武道刊行物事業',
        '個人情報保護方針',
        '研修センター',
        '業務・財務に関する資料',
    );
    echo '<div class="gf_container-01" id="gf_container-01"><ul id="gf_links-01" class="menu gf_links-01">';
    foreach ($items as $label) {
        echo '<li class="gfl_item-02 _noChild"><div class="gfl_title-02"><a class="gfl_link-02" href="#"><span>' . esc_html($label) . '</span></a></div></li>';
    }
    echo '</ul></div>';
}

/**
 * メニューリンクで新タブを開くべきか判定
 * （target="_blank"指定・空URL・指定拡張子のファイルリンクの場合にtrue）
 *
 * @param WP_Post $item メニューアイテム
 * @return bool
 */
function should_open_menu_link_in_new_tab($item)
{
    $item_target = isset( $item->target ) ? $item->target : '';
    $item_url = isset( $item->url ) ? $item->url : '';
    if ( $item_target === '_blank' || $item_url === '' ) {
        return true;
    }
    $extensions = array('pdf', 'doc', 'docx', 'docm', 'xls', 'xlsx', 'xlsm', 'png', 'jpg', 'jpeg', 'gif', 'webp');
    foreach ($extensions as $ext) {
        if (strpos($item_url, '.' . $ext) !== false) {
            return true;
        }
    }
    return false;
}

/**
 * グローバルナビゲーション用カスタムWalker
 *
 * 出力構造:
 * - 子あり : li._hasChild > div.gnl_title > {a.gnl_link + button.gnl_button} + div.gnl_wrapper > div.gnl_inner > ul.gnl_list
 * - 子なし : li._noChild > div.gnl_title > {a.gnl_link}
 */
class Custom_Global_Walker_Nav_Menu extends Walker_Nav_Menu
{
    /**
     * 子要素の有無を$argsに設定し、親のdisplay_elementに渡す
     * WordPress標準ではhas_childrenが設定されないため、ここで設定
     *
     * @param object $element メニューアイテム
     * @param array  $children_elements 子要素の配列（&は参照渡し。関数内での変更が呼び出し元に反映される）
     * @param int    $max_depth 最大深度
     * @param int    $depth 現在の深度
     * @param array  $args 引数
     * @param string $output 出力文字列（&は参照渡し。$outputへの追記が呼び出し元に反映される）
     * @return object
     * @return void
     */
    public function display_element($element, &$children_elements, $max_depth, $depth, $args, &$output)
    {
        $id_field = $this->db_fields['id'];
        $has_children = !empty($children_elements[$element->$id_field]);

        // 深度に応じた数字（2階層:01, 3階層:02, 4階層:03）。start_el / start_lvl で共通利用
        $depth_number = str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);

        // $argsがオブジェクトまたは配列の場合に対応
        if (isset($args[0]) && is_object($args[0])) {
            $args[0]->has_children = $has_children;
            $args[0]->depth_number = $depth_number;
        } elseif (is_object($args)) {
            $args->has_children = $has_children;
            $args->depth_number = $depth_number;
        }

        // parent:: は親クラス（Walker_Nav_Menu）の display_element を呼び出す。has_children 設定後に親の処理へ委譲
        parent::display_element($element, $children_elements, $max_depth, $depth, $args, $output);
    }

    /**
     * メニュー項目の開始要素を出力
     *
     * @param string   $output 出力バッファ
     * @param WP_Post  $item メニューアイテム
     * @param int      $depth 深度（0=2階層目, 1=3階層目, 2=4階層目）
     * @param stdClass $args wp_nav_menuの引数
     * @param int      $id アイテムID
     */
    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0)
    {
        // 引数
        $args = (object) $args;
        // 子要素の有無
        $has_children = !empty($args->has_children);
        // ターゲット属性
        $item_target = isset( $item->target ) ? $item->target : '';
        $target_attribute = ( $item_target === '_blank' ) ? ' target="_blank" rel="noopener noreferrer"' : '';
        // メニュータイトル
        $title = isset( $item->title ) ? $item->title : '';
        $item_url = isset( $item->url ) ? $item->url : '';
        // タイトル属性
        // $excerpt = $item->post_excerpt; // タイトル属性に入力した値を取得
        // 説明
        // $description = $item->description; // 説明に入力した値を取得
        // URL末尾のパスセグメント（英単語スラッグ）のみを取得
        // $path = parse_url($item->url, PHP_URL_PATH);
        // $slug = $path ? basename(rtrim($path, '/')) : '';
        // 深度に応じた数字（2階層:01, 3階層:02, 4階層:03）。start_el / start_lvl で共通利用
        $depth_number = isset($args->depth_number) ? $args->depth_number : str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);

        // 深度に応じたクラス名（2階層:gn_title-01, 3階層:gn_title-02, 4階層:gn_title-03）
        $li_class = 'gnl_item-' . $depth_number;
        $title_class = 'gnl_title-' . $depth_number;
        $is_mega_nav = isset($args->theme_location) && $args->theme_location === 'mega-nav';
        $is_mega_top = $is_mega_nav && (int) $depth === 0;
        /* Mega L3 (実装指示 2377:4084): full-row octagon + LTR underline, not module_textLink. */
        $is_mega_l3_row = $is_mega_nav && (int) $depth === 1;
        /* Mega L4 group heading (実装指示 2377:4054): gray band is not a link. */
        $is_mega_group_heading = $is_mega_nav && $has_children && (int) $depth === 2;
        $link_class = 'gnl_link-' . $depth_number . (($is_mega_top || $is_mega_l3_row || $is_mega_group_heading) ? '' : ' module_textLink');
        $button_class = 'gnl_button-' . $depth_number;
        $wrapper_class = 'gnl_wrapper-' . $depth_number;
        $inner_class = 'gnl_inner-' . $depth_number;

        if ($has_children) {
            // 子要素あり: li._hasChild + button + a + ラッパー開始（start_lvlで続く）
            $li_classes = trim(implode(' ', $item->classes)) . ' ' . $li_class . ' _hasChild';
            $output .= '<li class="' . esc_attr($li_classes) . '">';
            $output .=   '<div class="' . esc_attr($title_class) . '">';
            if ($is_mega_top || $is_mega_group_heading) {
                $output .=     '<span class="' . esc_attr($link_class) . '">';
                $output .=       '<span>' . esc_html($title) . '</span>';
                $output .=     '</span>';
            } else {
                $output .=     '<a class="' . esc_attr($link_class) . '" href="' . esc_url($item_url) . '"' . $target_attribute . '>';
                $output .=       '<span>' . esc_html($title) . '</span>';
                $output .=     '</a>';
            }
            $output .=     '<button class="' . esc_attr($button_class) . '" type="button"><span>開閉</span></button>';
            $output .=   '</div>';
            $output .=     '<div class="' . esc_attr($wrapper_class) . '">';
            $output .=       '<div class="' . esc_attr($inner_class) . '">';
            if ((int) $depth === 0) {
                $output .=         '<a class="gnl_panelTitle" href="' . esc_url($item_url) . '"' . $target_attribute . '>';
                $output .=           '<span>' . esc_html($title) . '</span>';
                $output .=         '</a>';
            }
        } else {
            $li_classes = trim(implode(' ', $item->classes)) . ' ' . $li_class . ' _noChild';
            $output .=  '<li class="' . esc_attr($li_classes) . '">';
            $output .=   '<div class="' . esc_attr($title_class) . '">';
            $output .=     '<a class="' . esc_attr($link_class) . '" href="' . esc_url($item_url) . '"' . $target_attribute . '>';
            $output .=       '<span>' . esc_html($title) . '</span>';
            // $output .=       '<span>' . esc_html($slug) . '</span>'; // スラッグを表示する場合はコメントアウトを解除
            $output .=     '</a>';
            $output .=   '</div>';
        }
    }

    /**
     * サブメニュー階層の開始
     * start_el（子あり）で既にラッパーを出力済みのため、ulのみ出力
     *
     * @param string   $output 出力バッファ
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    public function start_lvl(&$output, $depth = 0, $args = null)
    {
        $args = (object) $args;
        $depth_number = isset($args->depth_number) ? $args->depth_number : str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);
        $output .= '<ul class="sub-menu gnl_list-' . $depth_number . '">';
    }

    /**
     * サブメニュー階層の終了
     *
     * @param string   $output 出力バッファ
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    // public function end_lvl(&$output, $depth = 0, $args = null)
    // {
    //     $output .= '</ul>';
    // }

    /**
     * メニュー項目の終了要素を出力
     * 子要素ありの場合はラッパーのdivを閉じる
     *
     * @param string   $output 出力バッファ
     * @param WP_Post  $item メニューアイテム
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    public function end_el(&$output, $item, $depth = 0, $args = null)
    {
        $args = (object) $args;
        $has_children = !empty($args->has_children);

        if ($has_children) {
            // 子要素あり: gnl_inner, gnl_wrapper のdivを閉じる
            $output .= '</div></div>';
        }
        $output .= '</li>';
    }
}

class Custom_Header_Sub_Walker_Nav_Menu extends Walker_Nav_Menu
{
    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0)
    {
        $target_attribute = should_open_menu_link_in_new_tab($item) ? ' target="_blank" rel="noopener noreferrer"' : '';
        $output .= '<li class="menu-item">';
        $output .=   '<a class="module_textLink" href="' . esc_url($item->url) . '"' . $target_attribute . '><span>' . esc_html($item->title) . '</span></a>';
    }
}

class Custom_Footer_Walker_Nav_Menu extends Walker_Nav_Menu
{
    /**
     * 子要素の有無を$argsに設定し、親のdisplay_elementに渡す
     * WordPress標準ではhas_childrenが設定されないため、ここで設定
     *
     * @param object $element メニューアイテム
     * @param array  $children_elements 子要素の配列（&は参照渡し。関数内での変更が呼び出し元に反映される）
     * @param int    $max_depth 最大深度
     * @param int    $depth 現在の深度
     * @param array  $args 引数
     * @param string $output 出力文字列（&は参照渡し。$outputへの追記が呼び出し元に反映される）
     * @return object
     * @return void
     */
    public function display_element($element, &$children_elements, $max_depth, $depth, $args, &$output)
    {
        $id_field = $this->db_fields['id'];
        $has_children = !empty($children_elements[$element->$id_field]);

        // 深度に応じた数字（2階層:01, 3階層:02, 4階層:03）。start_el / start_lvl で共通利用
        $depth_number = str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);

        // $argsがオブジェクトまたは配列の場合に対応
        if (isset($args[0]) && is_object($args[0])) {
            $args[0]->has_children = $has_children;
            $args[0]->depth_number = $depth_number;
        } elseif (is_object($args)) {
            $args->has_children = $has_children;
            $args->depth_number = $depth_number;
        }

        // parent:: は親クラス（Walker_Nav_Menu）の display_element を呼び出す。has_children 設定後に親の処理へ委譲
        parent::display_element($element, $children_elements, $max_depth, $depth, $args, $output);
    }

    /**
     * メニュー項目の開始要素を出力
     *
     * @param string   $output 出力バッファ
     * @param WP_Post  $item メニューアイテム
     * @param int      $depth 深度（0=2階層目, 1=3階層目, 2=4階層目）
     * @param stdClass $args wp_nav_menuの引数
     * @param int      $id アイテムID
     */
    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0)
    {
        // 引数
        $args = (object) $args;
        // 子要素の有無
        $has_children = !empty($args->has_children);
        // ターゲット属性
        $item_target = isset( $item->target ) ? $item->target : '';
        $target_attribute = ( $item_target === '_blank' ) ? ' target="_blank" rel="noopener noreferrer"' : '';
        // メニュータイトル
        $title = isset( $item->title ) ? $item->title : '';
        $item_url = isset( $item->url ) ? $item->url : '';
        // URL末尾のパスセグメント（英単語スラッグ）のみを取得
        $path = parse_url($item_url, PHP_URL_PATH);
        $slug = $path ? basename(rtrim($path, '/')) : '';
        // 深度に応じた数字（2階層:01, 3階層:02, 4階層:03）。start_el / start_lvl で共通利用
        $depth_number = isset($args->depth_number) ? $args->depth_number : str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);

        // 深度に応じたクラス名（2階層:gn_title-01, 3階層:gn_title-02, 4階層:gn_title-03）
        $li_class = 'gfl_item-' . $depth_number;
        $title_class = 'gfl_title-' . $depth_number;
        $link_class = 'gfl_link-' . $depth_number . ' module_textLink';
        $button_class = 'gfl_button-' . $depth_number;
        $wrapper_class = 'gfl_wrapper-' . $depth_number;
        $inner_class = 'gfl_inner-' . $depth_number;

        if ($has_children) {
            // 子要素あり: li._hasChild + button + a + ラッパー開始（start_lvlで続く）
            $li_classes = trim(implode(' ', $item->classes)) . ' ' . $li_class . ' _hasChild';
            $output .= '<li class="' . esc_attr($li_classes) . '">';
            $output .=   '<div class="' . esc_attr($title_class) . '">';
            $output .=     '<a class="' . esc_attr($link_class) . '" href="' . esc_url($item_url) . '"' . $target_attribute . '>';
            $output .=       '<span>' . esc_html($title) . '</span>';
            // $output .=       '<span>' . esc_html($slug) . '</span>'; // スラッグを表示する場合はコメントアウトを解除
            $output .=     '</a>';
            $output .=     '<button class="' . esc_attr($button_class) . '" type="button"><span>開閉</span></button>';
            $output .=   '</div>';
            $output .=     '<div class="' . esc_attr($wrapper_class) . '">';
            $output .=       '<div class="' . esc_attr($inner_class) . '">';
        } else {
            $li_classes = trim(implode(' ', $item->classes)) . ' ' . $li_class . ' _noChild';
            $output .=  '<li class="' . esc_attr($li_classes) . '">';
            $output .=   '<div class="' . esc_attr($title_class) . '">';
            $output .=     '<a class="' . esc_attr($link_class) . '" href="' . esc_url($item_url) . '"' . $target_attribute . '>';
            $output .=       '<span>' . esc_html($title) . '</span>';
            // $output .=       '<span>' . esc_html($slug) . '</span>'; // スラッグを表示する場合はコメントアウトを解除
            $output .=     '</a>';
            $output .=   '</div>';
        }
    }

    /**
     * サブメニュー階層の開始
     * start_el（子あり）で既にラッパーを出力済みのため、ulのみ出力
     *
     * @param string   $output 出力バッファ
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    public function start_lvl(&$output, $depth = 0, $args = null)
    {
        $args = (object) $args;
        $depth_number = isset($args->depth_number) ? $args->depth_number : str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);
        $output .= '<ul class="sub-menu gfl_list-' . $depth_number . '">';
    }

    /**
     * サブメニュー階層の終了
     *
     * @param string   $output 出力バッファ
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    // public function end_lvl(&$output, $depth = 0, $args = null)
    // {
    //     $output .= '</ul>';
    // }

    /**
     * メニュー項目の終了要素を出力
     * 子要素ありの場合はラッパーのdivを閉じる
     *
     * @param string   $output 出力バッファ
     * @param WP_Post  $item メニューアイテム
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    public function end_el(&$output, $item, $depth = 0, $args = null)
    {
        $args = (object) $args;
        $has_children = !empty($args->has_children);

        if ($has_children) {
            // 子要素あり: gfl_inner, gfl_wrapper のdivを閉じる
            $output .= '</div></div>';
        }
        $output .= '</li>';
    }
}

class Custom_Footer_Sub_Walker_Nav_Menu extends Walker_Nav_Menu
{
    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0)
    {
        $target_attribute = should_open_menu_link_in_new_tab($item) ? ' target="_blank" rel="noopener noreferrer"' : '';
        $output .= '<li class="menu-item">';
        $output .=   '<a class="module_textLink" href="' . esc_url($item->url) . '"' . $target_attribute . '><span>' . esc_html($item->title) . '</span></a>';
    }
}

/**
 * サイドバーナビゲーション用カスタムWalker
 * ACF 指定メニューは全件出力（local_nav_show_all）。
 * それ以外は現在ページの枝だけ出す。
 * sidebar.php の ln_links / lnl_title 構造に合わせたHTMLを出力
 */
class Custom_Sidebar_Walker_Nav_Menu extends Walker_Nav_Menu
{
    /**
     * 子要素の有無を$argsに設定し、親のdisplay_elementに渡す
     * WordPress標準ではhas_childrenが設定されないため、ここで設定
     *
     * @param object $element メニューアイテム
     * @param array  $children_elements 子要素の配列（&は参照渡し。関数内での変更が呼び出し元に反映される）
     * @param int    $max_depth 最大深度
     * @param int    $depth 現在の深度
     * @param array  $args 引数
     * @param string $output 出力文字列（&は参照渡し。$outputへの追記が呼び出し元に反映される）
     * @return object
     * @return void
     */
    public function display_element($element, &$children_elements, $max_depth, $depth, $args, &$output)
    {
        $show_all = false;
        if (isset($args[0]) && is_object($args[0]) && !empty($args[0]->local_nav_show_all)) {
            $show_all = true;
        } elseif (is_object($args) && !empty($args->local_nav_show_all)) {
            $show_all = true;
        }

        // ACF 指定メニューは全件。それ以外は現在ページの枝だけ。
        if (!$show_all) {
            $elementClasses = isset($element->classes) ? (array) $element->classes : array();
            $isCurrentPage = in_array('current_page_item', $elementClasses, true) || in_array('current-menu-item', $elementClasses, true);
            $isAncestor = in_array('current_page_parent', $elementClasses, true) || in_array('current-menu-ancestor', $elementClasses, true);

            $currentPageId = get_the_ID();
            if ($currentPageId) {
                if ($depth === 0 && !$isCurrentPage && !$isAncestor) {
                    return;
                }
            }
        }

        $id_field = $this->db_fields['id'];
        $has_children = !empty($children_elements[$element->$id_field]);

        // 深度に応じた数字（2階層:01, 3階層:02, 4階層:03）。start_el / start_lvl で共通利用
        $depth_number = str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);

        // $argsがオブジェクトまたは配列の場合に対応
        if (isset($args[0]) && is_object($args[0])) {
            $args[0]->has_children = $has_children;
            $args[0]->depth_number = $depth_number;
        } elseif (is_object($args)) {
            $args->has_children = $has_children;
            $args->depth_number = $depth_number;
        }

        // parent:: は親クラス（Walker_Nav_Menu）の display_element を呼び出す。has_children 設定後に親の処理へ委譲
        parent::display_element($element, $children_elements, $max_depth, $depth, $args, $output);
    }

    /**
     * メニュー項目の開始要素を出力（sidebarのln_*構造に準拠）
     *
     * @param string   $output 出力バッファ
     * @param WP_Post  $item メニューアイテム
     * @param int      $depth 深度（0=1階層目, 1=2階層目, 2=3階層目）
     * @param stdClass $args wp_nav_menuの引数
     * @param int      $id アイテムID
     */
    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0)
    {
        // 引数
        $args = (object) $args;
        // 子要素の有無
        $has_children = !empty($args->has_children);
        // ターゲット属性
        $item_target = isset( $item->target ) ? $item->target : '';
        $target_attribute = ( $item_target === '_blank' ) ? ' target="_blank" rel="noopener noreferrer"' : '';
        // メニュータイトル
        $title = isset( $item->title ) ? $item->title : '';
        $item_url = isset( $item->url ) ? $item->url : '';
        // URL末尾のパスセグメント（英単語スラッグ）のみを取得
        $path = parse_url($item_url, PHP_URL_PATH);
        $slug = $path ? basename(rtrim($path, '/')) : '';
        // 深度に応じた数字（2階層:01, 3階層:02, 4階層:03）。start_el / start_lvl で共通利用
        $depth_number = isset($args->depth_number) ? $args->depth_number : str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);

        $li_class = 'lnl_item-' . $depth_number . ' mm_item-' . $depth_number;
        $title_class = 'lnl_title-' . $depth_number . ' mm_title-' . $depth_number;
        $link_class = 'lnl_link-' . $depth_number . ' mm_link-' . $depth_number . ' module_textLink';
        $button_class = 'lnl_button-' . $depth_number . ' mm_button-' . $depth_number;
        $wrapper_class = 'lnl_wrapper-' . $depth_number . ' mm_wrapper-' . $depth_number;
        $inner_class = 'lnl_inner-' . $depth_number . ' mm_inner-' . $depth_number;

        if ($has_children) {
            $li_classes = trim(implode(' ', $item->classes)) . ' ' . $li_class . ' _hasChild';
            $output .= '<li class="' . esc_attr($li_classes) . '">';
            $output .=   '<div class="' . esc_attr($title_class) . '">';
            $output .=     '<a class="' . esc_attr($link_class) . '" href="' . esc_url($item_url) . '"' . $target_attribute . '>';
            $output .=       '<span>' . esc_html($title) . '</span>';
            // $output .=       '<span>' . esc_html($slug) . '</span>'; // スラッグを表示する場合はコメントアウトを解除
            $output .=     '</a>';
            $output .=     '<button class="' . esc_attr($button_class) . '" type="button"><span>開閉</span></button>';
            $output .=   '</div>';
            $output .=     '<div class="' . esc_attr($wrapper_class) . '">';
            $output .=       '<div class="' . esc_attr($inner_class) . '">';
        } else {
            $li_classes = trim(implode(' ', $item->classes)) . ' ' . $li_class . ' _noChild';
            $output .= '<li class="' . esc_attr($li_classes) . '">';
            $output .=   '<div class="' . esc_attr($title_class) . '">';
            $output .=     '<a class="' . esc_attr($link_class) . '" href="' . esc_url($item_url) . '"' . $target_attribute . '>';
            $output .=       '<span>' . esc_html($title) . '</span>';
            // $output .=       '<span>' . esc_html($slug) . '</span>'; // スラッグを表示する場合はコメントアウトを解除
            $output .=     '</a>';
            $output .=   '</div>';
        }
    }

    /**
     * サブメニュー階層の開始
     *
     * @param string   $output 出力バッファ
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    public function start_lvl(&$output, $depth = 0, $args = null)
    {
        $args = (object) $args;
        $depth_number = isset($args->depth_number) ? $args->depth_number : str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);
        $output .= '<ul class="sub-menu lnl_list-' . $depth_number . ' mm_list-' . $depth_number . '">';
    }

    /**
     * サブメニュー階層の終了
     * 
     * @param string   $output 出力バッファ
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    // public function end_lvl(&$output, $depth = 0, $args = null)
    // {
    //     $output .= '</ul>';
    // }

    /**
     * メニュー項目の終了要素を出力
     * 子要素ありの場合はラッパーのdivを閉じる
     *
     * @param string   $output 出力バッファ
     * @param WP_Post  $item メニューアイテム
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    public function end_el(&$output, $item, $depth = 0, $args = null)
    {
        $args = (object) $args;
        $has_children = !empty($args->has_children);

        if ($has_children) {
            $output .= '</div></div>';
        }
        $output .= '</li>';
    }
}

/**
 * ドロップダウンナビゲーション用カスタムWalker
 * 現在のページの配下（子孫ページ）にあるメニューのみを出力
 * template-parts/_dropdown-navigation.php の dd_links / dd_title 構造に合わせたHTMLを出力
 */
class Custom_Dropdown_Walker_Nav_Menu extends Walker_Nav_Menu
{
    /**
     * 子要素の有無を$argsに設定し、親のdisplay_elementに渡す
     * WordPress標準ではhas_childrenが設定されないため、ここで設定
     *
     * @param object $element メニューアイテム
     * @param array  $children_elements 子要素の配列（&は参照渡し。関数内での変更が呼び出し元に反映される）
     * @param int    $max_depth 最大深度
     * @param int    $depth 現在の深度
     * @param array  $args 引数
     * @param string $output 出力文字列（&は参照渡し。$outputへの追記が呼び出し元に反映される）
     * @return object
     * @return void
     */
    public function display_element($element, &$children_elements, $max_depth, $depth, $args, &$output)
    {
        // current_page_item（現在のページ）または current_page_parent（先祖）の項目を出力。
        // 子要素は親出力時に再帰で全て出力され、孫が現在ページの場合は最上位の親まで遡って出力。
        // 互換のため current-menu-item / current-menu-ancestor も判定
        $elementClasses = isset($element->classes) ? (array) $element->classes : array();
        $isCurrentPage = in_array('current_page_item', $elementClasses, true) || in_array('current-menu-item', $elementClasses, true);
        $isAncestor = in_array('current_page_parent', $elementClasses, true) || in_array('current-menu-ancestor', $elementClasses, true);

        $currentPageId = get_the_ID();
        if ($currentPageId) {
            // 最上位(depth 0)では current_page_item / current_page_parent のときのみ出力
            // 子要素(depth > 0)は親が出力された時点でパス上にあるので全件出力
            if ($depth === 0 && !$isCurrentPage && !$isAncestor) {
                return;
            }
        }

        $id_field = $this->db_fields['id'];
        $has_children = !empty($children_elements[$element->$id_field]);

        // 深度に応じた数字（2階層:01, 3階層:02, 4階層:03）。start_el / start_lvl で共通利用
        $depth_number = str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);

        // $argsがオブジェクトまたは配列の場合に対応
        if (isset($args[0]) && is_object($args[0])) {
            $args[0]->has_children = $has_children;
            $args[0]->depth_number = $depth_number;
        } elseif (is_object($args)) {
            $args->has_children = $has_children;
            $args->depth_number = $depth_number;
        }

        // parent:: は親クラス（Walker_Nav_Menu）の display_element を呼び出す。has_children 設定後に親の処理へ委譲
        parent::display_element($element, $children_elements, $max_depth, $depth, $args, $output);
    }

    /**
     * メニュー項目の開始要素を出力（sidebarのln_*構造に準拠）
     *
     * @param string   $output 出力バッファ
     * @param WP_Post  $item メニューアイテム
     * @param int      $depth 深度（0=1階層目, 1=2階層目, 2=3階層目）
     * @param stdClass $args wp_nav_menuの引数
     * @param int      $id アイテムID
     */
    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0)
    {
        // 引数
        $args = (object) $args;
        // 子要素の有無
        $has_children = !empty($args->has_children);
        // ターゲット属性
        $item_target = isset( $item->target ) ? $item->target : '';
        $target_attribute = ( $item_target === '_blank' ) ? ' target="_blank" rel="noopener noreferrer"' : '';
        // メニュータイトル
        $title = isset( $item->title ) ? $item->title : '';
        $item_url = isset( $item->url ) ? $item->url : '';
        // URL末尾のパスセグメント（英単語スラッグ）のみを取得
        $path = parse_url($item_url, PHP_URL_PATH);
        $slug = $path ? basename(rtrim($path, '/')) : '';
        // 深度に応じた数字（2階層:01, 3階層:02, 4階層:03）。start_el / start_lvl で共通利用
        $depth_number = isset($args->depth_number) ? $args->depth_number : str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);

        $li_class = 'mdd_item-' . $depth_number;
        $title_class = 'mdd_title-' . $depth_number;
        $link_class = 'mdd_link-' . $depth_number . ' module_textLink';
        $button_class = 'mdd_button-' . $depth_number;
        $wrapper_class = 'mdd_wrapper-' . $depth_number;
        $inner_class = 'mdd_inner-' . $depth_number;

        if ($has_children) {
            $li_classes = trim(implode(' ', $item->classes)) . ' ' . $li_class . ' _hasChild';
            $output .= '<li class="' . esc_attr($li_classes) . '">';
            $output .=   '<div class="' . esc_attr($title_class) . '">';
            $output .=     '<a class="' . esc_attr($link_class) . '" href="' . esc_url($item_url) . '"' . $target_attribute . '>';
            $output .=       '<span>' . esc_html($title) . '</span>';
            // $output .=       '<span>' . esc_html($slug) . '</span>'; // スラッグを表示する場合はコメントアウトを解除
            $output .=     '</a>';
            $output .=     '<button class="' . esc_attr($button_class) . '" type="button"><span>開閉</span></button>';
            $output .=   '</div>';
            $output .=     '<div class="' . esc_attr($wrapper_class) . '">';
            $output .=       '<div class="' . esc_attr($inner_class) . '">';
        } else {
            $li_classes = trim(implode(' ', $item->classes)) . ' ' . $li_class . ' _noChild';
            $output .= '<li class="' . esc_attr($li_classes) . '">';
            $output .=   '<div class="' . esc_attr($title_class) . '">';
            $output .=     '<a class="' . esc_attr($link_class) . '" href="' . esc_url($item_url) . '"' . $target_attribute . '>';
            $output .=       '<span>' . esc_html($title) . '</span>';
            // $output .=       '<span>' . esc_html($slug) . '</span>'; // スラッグを表示する場合はコメントアウトを解除
            $output .=     '</a>';
            $output .=   '</div>';
        }
    }

    /**
     * サブメニュー階層の開始
     *
     * @param string   $output 出力バッファ
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    public function start_lvl(&$output, $depth = 0, $args = null)
    {
        $args = (object) $args;
        $depth_number = isset($args->depth_number) ? $args->depth_number : str_pad((string) $depth + 2, 2, '0', STR_PAD_LEFT);
        $output .= '<ul class="sub-menu mdd_list-' . $depth_number . '">';
    }

    /**
     * サブメニュー階層の終了
     * 
     * @param string   $output 出力バッファ
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    // public function end_lvl(&$output, $depth = 0, $args = null)
    // {
    //     $output .= '</ul>';
    // }

    /**
     * メニュー項目の終了要素を出力
     * 子要素ありの場合はラッパーのdivを閉じる
     *
     * @param string   $output 出力バッファ
     * @param WP_Post  $item メニューアイテム
     * @param int      $depth 深度
     * @param stdClass $args 引数
     */
    public function end_el(&$output, $item, $depth = 0, $args = null)
    {
        $args = (object) $args;
        $has_children = !empty($args->has_children);

        if ($has_children) {
            $output .= '</div></div>';
        }
        $output .= '</li>';
    }
}