<?php
/**
 * Template Name: 月刊「書写書道」最新号
 *
 * /publications/shodo/latest/ の固定ページ用。
 * 最新の shodou-book 1件を取得し、CPT single と同じ shared publication detail を描画する。
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
        <div class="global_inner _content publication_budo-shell publication_budo-shell--detail">
            <div class="gc_main _oneColumn">
                <?php if ($latest_shodou->have_posts()) : ?>
                    <?php while ($latest_shodou->have_posts()) : $latest_shodou->the_post(); ?>
                        <?php
                        get_template_part(
                            'template-parts/publications/_budo-detail',
                            null,
                            array(
                                'post_id' => get_the_ID(),
                                'config' => array(
                                    'month_field' => 'shodou_month',
                                    'size_field' => 'size',
                                    'pages_field' => '',
                                    'price_field' => 'price',
                                    'subscription_field' => 'teiki',
                                    'publication_label' => '月刊「書写書道」',
                                    'order_url' => '',
                                ),
                            )
                        );
                        ?>

                        <?php
                        get_template_part(
                            'acf/blocks/shodouRensaiList',
                            null,
                            array('post_id' => get_the_ID())
                        );
                        get_template_part('template-parts/publications/_shodou-contact');
                        ?>
                    <?php endwhile; ?>
                    <?php wp_reset_postdata(); ?>
                <?php endif; ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
