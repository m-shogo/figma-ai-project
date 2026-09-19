<?php
/**
 * 月刊「書写書道」バックナンバー1件。
 *
 * Visual owner は武道バックナンバーと同じ publication_budo-* family。
 * 書道固有なのは ACF field map と PDF リストだけに限定する。
 */
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$month = get_field('shodou_month', $post_id);
$thumbnail_id = get_post_thumbnail_id($post_id);
$detail_url = get_permalink($post_id);
$title = get_the_title($post_id);
$heading = nbk_acf_value_present($month)
    ? '月刊「書写書道」' . wp_strip_all_tags((string) $month)
    : $title;
$rensai_list = get_field('rensailist', $post_id);
$valid_rensai = array();

if (is_array($rensai_list)) {
    foreach ($rensai_list as $row) {
        $pdf = isset($row['rensaipdf']) ? $row['rensaipdf'] : '';
        $name = isset($row['rensainame']) ? $row['rensainame'] : '';
        if (!nbk_acf_value_present($pdf) || !nbk_acf_value_present($name)) {
            continue;
        }
        $valid_rensai[] = array(
            'pdf' => $pdf,
            'name' => wp_strip_all_tags((string) $name),
        );
    }
}

if (!$thumbnail_id && $heading === '' && empty($valid_rensai)) {
    return;
}
?>
<article class="publication_budo-backItem<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
    <?php if ($heading !== '') : ?>
        <header class="publication_budo-backHeader">
            <h2 class="publication_budo-backTitle"><?php echo esc_html($heading); ?></h2>
        </header>
    <?php endif; ?>

    <?php if ($thumbnail_id || !empty($valid_rensai)) : ?>
        <div class="publication_budo-backBody<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
            <?php if ($thumbnail_id) : ?>
                <figure class="publication_budo-backCover">
                    <a class="publication_budo-coverLink" href="<?php echo esc_url($detail_url); ?>" aria-label="<?php echo esc_attr($heading !== '' ? $heading . 'の詳細' : $title . 'の詳細'); ?>">
                        <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: $title)); ?>
                    </a>
                </figure>
            <?php endif; ?>

            <?php if (!empty($valid_rensai)) : ?>
                <div class="publication_budo-backSummary publication_budo-backPdfList">
                    <?php foreach ($valid_rensai as $row) : ?>
                        <p class="publication_budo-backPdf">
                            <a href="<?php echo esc_url($row['pdf']); ?>"><?php echo esc_html($row['name']); ?></a>
                        </p>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <div class="block-editor_wrap publication_budo-backDetail">
        <div class="wp-block-buttons">
            <div class="wp-block-button is-style-small">
                <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($detail_url); ?>">詳細はこちら</a>
            </div>
        </div>
    </div>
</article>
