<?php
/**
 * Template Name: 月刊「書写書道」最新号
 *
 * /publications/shodo/latest/ 。最新 shodou-book 1件を CPT single と同じ part で描画する。
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();

$latest_shodou = new WP_Query(array(
    'post_type'           => 'shodou-book',
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
                <?php if ($latest_shodou->have_posts()) : ?>
                    <?php while ($latest_shodou->have_posts()) : $latest_shodou->the_post(); ?>
                        <?php get_template_part('template-parts/publications/_shodou-detail', null, array('post_id' => get_the_ID())); ?>
                    <?php endwhile; ?>
                    <?php wp_reset_postdata(); ?>
                <?php endif; ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
