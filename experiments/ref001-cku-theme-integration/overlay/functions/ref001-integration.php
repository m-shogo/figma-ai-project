<?php
/**
 * REF-001 integration for the cku theme.
 *
 * This file is the ONLY functions.php touch-point this integration needs
 * (see the repo-root APPLY.md for the exact one-line `require` addition).
 * It follows cku's own functions/EnqueueScript.php + EnqueueStyle.php
 * conditional-load convention and keeps REF-001's already Human-Reviewed
 * fixture helpers intact so the rendered HTML/CSS/JS is byte-identical to
 * experiments/ref001-blind-clean-20260812/implementation/theme when no ACF
 * data is present, and only Student Voice / Swiper content changes when ACF
 * data IS present.
 */

if (!defined('REF001_PAGE_TEMPLATE')) {
    define('REF001_PAGE_TEMPLATE', 'page-ref001.php');
}

// ---------------------------------------------------------------------
// Fixture content + generic get/echo helpers
// (ported unchanged from experiments/ref001-blind-clean-20260812/implementation/theme/functions.php)
// ---------------------------------------------------------------------

function ref001_fixture_data(): array
{
    static $data;

    if ($data === null) {
        $data = require __DIR__ . '/../inc/fixture-content.php';
    }

    return $data;
}

function ref001_get(string $key, $fallback = '')
{
    if (function_exists('get_field')) {
        $value = get_field($key);
        if ($value !== null && $value !== false && $value !== '') {
            return $value;
        }
    }

    $data = ref001_fixture_data();
    return array_key_exists($key, $data) ? $data[$key] : $fallback;
}

function ref001_e($value): void
{
    echo htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function ref001_section(string $name): void
{
    require __DIR__ . '/../template-parts/ref001/' . $name . '.php';
}

function ref001_course_domain(): array
{
    return require __DIR__ . '/../inc/course-domain.php';
}

function ref001_figma_authority(): array
{
    static $authority;

    if ($authority === null) {
        $authority = require __DIR__ . '/../inc/figma-authority.php';
    }

    return $authority;
}

function ref001_figma_frame_attrs(): string
{
    $authority = ref001_figma_authority();
    $pc = (string) ($authority['frames']['pc']['node'] ?? '');
    $sp = (string) ($authority['frames']['sp']['node'] ?? '');

    return sprintf(
        ' data-figma-pc="%s" data-figma-sp="%s"',
        htmlspecialchars($pc, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($sp, ENT_QUOTES, 'UTF-8')
    );
}

function ref001_figma_section_attrs(string $name): string
{
    static $occurrences = [];

    $index = $occurrences[$name] ?? 0;
    $occurrences[$name] = $index + 1;

    $entry = ref001_figma_authority()['sections'][$name] ?? null;
    if (!is_array($entry)) {
        return '';
    }

    $pc = $entry['pc'][$index] ?? null;
    $sp = $entry['sp'][$index] ?? null;
    if (!is_string($pc) || !is_string($sp)) {
        return '';
    }

    return sprintf(
        ' data-figma-pc="%s" data-figma-sp="%s"',
        htmlspecialchars($pc, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($sp, ENT_QUOTES, 'UTF-8')
    );
}

// ---------------------------------------------------------------------
// Assets (namespaced under theme_root/assets-ref001/ so nothing in cku's
// own root-level images/js/css directories is touched or shadowed)
// ---------------------------------------------------------------------

function ref001_assets(): array
{
    static $assets;

    if ($assets === null) {
        $assets = require __DIR__ . '/../inc/asset-map.php';
    }

    return $assets;
}

function ref001_asset_url(string $path): string
{
    if (!function_exists('get_stylesheet_directory_uri')) {
        return $path;
    }

    return rtrim(get_stylesheet_directory_uri(), '/') . '/assets-ref001/' . ltrim($path, '/');
}

function ref001_icon_url(string $key): string
{
    $assets = ref001_assets();
    return ref001_asset_url($assets['icons'][$key] ?? '');
}

function ref001_link_url(string $key): string
{
    $assets = ref001_assets();
    return (string) ($assets['links'][$key] ?? '#');
}

/**
 * Render a REF-001 fixture-slot <picture> (PC/SP source pair from asset-map.php).
 */
function ref001_picture(string $slot, string $class = '', string $alt = '', bool $eager = false): void
{
    $entry = ref001_assets()['images'][$slot] ?? null;
    if (!is_array($entry) || empty($entry['pc']) || empty($entry['sp'])) {
        return;
    }

    $figma = is_array($entry['figma'] ?? null) ? $entry['figma'] : [];

    ref001_picture_urls(
        ref001_asset_url((string) $entry['pc']),
        ref001_asset_url((string) $entry['sp']),
        $class,
        $alt,
        $eager,
        $slot,
        isset($figma['pc']) ? (string) $figma['pc'] : '',
        isset($figma['sp']) ? (string) $figma['sp'] : ''
    );
}

/**
 * Render an ACF-sourced <picture>. ACF Image fields return one editor-uploaded
 * asset (no separate PC/SP crop authored by the editor), so the same URL is
 * used for both <source> and <img> -- this keeps the exact same `.ref-picture`
 * markup shape the frozen CSS expects, it just is not responsive-cropped.
 */
function ref001_picture_from_acf_image(?array $image, string $class = '', bool $eager = false): void
{
    if (empty($image['url'])) {
        return;
    }

    $url = (string) $image['url'];
    $alt = (string) ($image['alt'] ?? '');
    ref001_picture_urls($url, $url, $class, $alt, $eager, 'acf-image');
}

function ref001_picture_urls(string $pc, string $sp, string $class, string $alt, bool $eager, string $slot, string $figmaPc = '', string $figmaSp = ''): void
{
    $loading = $eager ? 'eager' : 'lazy';

    $figmaAttrs = '';
    if ($figmaPc !== '') {
        $figmaAttrs .= ' data-figma-pc="' . htmlspecialchars($figmaPc, ENT_QUOTES, 'UTF-8') . '"';
    }
    if ($figmaSp !== '') {
        $figmaAttrs .= ' data-figma-sp="' . htmlspecialchars($figmaSp, ENT_QUOTES, 'UTF-8') . '"';
    }

    printf(
        '<picture class="ref-picture %s" data-asset-slot="%s"%s>',
        htmlspecialchars($class, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($slot, ENT_QUOTES, 'UTF-8'),
        $figmaAttrs
    );
    printf(
        '<source media="(max-width:767px)" srcset="%s">',
        htmlspecialchars($sp, ENT_QUOTES, 'UTF-8')
    );
    printf(
        '<img src="%s" alt="%s" loading="%s" decoding="async">',
        htmlspecialchars($pc, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($alt, ENT_QUOTES, 'UTF-8'),
        $loading
    );
    echo '</picture>';
}

function ref001_icon(string $key, string $class = ''): void
{
    $url = ref001_icon_url($key);
    if ($url === '') {
        return;
    }

    printf(
        '<img class="ref-svg-icon %s" src="%s" alt="" aria-hidden="true">',
        htmlspecialchars($class, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($url, ENT_QUOTES, 'UTF-8')
    );
}

function ref001_asset_version(string $relativePath): string
{
    if (!function_exists('get_stylesheet_directory')) {
        return '1.0.0';
    }

    $path = get_stylesheet_directory() . '/assets-ref001/' . ltrim($relativePath, '/');
    return is_file($path) ? (string) filemtime($path) : '1.0.0';
}

// ---------------------------------------------------------------------
// Enqueue -- follows cku's own functions/EnqueueStyle.php / EnqueueScript.php
// conditional-load convention (`new EnqueueStyle(..., function () {...})`),
// scoped only to the new page template so nothing loads site-wide. cku
// already enqueues Swiper 8 globally (front-page.php carousel); REF-001's
// own assets/js/ref001-interactions.js self-detects `window.Swiper` before
// loading its own copy, so no duplicate Swiper enqueue is introduced here.
// ---------------------------------------------------------------------

function ref001_is_page_template(): bool
{
    return function_exists('is_page_template') && is_page_template(REF001_PAGE_TEMPLATE);
}

// Matches cku's own functions.php convention: `new EnqueueStyle(...)` /
// `new EnqueueScript(...)` are instantiated directly at file scope (each
// class registers its own internal `wp_enqueue_scripts` action), not
// nested inside an outer wp_enqueue_scripts callback -- nesting would
// register the inner action too late in that hook's priority pass to fire.
if (class_exists('EnqueueStyle')) {
    new EnqueueStyle(
        'ref001-style',
        ref001_asset_url('assets/css/ref001.css'),
        [],
        ref001_asset_version('assets/css/ref001.css'),
        'all',
        function () { return ref001_is_page_template(); }
    );
} elseif (function_exists('add_action')) {
    add_action('wp_enqueue_scripts', function () {
        if (ref001_is_page_template()) {
            wp_enqueue_style('ref001-style', ref001_asset_url('assets/css/ref001.css'), [], ref001_asset_version('assets/css/ref001.css'));
        }
    });
}

if (class_exists('EnqueueScript')) {
    new EnqueueScript(
        'ref001-interactions',
        ref001_asset_url('assets/js/ref001-interactions.js'),
        [],
        ref001_asset_version('assets/js/ref001-interactions.js'),
        true,
        false,
        function () { return ref001_is_page_template(); }
    );
} elseif (function_exists('add_action')) {
    add_action('wp_enqueue_scripts', function () {
        if (ref001_is_page_template()) {
            wp_enqueue_script('ref001-interactions', ref001_asset_url('assets/js/ref001-interactions.js'), [], ref001_asset_version('assets/js/ref001-interactions.js'), true);
        }
    });
}

// ---------------------------------------------------------------------
// ACF repeater helpers for Student Voice / Swiper, with a fixture-content
// fallback so an inactive/absent ACF PRO, or an ACF field with 0 rows,
// never triggers a PHP warning and never blanks the section -- it just
// renders the same Human-Reviewed fixture content REF-001 already ships.
// ---------------------------------------------------------------------

/**
 * @param string $acf_field   ACF repeater field name (e.g. ref001_student_voices)
 * @param array<int,string> $sub_fields  ACF sub_field names to read per row
 * @param array<int,array<string,mixed>> $fixture_rows  fallback rows, same shape
 * @return array<int,array<string,mixed>>
 */
function ref001_repeater_or_fixture(string $acf_field, array $sub_fields, array $fixture_rows): array
{
    if (function_exists('have_rows') && function_exists('the_row') && function_exists('get_sub_field')) {
        if (have_rows($acf_field)) {
            $rows = [];
            while (have_rows($acf_field)) {
                the_row();
                $row = [];
                foreach ($sub_fields as $key) {
                    $row[$key] = get_sub_field($key);
                }
                $rows[] = $row;
            }
            if (!empty($rows)) {
                return $rows;
            }
        }
    }

    return $fixture_rows;
}

function ref001_student_voices(): array
{
    $fixture = ref001_fixture_data();
    $slots = [1 => ['avatar' => 'voice-1-avatar', 'detail' => 'voice-1-detail'],
              2 => ['avatar' => 'voice-2-avatar', 'detail' => 'voice-1-detail'],
              3 => ['avatar' => 'voice-3-avatar', 'detail' => 'voice-1-detail']];

    $fixtureRows = [];
    foreach ($slots as $n => $slot) {
        $fixtureRows[] = [
            'avatar' => null,
            'avatar_slot' => $slot['avatar'],
            'detail_photo' => null,
            'detail_photo_slot' => $slot['detail'],
            'title' => $fixture["voice_{$n}_title"] ?? '',
            'profile' => $fixture["voice_{$n}_profile"] ?? '',
            'school' => $fixture["voice_{$n}_school"] ?? '',
            'body' => $fixture["voice_{$n}_body"] ?? '',
            'lesson' => $fixture["voice_{$n}_lesson"] ?? '',
            'reason' => $fixture["voice_{$n}_reason"] ?? '',
            'advice' => $fixture["voice_{$n}_advice"] ?? '',
        ];
    }

    return ref001_repeater_or_fixture(
        'ref001_student_voices',
        ['avatar', 'detail_photo', 'title', 'profile', 'school', 'body', 'lesson', 'reason', 'advice'],
        $fixtureRows
    );
}

function ref001_swiper_slides(): array
{
    $fixture = ref001_fixture_data();
    $pcLines = [
        1 => ['大学で培った企画力を武器に、', '今はIT企業のマーケターとして挑戦の毎日です！'],
        2 => ['ゼミで身につけた行動力を活かして、', '地域と企業をつなぐ仕事に挑戦しています！'],
        3 => ['数字と向き合う力が自信になり、', '会計の知識を活かせる進路が見えてきました！'],
        4 => ['先生や仲間と考え抜いた経験を糧に、', '自分らしい働き方を目指しています！'],
    ];
    $spLines = [
        1 => ['大学で培った企画力を武器に、', '今はIT企業のマーケターとして', '挑戦の毎日です！'],
        2 => ['ゼミで身につけた行動力を活かして、', '地域と企業をつなぐ仕事に', '挑戦しています！'],
        3 => ['数字と向き合う力が自信になり、', '会計の知識を活かせる進路が', '見えてきました！'],
        4 => ['先生や仲間と考え抜いた経験を糧に、', '自分らしい働き方を', '目指しています！'],
    ];
    $imageSlots = [1 => 'messages-photo', 2 => 'reason-1', 3 => 'reason-2', 4 => 'reason-3'];
    $profileKeys = [1 => 'message_profile', 2 => 'message_2_profile', 3 => 'message_3_profile', 4 => 'message_4_profile'];
    $schoolKeys = [1 => 'message_school', 2 => 'message_2_school', 3 => 'message_3_school', 4 => 'message_4_school'];

    $fixtureRows = [];
    foreach ([1, 2, 3, 4] as $n) {
        $fixtureRows[] = [
            'photo' => null,
            'photo_slot' => $imageSlots[$n],
            'quote_pc' => implode("\n", $pcLines[$n]),
            'quote_sp' => implode("\n", $spLines[$n]),
            'profile' => $fixture[$profileKeys[$n]] ?? '',
            'school' => $fixture[$schoolKeys[$n]] ?? '',
        ];
    }

    return ref001_repeater_or_fixture(
        'ref001_swiper_slides',
        ['photo', 'quote_pc', 'quote_sp', 'profile', 'school'],
        $fixtureRows
    );
}
