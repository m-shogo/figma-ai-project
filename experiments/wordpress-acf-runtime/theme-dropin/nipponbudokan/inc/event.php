<?php

/**
 * 開催イベント archive / 詳細。
 * ACF は event_date / event_time / event_capacity / event_fee / event_host のみ。
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
        return 0;
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

function nipponbudokan_event_date_short($post_id = 0)
{
    $ts = nipponbudokan_event_datetime($post_id);
    if (!$ts) {
        return '';
    }
    return wp_date('Y.m.d', $ts);
}

function nipponbudokan_event_selected_year()
{
    $year = (int) get_query_var('event_y');
    return $year > 1970 ? $year : (int) wp_date('Y');
}

function nipponbudokan_event_selected_month()
{
    $month = (int) get_query_var('event_m');
    return ($month >= 1 && $month <= 12) ? $month : (int) wp_date('n');
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

    $year = (int) $query->get('event_y');
    $month = (int) $query->get('event_m');
    if ($year < 1970) {
        $year = (int) wp_date('Y');
        $query->set('event_y', $year);
    }
    if ($month < 1 || $month > 12) {
        $month = (int) wp_date('n');
        $query->set('event_m', $month);
    }

    $month_start = date_create(sprintf('%04d-%02d-01', $year, $month), wp_timezone());
    if (!$month_start) {
        return;
    }
    $start = $month_start->format('Y-m-d 00:00:00');
    $end = $month_start->format('Y-m-t 23:59:59');

    $query->set('posts_per_page', 10);
    $query->set('meta_key', 'event_date');
    $query->set('orderby', 'meta_value');
    $query->set('order', 'ASC');
    $query->set('meta_query', array(
        array(
            'key' => 'event_date',
            'value' => array($start, $end),
            'compare' => 'BETWEEN',
            'type' => 'DATETIME',
        ),
    ));
}, 5);

add_action('init', function () {
    add_rewrite_rule('^event/([0-9]+)/?$', 'index.php?post_type=event&p=$matches[1]', 'top');
}, 20);

add_filter('redirect_canonical', function ($redirect_url) {
    if (is_singular('event')) {
        return false;
    }
    return $redirect_url;
});
