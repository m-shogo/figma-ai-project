<?php get_header(); ?>
<div class="top_mainVisual">
    <?php get_template_part('template-parts/_top-catchphrase'); ?>
    <?php get_template_part('template-parts/_top-mv-grid'); ?>
    <?php get_template_part('template-parts/_top-notice'); ?>
</div>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <?php get_template_part('template-parts/_top-about-intro'); ?>
    <?php get_template_part('template-parts/_top-applicants'); ?>
    <?php get_template_part('template-parts/_top-news'); ?>
    <div id="top_banner-01" class="top_banner-01">
        <div class="global_inner">
            <?php if (have_rows('top_banner-01')): ?>
                <ul class="list">
                    <?php while (have_rows('top_banner-01')): the_row(); ?>
                        <?php
                        $img = get_sub_field('img');
                        $thumb = wp_get_attachment_image_src($img, 'top_banner');
                        $title = get_sub_field('title');
                        $alt = isset(get_post($img)->ID) ? get_post_meta(get_post($img)->ID, '_wp_attachment_image_alt', true) : "";
                        $url = get_sub_field('url');
                        $target = get_sub_field('target');
                        ?>
                        <li <?php if (empty($img)): ?>class="_noImage" <?php endif; ?>>
                            <a <?php if (!empty($url)): ?>href="<?php echo esc_url($url); ?>" <?php if ($target): ?>target="_blank" <?php endif; ?><?php else: ?> class="_disabled" tabindex="-1" <?php endif; ?>>
                                <?php if ($img): ?><p class="image"><img src="<?php echo $thumb[0]; ?>" alt="<?php echo $alt; ?>" width="335" height="101" loading="lazy"></p><?php endif; ?>
                                <?php if ($title): ?><p class="title"><?php echo $title; ?></p><?php endif; ?>
                            </a>
                        </li>
                    <?php endwhile; ?>
                </ul>
            <?php endif; ?>
        </div>
    </div>
</main>
<?php get_footer(); ?>