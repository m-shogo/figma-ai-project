<?php

/**
 * 開催イベント archive / 詳細。
 * ACF は post_type / event_date / event_open_time / event_start_time / event_contact。
 * イベント名は WordPress の投稿タイトルを使用する。
 */

function nipponbudokan_event_value_present($value)
{
    if ($value === null || $value === false || $value === '') {
        return false;
    }
    if (is_array($value)) {
        foreach ($value as $item) {
            if (nipponbudokan_event_value_present($item)) {
                return true;
            }
        }
        return false;
    }
    if (is_int($value) || is_float($value)) {
        return true;
    }
    return trim(wp_strip_all_tags((string) $value)) !== '';
}

/**
 * 問合せ先は記事ごとの自由入力。リンクは本文中の a だけ。
 * 旧プレーンテキストは改行を残して出す。
 */
function nipponbudokan_event_contact_html($contact)
{
    $contact = is_string($contact) ? $contact : '';
    if (!nipponbudokan_event_value_present($contact)) {
        return '';
    }
    if ($contact === wp_strip_all_tags($contact)) {
        return wp_kses_post(nl2br(esc_html($contact), false));
    }

    return wp_kses_post($contact);
}

function nipponbudokan_event_datetime($post_id = 0)
{
    $post_id = $post_id ?: get_the_ID();
    if (!$post_id || !function_exists('get_field')) {
        return 0;
    }
    $raw = get_field('event_date', $post_id);
    if (!nipponbudokan_event_value_present($raw)) {
        return 0;
    }
    if (is_numeric($raw) || (is_string($raw) && preg_match('/^\d{8}$/', $raw))) {
        $parsed = date_create_from_format('Ymd', (string) $raw, wp_timezone());
        return $parsed ? $parsed->getTimestamp() : 0;
    }
    $ts = strtotime((string) $raw);
    return $ts ? $ts : 0;
}

function nipponbudokan_event_weekday_html($timestamp)
{
    $w = (int) wp_date('w', $timestamp);
    $labels = array('日', '月', '火', '水', '木', '金', '土');
    $mod = $w === 0 ? ' is-sun' : ($w === 6 ? ' is-sat' : '');
    return '<span class="ea_wday' . $mod . '">' . esc_html($labels[$w]) . '</span>';
}

function nipponbudokan_event_date_label_html($post_id = 0)
{
    $ts = nipponbudokan_event_datetime($post_id);
    if (!$ts) {
        return '';
    }
    $iso = wp_date('Y-m-d', $ts);
    $prefix = wp_date('Y年n月j日', $ts);
    return '<time datetime="' . esc_attr($iso) . '">' . esc_html($prefix) . '(' . nipponbudokan_event_weekday_html($ts) . ')</time>';
}

function nipponbudokan_event_date_short($post_id = 0)
{
    $ts = nipponbudokan_event_datetime($post_id);
    if (!$ts) {
        return '';
    }
    return wp_date('Y.m.d', $ts);
}

function nipponbudokan_event_requested_year()
{
    $year = (int) get_query_var('event_y');
    return $year > 1970 ? $year : 0;
}

function nipponbudokan_event_requested_month()
{
    $month = (int) get_query_var('event_m');
    return ($month >= 1 && $month <= 12) ? $month : 0;
}

function nipponbudokan_event_selected_year()
{
    $year = nipponbudokan_event_requested_year();
    return $year > 0 ? $year : (int) wp_date('Y');
}

function nipponbudokan_event_selected_month()
{
    $month = nipponbudokan_event_requested_month();
    return $month > 0 ? $month : (int) wp_date('n');
}

function nipponbudokan_event_archive_url($year, $month, $term = null)
{
    $year = (int) $year;
    $month = (int) $month;
    if ($term instanceof WP_Term) {
        $base = get_term_link($term);
    } elseif (is_tax('event_cat')) {
        $base = get_term_link(get_queried_object());
    } else {
        $base = get_post_type_archive_link('event');
    }
    if (!$base || is_wp_error($base)) {
        $base = home_url('/event/');
    }
    return add_query_arg(array(
        'event_y' => $year,
        'event_m' => $month,
    ), $base);
}

add_filter('query_vars', function ($vars) {
    $vars[] = 'event_y';
    $vars[] = 'event_m';
    return $vars;
});

add_action('pre_get_posts', function ($query) {
    if (is_admin() || !$query->is_main_query()) {
        return;
    }
    if (!$query->is_post_type_archive('event') && !$query->is_tax('event_cat')) {
        return;
    }

    $query->set('posts_per_page', 10);
    $query->set('meta_key', 'event_date');
    $query->set('meta_type', 'CHAR');
    $query->set('orderby', 'meta_value');
    $query->set('order', 'ASC');

    // /event/ は全件。月の絞り込みは event_y / event_m があるときだけ。
    $month = (int) $query->get('event_m');
    $year = (int) $query->get('event_y');
    if (($month < 1 || $month > 12) && $year < 1970) {
        return;
    }
    if ($month < 1 || $month > 12) {
        $month = (int) wp_date('n');
    }
    if ($year < 1970) {
        $year = (int) wp_date('Y');
    }

    $month_start = date_create(sprintf('%04d-%02d-01', $year, $month), wp_timezone());
    if (!$month_start) {
        return;
    }
    $start = $month_start->format('Ymd');
    $end = $month_start->format('Ymt');

    $query->set('meta_query', array(
        array(
            'key' => 'event_date',
            'value' => array($start, $end),
            'compare' => 'BETWEEN',
            'type' => 'CHAR',
        ),
    ));
}, 5);

add_action('init', function () {
    add_rewrite_rule('^event/([0-9]+)/?$', 'index.php?post_type=event&p=$matches[1]', 'top');
    if (get_option('nb_event_cat_rewrite') === 'event/event_cat') {
        return;
    }
    flush_rewrite_rules(false);
    update_option('nb_event_cat_rewrite', 'event/event_cat', false);
}, 99);

add_action('template_redirect', function () {
    if (is_admin()) {
        return;
    }
    $path = wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $relative = trim((string) $path, '/');
    $home_path = trim((string) wp_parse_url(home_url('/'), PHP_URL_PATH), '/');
    if ($home_path !== '' && ($relative === $home_path || str_starts_with($relative, $home_path . '/'))) {
        $relative = trim(substr($relative, strlen($home_path)), '/');
    }
    if (!preg_match('#^news/event_cat/(.+)$#', $relative, $matches)) {
        return;
    }
    $target = home_url('/event/event_cat/' . $matches[1] . '/');
    $query = wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY);
    if (is_string($query) && $query !== '') {
        $target .= '?' . $query;
    }
    wp_safe_redirect($target, 301);
    exit;
});

add_filter('redirect_canonical', function ($redirect_url) {
    if (is_singular('event')) {
        return false;
    }
    return $redirect_url;
});
