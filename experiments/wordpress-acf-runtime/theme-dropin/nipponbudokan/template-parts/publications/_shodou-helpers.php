<?php
/**
 * 月刊書写書道。フィールド名は group_nbk_gekkan_shodou。空は出さない。
 */
get_template_part('template-parts/publications/_acf-has-value');

if (!function_exists('nbk_shodou_issue_heading')) {
    function nbk_shodou_issue_heading($post_id)
    {
        $title = trim((string) get_the_title($post_id));
        if ($title === '') {
            return '';
        }
        if (strpos($title, '月刊') === 0) {
            return $title;
        }
        return '月刊「書写書道」' . $title;
    }
}

if (!function_exists('nbk_shodou_absolute_url')) {
    function nbk_shodou_absolute_url($value)
    {
        if (is_array($value) && !empty($value['url'])) {
            $value = $value['url'];
        }
        $url = trim((string) $value);
        if ($url === '') {
            return '';
        }
        if (preg_match('#^https?://#i', $url)) {
            return $url;
        }
        return home_url($url);
    }
}

if (!function_exists('nbk_shodou_plain_label')) {
    function nbk_shodou_plain_label($value)
    {
        $text = trim(html_entity_decode(wp_strip_all_tags((string) $value), ENT_QUOTES, 'UTF-8'));
        return $text;
    }
}

if (!function_exists('nbk_shodou_price_label')) {
    /**
     * 書写の定価 ACF は数字だけのことがある。現行最新号と同じく円（税込）を足す。
     */
    function nbk_shodou_price_label($value)
    {
        $text = trim(wp_strip_all_tags((string) $value));
        if ($text === '') {
            return '';
        }
        $has_yen = function_exists('mb_strpos')
            ? mb_strpos($text, '円') !== false
            : strpos($text, '円') !== false;
        if ($has_yen) {
            return $text;
        }
        return $text . '円（税込）';
    }
}

if (!function_exists('nbk_shodou_rensai_rows')) {
    function nbk_shodou_rensai_rows($post_id)
    {
        $rows = get_field('rensailist', $post_id);
        if (!is_array($rows)) {
            return array();
        }
        $out = array();
        foreach ($rows as $row) {
            $pdf = isset($row['rensaipdf']) ? nbk_shodou_absolute_url($row['rensaipdf']) : '';
            $name = isset($row['rensainame']) ? nbk_shodou_plain_label($row['rensainame']) : '';
            if ($pdf === '' && $name === '') {
                continue;
            }
            $out[] = array(
                'pdf'  => $pdf,
                'name' => $name,
            );
        }
        return $out;
    }
}

if (!function_exists('nbk_shodou_cover_id')) {
    /**
     * 表紙は WP アイキャッチ。ACF `topimage` は TOP 専用で latest/back/single に使わない。
     */
    function nbk_shodou_cover_id($post_id)
    {
        return (int) get_post_thumbnail_id($post_id);
    }
}

if (!function_exists('nbk_shodou_echo_pdf_links')) {
    /**
     * Parts テキストリンク（PDF アイコン）。button_L にはしない。
     */
    function nbk_shodou_echo_pdf_links($rows)
    {
        if (!$rows) {
            return;
        }
        echo '<ul class="wp-block-list publication_shodou-pdfs">';
        foreach ($rows as $row) {
            if ($row['pdf'] === '' || $row['name'] === '') {
                continue;
            }
            echo '<li><a href="' . esc_url($row['pdf']) . '" target="_blank" rel="noopener noreferrer">';
            echo esc_html($row['name']);
            echo '</a></li>';
        }
        echo '</ul>';
    }
}
