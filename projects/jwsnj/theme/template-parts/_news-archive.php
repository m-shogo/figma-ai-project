<?php
// Standard posts index/category only. Category URLs come from WordPress.
// Only link to a real posts index. A static front page without an assigned
// posts page is not an all-posts destination.
$posts_on_front = get_option('show_on_front') === 'posts';
$posts_page_id = $posts_on_front ? 0 : (int) get_option('page_for_posts');
$all_url = $posts_on_front ? home_url('/') : '';
if ($posts_page_id && $posts_page_id !== (int) get_option('page_on_front')
    && get_post_type($posts_page_id) === 'page' && get_post_status($posts_page_id) === 'publish') {
    $all_url = get_permalink($posts_page_id);
}
if (!$all_url) {
    $posts_page_id = 0;
}
$current_category = is_category() ? get_queried_object() : null;
$selected_id = $current_category instanceof WP_Term ? (int) $current_category->term_id : 0;
$categories = get_categories(['hide_empty' => false]);
?>
<section class="jwsnj_newsArchive">
    <?php get_template_part('template-parts/_news-archive-visual', null, ['posts_page_id' => $posts_page_id]); ?>
    <div class="global_inner jwsnj_newsArchive_inner">
        <?php if ($categories && !is_wp_error($categories)) : ?>
            <div class="jwsnj_newsArchive_filter">
                <p id="jwsnj-news-category-label" class="jwsnj_newsArchive_filterLabel">
                    <span class="jwsnj_newsArchive_blossom" aria-hidden="true"></span>カテゴリー
                </p>
                <details class="jwsnj_newsArchive_filterMenu">
                    <summary aria-labelledby="jwsnj-news-category-label jwsnj-news-category-value">
                        <span id="jwsnj-news-category-value"><?php echo esc_html($selected_id ? $current_category->name : '選択してください'); ?></span>
                        <span class="jwsnj_newsArchive_filterArrow" aria-hidden="true"></span>
                    </summary>
                    <ul>
                        <?php if ($all_url) : ?>
                            <li><a href="<?php echo esc_url($all_url); ?>"<?php if (!$selected_id) : ?> aria-current="page"<?php endif; ?>>すべて</a></li>
                        <?php endif; ?>
                        <?php foreach ($categories as $category) : ?>
                            <?php $category_url = get_category_link($category->term_id); ?>
                            <?php if (!is_wp_error($category_url) && $category_url) : ?>
                                <li><a href="<?php echo esc_url($category_url); ?>"<?php if ($selected_id === (int) $category->term_id) : ?> aria-current="page"<?php endif; ?>><?php echo esc_html($category->name); ?></a></li>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </ul>
                </details>
            </div>
        <?php endif; ?>
        <?php get_template_part('template-parts/_list-news', null, ['props' => 'newsArchive']); ?>
    </div>
    <?php get_template_part('template-parts/_breadCrumb', null, ['news_archive' => true, 'posts_page_id' => $posts_page_id, 'posts_page_url' => $all_url]); ?>
</section>
