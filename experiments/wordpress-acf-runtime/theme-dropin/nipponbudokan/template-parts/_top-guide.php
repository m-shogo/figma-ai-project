<?php
$theme_uri = get_template_directory_uri();
$cards = array(
    array(
        'icon' => 'ico-budo.svg',
        'image' => 'guide-budo.webp',
        'title' => '武道',
        'text' => '全日本少年少女武道錬成大会や指導者研修会など、武道を学び、技術を高め、指導に生かすための情報をご案内します。',
    ),
    array(
        'icon' => 'ico-calligraphy.svg',
        'image' => 'guide-calligraphy.webp',
        'title' => '書道',
        'text' => '月刊「書写書道」や段級位認定、高円宮杯日本武道館書写書道大展覧会・全日本書初め大展覧会など、書写書道を学び、作品を発表する機会に関する情報をご案内します。',
    ),
    array(
        'icon' => 'ico-budokan.svg',
        'image' => 'guide-budokan.webp',
        'title' => '日本武道館',
        'text' => '創建目的や沿革、施設概要をはじめ、研修センターの利用案内などを紹介しています。また、来場される皆様へのご案内やお願いも、こちらからご覧いただけます。 ',
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
                    <span class="tg_heading_en"><span class="tg_heading_en_initial">U</span>ser guide</span>
                </h2>
                <p class="tg_lead">日本武道館では、武道や書道に関する大会や指導者研修会、刊行物の発行、研修センターの運営など、さまざまな事業を行っています。参加したい、知りたい、利用したいなど、ご自身の目的に合わせて情報をお探しいただけます。</p>
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
