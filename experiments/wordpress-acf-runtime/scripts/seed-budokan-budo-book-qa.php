<?php
/**
 * 月刊「武道」一覧5件用の過去号と、未使用 ACF の表示確認号。
 * 1109（デザイン確認用）は上書きしない。
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan budo-book fixture requires the nipponbudokan theme.');
}

$source_id = 1109;
$source = get_post($source_id);
if (!$source || $source->post_type !== 'budo-book') {
    WP_CLI::error('Source budo-book #1109 is missing.');
}

$thumb_id = (int) get_post_thumbnail_id($source_id);
$cover_url = (string) get_field('budo_topimg', $source_id);

$issues = array(
    array(
        'slug'  => '2026nen6gatsu',
        'title' => '2026年6月号',
        'date'  => '2026-06-01 10:00:00',
        'month' => '6',
        'acf'   => array(
            'budo_backcontent' => '【今月の表紙絵】表示確認／6月号',
        ),
    ),
    array(
        'slug'  => '2026nen5gatsu',
        'title' => '2026年5月号',
        'date'  => '2026-05-01 10:00:00',
        'month' => '5',
        'acf'   => array(
            'budo_backcontent' => '【今月の表紙絵】表示確認／5月号',
        ),
    ),
    array(
        'slug'  => '2026nen4gatsu',
        'title' => '2026年4月号',
        'date'  => '2026-04-01 10:00:00',
        'month' => '4',
        'acf'   => array(
            'budo_backcontent' => '【今月の表紙絵】表示確認／4月号',
        ),
    ),
    array(
        'slug'  => '2026nen3gatsu',
        'title' => '2026年3月号',
        'date'  => '2026-03-01 10:00:00',
        'month' => '3',
        'acf'   => array(
            'budo_backcontent' => '【今月の表紙絵】表示確認／3月号',
        ),
    ),
    array(
        'slug'  => 'budo-acf-display-check',
        'title' => 'ACF表示確認号',
        'date'  => '2026-01-15 10:00:00',
        'month' => '1',
        'acf'   => array(
            'budo_size'         => 'A4判',
            'budo_page'         => '128ページ',
            'budo_price'        => '本体556円（税込）',
            'budo_teiki'        => "1年間6,540円（送料込）\n半年間3,270円（送料込）",
            'budo_new'          => "・新連載の表示確認／著者名",
            'budo_rensai'       => "・好評連載中の表示確認／著者名",
            'budo_contribution' => "特別寄稿の表示確認／著者名",
            'budo_calender'     => "・武道カレンダーの表示確認",
            'budo_dantai'       => "・少年少女武道優良団体の表示確認",
            'budo_tainin'       => "退任のご挨拶の表示確認／氏名",
            'budo_news'         => "・今月のニュースの表示確認",
            'budo_report'       => "特別レポートの表示確認／著者名",
            'budo_mokuji'       => "月刊「武道」総目次の表示確認",
            'budo_backcontent'  => '【表示確認】未使用だった ACF をこの号に入れています。',
        ),
    ),
);

$created = array();
foreach ($issues as $issue) {
    $existing = get_posts(array(
        'post_type'      => 'budo-book',
        'post_status'    => 'any',
        'name'           => $issue['slug'],
        'posts_per_page' => 1,
        'no_found_rows'  => true,
    ));
    $payload = array(
        'post_type'     => 'budo-book',
        'post_status'   => 'publish',
        'post_title'    => $issue['title'],
        'post_name'     => $issue['slug'],
        'post_content'  => '',
        'post_date'     => $issue['date'],
        'post_date_gmt' => get_gmt_from_date($issue['date']),
    );
    if ($existing) {
        $payload['ID'] = (int) $existing[0]->ID;
        $post_id = wp_update_post($payload, true);
    } else {
        $post_id = wp_insert_post($payload, true);
    }
    if (is_wp_error($post_id)) {
        WP_CLI::error($post_id->get_error_message());
    }
    if ($thumb_id) {
        set_post_thumbnail($post_id, $thumb_id);
    }
    update_field('budo_month', $issue['month'], $post_id);
    if ($cover_url) {
        update_field('budo_topimg', $cover_url, $post_id);
    }
    foreach ($issue['acf'] as $key => $value) {
        update_field($key, $value, $post_id);
    }
    $created[] = $post_id . ':' . $issue['slug'];
}

WP_CLI::success('Seeded budo-book QA issues: ' . implode(', ', $created));
