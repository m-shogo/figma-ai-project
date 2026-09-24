<?php
/**
 * Seed realistic local QA posts for 月刊「書写書道」 list/detail templates.
 *
 * Uses only the existing group_nbk_gekkan_shodou fields. The fixture is local
 * data; it never changes ACF Local JSON or production content contracts.
 *
 * Usage:
 *   wp eval-file scripts/seed-shodou-publication-qa.php
 */

if (!defined('WP_CLI') || !WP_CLI) {
    exit(2);
}
if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Shodou QA outside local WordPress.');
}
if (!function_exists('update_field')) {
    WP_CLI::error('ACF PRO is required; refusing to fake repeater values in templates.');
}

require_once __DIR__ . '/fixture-image.php';

function nbk_shodou_qa_image_id(string $seed): int
{
    $option_key = '_nbk_shodou_qa_image_' . sanitize_key($seed);
    $existing = (int) get_option($option_key, 0);
    if ($existing > 0 && get_post($existing)) {
        return $existing;
    }

    $upload = wp_upload_bits(
        'shodou-qa-' . sanitize_file_name($seed) . '.png',
        null,
        standalone_lp_fixture_png_bytes('shodou-' . $seed)
    );
    if (!empty($upload['error'])) {
        WP_CLI::error('QA image upload failed: ' . $upload['error']);
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    $attachment_id = wp_insert_attachment(array(
        'post_mime_type' => 'image/png',
        'post_title' => 'Shodou QA cover ' . $seed,
        'post_status' => 'inherit',
    ), $upload['file'], 0, true);
    if (is_wp_error($attachment_id)) {
        WP_CLI::error($attachment_id->get_error_message());
    }

    wp_update_attachment_metadata(
        $attachment_id,
        wp_generate_attachment_metadata($attachment_id, $upload['file'])
    );
    update_post_meta($attachment_id, '_wp_attachment_image_alt', 'QA 月刊書写書道 表紙');
    update_option($option_key, (int) $attachment_id, false);

    return (int) $attachment_id;
}

function nbk_shodou_qa_pdf_id(string $seed): int
{
    $option_key = '_nbk_shodou_qa_pdf_' . sanitize_key($seed);
    $existing = (int) get_option($option_key, 0);
    if ($existing > 0 && get_post($existing)) {
        return $existing;
    }

    $pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
    $upload = wp_upload_bits('shodou-qa-' . sanitize_file_name($seed) . '.pdf', null, $pdf);
    if (!empty($upload['error'])) {
        WP_CLI::error('QA PDF upload failed: ' . $upload['error']);
    }

    $attachment_id = wp_insert_attachment(array(
        'post_mime_type' => 'application/pdf',
        'post_title' => 'Shodou QA PDF ' . $seed,
        'post_status' => 'inherit',
    ), $upload['file'], 0, true);
    if (is_wp_error($attachment_id)) {
        WP_CLI::error($attachment_id->get_error_message());
    }

    update_option($option_key, (int) $attachment_id, false);
    return (int) $attachment_id;
}

function nbk_shodou_qa_upsert(array $case): int
{
    $existing = get_page_by_path($case['slug'], OBJECT, 'shodou-book');
    $postarr = array(
        'ID' => $existing ? (int) $existing->ID : 0,
        'post_type' => 'shodou-book',
        'post_status' => 'publish',
        'post_name' => $case['slug'],
        'post_title' => $case['title'],
        'post_date' => $case['date'],
        'post_content' => $case['content'],
    );

    $post_id = wp_insert_post($postarr, true);
    if (is_wp_error($post_id)) {
        WP_CLI::error($post_id->get_error_message());
    }
    $post_id = (int) $post_id;

    update_field('shodou_month', $case['month'], $post_id);
    update_field('size', $case['size'], $post_id);
    update_field('price', $case['price'], $post_id);
    update_field('teiki', $case['teiki'], $post_id);
    update_field('rensailist', $case['rensailist'], $post_id);

    if (!empty($case['cover'])) {
        $cover_id = nbk_shodou_qa_image_id($case['cover']);
        set_post_thumbnail($post_id, $cover_id);
        /* topimage is deliberately populated to prove list/detail still use
           the featured image and never leak this TOP-only field. */
        update_field('topimage', $cover_id, $post_id);
        update_field('toprensailist', '<p>TOP専用QA値。刊行物一覧・詳細には表示しない。</p>', $post_id);
    } else {
        delete_post_thumbnail($post_id);
        update_field('topimage', '', $post_id);
        update_field('toprensailist', '', $post_id);
    }

    update_post_meta($post_id, '_nbk_qa_fixture', 'shodou-publication');
    update_post_meta($post_id, '_nbk_qa_case', $case['case']);
    return $post_id;
}

$pdf_a = nbk_shodou_qa_pdf_id('rensai-a');
$pdf_b = nbk_shodou_qa_pdf_id('rensai-b');

$cases = array(
    array(
        'case' => 'latest-excluded',
        'slug' => 'qa-shodou-latest-excluded',
        'title' => '月刊「書写書道」最新号 QA',
        'date' => '2026-09-19 08:00:00',
        'month' => '2026年10月号',
        'size' => 'A4判・112ページ',
        'price' => '本体550円（税込）',
        'teiki' => '<p>1年間6,480円（送料込）</p><p>半年間3,240円</p>',
        'cover' => 'latest',
        'content' => '<!-- wp:paragraph --><p>最新号固定ページとsingleの共通detail出力を確認するQA本文です。</p><!-- /wp:paragraph -->',
        'rensailist' => array(
            array('rensaipdf' => $pdf_a, 'rensainame' => '「嵐山だより」／高橋大輔'),
            array('rensaipdf' => $pdf_b, 'rensainame' => '「若者へのメッセージ」／上垣内茂樹'),
        ),
    ),
    array(
        'case' => 'full',
        'slug' => 'qa-shodou-back-full',
        'title' => '月刊「書写書道」通常号 QA',
        'date' => '2026-09-18 08:00:00',
        'month' => '2026年9月号',
        'size' => 'A4判・112ページ',
        'price' => '本体550円（税込）',
        'teiki' => '<p>1年間6,480円（送料込）</p><p>半年間3,240円</p>',
        'cover' => 'full',
        'content' => '<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">連載（サンプル）</h3><!-- /wp:heading --><!-- wp:paragraph --><p>本文ownerとPDFリストの役割が混ざらないことを確認します。</p><!-- /wp:paragraph -->',
        'rensailist' => array(
            array('rensaipdf' => $pdf_a, 'rensainame' => '「嵐山だより」／高橋大輔'),
            array('rensaipdf' => $pdf_b, 'rensainame' => '子どもに大人気「しゅうじ君のことわざ・熟語ランド」'),
        ),
    ),
    array(
        'case' => 'long',
        'slug' => 'qa-shodou-back-long',
        'title' => '月刊「書写書道」長いタイトルと長い連載名の折り返し確認用 QA 特別増刊号',
        'date' => '2026-09-17 08:00:00',
        'month' => '2026年8月 特別増刊・非常に長い発行月表記の折り返し確認',
        'size' => 'A4判・112ページ・長い版型ページ情報が続く場合の確認',
        'price' => '本体550円（税込）・長い価格注記が続く場合の確認',
        'teiki' => '<p>1年間6,480円（送料込）／半年間3,240円／長い注記でも崩れないことを確認</p>',
        'cover' => 'long',
        'content' => '<!-- wp:paragraph --><p>PC/SP双方で長文時の高さ、折り返し、CTAとの距離を確認します。</p><!-- /wp:paragraph -->',
        'rensailist' => array(
            array('rensaipdf' => $pdf_a, 'rensainame' => '非常に長い連載タイトルと著者名が続いた場合でもPDFテキストリンクが自然に折り返すことを確認するQA項目／日本武道館'),
        ),
    ),
    array(
        'case' => 'no-pdf',
        'slug' => 'qa-shodou-back-no-pdf',
        'title' => '月刊「書写書道」PDFなし QA',
        'date' => '2026-09-16 08:00:00',
        'month' => '2026年7月号',
        'size' => 'A4判・112ページ',
        'price' => '本体550円（税込）',
        'teiki' => '',
        'cover' => 'no-pdf',
        'content' => '',
        'rensailist' => array(),
    ),
    array(
        'case' => 'empty',
        'slug' => 'qa-shodou-back-empty',
        'title' => '月刊「書写書道」空値・画像なし QA',
        'date' => '2026-09-15 08:00:00',
        'month' => '',
        'size' => '',
        'price' => '',
        'teiki' => '',
        'cover' => '',
        'content' => '',
        'rensailist' => array(),
    ),
);

$ids = array();
foreach ($cases as $case) {
    $ids[$case['case']] = nbk_shodou_qa_upsert($case);
}

update_option('budokan_shodou_publication_qa_ids', $ids, false);
flush_rewrite_rules(false);
WP_CLI::success('Seeded Shodou publication QA fixtures: ' . wp_json_encode($ids));
