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
$cover = get_the_post_thumbnail($post_id, 'large', array(
    'class'   => 'publication_budo-backCover',
    'loading' => 'lazy',
));
$detail_url = get_permalink($post_id);
$rensai_list = get_field('rensailist', $post_id);

$has_rensai = is_array($rensai_list) && !empty($rensai_list);
if (!$cover && !nbk_acf_value_present($month) && !$has_rensai) {
    return;
}
?>
<article class="publication_budo-backItem">
    <div class="publication_budo-backHeader">
        <?php if (nbk_acf_value_present($month)) : ?>
            <h2 class="publication_budo-backMonth"><?php echo esc_html(wp_strip_all_tags((string) $month)); ?></h2>
        <?php endif; ?>
    </div>

    <?php if ($cover) : ?>
        <a class="publication_budo-coverLink" href="<?php echo esc_url($detail_url); ?>">
            <?php echo $cover; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
        </a>
    <?php endif; ?>

    <?php if ($has_rensai) : ?>
        <div class="publication_budo-backBody">
            <?php foreach ($rensai_list as $row) : ?>
                <?php
                $pdf = isset($row['rensaipdf']) ? $row['rensaipdf'] : '';
                $name = isset($row['rensainame']) ? $row['rensainame'] : '';
                if (!nbk_acf_value_present($pdf) || !nbk_acf_value_present($name)) {
                    continue;
                }
                ?>
                <p class="publication_budo-backPdf">
                    <a href="<?php echo esc_url($pdf); ?>"><?php echo esc_html(wp_strip_all_tags((string) $name)); ?></a>
                </p>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <div class="wp-block-button is-style-small publication_budo-backDetail">
        <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($detail_url); ?>">詳細はこちら</a>
    </div>
</article>
