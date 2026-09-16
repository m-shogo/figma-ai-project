<?php
/**
 * 月刊「武道」バックナンバー一覧の1件。
 * Figma publications 1634:10806 の「月号 + 注文 / 表紙 + 概要 + 詳細」構造。
 */
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$month = get_field('budo_month', $post_id);
$summary = get_field('budo_backcontent', $post_id);
$thumbnail_id = get_post_thumbnail_id($post_id);
$title = get_the_title($post_id);
$heading = nbk_acf_value_present($month)
    ? '月刊「武道」' . wp_strip_all_tags((string) $month)
    : $title;
?>
<article class="publication_budo-backItem<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
    <?php if ($heading !== '') : ?>
        <header class="publication_budo-backHeader">
            <h2 class="publication_budo-backTitle"><?php echo esc_html($heading); ?></h2>
            <a class="publication_budo-backOrder" href="<?php echo esc_url(home_url('/publications/budo/order/')); ?>">
                <span>ご注文</span>
            </a>
        </header>
    <?php endif; ?>

    <?php if ($thumbnail_id || nbk_acf_value_present($summary)) : ?>
        <div class="publication_budo-backBody<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
            <?php if ($thumbnail_id) : ?>
                <figure class="publication_budo-backCover">
                    <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: $title)); ?>
                </figure>
            <?php endif; ?>

            <?php if (nbk_acf_value_present($summary)) : ?>
                <div class="publication_budo-backSummary"><?php echo wp_kses_post($summary); ?></div>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <a class="publication_budo-backDetail" href="<?php echo esc_url(get_permalink($post_id)); ?>">
        <span>詳細はこちら</span>
    </a>
</article>
