<?php
/**
 * 月刊「武道」共通。ACF JSON は編集しない。空は出さない。
 */
if (!function_exists('nbk_budo_issue_heading')) {
    /**
     * 見出しは現行 Theme と同じく 月刊「武道」+ 投稿タイトル。
     */
    function nbk_budo_issue_heading($post_id)
    {
        $title = trim((string) get_the_title($post_id));
        if ($title === '') {
            return '';
        }
        if (strpos($title, '月刊') === 0) {
            return $title;
        }
        return '月刊「武道」' . $title;
    }
}

if (!function_exists('nbk_budo_field_image_url')) {
    function nbk_budo_field_image_url($value)
    {
        if (is_array($value)) {
            if (!empty($value['url'])) {
                return (string) $value['url'];
            }
            if (!empty($value['ID'])) {
                $url = wp_get_attachment_image_url((int) $value['ID'], 'full');
                return $url ? $url : '';
            }
        }
        if (is_numeric($value)) {
            $url = wp_get_attachment_image_url((int) $value, 'full');
            return $url ? $url : '';
        }
        if (is_string($value) && $value !== '') {
            return $value;
        }
        return '';
    }
}

if (!function_exists('nbk_budo_echo_rich_field')) {
    /**
     * wysiwyg / textarea。HTML リストはそのまま、・始まりは Parts の ul.wp-block-list へ。
     */
    function nbk_budo_echo_rich_field($value)
    {
        if (!nbk_acf_value_present($value)) {
            return;
        }
        $html = trim((string) $value);
        if (preg_match('/<(ul|ol)\b/i', $html)) {
            echo wp_kses_post($html);
            return;
        }
        $normalized = preg_replace('/<\/p>\s*<p[^>]*>/i', "\n", $html);
        $normalized = preg_replace('/<br\s*\/?>/i', "\n", $normalized);
        $normalized = wp_strip_all_tags($normalized);
        $lines = preg_split("/\r\n|\r|\n/", (string) $normalized);
        $items = array();
        $bullets = 0;
        foreach ($lines as $line) {
            $line = trim(html_entity_decode((string) $line, ENT_QUOTES, 'UTF-8'));
            if ($line === '') {
                continue;
            }
            if (preg_match('/^[・●•]\s*/u', $line)) {
                $bullets++;
                $line = preg_replace('/^[・●•]\s*/u', '', $line);
            }
            $items[] = $line;
        }
        if ($items && ($bullets === count($items) || ($bullets > 0 && count($items) > 1))) {
            echo '<ul class="wp-block-list">';
            foreach ($items as $item) {
                echo '<li>' . wp_kses_post($item) . '</li>';
            }
            echo '</ul>';
            return;
        }
        echo wp_kses_post($html);
    }
}

if (!function_exists('nbk_budo_latest_sousakuin_url')) {
    /**
     * 一覧の総索引ファイルは最新号の ACF `sousakuin`。無ければ出さない。
     */
    function nbk_budo_latest_sousakuin_url()
    {
        $latest = get_posts(array(
            'post_type'           => 'budo-book',
            'post_status'         => 'publish',
            'numberposts'         => 1,
            'orderby'             => 'date',
            'order'               => 'DESC',
            'ignore_sticky_posts' => true,
        ));
        if (!$latest) {
            return '';
        }
        $file = get_field('sousakuin', $latest[0]->ID);
        if (is_array($file) && !empty($file['url'])) {
            return (string) $file['url'];
        }
        if (is_string($file) && $file !== '') {
            return $file;
        }
        return '';
    }
}
