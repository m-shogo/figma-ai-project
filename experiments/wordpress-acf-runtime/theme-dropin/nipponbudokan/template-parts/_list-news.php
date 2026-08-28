<?php
global $post, $posts, $wp_query;
$props = isset($args) && isset($args['props']) ? $args['props'] : '';
$context = isset($args) && isset($args['context']) ? sanitize_key($args['context']) : '';
?>
<?php if (is_front_page() || is_page()) : ?>
    <div class="module_newsList-01">
        <?php foreach ($posts as $post): setup_postdata($post); ?>
            <?php get_template_part('template-parts/_list-news_article'); ?>
        <?php endforeach;
        wp_reset_postdata(); ?>
    </div>
<?php else: ?>
    <?php if (have_posts()): ?>
        <div class="module_newsList-01">
            <?php while (have_posts()) : the_post(); ?>
                <?php get_template_part('template-parts/_list-news_article'); ?>
            <?php endwhile; ?>
        </div>
        <?php if ($props !== 'customPostList') : ?>
            <?php get_template_part('template-parts/_pagination', null, array(
                'variant' => $context === 'archive' ? 'news' : '',
            )); ?>
        <?php endif; ?>
    <?php else: ?>
        <p>お知らせはありません。</p>
    <?php endif; ?>
<?php endif; ?>
