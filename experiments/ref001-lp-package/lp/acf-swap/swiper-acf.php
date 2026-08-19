<?php
/**
 * 「Swiper（力をつけ活躍する先輩たち）」ACF差し替え版。
 *
 * lp-originalPage.php の直書き<section class="ref-messages" ...>...</section>を
 * このファイルの include に置き換えると、ACF PROの繰り返しフィールド
 * `ref001_swiper_slides`（lp/acf-json/group_ref001_swiper.json）を
 * 編集画面から更新できるようになる。
 *
 * Swiper本体のライブラリ/矢印色/hit area/JS初期化はlp/js/ref001-interactions.js
 * 側の既存実装をそのまま使う（このファイルはHTML/データ部分のみ）。
 * ACF未設定・0件の場合は元の直書き版と同じ4枚がそのまま表示される。
 */

require_once __DIR__ . '/_helpers.php';

$ref001_lp_swiper_fixture_rows = [
    [
        'photo' => null, 'photo_slot' => 'messages-photo',
        'quote_pc' => "大学で培った企画力を武器に、\n今はIT企業のマーケターとして挑戦の毎日です！",
        'quote_sp' => "大学で培った企画力を武器に、\n今はIT企業のマーケターとして\n挑戦の毎日です！",
        'profile' => '経営学科ビジネス経営コース3年 Tさん', 'school' => '千葉県立生浜高等学校出身',
    ],
    [
        'photo' => null, 'photo_slot' => 'reason-1',
        'quote_pc' => "ゼミで身につけた行動力を活かして、\n地域と企業をつなぐ仕事に挑戦しています！",
        'quote_sp' => "ゼミで身につけた行動力を活かして、\n地域と企業をつなぐ仕事に\n挑戦しています！",
        'profile' => '経済学科地域経済コース4年 Aさん', 'school' => '千葉県立千葉商業高等学校出身',
    ],
    [
        'photo' => null, 'photo_slot' => 'reason-2',
        'quote_pc' => "数字と向き合う力が自信になり、\n会計の知識を活かせる進路が見えてきました！",
        'quote_sp' => "数字と向き合う力が自信になり、\n会計の知識を活かせる進路が\n見えてきました！",
        'profile' => '経営学科会計コース4年 Kさん', 'school' => '千葉県立幕張総合高等学校出身',
    ],
    [
        'photo' => null, 'photo_slot' => 'reason-3',
        'quote_pc' => "先生や仲間と考え抜いた経験を糧に、\n自分らしい働き方を目指しています！",
        'quote_sp' => "先生や仲間と考え抜いた経験を糧に、\n自分らしい働き方を\n目指しています！",
        'profile' => '経営学科ビジネス経営コース4年 Sさん', 'school' => '千葉県立検見川高等学校出身',
    ],
];

$ref001_lp_slides = ref001_lp_repeater_or_fixture(
    'ref001_swiper_slides',
    ['photo', 'quote_pc', 'quote_sp', 'profile', 'school'],
    $ref001_lp_swiper_fixture_rows
);
$ref001_lp_total = count($ref001_lp_slides);
?>
<section class="ref-messages" data-section="messages">
    <header class="ref-messages__head">
        <span class="ref-kicker"># MESSAGES</span>
        <h2><span>力をつけ活躍する</span><strong>先輩たち</strong></h2>
    </header>
    <div class="swiper ref-messages__swiper" data-ref-messages-swiper>
        <div class="swiper-wrapper">
            <?php foreach ($ref001_lp_slides as $ref001_lp_index => $ref001_lp_slide): ?>
                <?php
                $ref001_lp_pc_lines = preg_split('/\r\n|\r|\n/', (string) ($ref001_lp_slide['quote_pc'] ?? ''));
                $ref001_lp_sp_lines = preg_split('/\r\n|\r|\n/', (string) ($ref001_lp_slide['quote_sp'] ?? ''));
                ?>
                <div class="swiper-slide ref-messages__slide" data-message-slide="<?= $ref001_lp_index + 1; ?>">
                    <div class="ref-content ref-messages__body">
                        <div class="ref-messages__copy">
                            <p class="ref-messages__quote ref-messages__quote--pc"><?php foreach ($ref001_lp_pc_lines as $ref001_lp_line): if ($ref001_lp_line === '') continue; ?><span><?php ref001_lp_e($ref001_lp_line); ?></span><?php endforeach; ?></p>
                            <p class="ref-messages__quote ref-messages__quote--sp"><?php foreach ($ref001_lp_sp_lines as $ref001_lp_line): if ($ref001_lp_line === '') continue; ?><span><?php ref001_lp_e($ref001_lp_line); ?></span><?php endforeach; ?></p>
                            <p class="ref-messages__profile"><?php ref001_lp_e($ref001_lp_slide['profile'] ?? ''); ?><br><?php ref001_lp_e($ref001_lp_slide['school'] ?? ''); ?></p>
                        </div>
                        <?php if (!empty($ref001_lp_slide['photo'])): ?>
                            <?php ref001_lp_picture_from_acf_image($ref001_lp_slide['photo'], 'ref-messages__photo ref-messages__photo--slide', $ref001_lp_index === 0); ?>
                        <?php else: ?>
                            <?php ref001_lp_picture_from_slot($lp_base, (string) ($ref001_lp_slide['photo_slot'] ?? ''), 'ref-messages__photo ref-messages__photo--slide', '', $ref001_lp_index === 0); ?>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        <div class="ref-messages__indicator">
            <button type="button" class="ref-messages__nav ref-messages__prev" aria-label="前のメッセージ"><?php ref001_lp_icon($lp_base, 'arrow-left', 'ref-messages__arrow'); ?></button>
            <span data-ref-message-current>1</span><span class="ref-messages__bar" style="--ref-message-progress:<?= $ref001_lp_total > 0 ? round(100 / $ref001_lp_total) : 0; ?>%"></span><span><?= $ref001_lp_total; ?></span>
            <button type="button" class="ref-messages__nav ref-messages__next" aria-label="次のメッセージ"><?php ref001_lp_icon($lp_base, 'arrow-right', 'ref-messages__arrow'); ?></button>
        </div>
    </div>
</section>
