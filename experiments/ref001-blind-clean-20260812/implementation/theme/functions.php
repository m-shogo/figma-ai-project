<?php
if (!defined('REF001_FIXTURE_MODE')) { define('REF001_FIXTURE_MODE', false); }
function ref001_fixture_data(): array { static $data; if ($data === null) { $data = require __DIR__ . '/inc/fixture-content.php'; } return $data; }
function ref001_get(string $key, $fallback = '') { if (function_exists('get_field') && !REF001_FIXTURE_MODE) { $value = get_field($key); if ($value !== null && $value !== false && $value !== '') return $value; } $data = ref001_fixture_data(); return array_key_exists($key,$data) ? $data[$key] : $fallback; }
function ref001_e($value): void { echo htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }
function ref001_section(string $name): void { require __DIR__ . '/template-parts/sections/' . $name . '.php'; }
function ref001_course_domain(): array { return require __DIR__ . '/inc/course-domain.php'; }
function ref001_assets(): array { static $assets; if ($assets === null) { $assets = require __DIR__ . '/inc/asset-map.php'; } return $assets; }
function ref001_asset_url(string $path): string {
    if (REF001_FIXTURE_MODE || !function_exists('get_stylesheet_directory_uri')) return $path;
    return rtrim(get_stylesheet_directory_uri(), '/') . '/' . ltrim($path, '/');
}
function ref001_icon_url(string $key): string {
    $assets = ref001_assets();
    return ref001_asset_url($assets['icons'][$key] ?? '');
}
function ref001_link_url(string $key): string {
    $assets = ref001_assets();
    return (string)($assets['links'][$key] ?? '#');
}
function ref001_picture(string $slot, string $class = '', string $alt = '', bool $eager = false): void {
    $assets = ref001_assets();
    $entry = $assets['images'][$slot] ?? null;
    if (!is_array($entry) || empty($entry['pc']) || empty($entry['sp'])) return;
    $pc = ref001_asset_url((string)$entry['pc']);
    $sp = ref001_asset_url((string)$entry['sp']);
    $loading = $eager ? 'eager' : 'lazy';
    echo '<picture class="ref-picture ' . htmlspecialchars($class, ENT_QUOTES, 'UTF-8') . '" data-asset-slot="' . htmlspecialchars($slot, ENT_QUOTES, 'UTF-8') . '">';
    echo '<source media="(max-width:767px)" srcset="' . htmlspecialchars($sp, ENT_QUOTES, 'UTF-8') . '">';
    echo '<img src="' . htmlspecialchars($pc, ENT_QUOTES, 'UTF-8') . '" alt="' . htmlspecialchars($alt, ENT_QUOTES, 'UTF-8') . '" loading="' . $loading . '" decoding="async">';
    echo '</picture>';
}
function ref001_icon(string $key, string $class = ''): void {
    $url = ref001_icon_url($key);
    if ($url === '') return;
    echo '<img class="ref-svg-icon ' . htmlspecialchars($class, ENT_QUOTES, 'UTF-8') . '" src="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '" alt="" aria-hidden="true">';
}
if (function_exists('add_action')) { add_action('wp_enqueue_scripts', function(){
    wp_enqueue_style('ref001-clean-first-pass', get_stylesheet_uri(), [], '0.1.0');
    wp_enqueue_style('ref001-clean-responsive-continuity', get_stylesheet_directory_uri() . '/responsive-continuity.css', ['ref001-clean-first-pass'], '0.1.0');
    wp_enqueue_style('ref001-clean-visual-repair', get_stylesheet_directory_uri() . '/visual-repair.css', ['ref001-clean-responsive-continuity'], '0.1.0');
    wp_enqueue_style('ref001-human-review-repair', get_stylesheet_directory_uri() . '/human-review-repair.css', ['ref001-clean-visual-repair'], '0.1.0');
    wp_enqueue_style('ref001-v2-visual-polish', get_stylesheet_directory_uri() . '/v2-visual-polish.css', ['ref001-human-review-repair'], '0.1.0');
    wp_enqueue_style('ref001-v2-reason-polish', get_stylesheet_directory_uri() . '/v2-reason-polish.css', ['ref001-v2-visual-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-education-polish', get_stylesheet_directory_uri() . '/v2-education-polish.css', ['ref001-v2-reason-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-student-voice-polish', get_stylesheet_directory_uri() . '/v2-student-voice-polish.css', ['ref001-v2-education-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-messages-polish', get_stylesheet_directory_uri() . '/v2-messages-polish.css', ['ref001-v2-student-voice-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-courses-polish', get_stylesheet_directory_uri() . '/v2-courses-polish.css', ['ref001-v2-messages-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-header-polish', get_stylesheet_directory_uri() . '/v2-header-polish.css', ['ref001-v2-courses-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-links-polish', get_stylesheet_directory_uri() . '/v2-links-polish.css', ['ref001-v2-header-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-shared-cta-polish', get_stylesheet_directory_uri() . '/v2-shared-cta-polish.css', ['ref001-v2-links-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-cta-value-polish', get_stylesheet_directory_uri() . '/v2-cta-value-polish.css', ['ref001-v2-shared-cta-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-continuity-fixes', get_stylesheet_directory_uri() . '/v2-continuity-fixes.css', ['ref001-v2-cta-value-polish'], '0.1.0');
    wp_enqueue_style('ref001-v2-hotspot-repair', get_stylesheet_directory_uri() . '/v2-hotspot-repair.css', ['ref001-v2-continuity-fixes'], '0.1.0');
    wp_enqueue_style('ref001-v2-footer-sns-position', get_stylesheet_directory_uri() . '/v2-footer-sns-position.css', ['ref001-v2-hotspot-repair'], '0.1.0');
    wp_enqueue_style('ref001-v2-speech-fluid-experiment', get_stylesheet_directory_uri() . '/v2-speech-fluid-experiment.css', ['ref001-v2-footer-sns-position'], '0.1.0');
    wp_enqueue_style('ref001-v2-speech-variable-layout', get_stylesheet_directory_uri() . '/v2-speech-variable-layout.css', ['ref001-v2-speech-fluid-experiment'], '0.1.0');
    wp_enqueue_style('ref001-v2-intermediate-desktop', get_stylesheet_directory_uri() . '/v2-intermediate-desktop.css', ['ref001-v2-speech-variable-layout'], '0.1.0');
    wp_enqueue_style('ref001-v2-mobile-fluid', get_stylesheet_directory_uri() . '/v2-mobile-fluid.css', ['ref001-v2-intermediate-desktop'], '0.1.0');
    wp_enqueue_style('ref001-v2-intermediate-mv', get_stylesheet_directory_uri() . '/v2-intermediate-mv.css', ['ref001-v2-mobile-fluid'], '0.1.0');
    wp_enqueue_style('ref001-v2-typography-fidelity', get_stylesheet_directory_uri() . '/v2-typography-fidelity.css', ['ref001-v2-intermediate-mv'], '0.1.0');
}); }
