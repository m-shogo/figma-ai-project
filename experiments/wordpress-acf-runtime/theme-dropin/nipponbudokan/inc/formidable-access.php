<?php

/**
 * --------------------------------------------------------------------------------
 *
 * Formidable Forms 部署ロール別 Form ID 制限
 *
 * WordPress のロール一覧を設定画面に出し、
 * フォーム割当のあるロールだけ Form ID 単位で管理画面を制限する。
 *
 * --------------------------------------------------------------------------------
 */

if (!defined('ABSPATH')) {
    exit;
}

/** 設定の option 名 */
define('BUDOKAN_FRM_ACCESS_OPTION', 'budokan_frm_department_access');

/**
 * WordPress ロールから、設定画面用の権限一覧を取得する
 *
 * 権限プラグインは WP のロールを編集するため、wp_roles() が正本になる。
 * 管理者は制限対象外なので一覧から外す。
 *
 * @return array<int,array{capability:string,label:string}>
 */
function budokan_get_wp_roles()
{
    $wp_roles = wp_roles();
    $roles = array();

    if (!$wp_roles || empty($wp_roles->roles) || !is_array($wp_roles->roles)) {
        return $roles;
    }

    foreach ($wp_roles->roles as $role_slug => $role_data) {
        if ($role_slug === 'administrator') {
            continue;
        }

        $roles[] = array(
            'capability' => sanitize_key($role_slug),
            'label'      => isset($role_data['name']) ? translate_user_role($role_data['name']) : $role_slug,
        );
    }

    usort(
        $roles,
        function ($left, $right) {
            return strnatcasecmp($left['label'], $right['label']);
        }
    );

    return $roles;
}

/**
 * 旧 Capability（budokan_soumu 等）を既存ロール名へ変換する
 *
 * @param array $departments 部署一覧
 * @param array $form_map    部署と Form ID の対応
 * @return array{departments:array,form_map:array,has_change:bool}
 */
function budokan_rename_legacy_frm_department_caps($departments, $form_map)
{
    $legacy_map = array(
        'budokan_soumu'  => 'soumu',
        'budokan_shinko' => 'shinko',
        'budokan_hukyu'  => 'hukyu',
    );
    $has_change = false;
    $renamed_departments = array();

    foreach ($departments as $department) {
        $capability = isset($department['capability']) ? (string) $department['capability'] : '';
        if (isset($legacy_map[$capability])) {
            $department['capability'] = $legacy_map[$capability];
            $has_change = true;
        }
        $renamed_departments[] = $department;
    }

    $renamed_form_map = array();
    foreach ($form_map as $capability => $form_ids) {
        $new_capability = isset($legacy_map[$capability]) ? $legacy_map[$capability] : $capability;
        if ($new_capability !== $capability) {
            $has_change = true;
        }

        $existing_ids = isset($renamed_form_map[$new_capability]) && is_array($renamed_form_map[$new_capability])
            ? $renamed_form_map[$new_capability]
            : array();
        $renamed_form_map[$new_capability] = array_values(array_unique(array_merge(
            $existing_ids,
            is_array($form_ids) ? array_map('intval', $form_ids) : array()
        )));
    }

    return array(
        'departments' => $renamed_departments,
        'form_map'    => $renamed_form_map,
        'has_change'  => $has_change,
    );
}

/**
 * 保存済み設定を取得する
 *
 * @return array{departments:array,form_map:array}
 */
function budokan_get_frm_access_settings()
{
    $saved_settings = get_option(BUDOKAN_FRM_ACCESS_OPTION, array());
    if (!is_array($saved_settings)) {
        $saved_settings = array();
    }

    $departments = budokan_get_wp_roles();

    $form_map = isset($saved_settings['form_map']) && is_array($saved_settings['form_map'])
        ? $saved_settings['form_map']
        : array();

    // 旧 Capability 名を既存ロール（soumu / shinko / hukyu）へ寄せる
    $renamed_settings = budokan_rename_legacy_frm_department_caps($departments, $form_map);
    $departments = $renamed_settings['departments'];
    $form_map = $renamed_settings['form_map'];

    if (!empty($renamed_settings['has_change'])) {
        update_option(
            BUDOKAN_FRM_ACCESS_OPTION,
            array(
                'form_map' => $form_map,
            ),
            false
        );
    }

    return array(
        'departments' => $departments,
        'form_map'    => $form_map,
    );
}

/**
 * 管理者は制限対象外とする
 *
 * @return bool
 */
function budokan_is_unrestricted_frm_user()
{
    return is_super_admin()
        || current_user_can('administrator')
        || current_user_can('manage_options');
}

/**
 * 現在ユーザーが部署制限の対象かどうか
 *
 * ロールを持っていても、フォーム未割当なら制限しない。
 * 購読者・編集者など、チェックしていないロールは Formidable 標準権限のままにする。
 *
 * @return bool
 */
function budokan_should_restrict_frm_access()
{
    if (budokan_is_unrestricted_frm_user()) {
        return false;
    }

    $settings = budokan_get_frm_access_settings();
    foreach (budokan_get_current_user_department_caps() as $role_slug) {
        if (!empty($settings['form_map'][$role_slug]) && is_array($settings['form_map'][$role_slug])) {
            return true;
        }
    }

    return false;
}

/**
 * 現在ユーザーが持つロール（スラッグ）一覧
 *
 * ユーザーに割り当てられたロールと、同名 Capability の両方で判定する。
 * 権限プラグインはロールスラッグを Capability としても持たせることが多い。
 *
 * @return string[]
 */
function budokan_get_current_user_department_caps()
{
    $settings = budokan_get_frm_access_settings();
    $current_user = wp_get_current_user();
    $user_roles = (isset($current_user->roles) && is_array($current_user->roles))
        ? $current_user->roles
        : array();
    $matched_role_slugs = array();

    foreach ($settings['departments'] as $department) {
        $role_slug = isset($department['capability']) ? (string) $department['capability'] : '';
        if ($role_slug === '') {
            continue;
        }

        if (in_array($role_slug, $user_roles, true) || current_user_can($role_slug)) {
            $matched_role_slugs[] = $role_slug;
        }
    }

    return array_values(array_unique($matched_role_slugs));
}

/**
 * 現在ユーザーがアクセスできる Form ID 一覧
 *
 * @return int[]
 */
function budokan_get_allowed_form_ids_for_current_user()
{
    if (budokan_is_unrestricted_frm_user()) {
        return budokan_get_all_published_form_ids();
    }

    $settings = budokan_get_frm_access_settings();
    $allowed_form_ids = array();

    foreach (budokan_get_current_user_department_caps() as $capability) {
        if (empty($settings['form_map'][$capability]) || !is_array($settings['form_map'][$capability])) {
            continue;
        }

        foreach ($settings['form_map'][$capability] as $form_id) {
            $allowed_form_ids[] = (int) $form_id;
        }
    }

    return array_values(array_unique(array_filter($allowed_form_ids)));
}

/**
 * 公開フォームの ID をすべて取得する
 *
 * @return int[]
 */
function budokan_get_all_published_form_ids()
{
    if (!class_exists('FrmForm')) {
        return array();
    }

    $forms = FrmForm::getAll(
        array(
            'is_template' => 0,
            'status !'    => 'trash',
        ),
        'id'
    );

    if (!is_array($forms)) {
        return array();
    }

    return array_map('intval', wp_list_pluck($forms, 'id'));
}

/**
 * 子フォームの場合は親 Form ID に正規化する
 *
 * @param int $form_id 対象 Form ID
 * @return int
 */
function budokan_normalize_frm_form_id($form_id)
{
    $form_id = (int) $form_id;
    if ($form_id <= 0 || !class_exists('FrmForm')) {
        return $form_id;
    }

    $form = FrmForm::getOne($form_id);
    if ($form && !empty($form->parent_form_id)) {
        return (int) $form->parent_form_id;
    }

    return $form_id;
}

/**
 * 指定 Form ID にアクセスできるか
 *
 * @param int $form_id 対象 Form ID
 * @return bool
 */
function budokan_user_can_access_form($form_id)
{
    $form_id = budokan_normalize_frm_form_id($form_id);
    if ($form_id <= 0) {
        return false;
    }

    if (!budokan_should_restrict_frm_access()) {
        return true;
    }

    return in_array($form_id, budokan_get_allowed_form_ids_for_current_user(), true);
}

/**
 * 新規作成・複製したフォームを、操作したユーザーの部署へ割り当てる
 *
 * @param int $form_id 新規 Form ID
 * @return void
 */
function budokan_assign_form_to_current_user_departments($form_id)
{
    $form_id = budokan_normalize_frm_form_id($form_id);
    if ($form_id <= 0 || budokan_is_unrestricted_frm_user()) {
        return;
    }

    $department_caps = budokan_get_current_user_department_caps();
    if (empty($department_caps)) {
        return;
    }

    $settings = budokan_get_frm_access_settings();
    $has_change = false;

    foreach ($department_caps as $capability) {
        // 未割当ロールへ書き込むと、そのロール全員が制限対象になるためスキップする
        if (empty($settings['form_map'][$capability]) || !is_array($settings['form_map'][$capability])) {
            continue;
        }

        $settings['form_map'][$capability][] = $form_id;
        $settings['form_map'][$capability] = array_values(array_unique(array_map('intval', $settings['form_map'][$capability])));
        $has_change = true;
    }

    if ($has_change) {
        update_option(
            BUDOKAN_FRM_ACCESS_OPTION,
            array(
                'form_map' => $settings['form_map'],
            ),
            false
        );
    }
}

/**
 * 削除されたフォームを対応表から外す
 *
 * @param int $form_id 削除 Form ID
 * @return void
 */
function budokan_remove_form_from_access_map($form_id)
{
    $form_id = (int) $form_id;
    if ($form_id <= 0) {
        return;
    }

    $settings = budokan_get_frm_access_settings();
    $has_change = false;

    foreach ($settings['form_map'] as $capability => $form_ids) {
        if (!is_array($form_ids)) {
            continue;
        }

        $filtered_ids = array_values(array_filter(
            array_map('intval', $form_ids),
            function ($mapped_form_id) use ($form_id) {
                return $mapped_form_id !== $form_id;
            }
        ));

        if ($filtered_ids !== array_map('intval', $form_ids)) {
            $settings['form_map'][$capability] = $filtered_ids;
            $has_change = true;
        }
    }

    if ($has_change) {
        update_option(
            BUDOKAN_FRM_ACCESS_OPTION,
            array(
                'form_map' => $settings['form_map'],
            ),
            false
        );
    }
}

/**
 * 権限エラーを表示して処理を止める
 *
 * @return void
 */
function budokan_deny_frm_access()
{
    $message = 'このフォームへのアクセス権限がありません。';

    if (wp_doing_ajax()) {
        wp_send_json_error(array('message' => $message), 403);
    }

    wp_die(
        esc_html($message),
        esc_html('権限がありません'),
        array('response' => 403)
    );
}

/**
 * リクエストから Form ID を解決する
 *
 * @return int 解決できない場合は 0
 */
function budokan_resolve_form_id_from_request()
{
    $page = isset($_REQUEST['page']) ? sanitize_key(wp_unslash($_REQUEST['page'])) : '';
    $frm_action = isset($_REQUEST['frm_action']) ? sanitize_title(wp_unslash($_REQUEST['frm_action'])) : '';
    $ajax_action = isset($_REQUEST['action']) ? sanitize_key(wp_unslash($_REQUEST['action'])) : '';

    $form_id = 0;

    if (!empty($_REQUEST['form_id'])) {
        $form_id = absint(wp_unslash($_REQUEST['form_id']));
    } elseif (!empty($_REQUEST['form'])) {
        $form_param = wp_unslash($_REQUEST['form']);
        if (is_numeric($form_param)) {
            $form_id = absint($form_param);
        } elseif (class_exists('FrmForm')) {
            $form = FrmForm::getOne($form_param);
            $form_id = $form ? (int) $form->id : 0;
        }
    }

    // フォーム編集・設定・レポートは id が Form ID
    $form_id_actions = array(
        'edit',
        'update',
        'settings',
        'update_settings',
        'trash',
        'untrash',
        'destroy',
        'duplicate',
        'reports',
        'lite-reports',
    );

    if (!$form_id && $page === 'formidable' && in_array($frm_action, $form_id_actions, true) && !empty($_REQUEST['id'])) {
        $form_id = absint(wp_unslash($_REQUEST['id']));
    }

    // フォーム一覧のゴミ箱・複製 AJAX も id が Form ID
    $form_id_ajax_actions = array(
        'frm_forms_trash',
        'frm_rename_form',
        'frm_save_form',
        'frm_get_default_html',
    );
    if (!$form_id && in_array($ajax_action, $form_id_ajax_actions, true) && !empty($_REQUEST['id'])) {
        $form_id = absint(wp_unslash($_REQUEST['id']));
    }

    // エントリー詳細・編集・削除は id がエントリー ID
    $entry_pages = array('formidable-entries');
    $entry_actions = array('show', 'edit', 'destroy', 'destroy_all', 'duplicate');
    if (!$form_id && (in_array($page, $entry_pages, true) || strpos($ajax_action, 'frm_') === 0) && !empty($_REQUEST['id'])) {
        $maybe_entry_id = absint(wp_unslash($_REQUEST['id']));
        if ($maybe_entry_id && class_exists('FrmEntry') && ($page === 'formidable-entries' || in_array($frm_action, $entry_actions, true))) {
            $entry = FrmEntry::getOne($maybe_entry_id);
            if ($entry && !empty($entry->form_id)) {
                $form_id = (int) $entry->form_id;
            }
        }
    }

    if (!$form_id && !empty($_REQUEST['item_id']) && class_exists('FrmEntry')) {
        $entry = FrmEntry::getOne(absint(wp_unslash($_REQUEST['item_id'])));
        if ($entry && !empty($entry->form_id)) {
            $form_id = (int) $entry->form_id;
        }
    }

    // フィールド操作は field_id から Form ID を辿る
    if (!$form_id && !empty($_REQUEST['field_id']) && class_exists('FrmField')) {
        $field = FrmField::getOne(absint(wp_unslash($_REQUEST['field_id'])));
        if ($field && !empty($field->form_id)) {
            $form_id = (int) $field->form_id;
        }
    }

    // Views は投稿メタの Form ID を使う
    if (!$form_id && !empty($_REQUEST['post'])) {
        $post_id = absint(wp_unslash($_REQUEST['post']));
        if ($post_id && get_post_type($post_id) === 'frm_display') {
            $form_id = (int) get_post_meta($post_id, 'frm_form_id', true);
        }
    }

    return budokan_normalize_frm_form_id($form_id);
}

/**
 * フォーム操作を伴わない画面かどうか
 *
 * @return bool
 */
function budokan_is_frm_list_or_create_screen()
{
    $page = isset($_REQUEST['page']) ? sanitize_key(wp_unslash($_REQUEST['page'])) : '';
    $frm_action = isset($_REQUEST['frm_action']) ? sanitize_title(wp_unslash($_REQUEST['frm_action'])) : '';
    $ajax_action = isset($_REQUEST['action']) ? sanitize_key(wp_unslash($_REQUEST['action'])) : '';

    $allowed_frm_actions = array('', 'list', 'new');
    $allowed_ajax_actions = array(
        'frm_install_form',
        'frm_build_new_form',
        'frm_install_template',
        'frm_create_template',
    );

    if (in_array($ajax_action, $allowed_ajax_actions, true)) {
        return true;
    }

    if ($page === 'formidable' && in_array($frm_action, $allowed_frm_actions, true) && empty($_REQUEST['id']) && empty($_REQUEST['form'])) {
        return true;
    }

    // スタイルプレビュー更新 AJAX は Form ID を持たない
    $allowed_style_ajax_actions = array(
        'frm_change_styling',
        'frm_settings_reset',
    );
    if (in_array($ajax_action, $allowed_style_ajax_actions, true)) {
        return true;
    }

    return false;
}

/**
 * Formidable のスタイル編集画面かどうか
 *
 * formidable-styles はフォームメニュー、formidable-styles2 は外観メニュー。
 *
 * @return bool
 */
function budokan_is_frm_style_editor_page()
{
    $page = isset($_REQUEST['page']) ? sanitize_key(wp_unslash($_REQUEST['page'])) : '';

    return in_array($page, array('formidable-styles', 'formidable-styles2'), true);
}

/**
 * スタイル画面のプレビューに使う Form ID を決める
 *
 * @return int
 */
function budokan_get_default_style_preview_form_id()
{
    if (budokan_should_restrict_frm_access()) {
        $allowed_form_ids = budokan_get_allowed_form_ids_for_current_user();
        foreach ($allowed_form_ids as $allowed_form_id) {
            if (!class_exists('FrmForm')) {
                return (int) $allowed_form_id;
            }

            $form = FrmForm::getOne((int) $allowed_form_id);
            if ($form && empty($form->parent_form_id)) {
                return (int) $form->id;
            }
        }

        return 0;
    }

    if (!class_exists('FrmForm')) {
        return 0;
    }

    $form = FrmForm::get_published_forms(array(), 1);
    if (is_object($form) && !empty($form->id)) {
        return (int) $form->id;
    }

    return 0;
}

/**
 * スタイル画面で Form 未選択のとき、プレビュー対象を付けて正規 URL へ送る
 *
 * Formidable は form パラメータが無いと警告だけ出して操作できない。
 * 外観 > フォーム（formidable-styles2）も同じ画面なので、フォームメニュー側へ寄せる。
 *
 * @return void
 */
function budokan_redirect_frm_styles_to_form()
{
    if (!is_admin() || wp_doing_ajax() || !empty($_POST)) {
        return;
    }

    if (!budokan_is_frm_style_editor_page()) {
        return;
    }

    if (!empty($_GET['form']) || !empty($_GET['style_id'])) {
        return;
    }

    $form_id = budokan_get_default_style_preview_form_id();
    if ($form_id <= 0) {
        return;
    }

    $redirect_args = array(
        'page' => 'formidable-styles',
        'form' => $form_id,
    );

    $frm_action = isset($_GET['frm_action']) ? sanitize_title(wp_unslash($_GET['frm_action'])) : '';
    if ($frm_action === '') {
        // メニューからの入場は編集画面が意図なので、警告回避後も編集のままにする
        $redirect_args['frm_action'] = 'edit';
    } else {
        $redirect_args['frm_action'] = $frm_action;
    }

    foreach (array('id', 'section', 'sample') as $query_key) {
        if (!empty($_GET[$query_key])) {
            $redirect_args[$query_key] = sanitize_text_field(wp_unslash($_GET[$query_key]));
        }
    }

    wp_safe_redirect(add_query_arg($redirect_args, admin_url('admin.php')));
    exit;
}
add_action('admin_init', 'budokan_redirect_frm_styles_to_form', 0);

/**
 * 管理画面・AJAX の直接アクセスを制限する
 *
 * @return void
 */
function budokan_guard_frm_admin_access()
{
    if (!is_admin() || !budokan_should_restrict_frm_access()) {
        return;
    }

    if (budokan_is_frm_list_or_create_screen()) {
        return;
    }

    $page = isset($_REQUEST['page']) ? sanitize_key(wp_unslash($_REQUEST['page'])) : '';
    $ajax_action = isset($_REQUEST['action']) ? sanitize_key(wp_unslash($_REQUEST['action'])) : '';
    $is_frm_screen = strpos($page, 'formidable') === 0;
    $is_frm_ajax = strpos($ajax_action, 'frm_') === 0 || $ajax_action === 'frm_entries_csv';

    if (!$is_frm_screen && !$is_frm_ajax && empty($_REQUEST['form_id']) && empty($_REQUEST['field_id'])) {
        return;
    }

    $form_id = budokan_resolve_form_id_from_request();
    if ($form_id > 0 && !budokan_user_can_access_form($form_id)) {
        budokan_deny_frm_access();
    }

    $bulk_form_ids = array();
    if (!empty($_REQUEST['frm_export_forms']) && is_array($_REQUEST['frm_export_forms'])) {
        $bulk_form_ids = array_merge($bulk_form_ids, wp_unslash($_REQUEST['frm_export_forms']));
    }
    if (!empty($_REQUEST['form']) && is_array($_REQUEST['form'])) {
        $bulk_form_ids = array_merge($bulk_form_ids, wp_unslash($_REQUEST['form']));
    }
    if (!empty($_REQUEST['item']) && is_array($_REQUEST['item']) && class_exists('FrmEntry')) {
        foreach (wp_unslash($_REQUEST['item']) as $entry_id) {
            $entry = FrmEntry::getOne(absint($entry_id));
            if ($entry && !empty($entry->form_id)) {
                $bulk_form_ids[] = $entry->form_id;
            }
        }
    }

    foreach ($bulk_form_ids as $bulk_form_id) {
        if (!budokan_user_can_access_form((int) $bulk_form_id)) {
            budokan_deny_frm_access();
        }
    }
}
add_action('admin_init', 'budokan_guard_frm_admin_access', 1);

/**
 * フォーム一覧ドロップダウンを許可 Form ID に絞る
 *
 * @param array $where 既存の抽出条件
 * @return array
 */
function budokan_filter_frm_forms_dropdown($where)
{
    if (!budokan_should_restrict_frm_access()) {
        return $where;
    }

    $allowed_form_ids = budokan_get_allowed_form_ids_for_current_user();
    // 0 だと抽出条件が壊れ、スタイル画面のフォーム切替が消える
    $where['id'] = !empty($allowed_form_ids) ? $allowed_form_ids : array(-1);

    return $where;
}
add_filter('frm_forms_dropdown', 'budokan_filter_frm_forms_dropdown');

/**
 * エントリー一覧を許可 Form ID に絞る
 *
 * @param array $query 既存クエリ
 * @return array
 */
function budokan_filter_frm_entries_list_query($query)
{
    if (!budokan_should_restrict_frm_access()) {
        return $query;
    }

    $allowed_form_ids = budokan_get_allowed_form_ids_for_current_user();
    $query['it.form_id'] = !empty($allowed_form_ids) ? $allowed_form_ids : 0;

    return $query;
}
add_filter('frm_entries_list_query', 'budokan_filter_frm_entries_list_query');

/**
 * CSV 書き出し対象を許可 Form ID に限定する
 *
 * @param array $query 既存クエリ
 * @param array $args  form_id などを含む引数
 * @return array
 */
function budokan_filter_frm_csv_where($query, $args = array())
{
    $form_id = isset($args['form_id']) ? (int) $args['form_id'] : 0;
    if ($form_id && !budokan_user_can_access_form($form_id)) {
        budokan_deny_frm_access();
    }

    return $query;
}
add_filter('frm_csv_where', 'budokan_filter_frm_csv_where', 10, 2);

/**
 * フロント／管理画面のエントリー編集可否にも同じ Form ID 制限を適用する
 *
 * @param bool  $allowed 既存の判定
 * @param array $args    form / entry を含む引数
 * @return bool
 */
function budokan_filter_frm_user_can_edit($allowed, $args)
{
    if (!$allowed) {
        return false;
    }

    $form = isset($args['form']) ? $args['form'] : null;
    $form_id = 0;

    if (is_object($form) && !empty($form->id)) {
        $form_id = (int) $form->id;
    } elseif (is_numeric($form)) {
        $form_id = (int) $form;
    }

    if ($form_id > 0 && !budokan_user_can_access_form($form_id)) {
        return false;
    }

    return $allowed;
}
add_filter('frm_user_can_edit', 'budokan_filter_frm_user_can_edit', 10, 2);

/**
 * フォーム一覧クラスを差し替え、許可 Form ID だけ表示する
 *
 * @param string $table_class 元のクラス名
 * @return string
 */
function budokan_filter_frm_forms_list_class($table_class)
{
    if (class_exists('BudokanFrmFormsListHelper')) {
        return 'BudokanFrmFormsListHelper';
    }

    return $table_class;
}
add_filter('frm_forms_list_class', 'budokan_filter_frm_forms_list_class', 20);

/**
 * 空白フォーム作成後に部署へ割り当てる
 *
 * @param int $form_id 新規 Form ID
 * @return void
 */
function budokan_on_build_new_form($form_id)
{
    budokan_assign_form_to_current_user_departments((int) $form_id);
}
add_action('frm_build_new_form', 'budokan_on_build_new_form');

/**
 * 複製後に部署へ割り当てる
 *
 * @param int $form_id 新規 Form ID
 * @return void
 */
function budokan_on_duplicate_form($form_id)
{
    budokan_assign_form_to_current_user_departments((int) $form_id);
}
add_action('frm_after_duplicate_form', 'budokan_on_duplicate_form');

/**
 * テンプレート／XML 取り込み後に部署へ割り当てる
 *
 * @param array $imported 取り込み結果
 * @return array
 */
function budokan_on_import_xml($imported)
{
    if (!empty($imported['forms']) && is_array($imported['forms'])) {
        foreach ($imported['forms'] as $form_id) {
            budokan_assign_form_to_current_user_departments((int) $form_id);
        }
    }

    if (!empty($imported['form_status']) && is_array($imported['form_status'])) {
        foreach (array_keys($imported['form_status']) as $form_id) {
            budokan_assign_form_to_current_user_departments((int) $form_id);
        }
    }

    return $imported;
}
add_filter('frm_importing_xml', 'budokan_on_import_xml');

/**
 * フォーム削除時に対応表から外す
 *
 * @param int $form_id 削除 Form ID
 * @return void
 */
function budokan_on_destroy_form($form_id)
{
    budokan_remove_form_from_access_map((int) $form_id);
}
add_action('frm_destroy_form', 'budokan_on_destroy_form');

/**
 * Views 一覧を許可 Form ID に絞る
 *
 * @param WP_Query $query メインクエリ
 * @return void
 */
function budokan_restrict_frm_views_query($query)
{
    if (!is_admin() || !$query->is_main_query() || !budokan_should_restrict_frm_access()) {
        return;
    }

    $post_type = $query->get('post_type');
    if ($post_type !== 'frm_display') {
        return;
    }

    $allowed_form_ids = budokan_get_allowed_form_ids_for_current_user();
    $meta_query = $query->get('meta_query');
    if (!is_array($meta_query)) {
        $meta_query = array();
    }

    $meta_query[] = array(
        'key'     => 'frm_form_id',
        'value'   => !empty($allowed_form_ids) ? $allowed_form_ids : array(0),
        'compare' => 'IN',
    );

    $query->set('meta_query', $meta_query);
}
add_action('pre_get_posts', 'budokan_restrict_frm_views_query');

/**
 * Views の編集・削除 capability を Form ID で制限する
 *
 * @param string[] $caps    必要な capability
 * @param string   $cap     判定対象
 * @param int      $user_id ユーザー ID
 * @param array    $args    投稿 ID など
 * @return string[]
 */
function budokan_map_frm_view_meta_cap($caps, $cap, $user_id, $args)
{
    if (!in_array($cap, array('edit_post', 'delete_post', 'read_post'), true)) {
        return $caps;
    }

    if (empty($args[0])) {
        return $caps;
    }

    $post = get_post($args[0]);
    if (!$post || $post->post_type !== 'frm_display') {
        return $caps;
    }

    $form_id = (int) get_post_meta($post->ID, 'frm_form_id', true);
    if ($form_id > 0 && !budokan_user_can_access_form($form_id)) {
        $caps[] = 'do_not_allow';
    }

    return $caps;
}
add_filter('map_meta_cap', 'budokan_map_frm_view_meta_cap', 10, 4);

/**
 * WordPress 標準の設定画面を追加する
 *
 * @return void
 */
function budokan_register_frm_access_settings_page()
{
    add_options_page(
        '部署フォーム制限',
        '部署フォーム制限',
        'manage_options',
        'budokan-frm-access',
        'budokan_render_frm_access_settings_page'
    );
}
add_action('admin_menu', 'budokan_register_frm_access_settings_page');

/**
 * 設定の保存処理
 *
 * @return void
 */
function budokan_handle_frm_access_settings_save()
{
    if (!isset($_POST['budokan_frm_access_nonce'])) {
        return;
    }

    if (!current_user_can('manage_options')) {
        return;
    }

    if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['budokan_frm_access_nonce'])), 'budokan_frm_access_save')) {
        wp_die(esc_html('設定の保存に失敗しました。'));
    }

    $posted_form_map = isset($_POST['budokan_form_map']) && is_array($_POST['budokan_form_map'])
        ? wp_unslash($_POST['budokan_form_map'])
        : array();

    $form_map = array();
    foreach (budokan_get_wp_roles() as $wp_role) {
        $role_slug = $wp_role['capability'];
        $selected_form_ids = isset($posted_form_map[$role_slug]) && is_array($posted_form_map[$role_slug])
            ? array_map('absint', $posted_form_map[$role_slug])
            : array();
        $filtered_form_ids = array_values(array_unique(array_filter($selected_form_ids)));
        if (!empty($filtered_form_ids)) {
            $form_map[$role_slug] = $filtered_form_ids;
        }
    }

    update_option(
        BUDOKAN_FRM_ACCESS_OPTION,
        array(
            'form_map' => $form_map,
        ),
        false
    );

    add_settings_error('budokan_frm_access', 'saved', 'ロールとフォームの対応を保存しました。', 'updated');
}
add_action('admin_init', 'budokan_handle_frm_access_settings_save');

/**
 * 設定画面の HTML
 *
 * @return void
 */
function budokan_render_frm_access_settings_page()
{
    if (!current_user_can('manage_options')) {
        return;
    }

    $settings = budokan_get_frm_access_settings();
    $forms = class_exists('FrmForm')
        ? FrmForm::getAll(
            array(
                'is_template' => 0,
                'status !'    => 'trash',
                array(
                    'or'               => 1,
                    'parent_form_id'   => null,
                    'parent_form_id <' => 1,
                ),
            ),
            'name'
        )
        : array();

    if (!is_array($forms)) {
        $forms = array();
    }

    settings_errors('budokan_frm_access');
    ?>
    <div class="wrap">
        <h1>部署フォーム制限</h1>
        <p>
            一覧は WordPress のロールです。権限プラグインでロールを追加すると、この画面にも自動で出ます。
            各ロールへ <code>frm_view_forms</code> / <code>frm_edit_forms</code> / <code>frm_view_entries</code> などの Formidable 基本権限を付与したうえで、
            ここで許可する Form ID を選んでください。管理者は常に全フォームへアクセスできます。
        </p>
        <p>
            フォームを1つ以上割り当てたロールだけが制限対象になります。チェックしていないロール（購読者・編集者など）は Formidable 標準の権限のままです。
            制限対象ロールのユーザーがフォームを新規作成・複製した場合、そのフォームは自動的にそのロールへ割り当てられます。
        </p>

        <form method="post" action="<?php echo esc_url(admin_url('options-general.php?page=budokan-frm-access')); ?>">
            <?php wp_nonce_field('budokan_frm_access_save', 'budokan_frm_access_nonce'); ?>

            <table class="widefat striped">
                <thead>
                    <tr>
                        <th scope="col">ロール名</th>
                        <th scope="col">ロール（スラッグ）</th>
                        <th scope="col">許可するフォーム</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    if (empty($settings['departments'])) :
                        ?>
                        <tr>
                            <td colspan="3">表示できるロールがありません。</td>
                        </tr>
                        <?php
                    else :
                        foreach ($settings['departments'] as $index => $department) :
                            $role_slug = isset($department['capability']) ? $department['capability'] : '';
                            $role_label = isset($department['label']) ? $department['label'] : '';
                            $selected_form_ids = ($role_slug !== '' && isset($settings['form_map'][$role_slug]))
                                ? array_map('intval', (array) $settings['form_map'][$role_slug])
                                : array();
                            ?>
                            <tr>
                                <td><?php echo esc_html($role_label); ?></td>
                                <td><code><?php echo esc_html($role_slug); ?></code></td>
                                <td>
                                    <?php if (empty($forms)) : ?>
                                        <p>表示できるフォームがありません。</p>
                                    <?php else : ?>
                                        <fieldset>
                                            <?php foreach ($forms as $form) : ?>
                                                <?php
                                                $form_id = (int) $form->id;
                                                $form_name = $form->name !== '' ? $form->name : '(無題)';
                                                $input_id = 'budokan_form_' . $index . '_' . $form_id;
                                                $map_name = 'budokan_form_map[' . $role_slug . '][]';
                                                ?>
                                                <label for="<?php echo esc_attr($input_id); ?>" style="display:block;margin:0 0 4px;">
                                                    <input
                                                        type="checkbox"
                                                        id="<?php echo esc_attr($input_id); ?>"
                                                        name="<?php echo esc_attr($map_name); ?>"
                                                        value="<?php echo esc_attr((string) $form_id); ?>"
                                                        <?php checked(in_array($form_id, $selected_form_ids, true)); ?>
                                                    />
                                                    <?php echo esc_html($form_name . ' (ID: ' . $form_id . ')'); ?>
                                                </label>
                                            <?php endforeach; ?>
                                        </fieldset>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php
                        endforeach;
                    endif;
                    ?>
                </tbody>
            </table>

            <p class="description">ロールの追加・削除・名称変更は権限プラグイン側で行ってください。この画面ではフォームの割当だけを保存します。</p>
            <?php submit_button('変更を保存'); ?>
        </form>
    </div>
    <?php
}

/**
 * フォーム一覧の抽出条件に許可 Form ID を足す
 */
trait BudokanFrmFormsListTrait
{
    /**
     * 一覧データの取得
     *
     * @return void
     */
    public function prepare_items()
    {
        global $per_page, $mode;

        $page = $this->get_pagenum();
        $items_per_page = $this->get_items_per_page('formidable_page_formidable_per_page');
        $per_page = $items_per_page;

        $mode = $this->get_param(
            array(
                'param'   => 'mode',
                'default' => 'list',
            )
        );

        $orderby = $this->get_param(
            array(
                'param'   => 'orderby',
                'default' => 'name',
            )
        );
        $order = $this->get_param(
            array(
                'param'   => 'order',
                'default' => 'ASC',
            )
        );

        FrmAppController::apply_saved_sort_preference($orderby, $order);

        $start = $this->get_param(
            array(
                'param'   => 'start',
                'default' => ($page - 1) * $items_per_page,
            )
        );

        $search_query = array(
            array(
                'or'               => 1,
                'parent_form_id'   => null,
                'parent_form_id <' => 1,
            ),
        );

        switch ($this->status) {
            case 'draft':
                $search_query['is_template'] = 0;
                $search_query['status'] = 'draft';
                break;
            case 'trash':
                $search_query['status'] = 'trash';
                break;
            default:
                $search_query['is_template'] = 0;
                $search_query['status !'] = 'trash';
                break;
        }

        if (budokan_should_restrict_frm_access()) {
            $allowed_form_ids = budokan_get_allowed_form_ids_for_current_user();
            $search_query['id'] = !empty($allowed_form_ids) ? $allowed_form_ids : 0;
        }

        $search_keyword = $this->get_param(
            array(
                'param'    => 's',
                'sanitize' => 'sanitize_text_field',
            )
        );

        if ($search_keyword !== '') {
            preg_match_all('/".*?("|$)|((?<=[\\s",+])|^)[^\\s",+]+/', $search_keyword, $matches);
            $search_terms = array_map('trim', $matches[0]);

            foreach ($search_terms as $term) {
                $search_query[] = array(
                    'or'               => true,
                    'name LIKE'        => $term,
                    'description LIKE' => $term,
                    'created_at LIKE'  => $term,
                    'form_key LIKE'    => $term,
                    'id'               => $term,
                );
            }
        }

        $this->items = FrmForm::getAll($search_query, $orderby . ' ' . $order, $start . ',' . $items_per_page);
        $this->total_items = FrmDb::get_count('frm_forms', $search_query);

        $this->set_pagination_args(
            array(
                'total_items' => $this->total_items,
                'per_page'    => $items_per_page,
            )
        );
    }
}

if (class_exists('FrmFormsListHelper') && !class_exists('BudokanFrmFormsListHelper')) {
    if (class_exists('FrmProFormsListHelper')) {
        /**
         * Pro の一覧クラスを拡張する
         */
        class BudokanFrmFormsListHelper extends FrmProFormsListHelper
        {
            use BudokanFrmFormsListTrait;
        }
    } else {
        /**
         * Lite の一覧クラスを拡張する
         */
        class BudokanFrmFormsListHelper extends FrmFormsListHelper
        {
            use BudokanFrmFormsListTrait;
        }
    }
}
