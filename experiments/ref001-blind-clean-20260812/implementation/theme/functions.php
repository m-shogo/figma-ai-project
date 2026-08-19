<?php

if (!defined('REF001_FIXTURE_MODE')) {
    define('REF001_FIXTURE_MODE', false);
}

function ref001_fixture_data(): array
{
    static $data;

    if ($data === null) {
        $data = require __DIR__ . '/inc/fixture-content.php';
    }

    return $data;
}

function ref001_get(string $key, $fallback = '')
{
    if (function_exists('get_field') && !REF001_FIXTURE_MODE) {
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
    require __DIR__ . '/template-parts/sections/' . $name . '.php';
}

function ref001_course_domain(): array
{
    return require __DIR__ . '/inc/course-domain.php';
}

function ref001_figma_authority(): array
{
    static $authority;

    if ($authority === null) {
        $authority = require __DIR__ . '/inc/figma-authority.php';
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

function ref001_assets(): array
{
    static $assets;

    if ($assets === null) {
        $assets = require __DIR__ . '/inc/asset-map.php';
    }

    return $assets;
}

function ref001_asset_url(string $path): string
{
    if (REF001_FIXTURE_MODE || !function_exists('get_stylesheet_directory_uri')) {
        return $path;
    }

    return rtrim(get_stylesheet_directory_uri(), '/') . '/' . ltrim($path, '/');
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

function ref001_picture(string $slot, string $class = '', string $alt = '', bool $eager = false): void
{
    $entry = ref001_assets()['images'][$slot] ?? null;
    if (!is_array($entry) || empty($entry['pc']) || empty($entry['sp'])) {
        return;
    }

    $pc = ref001_asset_url((string) $entry['pc']);
    $sp = ref001_asset_url((string) $entry['sp']);
    $loading = $eager ? 'eager' : 'lazy';
    $figma = is_array($entry['figma'] ?? null) ? $entry['figma'] : [];

    $figmaPc = isset($figma['pc'])
        ? ' data-figma-pc="' . htmlspecialchars((string) $figma['pc'], ENT_QUOTES, 'UTF-8') . '"'
        : '';
    $figmaSp = isset($figma['sp'])
        ? ' data-figma-sp="' . htmlspecialchars((string) $figma['sp'], ENT_QUOTES, 'UTF-8') . '"'
        : '';

    printf(
        '<picture class="ref-picture %s" data-asset-slot="%s"%s%s>',
        htmlspecialchars($class, ENT_QUOTES, 'UTF-8'),
        htmlspecialchars($slot, ENT_QUOTES, 'UTF-8'),
        $figmaPc,
        $figmaSp
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

    $path = get_stylesheet_directory() . '/' . ltrim($relativePath, '/');
    return is_file($path) ? (string) filemtime($path) : '1.0.0';
}

function ref001_enqueue_assets(): void
{
    $base = rtrim(get_stylesheet_directory_uri(), '/');

    wp_enqueue_style(
        'ref001',
        $base . '/assets/css/ref001.css',
        [],
        ref001_asset_version('assets/css/ref001.css')
    );

    wp_enqueue_script(
        'ref001-interactions',
        $base . '/assets/js/ref001-interactions.js',
        [],
        ref001_asset_version('assets/js/ref001-interactions.js'),
        true
    );
}

if (function_exists('add_action')) {
    add_action('wp_enqueue_scripts', 'ref001_enqueue_assets');
}
