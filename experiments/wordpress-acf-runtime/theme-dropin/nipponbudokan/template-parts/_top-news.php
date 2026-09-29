<?php
$news_query_args = array(
    'post_type' => 'post',
    'posts_per_page' => 5,
    'has_password' => false,
    'orderby' => 'date',
    'order' => 'DESC',
    'post_status' => 'publish',
);

$news_panels = array(
    array(
        'id' => 'all',
        'query' => new WP_Query($news_query_args),
    ),
);

$news_terms = get_terms(array(
    'taxonomy' => 'category',
    'hide_empty' => true,
    'parent' => 0,
    'orderby' => 'name',
    'order' => 'ASC',
));

if (!empty($news_terms) && !is_wp_error($news_terms)) {
    foreach ($news_terms as $news_term) {
        $news_panels[] = array(
            'id' => (string) $news_term->term_id,
            'query' => new WP_Query(array_merge($news_query_args, array(
                'cat' => (int) $news_term->term_id,
            ))),
        );
    }
}

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
                    <a class="module_listMore top_news_more_sp" data-news-more href="<?php echo esc_url($news_archive_url); ?>">
                        <span class="module_listMore_icon" aria-hidden="true"></span>
                        <span>一覧を表示</span>
                    </a>
                </div>

                <?php get_template_part('template-parts/_news-tabs', null, array(
                    'context' => 'top',
                    'link_tabs' => false,
                )); ?>

                <a class="module_listMore top_news_more_pc" data-news-more href="<?php echo esc_url($news_archive_url); ?>">
                    <span class="module_listMore_icon" aria-hidden="true"></span>
                    <span>一覧を表示</span>
                </a>
            </div>

            <div class="top_news_lists">
                <?php foreach ($news_panels as $news_panel): ?>
                    <div class="top_news_articles module_newsList-01" data-news-panel="<?php echo esc_attr($news_panel['id']); ?>"<?php echo $news_panel['id'] === 'all' ? '' : ' hidden'; ?>>
                        <?php if ($news_panel['query']->have_posts()): ?>
                            <?php while ($news_panel['query']->have_posts()): $news_panel['query']->the_post(); ?>
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
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</section>
