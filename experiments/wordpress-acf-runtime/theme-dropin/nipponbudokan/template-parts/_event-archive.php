<div class="global_inner _content">
    <div class="news_archive event_archive">
        <?php get_template_part('template-parts/_news-tabs', null, array(
            'context' => 'archive',
            'link_tabs' => true,
            'taxonomy' => 'event_cat',
            'post_type' => 'event',
        )); ?>
        <?php get_template_part('template-parts/_list-card'); ?>
    </div>
</div>
