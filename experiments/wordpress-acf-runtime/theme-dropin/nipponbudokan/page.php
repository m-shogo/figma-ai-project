<?php
global $post;
?>
<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <?php if (!post_password_required($post->ID)) :  ?>
        <section>
            <?php get_template_part('template-parts/_visual'); ?>
            <?php get_template_part('template-parts/_dropdown-navigation'); ?>
            <div class="global_inner _content _normalPage">
                <div class="gc_main _oneColumn">
                    <div class="block-editor_wrap">
                        <?php the_content(); ?>
                    </div>
                </div>
            </div>
            <?php get_template_part('template-parts/_local-navigation'); ?>
            <?php get_template_part('template-parts/_breadCrumb'); ?>
        </section>
    <?php else: ?>
        <section>
            <?php get_template_part('template-parts/_visual'); ?>
            <div class="global_inner _content">
                <div class="module_password">
                    <?php echo get_the_password_form(); ?>
                </div>
            </div>
            <?php get_template_part('template-parts/_breadCrumb'); ?>
        </section>
    <?php endif; ?>
</main>
<?php get_footer(); ?>
