<?php
$slides = [
    [
        'pc' => ['大学で培った企画力を武器に、', '今はIT企業のマーケターとして挑戦の毎日です！'],
        'sp' => ['大学で培った企画力を武器に、', '今はIT企業のマーケターとして', '挑戦の毎日です！'],
        'profile' => ref001_get('message_profile'), 'school' => ref001_get('message_school'),
    ],
    [
        'pc' => ['ゼミで身につけた行動力を活かして、', '地域と企業をつなぐ仕事に挑戦しています！'],
        'sp' => ['ゼミで身につけた行動力を活かして、', '地域と企業をつなぐ仕事に', '挑戦しています！'],
        'profile' => ref001_get('message_2_profile'), 'school' => ref001_get('message_2_school'),
    ],
    [
        'pc' => ['数字と向き合う力が自信になり、', '会計の知識を活かせる進路が見えてきました！'],
        'sp' => ['数字と向き合う力が自信になり、', '会計の知識を活かせる進路が', '見えてきました！'],
        'profile' => ref001_get('message_3_profile'), 'school' => ref001_get('message_3_school'),
    ],
    [
        'pc' => ['先生や仲間と考え抜いた経験を糧に、', '自分らしい働き方を目指しています！'],
        'sp' => ['先生や仲間と考え抜いた経験を糧に、', '自分らしい働き方を', '目指しています！'],
        'profile' => ref001_get('message_4_profile'), 'school' => ref001_get('message_4_school'),
    ],
];
?>
<section class="ref-messages" data-section="messages"<?= ref001_figma_section_attrs('messages'); ?>>
    <header class="ref-messages__head">
        <span class="ref-kicker"># MESSAGES</span>
        <h2><span>力をつけ活躍する</span><strong>先輩たち</strong></h2>
    </header>
    <div class="swiper ref-messages__swiper" data-ref-messages-swiper>
        <?php ref001_picture('messages-photo', 'ref-messages__photo ref-messages__photo--static', '', true); ?>
        <div class="swiper-wrapper">
            <?php foreach ($slides as $index => $slide): ?>
                <div class="swiper-slide ref-messages__slide" data-message-slide="<?= $index + 1; ?>">
                    <div class="ref-content ref-messages__body">
                        <div class="ref-messages__copy">
                            <p class="ref-messages__quote ref-messages__quote--pc"><?php foreach ($slide['pc'] as $line): ?><span><?php ref001_e($line); ?></span><?php endforeach; ?></p>
                            <p class="ref-messages__quote ref-messages__quote--sp"><?php foreach ($slide['sp'] as $line): ?><span><?php ref001_e($line); ?></span><?php endforeach; ?></p>
                            <p class="ref-messages__profile"><?php ref001_e($slide['profile']); ?><br><?php ref001_e($slide['school']); ?></p>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        <div class="ref-messages__indicator">
            <button type="button" class="ref-messages__nav ref-messages__prev" aria-label="前のメッセージ"><?php ref001_icon('arrow-left', 'ref-messages__arrow'); ?></button>
            <span data-ref-message-current>1</span><span class="ref-messages__bar" style="--ref-message-progress:25%"></span><span>4</span>
            <button type="button" class="ref-messages__nav ref-messages__next" aria-label="次のメッセージ"><?php ref001_icon('arrow-right', 'ref-messages__arrow'); ?></button>
        </div>
    </div>
</section>
