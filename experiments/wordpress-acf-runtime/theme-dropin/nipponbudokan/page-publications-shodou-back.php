<?php
/**
 * Template Name: 月刊「書写書道」バックナンバー
 *
 * /publications/shodo/back/ の固定ページ用。
 * 公開済み shodou-book を新しい順に、ページャーなしで出す。最新号は除く。
 * Visual owner は武道と同じ publication_budo-* family。
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();

$latest_shodou = get_posts(array(
    'post_type'           => 'shodou-book',
    'post_status'         => 'publish',
    'posts_per_page'      => 1,
    'orderby'             => 'date',
    'order'               => 'DESC',
    'fields'              => 'ids',
    'ignore_sticky_posts' => true,
));

$shodou_backnumbers = new WP_Query(array(
    'post_type'           => 'shodou-book',
    'post_status'         => 'publish',
    'posts_per_page'      => -1,
    'orderby'             => 'date',
    'order'               => 'DESC',
    'ignore_sticky_posts' => true,
    'no_found_rows'       => true,
    'post__not_in'        => $latest_shodou ? array((int) $latest_shodou[0]) : array(),
));
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <div class="global_inner _content publication_budo-shell publication_budo-shell--list">
            <div class="gc_main _oneColumn">
                <?php if ($shodou_backnumbers->have_posts()) : ?>
                    <div class="publication_budo-backList">
                        <?php while ($shodou_backnumbers->have_posts()) : $shodou_backnumbers->the_post(); ?>
                            <?php
                            get_template_part(
                                'template-parts/publications/_shodou-back-item',
                                null,
                                array('post_id' => get_the_ID())
                            );
                            ?>
                        <?php endwhile; ?>
                    </div>
                    <?php wp_reset_postdata(); ?>
                <?php endif; ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
