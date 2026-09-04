<?php
$theme_uri = get_template_directory_uri();
$event_query = new WP_Query(array(
    'post_type' => 'event',
    'posts_per_page' => 4,
    'has_password' => false,
    'orderby' => 'date',
    'order' => 'DESC',
    'post_status' => 'publish',
));
$has_events = $event_query->have_posts();
$samples = array(
    array('status' => '募集中', 'title' => '武道学園 入学案内'),
    array('status' => '開催中', 'title' => '少年少女武道錬成大会'),
    array('status' => '受付終了', 'title' => '書初め大展覧会'),
    array('status' => '募集中', 'title' => '古武道演武大会'),
);
?>
<section id="top_events-01" class="top_events-01">
    <div class="global_inner">
        <h2 class="te_heading">
            <span class="te_heading_ja">大会・イベント情報</span>
            <span class="te_heading_en"><span class="te_heading_en_initial">E</span>vent</span>
        </h2>
        <div class="te_layout">
            <div class="te_featured">
                <p class="te_featured_banner"><img src="<?php echo esc_url($theme_uri . '/images/top/ico-facilities.svg'); ?>" alt="" width="28" height="21" aria-hidden="true"><span>注目の大会・募集</span></p>
                <div class="te_cards">
                    <?php if ($has_events): ?>
                        <?php while ($event_query->have_posts()): $event_query->the_post(); ?>
                            <?php
                            $link_attrs = get_post_link_attributes();
                            $href = !empty($link_attrs['url']) ? $link_attrs['url'] : get_permalink();
                            $terms = get_the_terms(get_the_ID(), 'event_cat');
                            $cat_name = ($terms && !is_wp_error($terms)) ? $terms[0]->name : '';
                            $thumb_id = get_post_thumbnail_id();
                            $thumb = $thumb_id ? wp_get_attachment_image_src($thumb_id, 'medium') : null;
                            $img = !empty($thumb[0]) ? $thumb[0] : $theme_uri . '/images/common/noimage.webp';
                            ?>
                            <article class="te_card">
                                <a class="te_card_link" href="<?php echo esc_url($href); ?>">
                                    <p class="te_card_image"><img src="<?php echo esc_url($img); ?>" alt="" width="240" height="160" loading="lazy"></p>
                                    <div class="te_card_body">
                                        <?php if ($cat_name): ?>
                                            <p class="te_card_labels"><span class="te_label te_label_cat"><?php echo esc_html($cat_name); ?></span></p>
                                        <?php endif; ?>
                                        <p class="te_card_date">開催日 : <?php echo esc_html(get_the_date('Y.m.d')); ?></p>
                                        <h3 class="te_card_title"><?php the_title(); ?></h3>
                                    </div>
                                </a>
                            </article>
                        <?php endwhile; ?>
                        <?php wp_reset_postdata(); ?>
                    <?php else: ?>
                        <?php foreach ($samples as $sample): ?>
                            <article class="te_card">
                                <a class="te_card_link" href="<?php echo esc_url(get_post_type_archive_link('event')); ?>">
                                    <p class="te_card_image"><img src="<?php echo esc_url($theme_uri . '/images/common/noimage.webp'); ?>" alt="" width="240" height="160" loading="lazy"></p>
                                    <div class="te_card_body">
                                        <p class="te_card_labels">
                                            <span class="te_label<?php echo ($sample['status'] === '受付終了') ? ' te_label_closed' : ' te_label_open'; ?>"><?php echo esc_html($sample['status']); ?></span>
                                            <span class="te_label te_label_cat">カテゴリー</span>
                                        </p>
                                        <p class="te_card_date">開催日 : 2026.00.00～00.00</p>
                                        <h3 class="te_card_title"><?php echo esc_html($sample['title']); ?></h3>
                                    </div>
                                </a>
                            </article>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
            <div class="te_calendar_wrap">
                <div class="te_cal_toolbar">
                    <div class="te_cal_views" role="tablist" aria-label="カレンダー表示切替">
                        <button type="button" class="te_cal_view is-active" data-view="dayGridMonth" aria-pressed="true">カレンダー表示</button>
                        <button type="button" class="te_cal_view" data-view="listMonth" aria-pressed="false">リスト表示</button>
                    </div>
                    <div class="te_cal_month">
                        <button type="button" class="te_cal_nav te_cal_prev" aria-label="前の月"></button>
                        <p class="te_cal_label" aria-live="polite"></p>
                        <button type="button" class="te_cal_nav te_cal_next" aria-label="次の月"></button>
                    </div>
                </div>
                <div id="top_calendar" class="te_calendar"></div>
                <ul class="te_cal_legend">
                    <li><span class="te_cal_swatch te_cal_swatch_a" aria-hidden="true"></span>イベント種別</li>
                    <li><span class="te_cal_swatch te_cal_swatch_b" aria-hidden="true"></span>イベント種別</li>
                    <li><span class="te_cal_swatch te_cal_swatch_c" aria-hidden="true"></span>イベント種別</li>
                </ul>
                <p class="te_more">
                    <a href="<?php echo esc_url(get_post_type_archive_link('event')); ?>">
                        <span class="te_more_icon" aria-hidden="true"></span>
                        イベント一覧を表示
                    </a>
                </p>
            </div>
        </div>
        <aside class="te_sns" aria-label="公式SNS">
            <ul>
                <li>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                        <span class="te_sns_icon te_sns_youtube" aria-hidden="true"></span>
                        公式Youtube
                    </a>
                </li>
                <li>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                        <span class="te_sns_icon te_sns_instagram" aria-hidden="true"></span>
                        月刊「武道」編集部
                    </a>
                </li>
                <li>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                        <span class="te_sns_icon te_sns_x" aria-hidden="true"></span>
                        月刊「武道」編集部
                    </a>
                </li>
            </ul>
        </aside>
    </div>
</section>
