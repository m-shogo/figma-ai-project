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

$news_samples = array(
    array(
        'date' => '2025.00.00',
        'date_attr' => '2025-01-01',
        'category' => '刊行物',
        'title' => '日本武道協議会設立45周年記念「少年少女武道指導書」を刊行しました。',
    ),
    array(
        'date' => '2025.00.00',
        'date_attr' => '2025-01-01',
        'category' => '事務局',
        'title' => '令和7年度職員採用（新卒）の応募受付は終了しました。',
    ),
    array(
        'date' => '2025.00.00',
        'date_attr' => '2025-01-01',
        'category' => '武道',
        'title' => '11月30日(日)にシンガポールで日本武道演武大会が開催されます。',
    ),
    array(
        'date' => '2025.00.00',
        'date_attr' => '2025-01-01',
        'category' => '書道',
        'title' => '第62回全日本書初め大展覧会特設ページを開設しました。',
    ),
    array(
        'date' => '2025.00.00',
        'date_attr' => '2025-01-01',
        'category' => '事務局',
        'title' => '料金の改定について（令和7年10月1日より）',
    ),
);

$news_label_tones = array(
    '武道' => 'is-budo',
    '書道' => 'is-shodo',
    '刊行物' => 'is-publication',
    '研修' => 'is-training',
    '事務局' => 'is-office',
);
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
                        $category_name = !empty($categories) ? $categories[0]->name : 'お知らせ';
                        $tone_class = isset($news_label_tones[$category_name]) ? $news_label_tones[$category_name] : 'is-default';
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
                                'title' => get_the_title(),
                                'url' => $href,
                                'target_attr' => $target_attr,
                                'tone_class' => $tone_class,
                            ),
                        ));
                        ?>
                    <?php endwhile; ?>
                    <?php wp_reset_postdata(); ?>
                <?php else: ?>
                    <?php foreach ($news_samples as $sample): ?>
                        <?php
                        $tone_class = isset($news_label_tones[$sample['category']]) ? $news_label_tones[$sample['category']] : 'is-default';
                        $sample['url'] = $news_archive_url;
                        $sample['tone_class'] = $tone_class;
                        get_template_part('template-parts/_news-item', null, array(
                            'context' => 'top',
                            'heading_tag' => 'h3',
                            'item' => $sample,
                        ));
                        ?>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>
