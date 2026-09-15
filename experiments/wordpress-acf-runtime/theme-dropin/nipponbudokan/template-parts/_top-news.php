<?php
$news_query = new WP_Query(array(
    'post_type' => 'post',
    'posts_per_page' => 5,
    'has_password' => false,
    'orderby' => 'date',
    'order' => 'DESC',
    'post_status' => 'publish',
));

$posts_page_id = (int) get_option('page_for_posts');
$news_archive_url = $posts_page_id ? get_permalink($posts_page_id) : home_url('/');
?>
<section id="top_news-01" class="top_news-01">
    <div class="global_inner">
        <div class="top_news_panel">
            <div class="top_news_side">
                <div class="top_news_head">
                    <h2 class="top_news_heading">
                        <span class="top_news_heading_ja">お知らせ</span>
                        <span class="top_news_heading_en"><span class="top_news_heading_en_initial">N</span><span>ews</span></span>
                    </h2>
                    <a class="top_news_more top_news_more_sp" href="<?php echo esc_url($news_archive_url); ?>">
                        <span class="top_news_more_icon" aria-hidden="true"></span>
                        <span>一覧を表示</span>
                    </a>
                </div>

                <?php get_template_part('template-parts/_news-tabs', null, array(
                    'context' => 'top',
                    'link_tabs' => false,
                )); ?>

                <a class="top_news_more top_news_more_pc" href="<?php echo esc_url($news_archive_url); ?>">
                    <span class="top_news_more_icon" aria-hidden="true"></span>
                    <span>一覧を表示</span>
                </a>
            </div>

            <div class="top_news_articles module_newsList-01">
                <?php if ($news_query->have_posts()): ?>
                    <?php while ($news_query->have_posts()): $news_query->the_post(); ?>
                        <?php
                        $categories = get_the_category();
                        $primary = !empty($categories) ? $categories[0] : null;
                        $category_name = $primary ? $primary->name : 'お知らせ';
                        $label_color = ($primary && function_exists('nipponbudokan_get_category_color'))
                            ? nipponbudokan_get_category_color($primary)
                            : '';
                        $link_attrs = function_exists('get_post_link_attributes') ? get_post_link_attributes() : array();
                        $href = !empty($link_attrs['url']) ? $link_attrs['url'] : get_permalink();
                        $target_attr = !empty($link_attrs['targetAttr']) ? $link_attrs['targetAttr'] : '';

                        get_template_part('template-parts/_news-item', null, array(
                            'context' => 'top',
                            'heading_tag' => 'h3',
                            'item' => array(
                                'date' => get_the_date('Y.m.d'),
                                'date_attr' => get_the_date('Y-m-d'),
                                'category' => $category_name,
                                'label_color' => $label_color,
                                'title' => get_the_title(),
                                'url' => $href,
                                'target_attr' => $target_attr,
                            ),
                        ));
                        ?>
                    <?php endwhile; ?>
                    <?php wp_reset_postdata(); ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>
