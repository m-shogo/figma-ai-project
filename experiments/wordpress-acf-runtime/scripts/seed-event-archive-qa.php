<?php

/**
 * Local-only seed: event archive cards for the current Figma authority.
 *
 * PC: D4c05PxMEw6oZxgRggfcks / 1619:9554
 * SP: D4c05PxMEw6oZxgRggfcks / 2991:11982
 *
 *   wp eval-file /fixture/scripts/seed-event-archive-qa.php
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed event QA outside a local WordPress environment.');
}

if (!function_exists('update_field')) {
    WP_CLI::error('ACF update_field() is not available.');
}

function event_qa_term(string $name): int
{
    $existing = get_term_by('name', $name, 'event_cat');
    if ($existing && !is_wp_error($existing)) {
        return (int) $existing->term_id;
    }

    $created = wp_insert_term($name, 'event_cat');
    if (is_wp_error($created)) {
        WP_CLI::error($created->get_error_message());
    }

    return (int) $created['term_id'];
}

function event_qa_upsert(string $slug, string $title, string $content): int
{
    $matches = get_posts(array(
        'post_type' => 'event',
        'post_status' => 'any',
        'name' => $slug,
        'posts_per_page' => 1,
        'orderby' => 'ID',
        'order' => 'ASC',
        'no_found_rows' => true,
    ));

    $payload = array(
        'post_type' => 'event',
        'post_status' => 'publish',
        'post_title' => $title,
        'post_name' => $slug,
        'post_content' => $content,
    );

    if ($matches) {
        $payload['ID'] = (int) $matches[0]->ID;
        $result = wp_update_post($payload, true);
    } else {
        $result = wp_insert_post($payload, true);
    }

    if (is_wp_error($result)) {
        WP_CLI::error($result->get_error_message());
    }

    return (int) $result;
}

$general = event_qa_term('一般');
$budo = event_qa_term('武道');
$shodo = event_qa_term('書道');

$now = new DateTimeImmutable('now', wp_timezone());
$year = (int) $now->format('Y');
$month = (int) $now->format('n');

$body = <<<HTML
<!-- wp:paragraph -->
<p>開催イベントQA用の本文です。イベント一覧の表示契約と詳細遷移の確認に使用します。</p>
<!-- /wp:paragraph -->
HTML;

$contact = 'ホットスタッフ・プロモーション  050-5211-6077(平日12:00〜18:00)';
$categories = array($general, $budo, $budo, $shodo, $general, $budo, $shodo, $general, $budo, $shodo);
$titles = array(
    'DREAMS COME TRUEコンサート',
    '武道学園 入学案内',
    '昭和100年記念 令和8年度 全日本少年少女武道錬成大会',
    '第62回全日本書初め大展覧会',
    '日本武道館 開催イベント05',
    '日本武道館 開催イベント06',
    '日本武道館 開催イベント07',
    '日本武道館 開催イベント08',
    '日本武道館 開催イベント09',
    '日本武道館 開催イベント10',
);

for ($index = 0; $index < 10; $index++) {
    $day = $index + 1;
    $date = sprintf('%04d-%02d-%02d', $year, $month, $day);
    $slug = sprintf('qa-event-archive-%02d', $day);
    $id = event_qa_upsert($slug, $titles[$index], $body);

    update_field('event_date', $date, $id);
    update_field('event_open_time', '10:00', $id);
    update_field('event_start_time', '11:00', $id);
    update_field('event_contact', $contact, $id);

    if ($index === 8) {
        update_field('post_type', 'url', $id);
        update_field('postType_url', home_url('/contact/'), $id);
        update_field('postType_target', 0, $id);
    } elseif ($index === 9) {
        update_field('post_type', 'none', $id);
        update_field('postType_url', '', $id);
        update_field('postType_target', 0, $id);
    } else {
        update_field('post_type', 'post', $id);
        update_field('postType_url', '', $id);
        update_field('postType_target', 0, $id);
    }

    wp_set_object_terms($id, array((int) $categories[$index]), 'event_cat', false);
    WP_CLI::log(sprintf('#%d %s %s', $id, $date, get_permalink($id)));
}

WP_CLI::success(sprintf('Seeded 10 Event archive QA posts for %04d-%02d.', $year, $month));
