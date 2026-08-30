<?php

/**
 * Template Name: 1カラム＋ローカルナビテンプレート
 *
 * Reuses the canonical one-column content shell and renders the existing
 * sidebar-nav owner after the content so Local Navigation can span the
 * normal global width instead of being constrained to the 260px sidebar.
 */
global $post;
?>
<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <?php if (!post_password_required($post->ID)) :  ?>
        <section>
            <?php get_template_part('template-parts/_visual'); ?>
            <div class="global_inner _content">
                <div class="gc_main _oneColumn">
                    <div class="block-editor_wrap">
                        <?php the_content(); ?>
                    </div>
                </div>
            </div>
            <div class="global_inner">
                <?php get_sidebar(); ?>
            </div>
        </section>
    <?php else: ?>
        <section>
            <?php get_template_part('template-parts/_visual'); ?>
            <div class="global_inner _content">
                <div class="module_password">
                    <?php echo get_the_password_form(); ?>
                </div>
            </div>
        </section>
    <?php endif; ?>
</main>
<?php get_footer(); ?>
