<?php
$theme_uri = get_template_directory_uri();
$about_post_id = get_queried_object_id();
$about_bg_sp_id = function_exists('get_field') ? (int) get_field('top_about-bgsp', $about_post_id) : 0;
$about_bg_pc_id = function_exists('get_field') ? (int) get_field('top_about-bgpc', $about_post_id) : 0;
$about_bg_sp = $about_bg_sp_id ? wp_get_attachment_image_src($about_bg_sp_id, 'full') : null;
$about_bg_pc = $about_bg_pc_id ? wp_get_attachment_image_src($about_bg_pc_id, 'full') : null;
$about_bg_pc_src = !empty($about_bg_pc[0]) ? $about_bg_pc[0] : '';
$about_bg_sp_src = !empty($about_bg_sp[0]) ? $about_bg_sp[0] : $about_bg_pc_src;
$about_bg_src = $about_bg_sp_src !== '' ? $about_bg_sp_src : $about_bg_pc_src;
$about_bg_width = !empty($about_bg_sp[1]) ? (int) $about_bg_sp[1] : (!empty($about_bg_pc[1]) ? (int) $about_bg_pc[1] : 1380);
$about_bg_height = !empty($about_bg_sp[2]) ? (int) $about_bg_sp[2] : (!empty($about_bg_pc[2]) ? (int) $about_bg_pc[2] : 920);
$cards = array(
    array(
        'image' => 'about-card-01.webp',
        'overlay' => array('書道文化の継承', '武道の普及・振興と'),
        'label' => '日本武道館とは',
        'url' => home_url('/about/nipponbudokan/'),
    ),
    array(
        'image' => 'about-card-03.webp',
        'overlay' => array('歩んだ歴史', '国内外の武道振興の拠点として'),
        'label' => '武道館の歴史',
        'url' => home_url('/about/history/'),
    ),
    array(
        'image' => 'about-card-04.webp',
        'overlay' => array('支える総合施設', '武道・文化活動と研修を'),
        'label' => '武道館の施設',
        'url' => home_url('/about/facility/'),
    ),
    array(
        'image' => 'about-card-02.webp',
        'overlay' => array('人間形成を目指す', '心身の鍛錬を通じて'),
        'label' => '武道とは',
        'url' => home_url('/budo/'),
    ),
);
?>
<section id="top_about-01" class="top_about-01">
    <?php if ($about_bg_src !== ''): ?>
    <div class="ta_stage_bg" aria-hidden="true">
        <picture>
            <?php if ($about_bg_pc_src !== ''): ?>
                <source srcset="<?php echo esc_url($about_bg_pc_src); ?>" media="(min-width: 768px)">
            <?php endif; ?>
            <img src="<?php echo esc_url($about_bg_src); ?>" alt="" width="<?php echo esc_attr($about_bg_width); ?>" height="<?php echo esc_attr($about_bg_height); ?>">
        </picture>
    </div>
    <?php endif; ?>
    <div class="ta_stage">
        <div class="global_inner">
            <div class="ta_top">
                <div class="ta_side">
                    <h2 class="ta_heading">
                        <span class="ta_heading_ja">日本武道館とは</span>
                        <span class="ta_heading_en"><span class="ta_heading_en_text"><span class="ta_heading_en_initial">A</span>bout&nbsp;us</span></span>
                    </h2>
                    <div class="ta_actions">
                        <a href="/wp/wp-content/themes/nipponbudokan/pdf/pamphlet.pdf" target="_blank" class="ta_btn ta_btn_pdf" aria-disabled="true">パンフレット（29MB）</a>
                    </div>
                </div>
                <div class="ta_copy">
                    <p class="ta_lead">日本武道館は、日本の伝統文化である武道を普及・奨励し、青少年の心身の鍛錬と健全な育成を図るとともに、世界の平和に貢献することを目的に、1964年に創建されました。以来、武道振興・普及事業、教育文化事業に幅広く取り組んでいます。</p>
                    <div class="ta_cards_wrap">
                        <div class="ta_cards">
                            <div class="swiper ta_cards_swiper" aria-label="日本武道館とは">
                                <div class="swiper-wrapper">
                                    <?php foreach ($cards as $index => $card): ?>
                                        <?php $card_url = isset($card['url']) ? (string) $card['url'] : ''; ?>
                                        <article class="swiper-slide ta_card">
                                            <a class="ta_card_link"<?php echo $card_url !== '' ? ' href="' . esc_url($card_url) . '"' : ' aria-disabled="true"'; ?>>
                                                <p class="ta_card_image">
                                                    <img src="<?php echo esc_url($theme_uri . '/images/top/' . $card['image']); ?>" alt="" width="295" height="197" loading="lazy">
                                                    <span class="ta_card_overlay">
                                                        <?php foreach ($card['overlay'] as $line): ?>
                                                            <span><?php echo esc_html($line); ?></span>
                                                        <?php endforeach; ?>
                                                    </span>
                                                </p>
                                                <p class="ta_card_label"><?php echo esc_html($card['label']); ?></p>
                                            </a>
                                        </article>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                        <p class="ta_scroll" aria-hidden="true"><span class="ta_scroll_bar"></span></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
