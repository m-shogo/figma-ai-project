<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <?php if (get_current_post_type() === 'post' || is_category() || is_tag() || is_date()): ?>
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
