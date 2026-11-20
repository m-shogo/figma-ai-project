<?php get_header(); ?>
<?php
$theme_uri = get_template_directory_uri();
$has_acf_pro_repeater = class_exists('acf_field_repeater');
$default_title_pc = '伝統を未来へつなぐ、<br>武道の大殿堂';
$default_title_sp = $default_title_pc;
$default_lead_pc = '武道、書道の普及・振興を公益目的事業として活動しています。';
$default_lead_sp = $default_lead_pc;
// 確認用。後で top_mv_preview（表示確認）ごと削除する。なし以外は時間より優先。
$mv_preview_fields = array(
    'morning' => 'top_mv_morning',
    'day' => 'top_mv_day',
    'night' => 'top_mv_night',
);
$mv_preview = function_exists('get_field') ? get_field('top_mv_preview', get_queried_object_id()) : '';
if (is_string($mv_preview) && isset($mv_preview_fields[$mv_preview])) {
    $mv_field = $mv_preview_fields[$mv_preview];
} else {
    $mv_hour = (int) (new DateTimeImmutable('now', new DateTimeZone('Asia/Tokyo')))->format('G');
    if ($mv_hour >= 6 && $mv_hour < 12) {
        $mv_field = 'top_mv_morning';
    } elseif ($mv_hour >= 12 && $mv_hour < 18) {
        $mv_field = 'top_mv_day';
    } else {
        $mv_field = 'top_mv_night';
    }
}
$mv_group = function_exists('get_field') ? get_field($mv_field, get_queried_object_id()) : null;
$mv_pc_id = is_array($mv_group) ? (int) ($mv_group['img_pc'] ?? 0) : 0;
$mv_sp_id = is_array($mv_group) ? (int) ($mv_group['img_sp'] ?? 0) : 0;
$mv_pc = $mv_pc_id ? wp_get_attachment_image_src($mv_pc_id, 'full') : null;
$mv_sp = $mv_sp_id ? wp_get_attachment_image_src($mv_sp_id, 'full') : null;
$mv_pc_src = !empty($mv_pc[0]) ? $mv_pc[0] : '';
$mv_sp_src = !empty($mv_sp[0]) ? $mv_sp[0] : $mv_pc_src;
$mv_img_src = $mv_sp_src !== '' ? $mv_sp_src : $mv_pc_src;
$mv_alt_pc = $mv_pc_id ? (string) get_post_meta($mv_pc_id, '_wp_attachment_image_alt', true) : '';
$mv_alt_sp = $mv_sp_id ? (string) get_post_meta($mv_sp_id, '_wp_attachment_image_alt', true) : '';
$mv_alt = $mv_alt_sp !== '' ? $mv_alt_sp : $mv_alt_pc;
?>
<div class="top_mainVisual">
    <div class="tm_stage">
        <div class="tm_mv">
            <?php if ($mv_img_src !== ''): ?>
            <div class="tm_background">
                <picture>
                    <?php if ($mv_pc_src !== ''): ?>
                        <source srcset="<?php echo esc_url($mv_pc_src); ?>" media="(min-width: 768px)">
                    <?php endif; ?>
                    <img src="<?php echo esc_url($mv_img_src); ?>" alt="<?php echo esc_attr($mv_alt); ?>" width="1030" height="600" fetchpriority="high">
                </picture>
            </div>
            <?php endif; ?>
            <div class="tm_inner">
                <p class="tm_title">
                    <span class="tm_copy_pc"><?php echo wp_kses_post($default_title_pc); ?></span>
                    <span class="tm_copy_sp"><?php echo wp_kses_post($default_title_sp); ?></span>
                </p>
                <p class="tm_lead">
                    <span class="tm_copy_pc"><?php echo wp_kses_post($default_lead_pc); ?></span>
                    <span class="tm_copy_sp"><?php echo wp_kses_post($default_lead_sp); ?></span>
                </p>
            </div>
        </div>

        <aside class="tm_guide" aria-label="目的から探す">
            <p class="tm_guide_head"><span class="tm_guide_head_icon" aria-hidden="true"></span><span class="tm_guide_head_text">目的から探す</span></p>
            <div class="tm_guide_body">
                <?php get_template_part('template-parts/_purpose-menu'); ?>
            </div>
        </aside>
    </div>

    <?php
    $notice = null;
    $show_notice = true;
    if ($has_acf_pro_repeater && function_exists('get_field') && function_exists('have_rows')) {
        $show_notice = (bool) get_field('top_notice_select');
        if ($show_notice && have_rows('top_notice-01')) {
            while (have_rows('top_notice-01')) {
                the_row();
                $title = get_sub_field('title');
                $title = is_string($title) ? trim(wp_strip_all_tags($title)) : '';
                if ($title === '') {
                    $legacy = get_sub_field('textarea');
                    $title = is_string($legacy) ? trim(wp_strip_all_tags($legacy)) : '';
                }
                if ($title === '') {
                    continue;
                }
                if (function_exists('mb_substr')) {
                    $title = mb_substr($title, 0, 30);
                }
                $url = get_sub_field('url');
                $url = is_string($url) ? trim(str_replace(array("\r", "\n"), '', $url)) : '';
                $notice = array(
                    'title' => $title,
                    'url' => $url,
                    'external' => $url !== '' && (bool) get_sub_field('external'),
                );
                break;
            }
        }
        $show_notice = $show_notice && $notice !== null;
    }
    ?>
    <?php if ($show_notice): ?>
        <section id="top_notice-01" class="top_notice-01">
            <div class="tn_inner">
                <p class="tn_icon" aria-hidden="true"><img src="<?php echo esc_url($theme_uri . '/images/top/ico-attention.svg'); ?>" alt="" width="24" height="24" loading="lazy"></p>
                <div class="tn_body">
                    <?php if ($notice): ?>
                        <?php if ($notice['url'] !== ''): ?>
                            <a class="tn_text" href="<?php echo esc_url($notice['url']); ?>"<?php echo $notice['external'] ? ' target="_blank" rel="noopener noreferrer"' : ''; ?>><?php echo esc_html($notice['title']); ?></a>
                        <?php else: ?>
                            <p class="tn_text"><?php echo esc_html($notice['title']); ?></p>
                        <?php endif; ?>
                    <?php else: ?>
                        <span class="tn_placeholder" aria-disabled="true">重要なお知らせ</span>
                    <?php endif; ?>
                </div>
            </div>
        </section>
    <?php endif; ?>
</div>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <?php get_template_part('template-parts/_top-events'); ?>
    <?php get_template_part('template-parts/_top-sns'); ?>
    <?php get_template_part('template-parts/_top-guide'); ?>
    <?php get_template_part('template-parts/_top-about'); ?>
    <?php get_template_part('template-parts/_top-news'); ?>
    <?php get_template_part('template-parts/_top-partner'); ?>
    <?php get_template_part('template-parts/_top-instagram'); ?>
    <?php get_template_part('template-parts/_top-banner'); ?>
</main>
<?php get_footer(null, array('map' => true)); ?>