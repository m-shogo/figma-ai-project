<?php
/**
 * REF-001 V3 bootstrap.
 * Isolated from V2. Canonical rasters live at implementation/theme/assets/images/ref001/rendered/.
 */
if (!defined('V3_FIXTURE_MODE')) {
    define('V3_FIXTURE_MODE', true);
}

define('V3_IMPL_DIR', dirname(__DIR__));
define('V3_REPO_ROOT', realpath(V3_IMPL_DIR . '/../../..'));

function v3_data(): array
{
    static $data;
    if ($data === null) {
        $data = require V3_IMPL_DIR . '/data/page.php';
    }
    return $data;
}

function v3_assets(): array
{
    static $assets;
    if ($assets === null) {
        $assets = require V3_IMPL_DIR . '/data/assets.php';
    }
    return $assets;
}

function v3_courses(): array
{
    static $courses;
    if ($courses === null) {
        $courses = require V3_IMPL_DIR . '/data/courses.php';
    }
    return $courses;
}

function v3_e($value): void
{
    echo htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function v3_web_prefix(): string
{
    // Serve from the repository root (`php -S 127.0.0.1:8766 -t .`).
    return '/';
}

function v3_repo_url(string $repoRelative): string
{
    return v3_web_prefix() . ltrim(str_replace('\\', '/', $repoRelative), '/');
}

function v3_impl_url(string $implRelative): string
{
    return $implRelative;
}

function v3_section(string $name, array $props = []): void
{
    $path = V3_IMPL_DIR . '/sections/' . $name . '.php';
    if (!is_file($path)) {
        throw new RuntimeException('Missing V3 section: ' . $name);
    }
    $section = $props;
    require $path;
}

function v3_component(string $name, array $props = []): void
{
    $path = V3_IMPL_DIR . '/components/' . $name . '.php';
    if (!is_file($path)) {
        throw new RuntimeException('Missing V3 component: ' . $name);
    }
    extract($props, EXTR_SKIP);
    require $path;
}

function v3_link(string $key): string
{
    $assets = v3_assets();
    return (string) ($assets['links'][$key] ?? '#');
}

function v3_icon_url(string $key): string
{
    $assets = v3_assets();
    $path = $assets['icons'][$key] ?? '';
    return $path === '' ? '' : v3_impl_url($path);
}

function v3_picture(string $slot, string $class = '', string $alt = '', bool $eager = false): void
{
    $entry = v3_assets()['images'][$slot] ?? null;
    if (!is_array($entry)) {
        return;
    }
    $pc = v3_repo_url((string) $entry['pc']);
    $sp = v3_repo_url((string) $entry['sp']);
    $loading = $eager ? 'eager' : 'lazy';
    $nodePc = htmlspecialchars((string) ($entry['figma']['pc'] ?? ''), ENT_QUOTES, 'UTF-8');
    $nodeSp = htmlspecialchars((string) ($entry['figma']['sp'] ?? ''), ENT_QUOTES, 'UTF-8');
    echo '<picture class="v3-picture ' . htmlspecialchars($class, ENT_QUOTES, 'UTF-8') . '" data-asset-slot="' . htmlspecialchars($slot, ENT_QUOTES, 'UTF-8') . '" data-figma-pc="' . $nodePc . '" data-figma-sp="' . $nodeSp . '">';
    echo '<source media="(max-width:767px)" srcset="' . htmlspecialchars($sp, ENT_QUOTES, 'UTF-8') . '">';
    echo '<img src="' . htmlspecialchars($pc, ENT_QUOTES, 'UTF-8') . '" alt="' . htmlspecialchars($alt, ENT_QUOTES, 'UTF-8') . '" loading="' . $loading . '" decoding="async">';
    echo '</picture>';
}

function v3_icon(string $key, string $class = ''): void
{
    $url = v3_icon_url($key);
    if ($url === '') {
        return;
    }
    echo '<img class="v3-icon ' . htmlspecialchars($class, ENT_QUOTES, 'UTF-8') . '" src="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '" alt="" aria-hidden="true">';
}
