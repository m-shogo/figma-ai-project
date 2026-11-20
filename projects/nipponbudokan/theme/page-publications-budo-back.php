<?php
/**
 * Template Name: 月刊「武道」バックナンバー
 *
 * /publications/budo/back/ の固定ページ用。
 * 公開済み budo-book を新しい順に出す。最新号は除く。
 * 先頭は総索引アコーディオン。ファイル URL はこの固定ページの sousakuin。無いときはボタンを出さない。
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();

$latest_budo = get_posts(array(
    'post_type'           => 'budo-book',
    'post_status'         => 'publish',
    'posts_per_page'      => 1,
    'orderby'             => 'date',
    'order'               => 'DESC',
    'fields'              => 'ids',
    'ignore_sticky_posts' => true,
));

$budo_backnumbers = new WP_Query(array(
    'post_type'           => 'budo-book',
    'post_status'         => 'publish',
    'posts_per_page'      => -1,
    'orderby'             => 'date',
    'order'               => 'DESC',
    'ignore_sticky_posts' => true,
    'no_found_rows'       => true,
    'post__not_in'        => $latest_budo ? array((int) $latest_budo[0]) : array(),
));
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <div class="global_inner _content publication_budo-shell publication_budo-shell--list">
            <div class="gc_main _oneColumn">
                <?php get_template_part('template-parts/publications/_budo-sousakuin'); ?>
                <?php if ($budo_backnumbers->have_posts()) : ?>
                    <div class="publication_budo-backList">
                        <?php while ($budo_backnumbers->have_posts()) : $budo_backnumbers->the_post(); ?>
                            <?php
                            get_template_part(
                                'template-parts/publications/_budo-back-item',
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

        <?php get_template_part('template-parts/_local-navigation'); ?>
        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
