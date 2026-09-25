<?php
/**
 * 単行本一覧カード。
 * Existing tankoubon CPT / ACF owner only; empty values are omitted.
 */
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$title = get_the_title($post_id);
$thumbnail_id = get_post_thumbnail_id($post_id);
$author = get_field('book_author', $post_id);
$price = get_field('book_price', $post_id);
$permalink = get_permalink($post_id);
$is_featured = !empty($args['featured']);
?>
<article class="publication_book-card<?php echo $is_featured ? ' _featured' : ''; ?>">
    <?php if ($thumbnail_id) : ?>
        <a class="publication_book-cardCover" href="<?php echo esc_url($permalink); ?>">
            <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: $title)); ?>
        </a>
    <?php endif; ?>

    <div class="publication_book-cardBody<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
        <?php if (nbk_acf_value_present($title)) : ?>
            <h3 class="publication_book-cardTitle"><a href="<?php echo esc_url($permalink); ?>"><?php echo esc_html($title); ?></a></h3>
        <?php endif; ?>

        <?php if (nbk_acf_value_present($author)) : ?>
                    <div class="publication_book-cardAuthor"><?php echo wp_kses_post((string) $author); ?></div>
        <?php endif; ?>

        <?php if (nbk_acf_value_present($price)) : ?>
            <div class="publication_book-cardSpec">
                <div class="publication_book-cardPrice"><?php echo esc_html((string) $price); ?></div>
            </div>
        <?php endif; ?>

        <?php if ($is_featured) : ?>
            <div class="block-editor_wrap publication_book-cardButton">
                <div class="wp-block-buttons">
                    <div class="wp-block-button is-style-small"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($permalink); ?>">詳細はこちら</a></div>
                </div>
            </div>
        <?php endif; ?>
    </div>
</article>
