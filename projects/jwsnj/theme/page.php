<?php get_header(); ?>
<main id="global_contents" class="global_contents jwsnj_fixedPageMain" itemscope itemprop="mainContentOfPage">
    <section class="jwsnj_fixedPage">
        <?php get_template_part('template-parts/_fixed-page-visual'); ?>
        <?php if (post_password_required()) : ?>
            <div class="global_inner jwsnj_fixedPage_inner">
                <div class="module_password"><?php echo get_the_password_form(); ?></div>
            </div>
        <?php else : ?>
            <?php
            // Keep the existing editor-managed menu and walker; no empty aside.
            ob_start();
            get_sidebar();
            $sidebar = trim(ob_get_clean());
            ?>
            <div class="global_inner jwsnj_fixedPage_inner<?php if ($sidebar !== '') : ?> has-sidebar<?php endif; ?>">
                <div class="gc_main">
                    <div class="block-editor_wrap"><?php the_content(); ?></div>
                </div>
                <?php if ($sidebar !== '') : ?>
                    <aside class="gc_sub"><?php echo $sidebar; ?></aside>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        <?php get_template_part('template-parts/_breadCrumb', null, ['jwsnj_page' => true]); ?>
    </section>
</main>
<?php get_footer(); ?>
