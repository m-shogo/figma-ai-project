<div class="global_inner _content">
    <div class="news_archive">
        <?php get_template_part('template-parts/_news-tabs', null, array(
            'context' => 'archive',
            'link_tabs' => true,
        )); ?>
        <?php get_template_part('template-parts/_list-news', null, array(
            'context' => 'archive',
        )); ?>
    </div>
</div>
