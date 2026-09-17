<?php
/**
 * Template Name: 月刊「書写書道」バックナンバー
 *
 * /publications/shodo/back/
 * 公開済み号を最新から全件。ページャーなし。行は表紙 + 連載 PDF。
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();

$shodou_backnumbers = new WP_Query(array(
    'post_type'           => 'shodou-book',
    'post_status'         => 'publish',
    'posts_per_page'      => -1,
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
                <?php if ($shodou_backnumbers->have_posts()) : ?>
                    <div class="block-editor_wrap publication_budo-backList publication_shodou-backList">
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
