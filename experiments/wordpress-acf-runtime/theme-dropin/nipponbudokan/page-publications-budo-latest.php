<?php
/**
 * Template Name: 月刊「武道」最新号
 *
 * /publications/budo/latest/ の固定ページ用。
 * 最新の budo-book 1件を取得し、CPT single と同じ詳細 head + 本文を描画する。
 */
get_header();

$latest_budo = new WP_Query(array(
    'post_type'              => 'budo-book',
    'post_status'            => 'publish',
    'posts_per_page'         => 1,
    'orderby'                => 'date',
    'order'                  => 'DESC',
    'ignore_sticky_posts'    => true,
    'no_found_rows'          => true,
));
?>
<main class="main publication_budo-latest">
    <div class="main_inner">
        <?php if ($latest_budo->have_posts()) : ?>
            <?php while ($latest_budo->have_posts()) : $latest_budo->the_post(); ?>
                <?php get_template_part('template-parts/publications/_budo-detail', null, array('post_id' => get_the_ID())); ?>

                <div class="block-editor_wrap publication_budo-content">
                    <?php the_content(); ?>
                </div>
            <?php endwhile; ?>
            <?php wp_reset_postdata(); ?>
        <?php endif; ?>
    </div>
</main>
<?php get_footer();
