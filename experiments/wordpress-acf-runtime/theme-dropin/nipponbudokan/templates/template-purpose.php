<?php
/**
 * Template Name: 目的別
 *
 * ページ名を見出しにし、画像・概要・アイコンを出す。
 * ナビゲーションカードは本文のブロック。サイドメニューは目的から探す。
 */
get_header();

$image_id = 0;
$icon_id = 0;
$lead = '';
if (function_exists('get_field')) {
    $image_value = get_field('purpose_image');
    $icon_value = get_field('purpose_icon');
    $lead = (string) get_field('purpose_lead');
    $image_id = is_array($image_value) ? (int) ($image_value['ID'] ?? 0) : (int) $image_value;
    $icon_id = is_array($icon_value) ? (int) ($icon_value['ID'] ?? 0) : (int) $icon_value;
}
?>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
    <?php if (!post_password_required()) : ?>
        <section class="purposePage">
            <header class="purposeHero">
                <div class="purposeHero_copy">
                    <div class="purposeHero_heading">
                        <?php if ($icon_id) : ?>
                            <p class="purposeHero_icon"><?php echo wp_get_attachment_image($icon_id, 'medium', false, array('alt' => '', 'loading' => 'eager')); ?></p>
                        <?php endif; ?>
                        <h1 class="purposeHero_title"><?php echo nbk_title_html(get_the_title()); ?></h1>
                    </div>
                    <?php if ($lead !== '') : ?>
                        <p class="purposeHero_lead"><?php echo esc_html($lead); ?></p>
                    <?php endif; ?>
                </div>
                <?php if ($image_id) : ?>
                    <div class="purposeHero_media">
                        <?php echo wp_get_attachment_image($image_id, 'full', false, array(
                            'alt' => '',
                            'loading' => 'eager',
                            'fetchpriority' => 'high',
                            'decoding' => 'async',
                        )); ?>
                    </div>
                <?php endif; ?>
            </header>

            <div class="purposeBody">
                <nav class="purposeSidebar" aria-label="目的から探す">
                    <p class="tm_guide_head"><span class="tm_guide_head_icon" aria-hidden="true"></span><span class="tm_guide_head_text">目的から探す</span></p>
                    <div class="purposeBanner_clip">
                        <div class="tm_guide_body">
                            <?php get_template_part('template-parts/_purpose-menu', null, array(
                                'exclude_paths' => array('/recruit/'),
                            )); ?>
                        </div>
                    </div>
                </nav>

                <div class="purposeMain block-editor_wrap">
                    <?php the_content(); ?>
                </div>
            </div>
            <?php get_template_part('template-parts/_breadCrumb'); ?>
        </section>
    <?php else : ?>
        <section>
            <div class="global_inner _content">
                <div class="module_password">
                    <?php echo get_the_password_form(); ?>
                </div>
            </div>
            <?php get_template_part('template-parts/_breadCrumb'); ?>
        </section>
    <?php endif; ?>
</main>
<?php get_footer(); ?>
