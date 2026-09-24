<?php
/**
 * 詳細末尾のバックナンバー5件。表示中の号を除く最新5。
 */
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$related = new WP_Query(array(
    'post_type'           => 'budo-book',
    'post_status'         => 'publish',
    'posts_per_page'      => 5,
    'post__not_in'        => array($post_id),
    'orderby'             => 'date',
    'order'               => 'DESC',
    'ignore_sticky_posts' => true,
    'no_found_rows'       => true,
    'meta_query'          => array(
        array(
            'key'     => '_thumbnail_id',
            'compare' => 'EXISTS',
        ),
    ),
));
if (!$related->have_posts()) {
    return;
}
?>
<section class="publication_budo-related">
    <h3 class="wp-block-heading">バックナンバー</h3>
    <div class="publication_budo-relatedCovers">
        <?php while ($related->have_posts()) : $related->the_post(); ?>
            <?php
            $related_id = get_the_ID();
            $thumb_id = get_post_thumbnail_id($related_id);
            if (!$thumb_id) {
                continue;
            }
            $related_month = get_field('budo_month', $related_id);
            $related_month = is_string($related_month) ? trim($related_month) : '';
            if ($related_month !== '' && preg_match('/^\d{1,2}$/', $related_month)) {
                $related_year = (int) get_post_time('Y', false, $related_id);
                $related_label = ($related_year > 1970 ? $related_year . '年' : '') . (int) $related_month . '月号';
            } else {
                $related_label = $related_month !== '' ? $related_month : get_the_title($related_id);
            }
            $alt = get_post_meta($thumb_id, '_wp_attachment_image_alt', true) ?: $related_label;
            ?>
            <a class="publication_budo-coverLink" href="<?php echo esc_url(get_permalink($related_id)); ?>" aria-label="<?php echo esc_attr($related_label); ?>">
                <?php echo wp_get_attachment_image($thumb_id, 'full', false, array('alt' => $alt)); ?>
            </a>
        <?php endwhile; ?>
    </div>
    <?php wp_reset_postdata(); ?>
    <div class="wp-block-buttons is-content-justification-right">
        <div class="wp-block-button is-style-small">
            <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url(home_url('/publications/budo/back/')); ?>">バックナンバー一覧</a>
        </div>
    </div>
</section>
