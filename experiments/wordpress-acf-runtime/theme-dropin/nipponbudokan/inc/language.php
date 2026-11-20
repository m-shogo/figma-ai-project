<?php

/**
 * GTranslate 言語切り替え。
 * クリック先は注釈の固定ページ。OK で翻訳言語を保存し、元のURLへ戻す。
 * 有料版では X-GT-Lang を見て、display-ja / display-en / display-other と
 * display-ja-en / display-non-ja-en のブロックを出し分ける。
 * 武道憲章は、通常の回遊では日本語・英語のみ。言語切替の OK で戻ったときだけ、簡体字・繁體字・韓国語も機械翻訳する。
 */

function nipponbudokan_languages() {
    return array(
        'ja' => array(
            'label' => '日本語',
            'hreflang' => 'ja',
        ),
        'en' => array(
            'label' => 'English',
            'hreflang' => 'en',
            'heading' => 'English（Machine Translation）',
            'body' => 'The following pages have been translated using the web-based machine translation system “GTranslate,” operated by GTranslate Inc. Please note that machine translation systems do not guarantee 100% accuracy. Some proper nouns may not be translated correctly. Additionally, PDFs may not be translatable.',
            'continue' => 'OK',
            'cancel' => 'CANCEL',
        ),
        'zh-CN' => array(
            'label' => '簡体字',
            'hreflang' => 'zh-Hans',
            'heading' => '簡体字（机器翻译）',
            'body' => '以下页面是通过GTranslate Inc.运营的基于网络的机器翻译系统“GTranslate”翻译的。请注意，机器翻译系统无法保证100%的准确性。部分专有名词可能无法正确翻译。此外，PDF文件可能无法翻译。',
            'continue' => '确定',
            'cancel' => '取消',
            'charter' => '武道宪章页面仅提供日语和英语。',
        ),
        'zh-TW' => array(
            'label' => '繁體字',
            'hreflang' => 'zh-Hant',
            'heading' => '繁體字（機器翻譯）',
            'body' => '以下頁面是透過GTranslate Inc.運營的基於網絡的機器翻譯系統「GTranslate」翻譯的。請注意，機器翻譯系統無法保證100%的準確性。部分專有名詞可能無法正確翻譯。此外，PDF文件可能無法翻譯。',
            'continue' => '確定',
            'cancel' => '取消',
            'charter' => '武道憲章頁面僅提供日語和英語。',
        ),
        'ko' => array(
            'label' => '한국어',
            'hreflang' => 'ko',
            'heading' => '한국어（기계 번역）',
            'body' => '다음 페이지는 GTranslate Inc.가 운영하는 웹 기반 기계 번역 시스템 “GTranslate”를 통해 번역되었습니다. 기계 번역 시스템이 100% 정확성을 보장하지 않는다는 점에 유의하십시오. 일부 고유 명사는 올바르게 번역되지 않을 수 있습니다. 또한 PDF는 번역이 불가능할 수 있습니다.',
            'continue' => '확인',
            'cancel' => '취소',
            'charter' => '무도헌장 페이지는 일본어와 영어만 제공합니다.',
        ),
    );
}

function nipponbudokan_machine_translation_notice_ja() {
    $sentences = array(
        '以下のページは、GTranslate Inc.が運営するWebベースの機械翻訳システム「GTranslate」により翻訳されています。',
        '機械翻訳システムは 100% の正確さを保証するものではないことにご注意ください。',
        '一部の固有名詞は正しく翻訳されない場合があります。',
        'また、PDFは翻訳できない場合があります。',
    );
    return implode('<br>', array_map('esc_html', $sentences));
}

function nipponbudokan_budo_charter_slugs() {
    return array('kenshou', 'kensho', 'budo-charter', 'budo-kenshou', 'budochater');
}

function nipponbudokan_post_is_budo_charter($post) {
    if (!$post instanceof WP_Post || $post->post_type !== 'page') {
        return false;
    }
    $title = $post->post_title;
    if (is_string($title) && mb_strpos($title, '武道憲章') !== false && mb_strpos($title, 'こども') === false) {
        return true;
    }
    return in_array($post->post_name, nipponbudokan_budo_charter_slugs(), true);
}

function nipponbudokan_is_budo_charter() {
    return is_page() && nipponbudokan_post_is_budo_charter(get_queried_object());
}

function nipponbudokan_language_safe_path($value) {
    if (!is_string($value) || $value === '') {
        return null;
    }
    $value = wp_unslash($value);
    if ($value[0] !== '/' || str_starts_with($value, '//') || str_contains($value, '\\') || str_contains($value, '://')) {
        return null;
    }
    $parts = wp_parse_url($value);
    if (!is_array($parts) || !empty($parts['scheme']) || !empty($parts['host']) || empty($parts['path'])) {
        return null;
    }
    $path = $parts['path'];
    if ($path[0] !== '/') {
        return null;
    }
    $home_path = wp_parse_url(home_url('/'), PHP_URL_PATH);
    if (is_string($home_path)) {
        $home_path = untrailingslashit($home_path);
        if ($home_path !== '' && ($path === $home_path || str_starts_with($path, $home_path . '/'))) {
            $path = substr($path, strlen($home_path));
            if ($path === '' || $path[0] !== '/') {
                $path = '/' . ltrim((string) $path, '/');
            }
        }
    }
    $query = '';
    if (!empty($parts['query'])) {
        parse_str($parts['query'], $args);
        unset($args['nb_lang']);
        if ($args) {
            $query = '?' . http_build_query($args);
        }
    }
    return $path . $query;
}

function nipponbudokan_language_url($path) {
    $safe = nipponbudokan_language_safe_path($path);
    if ($safe === null) {
        return home_url('/');
    }
    $parts = wp_parse_url($safe);
    $url = home_url($parts['path'] ?? '/');
    if (!empty($parts['query'])) {
        $url .= '?' . $parts['query'];
    }
    return $url;
}

function nipponbudokan_language_page_slug($code) {
    return 'language_setting_' . strtolower($code);
}

function nipponbudokan_language_page_code($post = null) {
    $post = $post instanceof WP_Post ? $post : get_queried_object();
    if (!$post instanceof WP_Post || $post->post_type !== 'page') {
        return '';
    }
    foreach (nipponbudokan_languages() as $code => $language) {
        if ($code === 'ja') {
            continue;
        }
        if ($post->post_name === nipponbudokan_language_page_slug($code)) {
            return $code;
        }
    }
    return '';
}

function nipponbudokan_language_is_prefix_path($path) {
    if (!is_string($path) || $path === '') {
        return false;
    }
    $only = wp_parse_url($path, PHP_URL_PATH);
    if (!is_string($only)) {
        return false;
    }
    return in_array(trim($only, '/'), nipponbudokan_language_prefix_codes(), true);
}

function nipponbudokan_language_return_path() {
    if (nipponbudokan_language_page_code() !== '') {
        $path = isset($_GET['from']) ? nipponbudokan_language_safe_path(wp_unslash($_GET['from'])) : null;
        $path = $path ?: '/';
    } else {
        $request = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '/';
        $path = nipponbudokan_language_safe_path($request) ?: '/';
    }
    if (nipponbudokan_language_is_prefix_path($path)) {
        return '/';
    }
    return $path;
}

function nipponbudokan_language_choice_url($code) {
    $return = nipponbudokan_language_return_path();
    if ($code === 'ja') {
        return add_query_arg('nb_lang', 'ja', nipponbudokan_language_url($return));
    }
    $page = get_page_by_path(nipponbudokan_language_page_slug($code));
    $url = $page instanceof WP_Post
        ? get_permalink($page)
        : home_url('/' . nipponbudokan_language_page_slug($code) . '/');
    return add_query_arg('from', $return, $url);
}

function nipponbudokan_language_preserve_from_arg($redirect) {
    if (!is_string($redirect) || $redirect === '' || nipponbudokan_language_page_code() === '' || !isset($_GET['from'])) {
        return $redirect;
    }
    $from = nipponbudokan_language_safe_path(wp_unslash($_GET['from']));
    if ($from === null) {
        return $redirect;
    }
    return add_query_arg('from', $from, $redirect);
}
add_filter('redirect_canonical', 'nipponbudokan_language_preserve_from_arg', 20);

function nipponbudokan_language_switch_list($list_class) {
    $languages = nipponbudokan_languages();
    $html = '<ul class="' . esc_attr($list_class) . '">';
    foreach ($languages as $code => $language) {
        $current = $code === 'ja' ? ' aria-current="true"' : '';
        $html .= '<li class="notranslate"><a href="' . esc_url(nipponbudokan_language_choice_url($code)) . '" data-nb-lang="' . esc_attr($code) . '" lang="' . esc_attr($language['hreflang']) . '"' . $current . '>' . esc_html($language['label']) . '</a></li>';
    }
    $html .= '</ul>';
    return $html;
}

function nipponbudokan_language_page_content($code) {
    $languages = nipponbudokan_languages();
    $language = $languages[$code];
    $paragraphs = array(
        nipponbudokan_machine_translation_notice_ja(),
        $language['body'],
    );
    $html = '';
    foreach ($paragraphs as $index => $paragraph) {
        $lang = $index === 1 ? ' lang="' . esc_attr($language['hreflang']) . '"' : '';
        $inner = $index === 0 ? $paragraph : esc_html($paragraph);
        $html .= "<!-- wp:paragraph -->\n<p" . $lang . '>' . $inner . "</p>\n<!-- /wp:paragraph -->\n\n";
    }
    $html .= nipponbudokan_language_page_buttons($code);
    return $html;
}

function nipponbudokan_language_root_path($code) {
    $path = wp_parse_url(home_url('/' . $code . '/'), PHP_URL_PATH);
    return is_string($path) && $path !== '' ? $path : '/' . $code . '/';
}

function nipponbudokan_language_top_path() {
    $path = wp_parse_url(home_url('/'), PHP_URL_PATH);
    return is_string($path) && $path !== '' ? $path : '/';
}

function nipponbudokan_language_page_buttons($code) {
    $languages = nipponbudokan_languages();
    $language = $languages[$code];
    $html = "<!-- wp:html -->\n";
    $html .= '<div class="ls_actions">';
    $html .= '<p class="ls_action"><a class="ls_continue" href="' . esc_url(nipponbudokan_language_root_path($code)) . '">' . esc_html($language['continue']) . '</a></p>';
    $html .= '<p class="ls_action"><a class="ls_cancel" href="' . esc_url(nipponbudokan_language_top_path()) . '">' . esc_html($language['cancel']) . '</a></p>';
    $html .= '</div>';
    $html .= "\n<!-- /wp:html -->\n";
    return $html;
}

function nipponbudokan_ensure_language_pages() {
    $copy = '20261006-lang-root';
    $refresh = get_option('nb_language_copy') !== $copy;
    foreach (nipponbudokan_languages() as $code => $language) {
        if ($code === 'ja') {
            continue;
        }
        $slug = nipponbudokan_language_page_slug($code);
        $page = get_page_by_path($slug);
        $content = nipponbudokan_language_page_content($code);
        if (!$page instanceof WP_Post) {
            wp_insert_post(array(
                'post_type' => 'page',
                'post_status' => 'publish',
                'post_name' => $slug,
                'post_title' => $language['heading'],
                'post_content' => $content,
            ));
            continue;
        }
        if ($refresh) {
            wp_update_post(array(
                'ID' => $page->ID,
                'post_title' => $language['heading'],
                'post_content' => $content,
            ));
        }
    }
    if ($refresh) {
        update_option('nb_language_copy', $copy);
    }
    if (get_option('nb_language_route') !== 'page') {
        flush_rewrite_rules(false);
        update_option('nb_language_route', 'page');
    }
}
add_action('init', 'nipponbudokan_ensure_language_pages', 20);

function nipponbudokan_language_prefix_codes() {
    return array('en', 'zh-CN', 'zh-TW', 'ko');
}

function nipponbudokan_request_language_code() {
    $request = isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '';
    $path = wp_parse_url($request, PHP_URL_PATH);
    if (!is_string($path)) {
        return '';
    }
    $home = wp_parse_url(home_url('/'), PHP_URL_PATH);
    $home = is_string($home) ? untrailingslashit($home) : '';
    if ($home !== '' && ($path === $home || str_starts_with($path, $home . '/'))) {
        $path = substr($path, strlen($home));
    }
    $path = trim($path, '/');
    return in_array($path, nipponbudokan_language_prefix_codes(), true) ? $path : '';
}

function nipponbudokan_language_prefix_request($wp) {
    $code = nipponbudokan_request_language_code();
    if ($code === '') {
        return;
    }
    $wp->query_vars = array('nb_gt_lang' => $code);
    if (get_option('show_on_front') === 'page') {
        $front = (int) get_option('page_on_front');
        if ($front) {
            $wp->query_vars['page_id'] = $front;
        }
    }
}
add_action('parse_request', 'nipponbudokan_language_prefix_request');

function nipponbudokan_language_prefix_query_var($vars) {
    $vars[] = 'nb_gt_lang';
    return $vars;
}
add_filter('query_vars', 'nipponbudokan_language_prefix_query_var');

function nipponbudokan_language_prefix_canonical($redirect) {
    if (nipponbudokan_request_language_code() !== '') {
        return false;
    }
    return $redirect;
}
add_filter('redirect_canonical', 'nipponbudokan_language_prefix_canonical');

function nipponbudokan_language_body_class($classes) {
    if (nipponbudokan_language_page_code() !== '') {
        $classes[] = 'notranslate';
        $classes[] = 'nb-language-setting';
    }
    if (nipponbudokan_is_budo_charter()) {
        $classes[] = 'nb-budo-charter';
    }
    return $classes;
}
add_filter('body_class', 'nipponbudokan_language_body_class');

function nipponbudokan_language_head_bootstrap() {
    $config = array(
        'charter' => nipponbudokan_is_budo_charter(),
        'limited' => array('zh-CN', 'zh-TW', 'ko'),
    );
    $config['prefixes'] = nipponbudokan_language_prefix_codes();
    $config['homePath'] = (string) wp_parse_url(home_url('/'), PHP_URL_PATH);
    $config['serverLang'] = nipponbudokan_gtranslate_is_paid() ? nipponbudokan_gtranslate_language() : '';
    $setting = nipponbudokan_language_page_code();
    if ($setting !== '') {
        $config['settingLang'] = $setting;
        $config['returnPath'] = nipponbudokan_language_return_path();
    }
    echo '<script>window.nbLanguage=' . wp_json_encode($config) . ';</script>';
    echo <<<'HTML'
<script>(function(){var key="__GT_TRANSLATE_LANGS";var previewKey="nb_charter_preview";var config=window.nbLanguage||{};var params=new URLSearchParams(location.search);if(params.get("nb_lang")==="ja"){try{localStorage.removeItem(key);}catch(e){}try{sessionStorage.removeItem(previewKey);}catch(e){}params.delete("nb_lang");history.replaceState(null,"",location.pathname+(params.toString()?"?"+params.toString():"")+location.hash);}var home=String(config.homePath||"/").replace(/\/+$/,"");var rest=location.pathname.slice(home.length).replace(/^\/|\/$/g,"");if(config.prefixes&&config.prefixes.indexOf(rest)!==-1){try{localStorage.setItem(key,JSON.stringify({srcLang:"ja",tgtLang:rest}));}catch(e){}}var lang=config.serverLang||"ja";if(!config.serverLang){try{var stored=JSON.parse(localStorage.getItem(key)||"null");if(stored&&typeof stored.tgtLang==="string"&&stored.tgtLang)lang=stored.tgtLang;}catch(e){}}var preview=false;try{preview=sessionStorage.getItem(previewKey)===lang;}catch(e){}if(!config.charter){try{sessionStorage.removeItem(previewKey);}catch(e){}}var limited=config.charter&&config.limited&&config.limited.indexOf(lang)!==-1;if(limited&&!preview){try{config.hold=JSON.parse(localStorage.getItem(key)||"null");localStorage.removeItem(key);}catch(e){}document.documentElement.classList.add("nb-charter-limited","notranslate");if(!config.serverLang)lang="ja";}document.documentElement.classList.add("nb-lang-"+String(lang).toLowerCase());})();</script>
HTML;
}
add_action('wp_head', 'nipponbudokan_language_head_bootstrap', 1);

function nipponbudokan_language_charter_note($content) {
    static $inserted = false;
    if ($inserted || is_admin()) {
        return $content;
    }
    $post = get_post();
    if (!$post instanceof WP_Post || (int) $post->ID !== (int) get_queried_object_id()) {
        return $content;
    }
    if (!nipponbudokan_post_is_budo_charter($post)) {
        return $content;
    }
    $inserted = true;
    $note = '<div class="nb_charterLangNote"><p>このページは日本語・英語のみ対応しています。</p></div>';
    return $note . $content;
}
add_filter('the_content', 'nipponbudokan_language_charter_note', 8);

function nipponbudokan_gtranslate_is_paid() {
    $data = get_option('GTranslate');
    if (!is_array($data)) {
        return false;
    }
    return !empty($data['pro_version']) || !empty($data['enterprise_version']);
}

function nipponbudokan_gtranslate_language() {
    if (!isset($_SERVER['HTTP_X_GT_LANG'])) {
        return 'ja';
    }
    $lang = strtolower(trim(wp_unslash($_SERVER['HTTP_X_GT_LANG'])));
    if ($lang === '' || $lang === 'ja') {
        return 'ja';
    }
    return $lang;
}

function nipponbudokan_language_block_visible($class_name) {
    if (!is_string($class_name) || $class_name === '') {
        return true;
    }
    $classes = preg_split('/\s+/', $class_name, -1, PREG_SPLIT_NO_EMPTY);
    $lang = nipponbudokan_gtranslate_language();
    $ja_en = in_array($lang, array('ja', 'en'), true);
    if (in_array('display-ja', $classes, true) && $lang !== 'ja') {
        return false;
    }
    if (in_array('display-en', $classes, true) && $lang !== 'en') {
        return false;
    }
    if (in_array('display-other', $classes, true) && $ja_en) {
        return false;
    }
    if (in_array('display-ja-en', $classes, true) && !$ja_en) {
        return false;
    }
    if (in_array('display-non-ja-en', $classes, true) && $ja_en) {
        return false;
    }
    return true;
}

function nipponbudokan_language_render_block($content, $block) {
    if (is_admin() || (defined('REST_REQUEST') && REST_REQUEST) || !nipponbudokan_gtranslate_is_paid()) {
        return $content;
    }
    $class_name = isset($block['attrs']['className']) ? $block['attrs']['className'] : '';
    if (!nipponbudokan_language_block_visible($class_name)) {
        return '';
    }
    return $content;
}
add_filter('render_block', 'nipponbudokan_language_render_block', 10, 2);

function nipponbudokan_language_cache_headers() {
    if (is_admin() || !nipponbudokan_gtranslate_is_paid()) {
        return;
    }
    header('Vary: X-GT-Lang', false);
    header('Cache-Control: no-cache, must-revalidate, max-age=0');
}
add_action('send_headers', 'nipponbudokan_language_cache_headers');

function nipponbudokan_sync_gtranslate_contract() {
    if (!class_exists('GTranslate') || get_option('nb_gtranslate_contract') === '1') {
        return;
    }
    $data = get_option('GTranslate');
    if (!is_array($data)) {
        $data = array();
    }
    if (method_exists('GTranslate', 'load_defaults')) {
        GTranslate::load_defaults($data);
    }
    $languages = array('ja', 'en', 'zh-CN', 'zh-TW', 'ko');
    $data['default_language'] = 'ja';
    $data['incl_langs'] = $languages;
    $data['fincl_langs'] = $languages;
    $data['floating_language_selector'] = 'no';
    $data['detect_browser_language'] = '';
    $data['show_in_menu'] = '';
    $data['native_language_names'] = '1';
    update_option('GTranslate', $data);
    update_option('nb_gtranslate_contract', '1');
}
add_action('init', 'nipponbudokan_sync_gtranslate_contract', 20);

/**
 * GTranslate 設定を編集者相当でも Settings > GTranslate から開ける。
 * プラグインは administrator 固定のため、本体は触らずメニューだけ差し替える。
 */
function nipponbudokan_gtranslate_unhook_native_menu() {
    if (!class_exists('GTranslate')) {
        return;
    }
    remove_action('admin_menu', array('GTranslate', 'admin_menu'));
}
add_action('admin_menu', 'nipponbudokan_gtranslate_unhook_native_menu', 9);

function nipponbudokan_gtranslate_register_editor_menu() {
    if (!class_exists('GTranslate') || !method_exists('GTranslate', 'options')) {
        return;
    }
    remove_submenu_page('options-general.php', 'gtranslate_options');
    add_options_page(
        __('GTranslate Options', 'gtranslate'),
        'GTranslate',
        'edit_others_posts',
        'gtranslate_options',
        array('GTranslate', 'options')
    );
}
add_action('admin_menu', 'nipponbudokan_gtranslate_register_editor_menu', 11);

function nipponbudokan_gtranslate_show_settings_menu_for_editors() {
    global $menu, $submenu;
    if (current_user_can('manage_options') || !current_user_can('edit_others_posts')) {
        return;
    }

    foreach ($menu as $position => $item) {
        if (isset($item[2]) && $item[2] === 'options-general.php') {
            $menu[$position][1] = 'edit_others_posts';
            break;
        }
    }

    if (empty($submenu['options-general.php']) || !is_array($submenu['options-general.php'])) {
        return;
    }

    foreach ($submenu['options-general.php'] as $index => $item) {
        $slug = isset($item[2]) ? $item[2] : '';
        if ($slug !== 'gtranslate_options') {
            unset($submenu['options-general.php'][$index]);
        }
    }
}
add_action('admin_menu', 'nipponbudokan_gtranslate_show_settings_menu_for_editors', 999);

function nipponbudokan_enqueue_language_switcher() {
    $path = get_theme_file_path('/js/language-switcher.js');
    wp_enqueue_script(
        'language-switcher-script',
        get_theme_file_uri('/js/language-switcher.js'),
        array(),
        file_exists($path) ? filemtime($path) : null,
        array('strategy' => 'defer', 'in_footer' => true)
    );
}
add_action('wp_enqueue_scripts', 'nipponbudokan_enqueue_language_switcher', 20);

function nipponbudokan_gtranslate_boot() {
    if (!shortcode_exists('gt-link')) {
        return;
    }
    echo '<div class="nb_gtBoot notranslate" hidden>';
    foreach (array_keys(nipponbudokan_languages()) as $code) {
        echo do_shortcode('[gt-link lang="' . esc_attr($code) . '" label="' . esc_attr($code) . '" widget_look="lang_names"]');
    }
    echo '</div>';
}
add_action('wp_footer', 'nipponbudokan_gtranslate_boot', 5);
