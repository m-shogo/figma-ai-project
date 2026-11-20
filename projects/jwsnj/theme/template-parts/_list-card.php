<?php
global $post, $posts, $wp_query;
$props = isset($args) && isset($args['props']) ? $args['props'] : '';
?>
<?php if (is_front_page() || is_page()) : ?>
    <div class="module_newsCard-01">
        <?php foreach ($posts as $post) : setup_postdata($post); ?>
            <?php get_template_part('template-parts/_list-card_article'); ?>
        <?php endforeach;
        wp_reset_postdata(); ?>
    </div>
<?php else : ?>
    <?php if (have_posts()) : ?>
        <div class="module_newsCard-01">
            <?php while (have_posts()) : the_post(); ?>
                <?php get_template_part('template-parts/_list-card_article'); ?>
            <?php endwhile; ?>
        </div>
        <?php if ($props !== 'customPostList') : ?>
            <?php get_template_part('template-parts/_pagination'); ?>
        <?php endif; ?>
    <?php else: ?>
        <p>記事はありません。</p>
    <?php endif; ?>
<?php endif; ?>