<?php

/**
 * Stub pages from DIRECTORY_MAP + the 4 Human-requested menus.
 *
 *   wp eval-file /fixture/scripts/seed-budokan-stub-pages-and-menus.php
 *
 * Pages: empty body. Navigation kind → Navigation template + page_img.
 * Default pages stay on page.php without page_img (gold bar).
 * Form URLs use the form template; Formidable is not touched.
 * CPT archives (/event/ /news/ /feature/) and external pages are not created.
 * Group headings with no page (大会イベント etc.) are custom links to /.
 * Menus: hamburger / sub / mega / footer (one footer menu).
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan pages/menus outside a local WordPress environment.');
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Requires the nipponbudokan theme.');
}

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

/**
 * @return array<string, array{title:string,kind:string}>
 */
function budokan_stub_page_catalog()
{
    return array(
        'about' => array('title' => '日本武道館について', 'kind' => 'nav'),
        'about/budokan' => array('title' => '日本武道館とは', 'kind' => 'page'),
        'about/facility' => array('title' => '施設概要', 'kind' => 'page'),
        'about/past-presidents' => array('title' => '歴代会長', 'kind' => 'page'),
        'about/history' => array('title' => '歴史・沿革', 'kind' => 'page'),
        'about/access' => array('title' => 'アクセス', 'kind' => 'page'),
        'about/disclosure' => array('title' => '業務・財務に関する資料', 'kind' => 'page'),
        'about/partners' => array('title' => '関連協力組織', 'kind' => 'page'),
        'about/partners/budo-council' => array('title' => '日本武道協議会', 'kind' => 'page'),
        'about/partners/budokan-council' => array('title' => '全国都道府県立武道館協議会', 'kind' => 'page'),
        'about/partners/kobudo-association' => array('title' => '日本古武道協会', 'kind' => 'page'),
        'about/concert-guide' => array('title' => 'ご来場の皆様へ', 'kind' => 'page'),

        'activities' => array('title' => '事業について', 'kind' => 'nav'),
        'activities/budo' => array('title' => '武道 振興・普及事業', 'kind' => 'nav'),
        'activities/budo/youth-budo-tournament' => array('title' => '全日本少年少女武道錬成大会', 'kind' => 'page'),
        'activities/budo/aikido' => array('title' => '合気道', 'kind' => 'page'),
        'activities/budo/judo' => array('title' => '柔道', 'kind' => 'page'),
        'activities/budo/jukendo' => array('title' => '銃剣道', 'kind' => 'page'),
        'activities/budo/karate' => array('title' => '空手道', 'kind' => 'page'),
        'activities/budo/kendo' => array('title' => '剣道', 'kind' => 'page'),
        'activities/budo/kyudo' => array('title' => '弓道', 'kind' => 'page'),
        'activities/budo/naginata' => array('title' => 'なぎなた', 'kind' => 'page'),
        'activities/budo/shorinji-kempo' => array('title' => '少林寺拳法', 'kind' => 'page'),
        'activities/budo/form-register' => array('title' => '新規届フォーム', 'kind' => 'form'),
        'activities/budo/form-change' => array('title' => '変更届フォーム', 'kind' => 'form'),
        'activities/budo/form-jukendo' => array('title' => '銃剣道参加申込フォーム', 'kind' => 'form'),
        'activities/budo/regional-youth-budo' => array('title' => '地方青少年武道錬成大会', 'kind' => 'page'),
        'activities/budo/kobudo-demonstration' => array('title' => '日本古武道演武大会', 'kind' => 'page'),
        'activities/budo/form-ticket' => array('title' => '入場券応募フォーム', 'kind' => 'form'),
        'activities/budo/kashima-kobudo' => array('title' => '鹿島古武道大会', 'kind' => 'page'),
        'activities/budo/kagami-biraki' => array('title' => '鏡開き式・武道始め', 'kind' => 'page'),
        'activities/budo/form-kagamibiraki' => array('title' => '記念品引換券応募フォーム', 'kind' => 'form'),
        'activities/budo/wakashio-cup' => array('title' => '若潮杯争奪武道大会', 'kind' => 'page'),
        'activities/budo/budo-experience' => array('title' => '日本武道館で武道を体験してみよう', 'kind' => 'page'),
        'activities/budo/form-experience' => array('title' => '参加申込フォーム', 'kind' => 'form'),
        'activities/budo/budo-seminar' => array('title' => '全国武道指導者研修会', 'kind' => 'page'),
        'activities/budo/karate-seminar' => array('title' => '全国空手道指導者研修会', 'kind' => 'page'),
        'activities/budo/shorinji-kempo-seminar' => array('title' => '全国少林寺拳法指導者研修会', 'kind' => 'page'),
        'activities/budo/kendo-club-seminar' => array('title' => '全国高等学校･中学校剣道（部活動）指導者研修会', 'kind' => 'page'),
        'activities/budo/kendo-east-seminar' => array('title' => '全国剣道指導者研修会（東日本ブロック）', 'kind' => 'page'),
        'activities/budo/kyoka-seminar' => array('title' => '全国中学校（教科）柔道指導者研修会', 'kind' => 'page'),
        'activities/budo/aikido-seminar' => array('title' => '全国合気道指導者研修会', 'kind' => 'page'),
        'activities/budo/jukendo-seminar' => array('title' => '全国銃剣道指導者研修会', 'kind' => 'page'),
        'activities/budo/sumo-seminar' => array('title' => '全国相撲指導者研修会', 'kind' => 'page'),
        'activities/budo/naginata-seminar' => array('title' => '全国なぎなた指導者研修会', 'kind' => 'page'),
        'activities/budo/kendo-west-seminar' => array('title' => '全国剣道指導者研修会（西日本ブロック）', 'kind' => 'page'),
        'activities/budo/kyudo-seminar' => array('title' => '全国弓道指導者研修会', 'kind' => 'page'),
        'activities/budo/community-seminar' => array('title' => '地域社会武道指導者研修会', 'kind' => 'page'),
        'activities/budo/school-budo' => array('title' => '中学校武道授業指導法研究事業', 'kind' => 'page'),
        'activities/budo/archive' => array('title' => '過去の実施内容', 'kind' => 'page'),
        'activities/budo/budo-tv' => array('title' => '武道TV', 'kind' => 'page'),
        'activities/budo/international-seminar' => array('title' => '外国人留学生等対象国際武道文化セミナー', 'kind' => 'page'),
        'activities/budo/form-international' => array('title' => '参加申込フォーム', 'kind' => 'form'),
        'activities/budo/budo-delegation' => array('title' => '海外派遣日本武道代表団', 'kind' => 'page'),
        'activities/shodo' => array('title' => '書道 普及・奨励事業', 'kind' => 'nav'),
        'activities/shodo/kakizome' => array('title' => '全日本書初め大展覧会', 'kind' => 'page'),
        'activities/shodo/takamado' => array('title' => '高円宮杯日本武道館書写書道大展覧会', 'kind' => 'page'),
        'activities/shodo/award' => array('title' => '上位入賞作品', 'kind' => 'page'),
        'activities/shodo/schedule' => array('title' => '書道事業年間行事予定表', 'kind' => 'page'),
        'activities/academy' => array('title' => '武道学園の運営', 'kind' => 'nav'),
        'activities/academy/event' => array('title' => '武道学園の行事', 'kind' => 'page'),
        'activities/academy/regulations' => array('title' => '武道学園学則', 'kind' => 'page'),
        'activities/academy/instructor' => array('title' => '講師紹介', 'kind' => 'page'),
        'activities/academy/timetable' => array('title' => '時間割・年間行事予定表', 'kind' => 'page'),
        'activities/academy/visit' => array('title' => '見学・体験授業', 'kind' => 'page'),

        'publications' => array('title' => '刊行物について', 'kind' => 'page'),
        'publications/budo' => array('title' => '武道 刊行物事業', 'kind' => 'nav'),
        'publications/budo/latest' => array('title' => '月刊「武道」最新号のご案内', 'kind' => 'page'),
        'publications/budo/back' => array('title' => '月刊「武道」バックナンバー、総索引', 'kind' => 'page'),
        'publications/budo/books' => array('title' => '単行本', 'kind' => 'page'),
        'publications/budo/order' => array('title' => '購入申込入力フォーム', 'kind' => 'form'),
        'publications/budo/books-en' => array('title' => '単行本（Foreign Language Books）', 'kind' => 'page'),
        'publications/budo/form-contact' => array('title' => 'ご意見ご感想', 'kind' => 'form'),
        'publications/shodo' => array('title' => '書道 発刊物事業', 'kind' => 'nav'),
        'publications/shodo/latest' => array('title' => '月刊「書写書道」最新号のご案内', 'kind' => 'page'),
        'publications/shodo/digital' => array('title' => '電子版・会員Webサイトのご案内', 'kind' => 'page'),
        'publications/shodo/form-digital' => array('title' => '申込入力フォーム', 'kind' => 'form'),
        'publications/shodo/back' => array('title' => '月刊「書写書道」バックナンバー', 'kind' => 'page'),
        'publications/shodo/form-shodo' => array('title' => '書写書道各種申込書', 'kind' => 'page'),
        'publications/shodo/books' => array('title' => '単行本', 'kind' => 'page'),

        'training-center' => array('title' => '研修センターについて', 'kind' => 'nav'),
        'training-center/stay' => array('title' => '宿泊利用申し込み', 'kind' => 'page'),
        'training-center/meals' => array('title' => '食事', 'kind' => 'page'),
        'training-center/access' => array('title' => 'アクセス', 'kind' => 'page'),
        'training-center/facility' => array('title' => '施設概要', 'kind' => 'page'),
        'training-center/budo-school' => array('title' => '武道学園（勝浦分園）', 'kind' => 'page'),

        'qa' => array('title' => 'Q&A（よくあるご質問）', 'kind' => 'page'),
        'qa/kakizome-contest' => array('title' => '高円宮杯／書初め席書大会Q＆A', 'kind' => 'page'),
        'qa/shodo' => array('title' => '月刊「書写書道」Q＆A', 'kind' => 'page'),
        'contact' => array('title' => 'お問い合わせ', 'kind' => 'page'),
        'brochure' => array('title' => 'パンフレットのご案内', 'kind' => 'page'),
        'advertising' => array('title' => '広告掲載について', 'kind' => 'page'),
        'sitemap' => array('title' => 'サイトマップ', 'kind' => 'page'),
        'dvd' => array('title' => '武道DVD貸出作品一覧', 'kind' => 'page'),
        'privacy' => array('title' => '個人情報保護方針', 'kind' => 'page'),

        'mandatory-budo' => array('title' => '中学校武道必修化サイト', 'kind' => 'nav'),
        'youth-budo-guide' => array('title' => '少年少女武道指導書', 'kind' => 'nav'),
        'youth-budo-guide/budo' => array('title' => '武道', 'kind' => 'page'),
        'youth-budo-guide/judo' => array('title' => '柔道', 'kind' => 'page'),
        'youth-budo-guide/kendo' => array('title' => '剣道', 'kind' => 'page'),
        'youth-budo-guide/kyudo' => array('title' => '弓道', 'kind' => 'page'),
        'youth-budo-guide/sumo' => array('title' => '相撲', 'kind' => 'page'),
        'youth-budo-guide/karate' => array('title' => '空手道', 'kind' => 'page'),
        'youth-budo-guide/aikido' => array('title' => '合気道', 'kind' => 'page'),
        'youth-budo-guide/shorinji-kempo' => array('title' => '少林寺拳法', 'kind' => 'page'),
        'youth-budo-guide/naginata' => array('title' => 'なぎなた', 'kind' => 'page'),
        'youth-budo-guide/jukendo' => array('title' => '銃剣道', 'kind' => 'page'),
        'recruit' => array('title' => '採用情報', 'kind' => 'nav'),
        'recruit/graduate' => array('title' => '職員採用（大卒・院卒）', 'kind' => 'page'),
        'recruit/vocational' => array('title' => '職員採用（専門卒）', 'kind' => 'page'),
        'recruit/form-entry' => array('title' => 'エントリーフォーム', 'kind' => 'form'),
        'recruit/staff' => array('title' => '職員採用案内', 'kind' => 'page'),
        'budo' => array('title' => '武道とは', 'kind' => 'page'),
        'budo/disciplines' => array('title' => '現代武道9種目紹介', 'kind' => 'nav'),
        'budo/disciplines/judo' => array('title' => '柔道', 'kind' => 'page'),
        'budo/disciplines/kendo' => array('title' => '剣道', 'kind' => 'page'),
        'budo/disciplines/kyudo' => array('title' => '弓道', 'kind' => 'page'),
        'budo/disciplines/sumo' => array('title' => '相撲', 'kind' => 'page'),
        'budo/disciplines/karate' => array('title' => '空手道', 'kind' => 'page'),
        'budo/disciplines/aikido' => array('title' => '合気道', 'kind' => 'page'),
        'budo/disciplines/shorinji-kempo' => array('title' => '少林寺拳法', 'kind' => 'page'),
        'budo/disciplines/naginata' => array('title' => 'なぎなた', 'kind' => 'page'),
        'budo/disciplines/jukendo' => array('title' => '銃剣道', 'kind' => 'page'),
        'english' => array('title' => 'English', 'kind' => 'nav'),
        'english/about' => array('title' => 'About Budokan', 'kind' => 'page'),
        'english/definition' => array('title' => 'The Definition of Budō', 'kind' => 'page'),
        'english/seminar' => array('title' => 'International Seminar of Budō Culture', 'kind' => 'page'),
    );
}

function budokan_stub_path_parent(string $path): string
{
    $pos = strrpos($path, '/');
    return $pos === false ? '' : substr($path, 0, $pos);
}

function budokan_stub_path_slug(string $path): string
{
    $pos = strrpos($path, '/');
    return $pos === false ? $path : substr($path, $pos + 1);
}

function budokan_stub_nav_visual_id(): int
{
    $existing = (int) get_option('budokan_stub_page_img_id', 0);
    if ($existing > 0 && wp_attachment_is_image($existing)) {
        return $existing;
    }

    $source = get_template_directory() . '/images/common/noimage_visual-01.webp';
    if (!is_readable($source)) {
        WP_CLI::warning('Navigation visual source missing: ' . $source);
        return 0;
    }

    $tmp = wp_tempnam($source);
    if (!$tmp || !copy($source, $tmp)) {
        WP_CLI::warning('Could not copy navigation visual to temp file.');
        return 0;
    }

    $file_array = array(
        'name' => 'page-visual.webp',
        'tmp_name' => $tmp,
    );
    $attachment_id = media_handle_sideload($file_array, 0, 'ナビゲーション用ビジュアル');
    if (is_wp_error($attachment_id)) {
        WP_CLI::warning($attachment_id->get_error_message());
        return 0;
    }

    update_option('budokan_stub_page_img_id', (int) $attachment_id, false);
    return (int) $attachment_id;
}

function budokan_stub_upsert_page(string $path, array $spec, array $page_ids, int $visual_id): int
{
    $slug = budokan_stub_path_slug($path);
    $parent_path = budokan_stub_path_parent($path);
    $parent_id = $parent_path === '' ? 0 : (int) $page_ids[$parent_path];

    $matches = get_posts(array(
        'post_type' => 'page',
        'post_status' => 'any',
        'name' => $slug,
        'post_parent' => $parent_id,
        'posts_per_page' => 1,
        'orderby' => 'ID',
        'order' => 'ASC',
        'no_found_rows' => true,
    ));
    $page = $matches ? $matches[0] : null;

    $template = '';
    if ($spec['kind'] === 'nav') {
        $template = 'templates/template-navigation.php';
    } elseif ($spec['kind'] === 'form') {
        $template = 'templates/template-form.php';
    }

    $payload = array(
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_title' => $spec['title'],
        'post_name' => $slug,
        'post_parent' => $parent_id,
        'meta_input' => array(
            '_wp_page_template' => $template,
        ),
    );

    if ($page) {
        $payload['ID'] = (int) $page->ID;
        if (trim((string) $page->post_content) === '') {
            $payload['post_content'] = '';
        }
        $result = wp_update_post($payload, true);
    } else {
        $payload['post_content'] = '';
        $result = wp_insert_post($payload, true);
    }

    if (is_wp_error($result)) {
        WP_CLI::error($path . ': ' . $result->get_error_message());
    }

    $page_id = (int) $result;
    update_post_meta($page_id, '_wp_page_template', $template);

    if ($spec['kind'] === 'nav' && $visual_id > 0 && function_exists('update_field')) {
        $current = function_exists('get_field') ? get_field('page_img', $page_id) : null;
        if (empty($current)) {
            update_field('page_img', $visual_id, $page_id);
        }
    }

    return $page_id;
}

function budokan_stub_replace_menu(string $name): int
{
    $menu = wp_get_nav_menu_object($name);
    if ($menu) {
        $menu_id = (int) $menu->term_id;
        $items = wp_get_nav_menu_items($menu_id, array('post_status' => 'any')) ?: array();
        foreach ($items as $item) {
            wp_delete_post((int) $item->ID, true);
        }
        return $menu_id;
    }

    $created = wp_create_nav_menu(wp_slash($name));
    if (is_wp_error($created)) {
        WP_CLI::error($created->get_error_message());
    }
    return (int) $created;
}

function budokan_stub_menu_page_item(int $menu_id, int $page_id, string $title, int $parent_item_id, int $position): int
{
    $item_id = wp_update_nav_menu_item($menu_id, 0, array(
        'menu-item-title' => wp_slash($title),
        'menu-item-object-id' => $page_id,
        'menu-item-object' => 'page',
        'menu-item-type' => 'post_type',
        'menu-item-parent-id' => $parent_item_id,
        'menu-item-status' => 'publish',
        'menu-item-position' => $position,
    ));
    if (is_wp_error($item_id)) {
        WP_CLI::error($item_id->get_error_message());
    }
    return (int) $item_id;
}

function budokan_stub_menu_custom_item(int $menu_id, string $title, int $parent_item_id, int $position, string $url = '/'): int
{
    $item_id = wp_update_nav_menu_item($menu_id, 0, array(
        'menu-item-title' => wp_slash($title),
        'menu-item-url' => home_url($url),
        'menu-item-type' => 'custom',
        'menu-item-parent-id' => $parent_item_id,
        'menu-item-status' => 'publish',
        'menu-item-position' => $position,
    ));
    if (is_wp_error($item_id)) {
        WP_CLI::error($item_id->get_error_message());
    }
    return (int) $item_id;
}

/**
 * @param array<int, array<string, mixed>> $nodes
 * @param array<string, int> $page_ids
 */
function budokan_stub_add_menu_tree(int $menu_id, array $nodes, int $parent_item_id, array $page_ids): void
{
    $position = 0;
    foreach ($nodes as $node) {
        $position++;
        if (!empty($node['custom'])) {
            $url = isset($node['url']) ? (string) $node['url'] : '/';
            $item_id = budokan_stub_menu_custom_item($menu_id, $node['title'], $parent_item_id, $position, $url);
        } else {
            $path = (string) $node['path'];
            if (!isset($page_ids[$path])) {
                WP_CLI::error('Missing stub page for menu path: ' . $path);
            }
            $item_id = budokan_stub_menu_page_item(
                $menu_id,
                $page_ids[$path],
                $node['title'],
                $parent_item_id,
                $position
            );
        }
        if (!empty($node['children']) && is_array($node['children'])) {
            budokan_stub_add_menu_tree($menu_id, $node['children'], $item_id, $page_ids);
        }
    }
}

$catalog = budokan_stub_page_catalog();
uksort($catalog, static function ($a, $b) {
    $da = substr_count($a, '/');
    $db = substr_count($b, '/');
    if ($da === $db) {
        return strcmp($a, $b);
    }
    return $da <=> $db;
});

$visual_id = budokan_stub_nav_visual_id();
$page_ids = array();
foreach ($catalog as $path => $spec) {
    $page_ids[$path] = budokan_stub_upsert_page($path, $spec, $page_ids, $visual_id);
}

$about_children = array(
    array('path' => 'about/budokan', 'title' => '日本武道館とは'),
    array('path' => 'about/facility', 'title' => '施設概要'),
    array('path' => 'about/past-presidents', 'title' => '歴代会長'),
    array('path' => 'about/history', 'title' => '歴史・沿革'),
    array('path' => 'about/access', 'title' => 'アクセス'),
    array('path' => 'about/disclosure', 'title' => '業務・財務に関する資料'),
    array(
        'path' => 'about/partners',
        'title' => '関連協力組織',
        'children' => array(
            array('path' => 'about/partners/budo-council', 'title' => '日本武道協議会'),
            array('path' => 'about/partners/budokan-council', 'title' => '全国都道府県立武道館協議会'),
            array('path' => 'about/partners/kobudo-association', 'title' => '日本古武道協会'),
        ),
    ),
    array('path' => 'about/concert-guide', 'title' => 'ご来場の皆様へ'),
);

$event_group_mega = array(
    array('path' => 'activities/budo/youth-budo-tournament', 'title' => '全日本少年少女武道錬成大会'),
    array('path' => 'activities/budo/regional-youth-budo', 'title' => '地方青少年武道錬成大会'),
    array('path' => 'activities/budo/kobudo-demonstration', 'title' => '日本古武道演武大会'),
    array('path' => 'activities/budo/kashima-kobudo', 'title' => '鹿島古武道大会'),
    array('path' => 'activities/budo/kagami-biraki', 'title' => '鏡開き式・武道始め'),
    array('path' => 'activities/budo/wakashio-cup', 'title' => '若潮杯争奪武道大会'),
    array('path' => 'activities/budo/budo-experience', 'title' => '日本武道館で武道を体験してみよう'),
);

$event_group_hamburger = array(
    array('path' => 'activities/budo/youth-budo-tournament', 'title' => '全日本少年少女武道錬成大会'),
    array('path' => 'activities/budo/regional-youth-budo', 'title' => '地方青少年武道錬成大会'),
    array('path' => 'activities/budo/kobudo-demonstration', 'title' => '日本古武道演武大会'),
    array('path' => 'activities/budo/form-ticket', 'title' => '入場券応募フォーム'),
    array('path' => 'activities/budo/kashima-kobudo', 'title' => '鹿島古武道大会'),
    array('path' => 'activities/budo/kagami-biraki', 'title' => '鏡開き式・武道始め'),
    array('path' => 'activities/budo/form-kagamibiraki', 'title' => '記念品引換券応募フォーム'),
    array('path' => 'activities/budo/wakashio-cup', 'title' => '若潮杯争奪武道大会'),
    array('path' => 'activities/budo/budo-experience', 'title' => '日本武道館で武道を体験してみよう'),
    array('path' => 'activities/budo/form-experience', 'title' => '参加申込フォーム'),
);

$seminar_children = array(
    array('path' => 'activities/budo/karate-seminar', 'title' => '全国空手道指導者研修会'),
    array('path' => 'activities/budo/shorinji-kempo-seminar', 'title' => '全国少林寺拳法指導者研修会'),
    array('path' => 'activities/budo/kendo-club-seminar', 'title' => '全国高等学校･中学校剣道（部活動）指導者研修会'),
    array('path' => 'activities/budo/kendo-east-seminar', 'title' => '全国剣道指導者研修会（東日本ブロック）'),
    array('path' => 'activities/budo/kyoka-seminar', 'title' => '全国中学校（教科）柔道指導者研修会'),
    array('path' => 'activities/budo/aikido-seminar', 'title' => '全国合気道指導者研修会'),
    array('path' => 'activities/budo/jukendo-seminar', 'title' => '全国銃剣道指導者研修会'),
    array('path' => 'activities/budo/sumo-seminar', 'title' => '全国相撲指導者研修会'),
    array('path' => 'activities/budo/naginata-seminar', 'title' => '全国なぎなた指導者研修会'),
    array('path' => 'activities/budo/kendo-west-seminar', 'title' => '全国剣道指導者研修会（西日本ブロック）'),
    array('path' => 'activities/budo/kyudo-seminar', 'title' => '全国弓道指導者研修会'),
    array('path' => 'activities/budo/community-seminar', 'title' => '地域社会武道指導者研修会'),
    array('path' => 'activities/budo/school-budo', 'title' => '中学校武道授業指導法研究事業'),
);

$international_children = array(
    array('path' => 'activities/budo/budo-tv', 'title' => '事業武道TV'),
    array('path' => 'activities/budo/international-seminar', 'title' => '外国人留学生等対象国際武道文化セミナー'),
    array('path' => 'activities/budo/form-international', 'title' => '参加申込フォーム'),
    array('path' => 'activities/budo/budo-delegation', 'title' => '海外派遣日本武道代表団'),
);

$shodo_children = array(
    array(
        'custom' => true,
        'title' => '展覧会',
        'children' => array(
            array('path' => 'activities/shodo/kakizome', 'title' => '全日本書初め大展覧会'),
            array('path' => 'activities/shodo/takamado', 'title' => '高円宮杯日本武道館書写書道大展覧会'),
            array('path' => 'activities/shodo/award', 'title' => '上位入賞作品'),
        ),
    ),
    array('path' => 'activities/shodo/schedule', 'title' => '書道事業年間行事予定表'),
);

$academy_children = array(
    array('path' => 'activities/academy/event', 'title' => '武道学園の行事'),
    array('path' => 'activities/academy/regulations', 'title' => '武道学園学則'),
    array('path' => 'activities/academy/instructor', 'title' => '講師紹介'),
    array('path' => 'activities/academy/timetable', 'title' => '時間割・年間行事予定表'),
    array('path' => 'activities/academy/visit', 'title' => '見学・体験授業'),
);

$publications_children = array(
    array(
        'path' => 'publications/budo',
        'title' => '武道 刊行物事業',
        'children' => array(
            array('path' => 'publications/budo/latest', 'title' => '月刊「武道」最新号のご案内'),
            array('path' => 'publications/budo/back', 'title' => '月刊「武道」バックナンバー、総索引'),
            array('path' => 'publications/budo/books', 'title' => '単行本'),
            array('path' => 'publications/budo/books-en', 'title' => '単行本（Foreign Language Books）'),
            array('path' => 'publications/budo/form-contact', 'title' => 'ご意見ご感想'),
        ),
    ),
    array(
        'path' => 'publications/shodo',
        'title' => '書道 発刊物事業',
        'children' => array(
            array('path' => 'publications/shodo/latest', 'title' => '月刊「書写書道」最新号のご案内'),
            array('path' => 'publications/shodo/digital', 'title' => '電子版・会員Webサイトのご案内'),
            array('path' => 'publications/shodo/back', 'title' => '月刊「書写書道」バックナンバー'),
            array('path' => 'publications/shodo/form-shodo', 'title' => '書写書道各種申込書'),
            array('path' => 'publications/shodo/books', 'title' => '単行本'),
        ),
    ),
);

$training_children = array(
    array('path' => 'training-center/stay', 'title' => '宿泊利用申し込み'),
    array('path' => 'training-center/meals', 'title' => '食事'),
    array('path' => 'training-center/access', 'title' => 'アクセス'),
    array('path' => 'training-center/facility', 'title' => '施設概要'),
    array('path' => 'training-center/budo-school', 'title' => '武道学園（勝浦分園）'),
);

$activities_children = array(
    array(
        'path' => 'activities/budo',
        'title' => '武道 振興・普及事業',
        'children' => array(
            array(
                'custom' => true,
                'title' => '大会イベント',
                'children' => $event_group_mega,
            ),
            array(
                'custom' => true,
                'title' => '指導者研修・指導法研究',
                'children' => $seminar_children,
            ),
            array(
                'custom' => true,
                'title' => '国際交流',
                'children' => $international_children,
            ),
        ),
    ),
    array(
        'path' => 'activities/shodo',
        'title' => '書道 普及・奨励事業',
        'children' => $shodo_children,
    ),
    array(
        'path' => 'activities/academy',
        'title' => '武道学園の運営',
        'children' => $academy_children,
    ),
);

$activities_children_hamburger = unserialize(serialize($activities_children));
$activities_children_hamburger[0]['children'][0]['children'] = $event_group_hamburger;

$hamburger_tree = array(
    array(
        'path' => 'about',
        'title' => '日本武道館について',
        'children' => $about_children,
    ),
    array(
        'path' => 'activities',
        'title' => '事業案内',
        'children' => $activities_children_hamburger,
    ),
    array(
        'path' => 'publications',
        'title' => '刊行物について',
        'children' => $publications_children,
    ),
    array(
        'path' => 'training-center',
        'title' => '研修センターについて',
        'children' => $training_children,
    ),
    array('custom' => true, 'title' => '開催イベント', 'url' => '/event/'),
    array('custom' => true, 'title' => 'お知らせ', 'url' => '/news/'),
    array('path' => 'mandatory-budo', 'title' => '中学校武道必修化サイト'),
    array(
        'path' => 'youth-budo-guide',
        'title' => '少年少女武道指導書',
        'children' => array(
            array('path' => 'youth-budo-guide/budo', 'title' => '武道'),
            array('path' => 'youth-budo-guide/judo', 'title' => '柔道'),
            array('path' => 'youth-budo-guide/kendo', 'title' => '剣道'),
            array('path' => 'youth-budo-guide/kyudo', 'title' => '弓道'),
            array('path' => 'youth-budo-guide/sumo', 'title' => '相撲'),
            array('path' => 'youth-budo-guide/karate', 'title' => '空手道'),
            array('path' => 'youth-budo-guide/aikido', 'title' => '合気道'),
            array('path' => 'youth-budo-guide/shorinji-kempo', 'title' => '少林寺拳法'),
            array('path' => 'youth-budo-guide/naginata', 'title' => 'なぎなた'),
            array('path' => 'youth-budo-guide/jukendo', 'title' => '銃剣道'),
        ),
    ),
    array(
        'path' => 'recruit',
        'title' => '採用情報',
        'children' => array(
            array('path' => 'recruit/graduate', 'title' => '職員採用（大卒・院卒）'),
            array(
                'path' => 'recruit/vocational',
                'title' => '職員採用（専門卒）',
                'children' => array(
                    array('path' => 'recruit/form-entry', 'title' => 'エントリーフォーム'),
                ),
            ),
            array('path' => 'recruit/staff', 'title' => '職員採用案内'),
        ),
    ),
    array(
        'path' => 'budo',
        'title' => '武道とは',
        'children' => array(
            array(
                'path' => 'budo/disciplines',
                'title' => '現代武道9種目紹介',
                'children' => array(
                    array('path' => 'budo/disciplines/judo', 'title' => '柔道'),
                    array('path' => 'budo/disciplines/kendo', 'title' => '剣道'),
                    array('path' => 'budo/disciplines/kyudo', 'title' => '弓道'),
                    array('path' => 'budo/disciplines/sumo', 'title' => '相撲'),
                    array('path' => 'budo/disciplines/karate', 'title' => '空手道'),
                    array('path' => 'budo/disciplines/aikido', 'title' => '合気道'),
                    array('path' => 'budo/disciplines/shorinji-kempo', 'title' => '少林寺拳法'),
                    array('path' => 'budo/disciplines/naginata', 'title' => 'なぎなた'),
                    array('path' => 'budo/disciplines/jukendo', 'title' => '銃剣道'),
                ),
            ),
        ),
    ),
    array(
        'path' => 'qa',
        'title' => 'Q&A',
        'children' => array(
            array('path' => 'qa/kakizome-contest', 'title' => '高円宮杯／書初め席書大会Q＆A'),
            array('path' => 'qa/shodo', 'title' => '月刊「書写書道」Q＆A'),
        ),
    ),
);

$global_tree = array(
    array(
        'path' => 'about',
        'title' => '日本武道館について',
        'children' => $about_children,
    ),
    array(
        'path' => 'activities',
        'title' => '事業案内',
        'children' => $activities_children,
    ),
    array(
        'path' => 'publications',
        'title' => '刊行物',
        'children' => $publications_children,
    ),
    array(
        'path' => 'training-center',
        'title' => '研修センター',
        'children' => $training_children,
    ),
);

$sub_tree = array(
    array('path' => 'contact', 'title' => 'お問い合わせ'),
    array('path' => 'brochure', 'title' => 'パンフレットのご案内'),
    array('path' => 'advertising', 'title' => '広告掲載について'),
    array('path' => 'sitemap', 'title' => 'サイトマップ'),
    array('path' => 'dvd', 'title' => '武道DVD貸出作品一覧'),
    array('path' => 'privacy', 'title' => '個人情報保護方針'),
);

$footer_tree = array(
    array('path' => 'about', 'title' => '日本武道館について'),
    array('path' => 'qa', 'title' => 'よくあるご質問'),
    array('path' => 'activities/budo', 'title' => '武道振興・普及事業'),
    array('path' => 'contact', 'title' => 'お問い合わせ'),
    array('path' => 'activities/shodo', 'title' => '書道普及・奨励事業'),
    array('path' => 'brochure', 'title' => 'パンフレットのご案内'),
    array('path' => 'publications/budo', 'title' => '武道刊行物事業'),
    array('path' => 'privacy', 'title' => '個人情報保護方針'),
    array('path' => 'training-center', 'title' => '研修センター'),
    array('path' => 'about/disclosure', 'title' => '業務・財務に関する資料'),
);

$global_id = budokan_stub_replace_menu('グローバルメニュー');
$mega_id = budokan_stub_replace_menu('メガメニュー');
$sub_id = budokan_stub_replace_menu('サブメニュー');
$footer_id = budokan_stub_replace_menu('フッターメニュー');

budokan_stub_add_menu_tree($global_id, $hamburger_tree, 0, $page_ids);
budokan_stub_add_menu_tree($mega_id, $global_tree, 0, $page_ids);
budokan_stub_add_menu_tree($sub_id, $sub_tree, 0, $page_ids);
budokan_stub_add_menu_tree($footer_id, $footer_tree, 0, $page_ids);

$locations = get_theme_mod('nav_menu_locations', array());
if (!is_array($locations)) {
    $locations = array();
}
unset($locations['footer-sub-nav']);
$locations['global-nav'] = $global_id;
$locations['mega-nav'] = $mega_id;
$locations['sub-nav'] = $sub_id;
$locations['footer-nav'] = $footer_id;
set_theme_mod('nav_menu_locations', $locations);

flush_rewrite_rules(false);

WP_CLI::success(sprintf(
    'Stub pages %d; menus hamburger #%d, mega #%d, sub #%d, footer #%d.',
    count($page_ids),
    $global_id,
    $mega_id,
    $sub_id,
    $footer_id
));
