<?php
/**
 * 月刊書写書道の連載リスト。
 * 値は投稿の ACF rensailist。本文は出さない。
 */
if (!function_exists('nbk_shodou_rensai_label')) {
    function nbk_shodou_rensai_label($html)
    {
        $text = wp_strip_all_tags((string) $html);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text);
        return trim((string) $text);
    }
}

if (!function_exists('nbk_shodou_file_url')) {
    function nbk_shodou_file_url($value)
    {
        if (is_array($value) && !empty($value['url'])) {
            return (string) $value['url'];
        }
        if (is_numeric($value)) {
            $url = wp_get_attachment_url((int) $value);
            return $url ? $url : '';
        }
        if (is_string($value) && $value !== '') {
            return $value;
        }
        return '';
    }
}

$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
$rows = $post_id ? get_field('rensailist', $post_id) : null;
if (!is_array($rows) || !$rows) {
    return;
}

$items = array();
foreach ($rows as $row) {
    if (!is_array($row)) {
        continue;
    }
    $label = nbk_shodou_rensai_label($row['rensainame'] ?? '');
    $url = nbk_shodou_file_url($row['rensaipdf'] ?? '');
    if ($label === '' && $url === '') {
        continue;
    }
    $items[] = array('label' => $label, 'url' => $url);
}
if (!$items) {
    return;
}
?>
<div class="block-editor_wrap publication_shodou-rensai">
    <h3 class="wp-block-heading">連載</h3>
    <ul class="publication_shodou-rensaiList">
        <?php foreach ($items as $item) : ?>
            <li>
                <?php if ($item['url'] !== '') : ?>
                    <a href="<?php echo esc_url($item['url']); ?>"><?php echo esc_html($item['label'] !== '' ? $item['label'] : 'PDF'); ?></a>
                <?php else : ?>
                    <span><?php echo esc_html($item['label']); ?></span>
                <?php endif; ?>
            </li>
        <?php endforeach; ?>
    </ul>
</div>
