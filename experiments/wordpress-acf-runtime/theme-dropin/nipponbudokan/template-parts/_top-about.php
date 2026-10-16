<?php
$theme_uri = get_template_directory_uri();
$cards = array(
    array(
        'image' => 'about-card-01.webp',
        'overlay' => array('書道文化の継承', '武道の普及・振興と'),
        'label' => '日本武道館とは',
    ),
    array(
        'image' => 'about-card-03.webp',
        'overlay' => array('歩んだ歴史', '国内外の武道振興の拠点として'),
        'label' => '武道館の歴史',
    ),
    array(
        'image' => 'about-card-04.webp',
        'overlay' => array('支える総合施設', '武道・文化活動と研修を'),
        'label' => '武道館の施設',
    ),
    array(
        'image' => 'about-card-02.webp',
        'overlay' => array('人間形成を目指す', '心身の鍛錬を通じて'),
        'label' => '武道とは',
    ),
);
?>
<section id="top_about-01" class="top_about-01">
    <div class="ta_stage_bg" aria-hidden="true">
        <picture>
            <source srcset="<?php echo esc_url($theme_uri . '/images/top/about-bg-pc.webp'); ?>" media="(min-width: 768px)">
            <img src="<?php echo esc_url($theme_uri . '/images/top/about-bg-sp.webp'); ?>" alt="" width="1380" height="920">
        </picture>
    </div>
    <div class="ta_stage">
        <div class="global_inner">
            <div class="ta_top">
                <div class="ta_side">
                    <h2 class="ta_heading">
                        <span class="ta_heading_ja">日本武道館とは</span>
                        <span class="ta_heading_en"><span class="ta_heading_en_text"><span class="ta_heading_en_initial">A</span>bout&nbsp;us</span></span>
                    </h2>
                    <div class="ta_actions">
                        <a href="" target="_blank" class="ta_btn ta_btn_pdf" aria-disabled="true">パンフレット（1.2MB）</a>
                    </div>
                </div>
                <div class="ta_copy">
                    <p class="ta_lead">日本武道館は、日本の伝統文化である武道を普及・奨励し、青少年の心身の鍛錬と健全な育成を図るとともに、世界の平和に貢献することを目的に、1964年に創建されました。以来、武道大会や青少年育成事業をはじめ、さまざまな公益事業を展開し、武道文化の継承と発展に取り組んでいます。 </p>
                    <div class="ta_cards_wrap">
                        <div class="ta_cards">
                            <div class="swiper ta_cards_swiper" aria-label="日本武道館とは">
                                <div class="swiper-wrapper">
                                    <?php foreach ($cards as $index => $card): ?>
                                        <article class="swiper-slide ta_card">
                                            <a class="ta_card_link" aria-disabled="true">
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
