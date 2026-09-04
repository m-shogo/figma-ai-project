<?php
$theme_uri = get_template_directory_uri();
$cards = array(
    array(
        'icon' => 'ico-budo.svg',
        'image' => 'guide-budo.webp',
        'title' => '武道',
        'text' => '日本の伝統的な武道を普及・奨励し、心身をきたえる中心的な道場として、人格形成や礼節を重んじる武道の振興事業を行っています。',
    ),
    array(
        'icon' => 'ico-calligraphy.svg',
        'image' => 'guide-calligraphy.webp',
        'title' => '書道',
        'text' => '月刊誌「書写書道」での段級位認定、高円宮杯日本武道館書写書道大展覧会・全日本書初め大展覧会の2大全国大会を主催しています。',
    ),
    array(
        'icon' => 'ico-budokan.svg',
        'image' => 'guide-budokan.webp',
        'title' => '日本武道館',
        'text' => '武道大会・研修会・青少年育成・書初め大展覧会・刊行物発行など、多岐にわたる事業を展開しています。',
    ),
);
?>
<section id="top_guide-01" class="top_guide-01">
    <div class="tg_deco" aria-hidden="true"></div>
    <div class="tg_intro">
        <div class="global_inner">
            <div class="tg_head">
                <h2 class="tg_heading">
                    <span class="tg_heading_ja">目的から探す</span>
                    <span class="tg_heading_en">User guide</span>
                </h2>
                <p class="tg_lead">日本武道館では、武道大会や書初め大展覧会、研修会、武道学園の行事など、多様な参加型イベントを開催しています。子どもから大人まで、技術向上や文化体験を目的とした機会がそろっています。参加内容に応じて、各種イベント情報からお選びください。</p>
            </div>
        </div>
    </div>
    <div class="tg_body">
        <div class="global_inner">
            <div class="tg_cards">
                <?php foreach ($cards as $card): ?>
                    <article class="tg_card">
                        <p class="tg_card_image"><img src="<?php echo esc_url($theme_uri . '/images/top/' . $card['image']); ?>" alt="" width="360" height="220" loading="lazy"></p>
                        <div class="tg_card_body">
                            <p class="tg_card_title">
                                <img class="tg_card_icon" src="<?php echo esc_url($theme_uri . '/images/top/' . $card['icon']); ?>" alt="" width="36" height="36">
                                <span><?php echo esc_html($card['title']); ?></span>
                            </p>
                            <p class="tg_card_line" aria-hidden="true"></p>
                            <p class="tg_card_text"><?php echo esc_html($card['text']); ?></p>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</section>
