<?php
$year = nipponbudokan_event_selected_year();
$month = (int) get_query_var('event_m');
$heading = ($month >= 1 && $month <= 12) ? $year . '年' . $month . '月' : $year . '年';
$calendar_url = home_url('/#top_calendar');
?>
<div class="global_inner _content">
    <div class="news_archive event_archive">
        <?php get_template_part('template-parts/_event-month-nav'); ?>
        <div class="ea_board">
            <div class="ea_toolbar">
                <h2 class="ea_heading"><?php echo esc_html($heading); ?></h2>
                <p class="ea_cal">
                    <a href="<?php echo esc_url($calendar_url); ?>">カレンダーで見る</a>
                </p>
            </div>
            <?php get_template_part('template-parts/_news-tabs', null, array(
                'context' => 'archive',
                'link_tabs' => true,
                'taxonomy' => 'event_cat',
                'post_type' => 'event',
            )); ?>
        </div>
        <?php if (have_posts()) : ?>
            <div class="ea_list">
                <?php while (have_posts()) : the_post(); ?>
                    <?php get_template_part('template-parts/_event-card'); ?>
                <?php endwhile; ?>
            </div>
            <?php get_template_part('template-parts/_pagination', null, array(
                'variant' => 'news',
            )); ?>
        <?php else : ?>
            <p>記事はありません。</p>
        <?php endif; ?>
    </div>
</div>
