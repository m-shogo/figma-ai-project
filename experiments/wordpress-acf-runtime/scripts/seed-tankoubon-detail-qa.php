<?php
/**
 * Local QA seed: tankoubon detail.
 *
 * Existing ACF only. Never changes group_nbk_*.json or production contracts.
 * Run with wp eval-file in the local WordPress container.
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run via wp eval-file.\n");
    return;
}

$fixtures = array(
    array(
        'slug' => 'qa-tankoubon-detail-standard',
        'title' => 'QA 単行本詳細 標準値',
        'content' => '<!-- wp:heading --><h2 class="wp-block-heading">内容</h2><!-- /wp:heading --><!-- wp:paragraph --><p>本文はブロックエディタが owner であることを確認する QA 本文です。</p><!-- /wp:paragraph -->',
        'fields' => array(
            'book_author' => "一般財団法人\nQA 武道連盟",
            'book_desc' => '武道の歴史と技法を紹介する標準長の説明文です。複数行になった場合の本文幅と行間を確認します。',
            'book_info' => '四六判・並製・322頁／電子書籍版',
            'book_price' => '2,530円／2,500円',
            'readingttl' => '試し読み',
            'readingtest' => 'https://example.com/qa-reading.pdf',
            'amazon' => 'https://example.com/qa-amazon',
            'book_addbtn' => array(
                array('book_btntitle' => '書店で購入', 'book_addurl' => 'https://example.com/qa-store'),
                array('book_btntitle' => '電子版を購入', 'book_addurl' => 'https://example.com/qa-ebook'),
            ),
        ),
    ),
    array(
        'slug' => 'qa-tankoubon-detail-long',
        'title' => 'QA 単行本詳細 とても長いタイトルでPCとSPの折り返しおよび見出し帯の高さが自然に伸びることを確認するための投稿',
        'content' => '<!-- wp:heading --><h2 class="wp-block-heading">長文本文</h2><!-- /wp:heading --><!-- wp:paragraph --><p>CTAの下から本文までの間隔と、長い文字量でもレイアウトが崩れないことを確認します。</p><!-- /wp:paragraph -->',
        'fields' => array(
            'book_author' => '非常に長い著者・編者・監修者名を想定したQA文字列　日本武道館刊行物編集委員会ほか',
            'book_desc' => '長い説明文の折り返し確認用です。画像の右側で複数行にわたり文章が続いた場合にも、表紙とテキストが重ならず、価格や版型情報が下へ自然に押し出されることを確認します。さらにSPでは1カラムへ落ち、固定幅やnowrapによる横スクロールを発生させないことを確認します。',
            'book_info' => 'A5判・上製・本文512頁・別冊付録128頁・オンデマンド版および電子書籍版',
            'book_price' => '12,345円（税込）／電子版 9,876円（税込）',
            'readingttl' => '長いラベルの試し読み資料を別ウィンドウで開く',
            'readingtest' => 'https://example.com/qa-long-reading.pdf',
            'amazon' => 'https://example.com/qa-long-amazon',
            'book_addbtn' => array(
                array('book_btntitle' => '非常に長い書店名のオンラインストアで購入する', 'book_addurl' => 'https://example.com/qa-long-store'),
            ),
        ),
    ),
    array(
        'slug' => 'qa-tankoubon-detail-empty',
        'title' => 'QA 単行本詳細 空値',
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
        fwrite(STDERR, $post_id->get_error_message() . "\n");
        continue;
    }

    foreach ($fixture['fields'] as $field => $value) {
        update_field($field, $value, $post_id);
    }

    /* Empty-image QA is intentional. Image fixture can be assigned manually to
       the standard/long posts without changing the production data contract. */
    if ($fixture['slug'] === 'qa-tankoubon-detail-empty') {
        delete_post_thumbnail($post_id);
    }

    echo get_permalink($post_id) . "\n";
}
