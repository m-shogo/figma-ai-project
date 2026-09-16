<?php
/**
 * 単行本詳細の共通 head。
 * Figma hardcover_detail 1686:5574 を、既存 ACF + title + thumbnail + CTA の契約で描画する。
 * 本文は呼び出し側の the_content() が owner。
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
$action_icon_url = get_template_directory_uri() . '/images/common/icon-arrow-octagon.svg';
$external_icon_url = get_template_directory_uri() . '/images/common/icon-external-link.svg';
?>
<div class="publication_book-head">
    <h2 class="publication_book-sectionHeading"><span class="publication_book-sectionMark" aria-hidden="true"></span><span>日本武道館発行の単行本</span></h2>

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
                    <div class="publication_book-author"><?php echo nl2br(esc_html((string) $author)); ?></div>
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
        <div class="publication_book-actions">
            <?php if (nbk_acf_value_present($reading_url) && nbk_acf_value_present($reading_label)) : ?>
                <a class="publication_book-action" href="<?php echo esc_url($reading_url); ?>" target="_blank" rel="noopener noreferrer"><img class="publication_book-actionIcon" src="<?php echo esc_url($action_icon_url); ?>" alt="" aria-hidden="true"><span class="publication_book-actionLabel"><?php echo esc_html((string) $reading_label); ?></span><img class="publication_book-externalIcon" src="<?php echo esc_url($external_icon_url); ?>" alt="" aria-hidden="true"></a>
            <?php endif; ?>

            <?php if (nbk_acf_value_present($amazon_url)) : ?>
                <a class="publication_book-action" href="<?php echo esc_url($amazon_url); ?>" target="_blank" rel="noopener noreferrer"><img class="publication_book-actionIcon" src="<?php echo esc_url($action_icon_url); ?>" alt="" aria-hidden="true"><span class="publication_book-actionLabel">Amazonで購入</span><img class="publication_book-externalIcon" src="<?php echo esc_url($external_icon_url); ?>" alt="" aria-hidden="true"></a>
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
                    <a class="publication_book-action" href="<?php echo esc_url($button_url); ?>" target="_blank" rel="noopener noreferrer"><img class="publication_book-actionIcon" src="<?php echo esc_url($action_icon_url); ?>" alt="" aria-hidden="true"><span class="publication_book-actionLabel"><?php echo esc_html((string) $button_title); ?></span><img class="publication_book-externalIcon" src="<?php echo esc_url($external_icon_url); ?>" alt="" aria-hidden="true"></a>
                <?php endwhile; ?>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>
