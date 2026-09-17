<?php
$month_filter = nipponbudokan_event_archive_month_filter();
$year = $month_filter ? $month_filter[0] : nipponbudokan_event_selected_year();
$month = $month_filter ? $month_filter[1] : nipponbudokan_event_selected_month();
?>
<div class="global_inner _content">
    <div class="news_archive event_archive">
        <?php get_template_part('template-parts/_event-month-nav'); ?>
        <div class="ea_board">
            <?php if ($month_filter) : ?>
            <div class="ea_toolbar">
                <h2 class="ea_heading"><?php echo esc_html($year . '年' . $month . '月'); ?></h2>
            </div>
            <?php endif; ?>
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
