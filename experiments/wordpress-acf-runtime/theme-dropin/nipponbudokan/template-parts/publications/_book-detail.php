<?php
/**
 * 単行本詳細の共通 head。
 * Figma hardcover_detail 1686:5574 を、既存 ACF + title + thumbnail + CTA の契約で描画する。
 * head は既存 ACF + アイキャッチ。記事本文は出さない。
 */
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$title = get_the_title($post_id);
$thumbnail_id = get_post_thumbnail_id($post_id);
$author = get_field('book_author', $post_id);
$description = get_field('book_desc', $post_id);
$book_info = get_field('book_info', $post_id);
$price = get_field('book_price', $post_id);
$reading_label = get_field('readingttl', $post_id);
$reading_url = get_field('readingtest', $post_id);
$amazon_url = get_field('amazon', $post_id);
?>
<div class="publication_book-head">
    <div class="block-editor_wrap">
        <h2 class="wp-block-heading">日本武道館発行の単行本</h2>
    </div>

    <?php if (nbk_acf_value_present($title)) : ?>
        <h1 class="publication_book-heading"><?php echo esc_html($title); ?></h1>
    <?php endif; ?>

    <?php if ($thumbnail_id || nbk_acf_value_present($author) || nbk_acf_value_present($description) || nbk_acf_value_present($book_info) || nbk_acf_value_present($price)) : ?>
        <div class="publication_book-summary<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
            <?php if ($thumbnail_id) : ?>
                <figure class="publication_book-cover">
                    <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: $title)); ?>
                </figure>
            <?php endif; ?>

            <div class="publication_book-meta">
                <?php if (nbk_acf_value_present($author)) : ?>
                    <div class="publication_book-author"><?php echo wp_kses_post((string) $author); ?></div>
                <?php endif; ?>

                <?php if (nbk_acf_value_present($description)) : ?>
                    <div class="publication_book-description"><?php echo wp_kses_post($description); ?></div>
                <?php endif; ?>

                <?php if (nbk_acf_value_present($book_info) || nbk_acf_value_present($price)) : ?>
                    <div class="publication_book-spec">
                        <?php if (nbk_acf_value_present($book_info)) : ?>
                            <div class="publication_book-info"><?php echo esc_html((string) $book_info); ?></div>
                        <?php endif; ?>
                        <?php if (nbk_acf_value_present($price)) : ?>
                            <div class="publication_book-price"><?php echo esc_html((string) $price); ?></div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>

    <?php if ((nbk_acf_value_present($reading_url) && nbk_acf_value_present($reading_label)) || nbk_acf_value_present($amazon_url) || have_rows('book_addbtn', $post_id)) : ?>
        <div class="block-editor_wrap publication_book-actions">
            <div class="wp-block-buttons">
                <?php if (nbk_acf_value_present($reading_url) && nbk_acf_value_present($reading_label)) : ?>
                    <div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($reading_url); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html((string) $reading_label); ?></a></div>
                <?php endif; ?>
                <?php if (nbk_acf_value_present($amazon_url)) : ?>
                    <div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($amazon_url); ?>" target="_blank" rel="noopener noreferrer">Amazonで購入</a></div>
                <?php endif; ?>
                <?php if (have_rows('book_addbtn', $post_id)) : ?>
                    <?php while (have_rows('book_addbtn', $post_id)) : the_row(); ?>
                        <?php
                        $button_title = get_sub_field('book_btntitle');
                        $button_url = get_sub_field('book_addurl');
                        if (!nbk_acf_value_present($button_title) || !nbk_acf_value_present($button_url)) {
                            continue;
                        }
                        ?>
                        <div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($button_url); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html((string) $button_title); ?></a></div>
                    <?php endwhile; ?>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
</div>
