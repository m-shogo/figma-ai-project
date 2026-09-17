<?php

/**
 * Local-only seed: event archive/detail cards for Figma 1619:9554 / 1632:10382 QA.
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

$taikai = event_qa_term('大会');
$taiken = event_qa_term('体験');

$body = <<<HTML
<!-- wp:paragraph -->
<p>世界中から参集した柔道・空手競技の精鋭エキスパートたちが究極の技を競った2020オリンピック・パラリンピック大会。その開催に備え東京都から補助金を得て新たに整備された日本武道館の中道場を使って都民の皆様を中心に、日本武道館武道学園のなぎなた講師による体験会を実施します。</p>
<!-- /wp:paragraph -->
HTML;

$items = array(
    array(
        'slug' => 'qa-event-2026-09-01-gakuen',
        'title' => '武道学園 入学案内',
        'date' => '2026-09-01',
        'time' => '10時開会',
        'capacity' => '80名',
        'fee' => '1,000円',
        'host' => '日本武道協議会',
        'term' => $taiken,
        'status' => '募集中',
    ),
    array(
        'slug' => 'qa-event-2026-09-01-shonen',
        'title' => '昭和100年記念 令和8年度 全日本少年少女武道錬成大会',
        'date' => '2026-09-01',
        'time' => '11時開会',
        'capacity' => '80名',
        'fee' => '1,000円',
        'host' => '日本武道協議会',
        'term' => $taikai,
        'status' => '開催中',
    ),
    array(
        'slug' => 'qa-event-2026-09-03-kakizome',
        'title' => '第62回全日本書初め大展覧会',
        'date' => '2026-09-03',
        'time' => '11時開会',
        'capacity' => '80名',
        'fee' => '1,000円',
        'host' => '日本武道協議会',
        'term' => $taikai,
        'status' => '受付終了',
    ),
    array(
        'slug' => 'qa-event-2026-09-05-gakuen',
        'title' => '武道学園 入学案内',
        'date' => '2026-09-05',
        'time' => '10時開会',
        'capacity' => '',
        'fee' => '',
        'host' => '日本武道協議会',
        'term' => $taiken,
        'status' => '募集中',
    ),
    array(
        'slug' => 'qa-event-2026-08-01-shonen',
        'title' => '8月サンプル（月切替確認）',
        'date' => '2026-08-01',
        'time' => '10時開会',
        'capacity' => '30名',
        'fee' => '無料',
        'host' => '日本武道館',
        'term' => $taikai,
        'status' => '',
    ),
);

foreach ($items as $item) {
    $id = event_qa_upsert($item['slug'], $item['title'], $body);
    update_field('event_date', $item['date'], $id);
    update_field('event_time', $item['time'], $id);
    update_field('event_capacity', $item['capacity'], $id);
    update_field('event_fee', $item['fee'], $id);
    update_field('event_host', $item['host'], $id);
    if ($item['status'] === '') {
        delete_field('event_status', $id);
    } else {
        update_field('event_status', $item['status'], $id);
    }
    wp_set_object_terms($id, array((int) $item['term']), 'event_cat', false);
    WP_CLI::log(sprintf('#%d %s %s', $id, $item['date'], get_permalink($id)));
}

WP_CLI::success('Seeded event archive QA posts.');
