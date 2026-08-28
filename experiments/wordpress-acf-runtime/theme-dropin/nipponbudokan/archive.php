<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <?php
        $current_post_type = get_current_post_type();
        $is_news_archive = $current_post_type === 'post'
            || (empty($current_post_type) && (is_category() || is_tag() || is_date()));
        ?>
        <?php if ($is_news_archive): ?>
            <?php get_template_part('template-parts/_news-archive'); ?>
        <?php else: ?>
            <?php get_template_part('template-parts/_dropdown-archive'); ?>
            <div class="global_inner">
                <div class="gc_main _oneColumn">
                    <?php get_sidebar('archive'); ?>
                    <?php get_template_part('template-parts/_list-card'); ?>
                </div>
            </div>
        <?php endif; ?>
    </section>
</main>
<?php get_footer(); ?>
