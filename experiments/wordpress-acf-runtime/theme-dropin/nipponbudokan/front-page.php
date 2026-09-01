<?php get_header(); ?>
<?php
$theme_uri = get_template_directory_uri();
$has_slider = function_exists('have_rows') && have_rows('top_slider-01');
?>
<div class="top_mainVisual">
    <div class="tm_stage">
        <div class="tm_mv">
            <div class="swiper tm_swiper-container">
                <ul class="swiper-wrapper">
                    <?php if ($has_slider): ?>
                        <?php while (have_rows('top_slider-01')): the_row(); ?>
                            <?php
                            $img_pc = get_sub_field('img_pc');
                            $thumb_pc = $img_pc ? wp_get_attachment_image_src($img_pc, 'top_main_pc') : null;
                            $alt_pc = ($img_pc && get_post($img_pc)) ? get_post_meta($img_pc, '_wp_attachment_image_alt', true) : '';
                            $img_sp = get_sub_field('img_sp');
                            $thumb_sp = $img_sp ? wp_get_attachment_image_src($img_sp, 'top_main_sp') : null;
                            $alt_sp = ($img_sp && get_post($img_sp)) ? get_post_meta($img_sp, '_wp_attachment_image_alt', true) : '';
                            $text = get_sub_field('text');
                            $pc_src = !empty($thumb_pc[0]) ? $thumb_pc[0] : $theme_uri . '/images/top/mv-sample.png';
                            $sp_src = !empty($thumb_sp[0]) ? $thumb_sp[0] : $pc_src;
                            ?>
                            <li class="swiper-slide">
                                <div class="tm_background">
                                    <picture>
                                        <source srcset="<?php echo esc_url($pc_src); ?>" media="(min-width: 768px)">
                                        <img src="<?php echo esc_url($sp_src); ?>" alt="<?php echo esc_attr($alt_sp ?: $alt_pc); ?>" width="1040" height="600" fetchpriority="high">
                                    </picture>
                                </div>
                                <?php if ($text): ?>
                                    <div class="tm_inner">
                                        <p class="tm_title"><span><?php echo esc_html($text); ?></span></p>
                                    </div>
                                <?php endif; ?>
                            </li>
                        <?php endwhile; ?>
                    <?php else: ?>
                        <li class="swiper-slide">
                            <div class="tm_background">
                                <img src="<?php echo esc_url($theme_uri . '/images/top/mv-sample.png'); ?>" alt="<?php bloginfo('name'); ?>" width="1040" height="600" fetchpriority="high">
                            </div>
                            <div class="tm_inner">
                                <p class="tm_title"><span>伝統を未来へつなぐ、<br>武道と書道の中心地</span></p>
                                <p class="tm_lead"><span>武道の振興、書道文化の継承、公益事業の拠点として活動しています。</span></p>
                            </div>
                        </li>
                    <?php endif; ?>
                </ul>
                <?php if ($has_slider): ?>
                    <div class="swiper-pagination"></div>
                <?php endif; ?>
            </div>
        </div>

        <aside class="tm_guide" aria-label="目的から探す">
            <p class="tm_guide_head"><span class="tm_guide_head_icon" aria-hidden="true"></span><span class="tm_guide_head_text">目的から探す</span></p>
            <div class="tm_guide_body">
                <div class="tm_guide_group">
                    <p class="tm_guide_title"><img src="<?php echo esc_url($theme_uri . '/images/top/ico-budo.svg'); ?>" alt="" width="36" height="36" loading="lazy"><span>武道</span></p>
                    <ul class="tm_guide_list">
                        <li><a href="#">武道を知りたい</a></li>
                        <li><a href="#">大会・行事に参加したい</a></li>
                        <li><a href="#">指導について知りたい</a></li>
                    </ul>
                </div>
                <div class="tm_guide_group">
                    <p class="tm_guide_title"><img src="<?php echo esc_url($theme_uri . '/images/top/ico-calligraphy.svg'); ?>" alt="" width="36" height="36" loading="lazy"><span>書道</span></p>
                    <ul class="tm_guide_list">
                        <li><a href="#">書道を学びたい</a></li>
                        <li><a href="#">展覧会に参加したい</a></li>
                    </ul>
                </div>
                <div class="tm_guide_group">
                    <p class="tm_guide_title"><img src="<?php echo esc_url($theme_uri . '/images/top/ico-budokan.svg'); ?>" alt="" width="36" height="36" loading="lazy"><span>日本武道館</span></p>
                    <ul class="tm_guide_list">
                        <li><a href="#">研修施設を利用したい</a></li>
                        <li><a href="#">コンサートに行きたい</a></li>
                        <li><a href="#">武道館について知りたい</a></li>
                    </ul>
                </div>
            </div>
        </aside>
    </div>

    <section id="top_notice-01" class="top_notice-01">
        <div class="tn_inner">
            <p class="tn_icon" aria-hidden="true"><img src="<?php echo esc_url($theme_uri . '/images/top/ico-attention.svg'); ?>" alt="" width="24" height="24" loading="lazy"></p>
            <div class="tn_body">
                    <?php if (function_exists('have_rows') && have_rows('top_notice-01')): ?>
                        <ul class="tn_list">
                            <?php while (have_rows('top_notice-01')): the_row(); ?>
                                <?php
                                $textarea = get_sub_field('textarea');
                                $none = get_sub_field('none');
                                ?>
                                <?php if (!$none && $textarea): ?>
                                    <li class="tn_item"><?php echo $textarea; ?></li>
                                <?php endif; ?>
                            <?php endwhile; ?>
                        </ul>
                    <?php else: ?>
                        <p class="tn_text"><a href="#">コンサートでご来場される皆様へ、日本武道館からのお願い</a></p>
                    <?php endif; ?>
                </div>
            </div>
        </section>
</div>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <?php get_template_part('template-parts/_top-events'); ?>
    <?php get_template_part('template-parts/_top-guide'); ?>
    <?php get_template_part('template-parts/_top-about'); ?>
    <?php get_template_part('template-parts/_top-news'); ?>
    <?php get_template_part('template-parts/_top-partner'); ?>
    <?php get_template_part('template-parts/_top-instagram'); ?>
    <?php get_template_part('template-parts/_top-banner'); ?>
</main>
<?php get_footer(null, array('map' => true)); ?>
