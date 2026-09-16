<?php
/**
 * Seed local QA posts for /publications/budo/back/.
 *
 * Usage:
 *   wp eval-file scripts/seed-budo-back-qa.php
 *
 * QA-only: uses existing production fields; does not alter ACF field groups.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (!function_exists('update_field')) {
    WP_CLI::error('ACF PRO is required; refusing to fake publication values in templates.');
}

require_once __DIR__ . '/fixture-image.php';

function nbk_budo_back_qa_image_id(string $seed): int
{
    $option_key = '_nbk_budo_back_qa_image_' . sanitize_key($seed);
    $existing = (int) get_option($option_key, 0);
    if ($existing > 0 && get_post($existing)) {
        return $existing;
    }

    $upload = wp_upload_bits(
        'budo-back-qa-' . sanitize_file_name($seed) . '.png',
        null,
        standalone_lp_fixture_png_bytes('budo-back-' . $seed)
    );
    if (!empty($upload['error'])) {
        WP_CLI::error('QA media upload failed: ' . $upload['error']);
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    $attachment_id = wp_insert_attachment([
        'post_mime_type' => 'image/png',
        'post_title'     => 'Budo back QA cover ' . $seed,
        'post_status'    => 'inherit',
    ], $upload['file']);
    if (is_wp_error($attachment_id)) {
        WP_CLI::error($attachment_id->get_error_message());
    }

    wp_update_attachment_metadata(
        $attachment_id,
        wp_generate_attachment_metadata($attachment_id, $upload['file'])
    );
    update_option($option_key, (int) $attachment_id, false);

    return (int) $attachment_id;
}

function nbk_budo_back_qa_upsert(array $case): int
{
    $existing = get_page_by_path($case['slug'], OBJECT, 'budo-book');
    $postarr = [
        'post_type'    => 'budo-book',
        'post_status'  => 'publish',
        'post_title'   => $case['title'],
        'post_name'    => $case['slug'],
        'post_date'    => $case['date'],
        'post_content' => $case['content'],
    ];

    if ($existing) {
        $postarr['ID'] = (int) $existing->ID;
        $post_id = wp_update_post($postarr, true);
    } else {
        $post_id = wp_insert_post($postarr, true);
    }
    if (is_wp_error($post_id)) {
        WP_CLI::error($post_id->get_error_message());
    }

    $post_id = (int) $post_id;
    update_field('budo_month', $case['month'], $post_id);
    update_field('budo_backcontent', $case['summary'], $post_id);

    if (!empty($case['cover'])) {
        set_post_thumbnail($post_id, nbk_budo_back_qa_image_id($case['cover']));
    } else {
        delete_post_thumbnail($post_id);
    }

    update_post_meta($post_id, '_nbk_qa_fixture', 'budo-back');
    update_post_meta($post_id, '_nbk_qa_case', $case['case']);

    return $post_id;
}

// The newest fixture is intentionally a sentinel: the back page must exclude it.
$cases = [
    [
        'case' => 'latest-excluded',
        'slug' => 'qa-budo-back-latest-excluded',
        'title' => 'QA 最新号（バック一覧には表示しない）',
        'date' => '2026-09-16 09:00:00',
        'month' => '2026年10月号',
        'summary' => '<p>この投稿がバックナンバー一覧に表示された場合、最新号除外 query の回帰です。</p>',
        'cover' => 'latest',
        'content' => '',
    ],
    [
        'case' => 'full',
        'slug' => 'qa-budo-back-full',
        'title' => 'QA 通常号',
        'date' => '2026-09-15 09:00:00',
        'month' => '2026年9月号',
        'summary' => '<p>【今月の表紙絵】秋の武道館／QA</p><p>【巻頭リレーエッセイ】通常文字量の確認／QA</p><p>【武道人の肖像】一覧本文と詳細導線の間隔を確認します。</p>',
        'cover' => 'full',
        'content' => '',
    ],
    [
        'case' => 'long',
        'slug' => 'qa-budo-back-long',
        'title' => 'QA 長いタイトルと長い月号表記を含むバックナンバー表示確認用特別号',
        'date' => '2026-09-14 09:00:00',
        'month' => '2026年8月 特別増刊・非常に長い月号表記の折り返し確認',
        'summary' => '<p>【日本遺産を往く】非常に長い見出しと筆者名が続いた場合でも、PC/SPの両方で表紙横の本文が自然に折り返し、詳細リンクとの余白が崩れないことを確認するための長文QAです。</p><p>【武道の可能性を探る】二段落以上になった場合の行間と縦方向の伸びも確認します。</p>',
        'cover' => 'long',
        'content' => '',
    ],
    [
        'case' => 'empty-summary',
        'slug' => 'qa-budo-back-empty-summary',
        'title' => 'QA 概要空値',
        'date' => '2026-09-13 09:00:00',
        'month' => '2026年7月号',
        'summary' => '',
        'cover' => 'empty-summary',
        'content' => '',
    ],
    [
        'case' => 'no-image',
        'slug' => 'qa-budo-back-no-image',
        'title' => 'QA 画像なし',
        'date' => '2026-09-12 09:00:00',
        'month' => '2026年6月号',
        'summary' => '<p>アイキャッチが空のとき、空画像やプレースホルダーを捏造せず、既存概要だけで自然に表示されることを確認します。</p>',
        'cover' => '',
        'content' => '',
    ],
];

$ids = [];
foreach ($cases as $case) {
    $ids[$case['case']] = nbk_budo_back_qa_upsert($case);
}

flush_rewrite_rules(false);
WP_CLI::success(sprintf(
    'Seeded Budo back QA posts: latest #%d (must be excluded), full #%d, long #%d, empty-summary #%d, no-image #%d.',
    $ids['latest-excluded'],
    $ids['full'],
    $ids['long'],
    $ids['empty-summary'],
    $ids['no-image']
));
