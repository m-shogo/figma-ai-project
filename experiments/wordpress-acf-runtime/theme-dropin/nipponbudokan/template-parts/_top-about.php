<?php
$theme_uri = get_template_directory_uri();
$cards = array(
    array(
        'overlay' => '武道の普及・振興と書道文化の継承',
        'label' => '日本武道館とは',
    ),
    array(
        'overlay' => '心身の鍛錬を通じて人間形成を目指す',
        'label' => '武道とは',
    ),
    array(
        'overlay' => '武道を結び音楽を刻んだ半世紀の歴史',
        'label' => '武道館の歴史',
    ),
    array(
        'overlay' => '武道から研修まで集中と成長を支える拠点',
        'label' => '武道館の施設',
    ),
);
?>
<section id="top_about-01" class="top_about-01">
    <div class="ta_stage_bg" aria-hidden="true">
        <img src="<?php echo esc_url($theme_uri . '/images/top/mv-sample.png'); ?>" alt="" width="1380" height="600">
    </div>
    <div class="ta_stage">
        <div class="global_inner">
            <div class="ta_top">
                <h2 class="ta_heading">
                    <span class="ta_heading_ja">日本武道館とは</span>
                    <span class="ta_heading_en">About us</span>
                </h2>
                <div class="ta_panel">
                    <p class="ta_lead">日本武道館は、武道の普及・振興と書道文化の継承を目的として設立された公益財団法人です。武道大会・研修会・青少年育成・書初め大展覧会・刊行物発行など、多岐にわたる事業を展開しています。1964年東京オリンピックでは柔道競技の会場となり、現在は式典やコンサート会場としても利用されています。</p>
                    <div class="ta_actions">
                        <a class="ta_btn ta_btn_pdf" href="#">パンフレット（10MB）</a>
                        <a class="ta_btn ta_btn_video" href="#">ご紹介動画</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="ta_cards_wrap">
        <div class="global_inner">
            <div class="ta_cards">
                <?php foreach ($cards as $card): ?>
                    <article class="ta_card">
                        <a class="ta_card_link" href="#">
                            <p class="ta_card_image">
                                <img src="<?php echo esc_url($theme_uri . '/images/common/noimage.webp'); ?>" alt="" width="240" height="320" loading="lazy">
                                <span class="ta_card_overlay"><?php echo esc_html($card['overlay']); ?></span>
                            </p>
                            <p class="ta_card_label"><?php echo esc_html($card['label']); ?></p>
                        </a>
                    </article>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</section>
