<?php

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

$fixture_path = $args[0] ?? '';
if ($fixture_path === '' || !is_file($fixture_path)) {
    WP_CLI::error('Fixture JSON not found: ' . $fixture_path);
}

try {
    $fixture = json_decode((string) file_get_contents($fixture_path), true, 512, JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    WP_CLI::error('Invalid fixture JSON: ' . $error->getMessage());
}

if (!function_exists('is_plugin_active')) {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
}
if (!function_exists('update_field') || !is_plugin_active('advanced-custom-fields-pro/acf.php')) {
    WP_CLI::error('ACF PRO is required; refusing to fake the full E2E path.');
}

require_once __DIR__ . '/fixture-image.php';

function fixture_image_id(?string $seed): int
{
    if (!$seed) {
        return 0;
    }

    $option_key = '_standalone_lp_fixture_image_v2_' . sanitize_key($seed);
    $existing = (int) get_option($option_key, 0);
    if ($existing > 0 && get_post($existing)) {
        return $existing;
    }

    $bytes = standalone_lp_fixture_png_bytes($seed);
    $upload = wp_upload_bits('sample-theme-' . sanitize_file_name($seed) . '.png', null, $bytes);
    if (!empty($upload['error'])) {
        WP_CLI::error('Fixture media upload failed: ' . $upload['error']);
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    $attachment_id = wp_insert_attachment([
        'post_mime_type' => 'image/png',
        'post_title' => 'Sample Theme fixture ' . $seed,
        'post_status' => 'inherit',
    ], $upload['file']);
    if (is_wp_error($attachment_id)) {
        WP_CLI::error($attachment_id->get_error_message());
    }
    wp_update_attachment_metadata($attachment_id, wp_generate_attachment_metadata($attachment_id, $upload['file']));
    update_option($option_key, (int) $attachment_id, false);
    return (int) $attachment_id;
}

$page_data = $fixture['page'] ?? [];
$slug = sanitize_title((string) ($page_data['slug'] ?? 'sample-theme'));
$title = sanitize_text_field((string) ($page_data['title'] ?? 'Sample Theme Fixture'));
$page = get_page_by_path($slug, OBJECT, 'page');

if ($page) {
    $page_id = (int) $page->ID;
    wp_update_post(['ID' => $page_id, 'post_title' => $title, 'post_status' => 'publish']);
} else {
    $page_id = wp_insert_post([
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_title' => $title,
        'post_name' => $slug,
    ], true);
    if (is_wp_error($page_id)) {
        WP_CLI::error($page_id->get_error_message());
    }
    $page_id = (int) $page_id;
}

update_post_meta($page_id, '_wp_page_template', 'page-lp.php');
$fields = $fixture['fields'] ?? [];
update_field('field_lp_hero_title', (string) ($fields['hero_title'] ?? ''), $page_id);
update_field('field_lp_hero_body', (string) ($fields['hero_body'] ?? ''), $page_id);
update_field('field_lp_hero_cta', $fields['hero_cta'] ?? null, $page_id);

$rows = [];
foreach (($fields['cards'] ?? []) as $card) {
    $rows[] = [
        'field_lp_card_title' => (string) ($card['title'] ?? ''),
        'field_lp_card_body' => (string) ($card['body'] ?? ''),
        'field_lp_card_image' => fixture_image_id(isset($card['image']) ? (string) $card['image'] : null),
        'field_lp_card_link' => $card['link'] ?? null,
    ];
}
update_field('field_lp_cards', $rows, $page_id);

update_option('show_on_front', 'page');
update_option('page_on_front', $page_id);
update_option('blog_public', '0');
update_option('standalone_lp_fixture_id', sanitize_key((string) ($fixture['id'] ?? 'unknown')), false);
flush_rewrite_rules(false);

WP_CLI::success(sprintf('Applied fixture %s to page #%d (%d cards).', $fixture['id'] ?? 'unknown', $page_id, count($rows)));
