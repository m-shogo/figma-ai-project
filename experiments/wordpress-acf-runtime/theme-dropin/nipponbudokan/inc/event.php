<?php

/**
 * 開催イベント archive / 詳細。
 * ACF は event_date / event_time / event_capacity / event_fee / event_host / event_status。
 * event_date は date_picker（Y-m-d）。時間は event_time。空は出さない。
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

function nipponbudokan_event_datetime($post_id = 0)
{
    $post_id = $post_id ?: get_the_ID();
    if (!$post_id || !function_exists('get_field')) {
        return 0;
    }
    $raw = get_field('event_date', $post_id);
    if (!nipponbudokan_event_value_present($raw)) {
        $raw = get_post_meta($post_id, 'event_date', true);
    }
    if (!nipponbudokan_event_value_present($raw)) {
        return 0;
    }
    if (is_numeric($raw) && strlen((string) $raw) === 8) {
        $parsed = date_create_from_format('!Ymd', (string) $raw, wp_timezone());
        return $parsed ? $parsed->getTimestamp() : 0;
    }
    if (is_numeric($raw)) {
        return (int) $raw;
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

function nipponbudokan_event_status($post_id = 0)
{
    $post_id = $post_id ?: get_the_ID();
    if (!$post_id || !function_exists('get_field')) {
        return '';
    }
    $raw = get_field('event_status', $post_id);
    $allowed = array('募集中', '開催中', '受付終了');
    if (!is_string($raw) || !in_array($raw, $allowed, true)) {
        return '';
    }
    return $raw;
}

function nipponbudokan_event_status_mod($label)
{
    $map = array(
        '募集中' => 'is-open',
        '開催中' => 'is-holding',
        '受付終了' => 'is-closed',
    );
    return isset($map[$label]) ? $map[$label] : '';
}

function nipponbudokan_event_date_short($post_id = 0)
{
    $ts = nipponbudokan_event_datetime($post_id);
    if (!$ts) {
        return '';
    }
    return wp_date('Y.m.d', $ts);
}

function nipponbudokan_event_archive_month_filter()
{
    $year = (int) get_query_var('event_y');
    $month = (int) get_query_var('event_m');
    if ($year > 1970 && $month >= 1 && $month <= 12) {
        return array($year, $month);
    }
    return null;
}

function nipponbudokan_event_selected_year()
{
    $filter = nipponbudokan_event_archive_month_filter();
    return $filter ? $filter[0] : (int) wp_date('Y');
}

function nipponbudokan_event_selected_month()
{
    $filter = nipponbudokan_event_archive_month_filter();
    return $filter ? $filter[1] : (int) wp_date('n');
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
    $query->set('orderby', 'meta_value');
    $query->set('order', 'DESC');

    $year = (int) $query->get('event_y');
    $month = (int) $query->get('event_m');
    if ($year <= 1970 || $month < 1 || $month > 12) {
        $query->set('meta_query', array(
            array(
                'key' => 'event_date',
                'compare' => 'EXISTS',
            ),
        ));
        return;
    }

    $month_start = date_create(sprintf('%04d-%02d-01', $year, $month), wp_timezone());
    if (!$month_start) {
        return;
    }

    $query->set('order', 'ASC');
    $query->set('meta_query', array(
        'relation' => 'OR',
        array(
            'key' => 'event_date',
            'value' => array($month_start->format('Y-m-d'), $month_start->format('Y-m-t')),
            'compare' => 'BETWEEN',
        ),
        array(
            'key' => 'event_date',
            'value' => array($month_start->format('Ymd'), $month_start->format('Ymt')),
            'compare' => 'BETWEEN',
        ),
    ));
}, 5);

add_filter('acf/update_value/key=field_event_date', function ($value) {
    if ($value === '' || $value === null || $value === false) {
        return $value;
    }
    $raw = is_string($value) || is_numeric($value) ? (string) $value : '';
    if ($raw === '') {
        return $value;
    }
    if (preg_match('/^\d{8}$/', $raw)) {
        return substr($raw, 0, 4) . '-' . substr($raw, 4, 2) . '-' . substr($raw, 6, 2);
    }
    $ts = strtotime($raw);
    return $ts ? wp_date('Y-m-d', $ts) : $value;
});
