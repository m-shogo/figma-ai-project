<?php
/**
 * CPT `event` native archive.
 * Public URL owner: `/event/`。Markup: `_event-archive.php`。
 */
get_header();
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <section>
        <?php get_template_part('template-parts/_visual'); ?>
        <?php get_template_part('template-parts/_event-archive'); ?>
        <?php get_template_part('template-parts/_breadCrumb'); ?>
    </section>
</main>
<?php get_footer(); ?>
