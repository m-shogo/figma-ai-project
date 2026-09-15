<?php
/**
 * Template Name: 月刊「武道」最新号
 *
 * /publications/budo/latest/ の固定ページ用。
 * 最新の budo-book 1件を取得し、CPT single と同じ詳細 head + 本文を描画する。
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();

$latest_budo = new WP_Query(array(
    'post_type'           => 'budo-book',
    'post_status'         => 'publish',
    'posts_per_page'      => 1,
    'orderby'             => 'date',
    'order'               => 'DESC',
    'ignore_sticky_posts' => true,
    'no_found_rows'       => true,
));
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <div class="global_inner _content">
            <div class="gc_main _oneColumn">
                <?php if ($latest_budo->have_posts()) : ?>
                    <?php while ($latest_budo->have_posts()) : $latest_budo->the_post(); ?>
                        <?php get_template_part('template-parts/publications/_budo-detail', null, array('post_id' => get_the_ID())); ?>

                        <?php if (nbk_acf_value_present(get_post()->post_content)) : ?>
                            <div class="block-editor_wrap publication_budo-content">
                                <?php the_content(); ?>
                            </div>
                        <?php endif; ?>
                    <?php endwhile; ?>
                    <?php wp_reset_postdata(); ?>
                <?php endif; ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
