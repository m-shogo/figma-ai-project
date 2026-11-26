<?php
// TOP News: use the standard post owner and real configured posts-page URL.
$posts_page_id = get_option('show_on_front') === 'page' ? (int) get_option('page_for_posts') : 0;
$news_url = '';
if ($posts_page_id && $posts_page_id !== (int) get_option('page_on_front')
    && get_post_type($posts_page_id) === 'page' && get_post_status($posts_page_id) === 'publish') {
    $news_url = esc_url((string) get_permalink($posts_page_id));
}
$news_query = new WP_Query([
    'post_type' => 'post',
    'post_status' => 'publish',
    'posts_per_page' => 5,
    'ignore_sticky_posts' => true,
    'no_found_rows' => true,
    'orderby' => 'date',
    'order' => 'DESC',
]);
?>
<section id="top_news-01" class="top_news-01">
    <div class="global_inner jwsnj_topNews_inner">
        <div class="jwsnj_topNews_panel">
            <div class="jwsnj_topNews_head">
                <h2 class="jwsnj_topNews_title">
                    <span class="jwsnj_topNews_en" lang="en">News</span>
                    <span class="jwsnj_topNews_ja"><img src="<?php echo esc_url(get_theme_file_uri('images/common/ico_blossom.svg')); ?>" width="12" height="12" alt="">お知らせ</span>
                </h2>
                <?php if ($news_url !== '') : ?>
                    <a class="jwsnj_topNews_more" href="<?php echo $news_url; ?>">お知らせ一覧<span class="jwsnj_topNews_arrow" aria-hidden="true"></span></a>
                <?php endif; ?>
            </div>
            <?php if ($news_query->have_posts()) : ?>
                <div class="module_newsList-01">
                    <?php while ($news_query->have_posts()) : $news_query->the_post(); ?>
                        <?php get_template_part('template-parts/_list-news_article', null, ['props' => 'topNews']); ?>
                    <?php endwhile; ?>
                </div>
                <?php wp_reset_postdata(); ?>
            <?php else : ?>
                <p>お知らせはありません。</p>
            <?php endif; ?>
        </div>
        <?php get_template_part('template-parts/_top-instagram'); ?>
    </div>
</section>
