<?php
/**
 * Seed realistic local QA posts for the 月刊「武道」 detail/latest templates.
 *
 * Usage:
 *   wp eval-file scripts/seed-budo-detail-qa.php
 *
 * QA-only: uses existing production ACF field names and does not alter field groups.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budo detail QA outside local WordPress.');
}

if (!function_exists('update_field')) {
    WP_CLI::error('ACF PRO is required; refusing to fake ACF values with hard-coded template data.');
}

require_once __DIR__ . '/fixture-image.php';

function nbk_budo_qa_image_id(string $seed): int
{
    $option_key = '_nbk_budo_qa_image_' . sanitize_key($seed);
    $existing = (int) get_option($option_key, 0);
    if ($existing > 0 && get_post($existing)) {
        return $existing;
    }

    $upload = wp_upload_bits(
        'budo-qa-' . sanitize_file_name($seed) . '.png',
        null,
        standalone_lp_fixture_png_bytes($seed)
    );
    if (!empty($upload['error'])) {
        WP_CLI::error('QA media upload failed: ' . $upload['error']);
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    $attachment_id = wp_insert_attachment([
        'post_mime_type' => 'image/png',
        'post_title'     => 'Budo detail QA cover ' . $seed,
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

function nbk_budo_qa_upsert(array $case): int
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
    foreach (['budo_month', 'budo_size', 'budo_page', 'budo_price', 'budo_teiki'] as $field_name) {
        update_field($field_name, $case['fields'][$field_name] ?? '', $post_id);
    }

    if (!empty($case['cover'])) {
        set_post_thumbnail($post_id, nbk_budo_qa_image_id($case['cover']));
    } else {
        delete_post_thumbnail($post_id);
    }

    update_post_meta($post_id, '_nbk_qa_fixture', 'budo-detail');
    update_post_meta($post_id, '_nbk_qa_case', $case['case']);

    return $post_id;
}

$cases = [
    [
        'case'    => 'full',
        'slug'    => 'qa-budo-detail-full',
        'title'   => '月刊「武道」2026年9月号 QA',
        'date'    => '2026-09-16 07:30:00',
        'cover'   => 'full',
        'content' => '<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">QA 本文見出し</h3><!-- /wp:heading --><!-- wp:paragraph --><p>画像・書誌情報・本文が同時に存在する通常ケースです。CTA と本文の間隔も確認します。</p><!-- /wp:paragraph -->',
        'fields'  => [
            'budo_month' => '2026年9月号',
            'budo_size'  => 'A5判',
            'budo_page'  => '192ページ',
            'budo_price' => '本体556円（税込）',
            'budo_teiki' => '1年間6,666円（税込・送料込） / 半年間3,333円（税込・送料込）',
        ],
    ],
    [
        'case'    => 'long',
        'slug'    => 'qa-budo-detail-long',
        'title'   => '月刊「武道」非常に長いタイトルと書誌情報の折り返し確認用 QA 2026年特別増刊号',
        'date'    => '2026-09-15 07:30:00',
        'cover'   => 'long',
        'content' => '<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">長文 QA 本文</h3><!-- /wp:heading --><!-- wp:paragraph --><p>PC/SP の両方で、タイトル・書誌値・本文が複数行になった際の余白、改行、整列、CTA との距離を確認するための長文です。</p><!-- /wp:paragraph -->',
        'fields'  => [
            'budo_month' => '2026年9月 特別増刊・長い月号表記の折り返し確認',
            'budo_size'  => 'A5判・特殊製本仕様・長い版型説明が入った場合の表示確認',
            'budo_page'  => '本文192ページ＋別冊付録48ページ＋資料編を含む長いページ情報',
            'budo_price' => '本体556円（税込）・付録込み・長い価格注記が続いた場合の折り返し確認',
            'budo_teiki' => '1年間6,666円（税込・送料込） / 半年間3,333円（税込・送料込） / 長い注記が続いてもレイアウトを壊さないことを確認',
        ],
    ],
    [
        'case'    => 'empty',
        'slug'    => 'qa-budo-detail-empty',
        'title'   => '月刊「武道」空値表示 QA',
        'date'    => '2026-09-14 07:30:00',
        'cover'   => '',
        'content' => '<!-- wp:paragraph --><p>ACF とアイキャッチが空でも、空ラベルやダミー値を出さず本文だけが自然につながることを確認します。</p><!-- /wp:paragraph -->',
        'fields'  => [
            'budo_month' => '',
            'budo_size'  => '',
            'budo_page'  => '',
            'budo_price' => '',
            'budo_teiki' => '',
        ],
    ],
];

$ids = [];
foreach ($cases as $case) {
    $ids[$case['case']] = nbk_budo_qa_upsert($case);
}

update_option('budokan_budo_detail_qa_ids', $ids, false);
flush_rewrite_rules(false);
WP_CLI::success(sprintf(
    'Seeded budo detail QA posts: full #%d, long #%d, empty #%d.',
    $ids['full'],
    $ids['long'],
    $ids['empty']
));
