<?php
if (!defined('REF001_FIXTURE_MODE')) { define('REF001_FIXTURE_MODE', false); }
function ref001_fixture_data(): array { static $data; if ($data === null) { $data = require __DIR__ . '/inc/fixture-content.php'; } return $data; }
function ref001_get(string $key, $fallback = '') { if (function_exists('get_field') && !REF001_FIXTURE_MODE) { $value = get_field($key); if ($value !== null && $value !== false && $value !== '') return $value; } $data = ref001_fixture_data(); return array_key_exists($key,$data) ? $data[$key] : $fallback; }
function ref001_e($value): void { echo htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }
function ref001_section(string $name): void { require __DIR__ . '/template-parts/sections/' . $name . '.php'; }
function ref001_course_domain(): array { return require __DIR__ . '/inc/course-domain.php'; }
if (function_exists('add_action')) { add_action('wp_enqueue_scripts', function(){
    wp_enqueue_style('ref001-clean-first-pass', get_stylesheet_uri(), [], '0.1.0');
    wp_enqueue_style('ref001-clean-responsive-continuity', get_stylesheet_directory_uri() . '/responsive-continuity.css', ['ref001-clean-first-pass'], '0.1.0');
    wp_enqueue_style('ref001-clean-visual-repair', get_stylesheet_directory_uri() . '/visual-repair.css', ['ref001-clean-responsive-continuity'], '0.1.0');
}); }
