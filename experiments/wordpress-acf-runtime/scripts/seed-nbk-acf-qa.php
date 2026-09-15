<?php

/**
 * Local-only seed: one published test post per ACF group / CPT pairing.
 *
 *   wp eval-file /fixture/scripts/seed-nbk-acf-qa.php
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed NBK ACF QA outside a local WordPress environment.');
}

if (!function_exists('update_field')) {
    WP_CLI::error('ACF update_field() is not available.');
}

function nbk_qa_upsert_post(string $post_type, string $slug, string $title, string $content): int
{
    $matches = get_posts(array(
        'post_type' => $post_type,
        'post_status' => 'any',
        'name' => $slug,
        'posts_per_page' => 1,
        'orderby' => 'ID',
        'order' => 'ASC',
        'no_found_rows' => true,
    ));
    $post = $matches ? $matches[0] : null;

    $payload = array(
        'post_type' => $post_type,
        'post_status' => 'publish',
        'post_title' => $title,
        'post_name' => $slug,
        'post_content' => $content,
        'post_excerpt' => 'NBK ACF QA fixture',
    );

    if ($post) {
        $payload['ID'] = (int) $post->ID;
        $result = wp_update_post($payload, true);
    } else {
        $result = wp_insert_post($payload, true);
    }

    if (is_wp_error($result)) {
        WP_CLI::error($result->get_error_message());
    }

    return (int) $result;
}

function nbk_qa_ensure_png(): int
{
    $filename = 'nbk-acf-qa-cover.png';
    $existing = get_posts(array(
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'posts_per_page' => 1,
        'meta_key' => '_wp_attached_file',
        'meta_value' => $filename,
        'no_found_rows' => true,
    ));
    if ($existing) {
        return (int) $existing[0]->ID;
    }

    $upload = wp_upload_dir();
    $path = trailingslashit($upload['path']) . $filename;
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
    if (file_put_contents($path, $png) === false) {
        WP_CLI::error('Could not write QA PNG.');
    }

    $attachment_id = wp_insert_attachment(array(
        'post_mime_type' => 'image/png',
        'post_title' => 'NBK ACF QA cover',
        'post_status' => 'inherit',
    ), $path);
    if (is_wp_error($attachment_id)) {
        WP_CLI::error($attachment_id->get_error_message());
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    wp_update_attachment_metadata($attachment_id, wp_generate_attachment_metadata($attachment_id, $path));
    return (int) $attachment_id;
}

function nbk_qa_ensure_pdf(): int
{
    $filename = 'nbk-acf-qa.pdf';
    $existing = get_posts(array(
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'posts_per_page' => 1,
        'name' => 'nbk-acf-qa',
        'no_found_rows' => true,
    ));
    if ($existing) {
        return (int) $existing[0]->ID;
    }

    $upload = wp_upload_dir();
    $path = trailingslashit($upload['path']) . $filename;
    $pdf = "%PDF-1.1\n1 0 obj<<>>endobj\n2 0 obj<</Length 44>>stream\nBT /F1 12 Tf 72 720 Td (NBK ACF QA) Tj ET\nendstream\nendobj\ntrailer<<>>\n%%EOF\n";
    if (file_put_contents($path, $pdf) === false) {
        WP_CLI::error('Could not write QA PDF.');
    }

    $attachment_id = wp_insert_attachment(array(
        'post_mime_type' => 'application/pdf',
        'post_title' => 'NBK ACF QA PDF',
        'post_name' => 'nbk-acf-qa',
        'post_status' => 'inherit',
    ), $path);
    if (is_wp_error($attachment_id)) {
        WP_CLI::error($attachment_id->get_error_message());
    }

    return (int) $attachment_id;
}

$img_id = nbk_qa_ensure_png();
$pdf_id = nbk_qa_ensure_pdf();
$body = '<!-- wp:paragraph --><p>NBK ACF QA fixture. デザイン実装は別途。</p><!-- /wp:paragraph -->';

$created = array();

$post_id = nbk_qa_upsert_post('post', 'qa-nbk-displaytime-post', '【QA】表示日時（通常投稿）', $body);
update_field('displaytime', '2026年9月15日', $post_id);
$created[] = array('displaytime', 'post', $post_id, get_permalink($post_id));

$news_id = nbk_qa_upsert_post('news', 'qa-nbk-displaytime-news', '【QA】表示日時（総務課 news）', $body);
update_field('displaytime', '2026年9月15日', $news_id);
$created[] = array('displaytime', 'news', $news_id, get_permalink($news_id));

$kyoiku_id = nbk_qa_upsert_post('shosyashodou', 'qa-nbk-displaytime-shosyashodou', '【QA】表示日時（教育文化課 shosyashodou）', $body);
update_field('displaytime', '2026年9月15日', $kyoiku_id);
$created[] = array('displaytime', 'shosyashodou', $kyoiku_id, get_permalink($kyoiku_id));

$budo_id = nbk_qa_upsert_post('budo-book', 'qa-nbk-budo-book-202609', '【QA】月刊「武道」2026年9月号', $body);
set_post_thumbnail($budo_id, $img_id);
update_field('budo_month', '9', $budo_id);
update_field('budo_size', 'A4判', $budo_id);
update_field('budo_page', '128', $budo_id);
update_field('budo_price', '880円（税込）', $budo_id);
update_field('budo_teiki', "1年間 9,504円（送料込）\n半年間 4,752円", $budo_id);
update_field('budo_topimg', $img_id, $budo_id);
update_field('budo_pickup', array(
    array(
        'budo_pickup_ttl' => 'QAピックアップタイトル',
        'budo_pickup_txt' => '今月のピックアップ本文（テスト）',
        'budo_pickup_img' => $img_id,
    ),
), $budo_id);
update_field('monthpickup', array(
    array(
        'pickupImg' => $img_id,
        'pickuptitle' => 'QA今月のおすすめ',
        'pickupdesc' => 'おすすめ説明（テスト）',
    ),
), $budo_id);
update_field('budo_speacial', '<p>今月の特集・企画（テスト）</p>', $budo_id);
update_field('budo_new', '<p>新連載（テスト）</p>', $budo_id);
update_field('budo_rensai', '<p>好評連載中（テスト）</p>', $budo_id);
update_field('budo_contribution', '特別寄稿（テスト）', $budo_id);
update_field('budo_zuihitsu', '<p>随筆（テスト）</p>', $budo_id);
update_field('budo_calender', '武道カレンダー（テスト）', $budo_id);
update_field('budo_dantai', '少年少女武道優良団体（テスト）', $budo_id);
update_field('budo_tainin', '退任のご挨拶（テスト）', $budo_id);
update_field('budo_news', '今月のニュース（テスト）', $budo_id);
update_field('budo_report', '特別レポート（テスト）', $budo_id);
update_field('budo_mokuji', '総目次（テスト）', $budo_id);
update_field('budo_backcontent', '<p>バックナンバー用リスト（テスト）</p>', $budo_id);
update_field('budo_topcontent', '<p>TOP用掲載内容（テスト）</p>', $budo_id);
update_field('rensai_title', 'QA連載タイトル', $budo_id);
update_field('rensai_desc', 'QA連載紹介文', $budo_id);
update_field('rensai_pdf', $pdf_id, $budo_id);
update_field('sousakuin', $pdf_id, $budo_id);
$created[] = array('gekkan_budo+rensai+sousakuin', 'budo-book', $budo_id, get_permalink($budo_id));

$shodou_id = nbk_qa_upsert_post('shodou-book', 'qa-nbk-shodou-book-202609', '【QA】月刊書写書道 2026年9月号', $body);
set_post_thumbnail($shodou_id, $img_id);
update_field('shodou_month', '9', $shodou_id);
update_field('size', 'A4判・96ページ', $shodou_id);
update_field('price', '550', $shodou_id);
update_field('teiki', "<p>1年間6,480円（送料込）</p>\n半年間3,240円", $shodou_id);
update_field('rensailist', array(
    array(
        'rensaipdf' => $pdf_id,
        'rensainame' => '<p>QA連載名</p>',
    ),
), $shodou_id);
update_field('topimage', $img_id, $shodou_id);
update_field('toprensailist', '<p>TOP用連載リスト（テスト）</p>', $shodou_id);
$created[] = array('gekkan_shodou', 'shodou-book', $shodou_id, get_permalink($shodou_id));

$book_id = nbk_qa_upsert_post('tankoubon', 'qa-nbk-tankoubon-shorinji', '【QA】少林寺拳法 その歴史と技法', $body);
set_post_thumbnail($book_id, $img_id);
update_field('readingttl', '試し読み', $book_id);
update_field('readingtest', $pdf_id, $book_id);
update_field('book_author', '一般財団法人 少林寺拳法連盟', $book_id);
update_field('book_desc', "関祖宗温伝が追い求めた「本当の強さ」とは。\nQAテスト用の説明文です。", $book_id);
update_field('book_info', '四六判・並製・327頁', $book_id);
update_field('book_price', '2,530円／2,500円', $book_id);
update_field('book_content', '<h3>目次</h3><p>第1章 QAテスト</p>', $book_id);
update_field('amazon', 'https://www.amazon.co.jp/', $book_id);
update_field('book_select', 'read', $book_id);
update_field('css', '', $book_id);
update_field('book_addbtn', array(
    array(
        'book_btntitle' => 'Amazonで購入',
        'book_addurl' => 'https://www.amazon.co.jp/',
    ),
    array(
        'book_btntitle' => '三省堂書店で購入',
        'book_addurl' => 'https://www.nipponbudokan.or.jp/',
    ),
), $book_id);
$created[] = array('tankoubon', 'tankoubon', $book_id, get_permalink($book_id));

update_option('nbk_acf_qa_posts', $created, false);

foreach ($created as $row) {
    WP_CLI::log(sprintf('%s → %s #%d %s', $row[0], $row[1], $row[2], $row[3]));
}

WP_CLI::success(sprintf('Seeded %d NBK ACF QA posts.', count($created)));
