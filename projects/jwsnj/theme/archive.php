<?php get_header(); ?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <?php if (is_home() || is_category()) : ?>
            <div class="global_inner jwsnj_newsArchive">
                <form class="jwsnj_newsArchive_filter" action="<?php echo esc_url(get_permalink(get_option('page_for_posts')) ?: home_url('/')); ?>" method="get">
                    <label for="jwsnj-news-category">カテゴリー</label>
                    <select id="jwsnj-news-category" name="cat">
                        <option value="0" <?php selected(!is_category()); ?>>選択してください</option>
                        <?php foreach (get_categories(['hide_empty' => false]) as $category) : ?>
                            <option value="<?php echo esc_attr($category->term_id); ?>" <?php selected(is_category($category->term_id)); ?>>
                                <?php echo esc_html($category->name); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                    <button type="submit">表示</button>
                </form>
                <?php get_template_part('template-parts/_list-news'); ?>
            </div>
        <?php else : ?>
            <div class="global_inner _column">
                <div class="gc_main">
                    <?php get_template_part('template-parts/_list-news'); ?>
                </div>
                <aside class="gc_sub">
                    <?php get_sidebar('archive'); ?>
                </aside>
            </div>
        <?php endif; ?>
    </section>
</main>
<?php get_footer(); ?>
