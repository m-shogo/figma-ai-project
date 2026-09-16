<?php
/**
 * 投稿タイプ: tankoubon（単行本）詳細。
 * Figma hardcover_detail 1686:5574。
 * head は既存 ACF + title + thumbnail + CTA、本文は the_content() が owner。
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>

        <div class="global_inner _content">
            <div class="gc_main _oneColumn">
                <?php while (have_posts()) : the_post(); ?>
                    <?php get_template_part('template-parts/publications/_book-detail', null, array('post_id' => get_the_ID())); ?>

                    <?php if (nbk_acf_value_present(get_post()->post_content)) : ?>
                        <div class="block-editor_wrap publication_book-content">
                            <?php the_content(); ?>
                        </div>
                    <?php endif; ?>
                <?php endwhile; ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
