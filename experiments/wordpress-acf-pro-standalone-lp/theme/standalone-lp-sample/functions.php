<?php
declare(strict_types=1);

add_action('after_setup_theme', static function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
});

add_action('wp_enqueue_scripts', static function (): void {
    wp_enqueue_style(
        'standalone-lp-sample',
        get_theme_file_uri('/assets/css/lp.css'),
        [],
        '0.1.0'
    );
});

// This is disposable local validation infrastructure, never a crawlable site.
add_filter('wp_robots', static function (array $robots): array {
    $robots['noindex'] = true;
    $robots['nofollow'] = true;
    $robots['noarchive'] = true;
    return $robots;
});

add_filter('robots_txt', static function (string $output, bool $public): string {
    unset($public);
    return "User-agent: *\nDisallow: /\n";
}, 10, 2);

// The committed Local JSON is mounted read-only as fixture source evidence.
// Redirect any ACF runtime/import writes into the disposable WordPress volume.
add_filter('acf/settings/save_json', static function (string $path): string {
    $runtime_path = WP_CONTENT_DIR . '/uploads/acf-json-runtime';
    if (!is_dir($runtime_path)) {
        wp_mkdir_p($runtime_path);
    }
    return $runtime_path;
});

function standalone_lp_normalize_link(mixed $value): ?array
{
    if (!is_array($value) || empty($value['url'])) {
        return null;
    }

    return [
        'url' => esc_url((string) $value['url']),
        'title' => sanitize_text_field((string) ($value['title'] ?? '')),
        'target' => in_array(($value['target'] ?? ''), ['_blank', '_self'], true) ? (string) $value['target'] : '_self',
    ];
}
