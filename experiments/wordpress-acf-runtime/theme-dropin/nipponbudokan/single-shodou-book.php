<?php
/**
 * 月刊書写書道 号詳細。
 */
get_template_part('template-parts/publications/_acf-has-value');
get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <div class="global_inner _content">
            <div class="gc_main _oneColumn">
                <?php get_template_part('template-parts/publications/_shodou-detail', null, array('post_id' => get_the_ID())); ?>
            </div>
        </div>

        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
