<?php
/**
 * 書写書道バック一覧の1行。表紙リンクは独自。PDF は Parts テキストリンク。TOP画像は出さない。
 */
get_template_part('template-parts/publications/_shodou-helpers');

$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$thumbnail_id = nbk_shodou_cover_id($post_id);
$title = get_the_title($post_id);
$heading = nbk_shodou_issue_heading($post_id);
$order_url = home_url('/publications/shodo/form-shodo/');
$rensai_rows = nbk_shodou_rensai_rows($post_id);
$cover_alt = $thumbnail_id
    ? (get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: $title)
    : $title;
$permalink = get_permalink($post_id);
?>
<article class="publication_budo-backItem<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
    <?php if ($heading !== '') : ?>
        <header class="publication_budo-backHeader">
            <h2 class="publication_budo-backTitle"><?php echo esc_html($heading); ?></h2>
            <a class="publication_budo-backOrder" href="<?php echo esc_url($order_url); ?>">ご注文</a>
        </header>
    <?php endif; ?>

    <?php
    $detail_button = static function ($post_id) {
        ?>
        <div class="wp-block-buttons publication_budo-backDetail">
            <div class="wp-block-button is-style-small">
                <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url(get_permalink($post_id)); ?>">詳細はこちら</a>
            </div>
        </div>
        <?php
    };
    ?>

    <?php if ($thumbnail_id && $rensai_rows) : ?>
        <div class="publication_budo-backBody">
            <a class="publication_budo-coverLink" href="<?php echo esc_url($permalink); ?>">
                <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => $cover_alt)); ?>
            </a>
            <div class="publication_budo-backSummary">
                <?php nbk_shodou_echo_pdf_links($rensai_rows); ?>
                <?php $detail_button($post_id); ?>
            </div>
        </div>
    <?php elseif ($thumbnail_id) : ?>
        <a class="publication_budo-coverLink publication_budo-backCover" href="<?php echo esc_url($permalink); ?>">
            <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => $cover_alt)); ?>
        </a>
        <?php $detail_button($post_id); ?>
    <?php elseif ($rensai_rows) : ?>
        <div class="publication_budo-backSummary">
            <?php nbk_shodou_echo_pdf_links($rensai_rows); ?>
            <?php $detail_button($post_id); ?>
        </div>
    <?php else : ?>
        <?php $detail_button($post_id); ?>
    <?php endif; ?>
</article>
