<?php get_header(); ?>
<div class="top_mainVisual">
    <?php get_template_part('template-parts/_top-catchphrase'); ?>
    <div class="swiper tm_swiper-container">
        <ul class="swiper-wrapper">
            <?php if (have_rows('top_slider-01')): ?>
                <?php while (have_rows('top_slider-01')): the_row(); ?>
                    <?php
                    $img_pc = get_sub_field('img_pc');
                    $thumb_pc = wp_get_attachment_image_src($img_pc, 'top_main_pc');
                    $alt_pc = isset(get_post($img_pc)->ID) ? get_post_meta(get_post($img_pc)->ID, '_wp_attachment_image_alt', true) : "";
                    $img_sp = get_sub_field('img_sp');
                    $thumb_sp = wp_get_attachment_image_src($img_sp, 'top_main_sp');
                    $alt_sp = isset(get_post($img_sp)->ID) ? get_post_meta(get_post($img_sp)->ID, '_wp_attachment_image_alt', true) : "";
                    $text = get_sub_field('text');
                    ?>
                    <li class="swiper-slide">
                        <p class="tm_background">
                            <picture>
                                <source srcset="<?php echo  esc_url($thumb_pc[0]); ?>" width="1380" height="600" media="(min-width: 768px)">
                                <source srcset="<?php echo  esc_url($thumb_sp[0]); ?>" width="375" height="375" media="(max-width: 767px)">
                                <img src="<?php echo  esc_url($thumb_sp[0]); ?>" alt="<?php echo $alt_sp; ?>" width="1380" height="600" fetchpriority="high">
                            </picture>
                        </p>
                        <?php if ($text): ?>
                            <div class="tm_inner">
                                <p class="tm_title"><span><?php echo $text; ?></span></p>
                            </div>
                        <?php endif; ?>
                    </li>
                <?php endwhile; ?>
            <?php endif; ?>
        </ul>
        <div class="swiper-pagination"></div>
    </div>
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