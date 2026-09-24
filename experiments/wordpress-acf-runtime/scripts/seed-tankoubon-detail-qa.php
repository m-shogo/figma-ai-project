<?php
/**
 * Local/disposable QA seed: tankoubon detail.
 *
 * Existing ACF only. Never changes group_nbk_*.json or production contracts.
 * Creates standard / long / empty fixtures plus local placeholder featured
 * images so browser QA can verify real output geometry and object-fit behavior.
 *
 * Run:
 *   wp eval-file /fixture/scripts/seed-tankoubon-detail-qa.php
 */

if (!defined('WP_CLI') || !WP_CLI) {
    exit(2);
}
if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed tankoubon QA outside local WordPress.');
}

function nbk_tankoubon_qa_cover($slug, $filename, $base64)
{
    $existing = get_page_by_path($slug, OBJECT, 'attachment');
    if ($existing) {
        return (int) $existing->ID;
    }

    $bytes = base64_decode($base64, true);
    if ($bytes === false) {
        WP_CLI::error('Invalid base64 cover fixture: ' . $slug);
    }

    $upload = wp_upload_bits($filename, null, $bytes);
    if (!empty($upload['error'])) {
        WP_CLI::error($upload['error']);
    }

    $attachment_id = wp_insert_attachment(array(
        'post_mime_type' => 'image/png',
        'post_title' => $slug,
        'post_name' => $slug,
        'post_status' => 'inherit',
    ), $upload['file'], 0, true);

    if (is_wp_error($attachment_id)) {
        WP_CLI::error($attachment_id->get_error_message());
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    $metadata = wp_generate_attachment_metadata($attachment_id, $upload['file']);
    if (is_array($metadata)) {
        wp_update_attachment_metadata($attachment_id, $metadata);
    }
    update_post_meta($attachment_id, '_wp_attachment_image_alt', 'QA 単行本表紙');

    return (int) $attachment_id;
}

$standard_cover = nbk_tankoubon_qa_cover(
    'qa-tankoubon-cover-standard',
    'qa-tankoubon-cover-standard.png',
    'iVBORw0KGgoAAAANSUhEUgAAAJgAAADgCAIAAABw0TjaAAABWUlEQVR42u3RAQ0AAAjDMMC/xIu5DpJOwrpJRv87C0AKpEAKJEiBFEiBBCmQAimQAglSIAVSIEEKpEAKJEiBFEiBFEiQAimQAglSIAVSIEEKpEAKpECCFEiBFEiQAimQAimQIAVSIAUSpEAKpECCFEiBFEiBBCmQAimQIAVSIAUSpEAKpEAKJEiBFEiBBCmQAimQAglSIAVSIEEKpEAKJEiBFEiBFEiQAimQAglSIAVSIEEKpEAKpECCFEiBFEiQAimQAimQIAVSIAUSpEAKpECCFEiBFEiBBCmQAimQIAVSIAUSpEAKpEAKJEiBFEiBBCmQAimQAglSIAVSIEEKpEAKJEiBFEiBFEiQAimQAglSIAVSIEEKpEAKpECCFEiBFEiQAimQAimQIAVSIAUSpEAKpECCFEiBFEiBBCmQAimQIAVSIAUSpEAKpEAKJEiBFEiBBCmQAimQKq0yBFQG+WDbAAAAAElFTkSuQmCC'
);
$wide_cover = nbk_tankoubon_qa_cover(
    'qa-tankoubon-cover-wide',
    'qa-tankoubon-cover-wide.png',
    'iVBORw0KGgoAAAANSUhEUgAAASwAAAB4CAIAAADHd1h3AAABDklEQVR42u3TQQ0AAAjEMMC/xBODDHi0EpaskxRwZyQAE4IJAROCCQETggkBE4IJAROCCQETggkBE4IJAROCCQETggkBE4IJAROCCQETggkBE4IJAROCCQETggkBE4IJAROCCQETggkBE4IJAROCCQETggkBE4IJAROCCQETggkBE4IJAROCCQETggkBE4IJAROCCcGEgAnBhIAJwYSACcGEgAnBhIAJwYSACcGEgAnBhIAJwYSACcGEgAnBhIAJwYSACcGEgAnBhIAJwYSACcGEgAnBhIAJwYSACcGEgAnBhIAJwYSACcGEgAnBhIAJwYSACcGEgAnBhIAJwYSACeGjBcDIA4QmzQPxAAAAAElFTkSuQmCC'
);

$fixtures = array(
    array(
        'key' => 'standard',
        'slug' => 'qa-tankoubon-detail-standard',
        'title' => '少林寺拳法　その歴史と技法（POD版・電子書籍版）',
        'thumbnail_id' => $standard_cover,
        'content' => '<!-- wp:heading --><h2 class="wp-block-heading">内容</h2><!-- /wp:heading --><!-- wp:paragraph --><p>本文はブロックエディタが owner であることを確認する QA 本文です。</p><!-- /wp:paragraph -->',
        'fields' => array(
            'book_author' => "一般財団法人\n少林寺拳法連盟",
            'book_desc' => '開祖宗道臣が追い求めた「本当の強さ」とは、理想とする人間像とは、社会の在り方とは……創始に至った背景、それらの理念に向かって歩んでいくための技法と修練法。これらを網羅した決定版。',
            'book_info' => '四六判・並製（POD版）・322頁／電子書籍版',
            'book_price' => '2,530円／2,500円',
            'readingttl' => '試し読み',
            'readingtest' => $standard_cover,
            'amazon' => 'https://example.com/qa-amazon',
            'book_addbtn' => array(
                array('field_nbk_book_btntitle' => '三省堂書店で購入', 'field_nbk_book_addurl' => 'https://example.com/qa-store'),
                array('field_nbk_book_btntitle' => '楽天ブックスで購入', 'field_nbk_book_addurl' => 'https://example.com/qa-rakuten'),
            ),
        ),
    ),
    array(
        'key' => 'long',
        'slug' => 'qa-tankoubon-detail-long',
        'title' => 'QA 単行本詳細 とても長いタイトルでPCとSPの折り返しおよび見出し帯の高さが自然に伸びることを確認するための投稿',
        'thumbnail_id' => $wide_cover,
        'content' => '<!-- wp:heading --><h2 class="wp-block-heading">長文本文</h2><!-- /wp:heading --><!-- wp:paragraph --><p>CTAの下から本文までの間隔と、長い文字量でもレイアウトが崩れないことを確認します。</p><!-- /wp:paragraph -->',
        'fields' => array(
            'book_author' => '非常に長い著者・編者・監修者名を想定したQA文字列　日本武道館刊行物編集委員会ほか',
            'book_desc' => '長い説明文の折り返し確認用です。画像の右側で複数行にわたり文章が続いた場合にも、表紙とテキストが重ならず、価格や版型情報が下へ自然に押し出されることを確認します。さらにSPでは1カラムへ落ち、固定幅やnowrapによる横スクロールを発生させないことを確認します。',
            'book_info' => 'A5判・上製・本文512頁・別冊付録128頁・オンデマンド版および電子書籍版',
            'book_price' => '12,345円（税込）／電子版 9,876円（税込）',
            'readingttl' => '長いラベルの試し読み資料を別ウィンドウで開く',
            'readingtest' => $wide_cover,
            'amazon' => 'https://example.com/qa-long-amazon',
            'book_addbtn' => array(
                array('field_nbk_book_btntitle' => '非常に長い書店名のオンラインストアで購入する', 'field_nbk_book_addurl' => 'https://example.com/qa-long-store'),
            ),
        ),
    ),
    array(
        'key' => 'empty',
        'slug' => 'qa-tankoubon-detail-empty',
        'title' => 'QA 単行本詳細 空値',
        'thumbnail_id' => 0,
        'content' => '',
        'fields' => array(
            'book_author' => '',
            'book_desc' => '',
            'book_info' => '',
            'book_price' => '',
            'readingttl' => '',
            'readingtest' => '',
            'amazon' => '',
            'book_addbtn' => array(),
        ),
    ),
);

$field_keys = array(
    'book_author' => 'field_nbk_book_author',
    'book_desc' => 'field_nbk_book_desc',
    'book_info' => 'field_nbk_book_info',
    'book_price' => 'field_nbk_book_price',
    'readingttl' => 'field_nbk_readingttl',
    'readingtest' => 'field_nbk_readingtest',
    'amazon' => 'field_nbk_amazon',
    'book_addbtn' => 'field_nbk_book_addbtn',
);

$ids = array();
foreach ($fixtures as $fixture) {
    $existing = get_page_by_path($fixture['slug'], OBJECT, 'tankoubon');
    $postarr = array(
        'ID' => $existing ? $existing->ID : 0,
        'post_type' => 'tankoubon',
        'post_status' => 'publish',
        'post_name' => $fixture['slug'],
        'post_title' => $fixture['title'],
        'post_content' => $fixture['content'],
    );
    $post_id = wp_insert_post($postarr, true);
    if (is_wp_error($post_id)) {
        WP_CLI::warning($post_id->get_error_message());
        continue;
    }

    foreach ($fixture['fields'] as $field => $value) {
        $field_key = isset($field_keys[$field]) ? $field_keys[$field] : $field;
        update_field($field_key, $value, $post_id);
    }

    if (!empty($fixture['thumbnail_id'])) {
        set_post_thumbnail($post_id, (int) $fixture['thumbnail_id']);
    } else {
        delete_post_thumbnail($post_id);
    }

    $ids[$fixture['key']] = (int) $post_id;
    WP_CLI::log($fixture['key'] . ': ' . get_permalink($post_id));
}

update_option('budokan_tankoubon_detail_qa_ids', $ids, false);
WP_CLI::success('Seeded tankoubon detail QA fixtures.');
