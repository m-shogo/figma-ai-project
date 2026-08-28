<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <?php if (get_post_type() === 'post' || is_category()): //通常投稿 
        ?>
            <div class="global_inner _column">
                <div class="gc_main">
                    <?php get_template_part('template-parts/_list-news'); ?>
                </div>
                <aside class="gc_sub">
                    <?php get_sidebar('archive'); ?>
                </aside>
            </div>
        <?php else: //その他カスタム投稿 
        ?>
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