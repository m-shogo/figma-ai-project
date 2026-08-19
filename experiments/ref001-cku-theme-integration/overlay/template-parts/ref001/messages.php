<?php
/**
 * ACF-ified Swiper / Messages (力をつけ活躍する先輩たち).
 *
 * Sources slides from the `ref001_swiper_slides` ACF PRO repeater
 * (experiments/ref001-cku-theme-integration/overlay/acf-json/group_ref001_swiper.json)
 * when present, falling back to REF-001's own Human-Reviewed fixture content
 * when ACF is inactive or the repeater is empty -- see
 * ref001_swiper_slides() / ref001_repeater_or_fixture() in
 * functions/ref001-integration.php. Swiper markup/classes, arrow color/hit
 * area, and JS init are unchanged from the frozen fixture. Slide count and
 * the "1 / N" indicator derive from the repeater at render time instead of
 * being hardcoded to 4.
 */
$slides = ref001_swiper_slides();
$total = count($slides);
?>
<section class="ref-messages" data-section="messages"<?= ref001_figma_section_attrs('messages'); ?>>
    <header class="ref-messages__head">
        <span class="ref-kicker"># MESSAGES</span>
        <h2><span>力をつけ活躍する</span><strong>先輩たち</strong></h2>
    </header>
    <div class="swiper ref-messages__swiper" data-ref-messages-swiper>
        <div class="swiper-wrapper">
            <?php foreach ($slides as $index => $slide): ?>
                <?php
                $pc_lines = preg_split('/\r\n|\r|\n/', (string) ($slide['quote_pc'] ?? ''));
                $sp_lines = preg_split('/\r\n|\r|\n/', (string) ($slide['quote_sp'] ?? ''));
                ?>
                <div class="swiper-slide ref-messages__slide" data-message-slide="<?= $index + 1; ?>">
                    <div class="ref-content ref-messages__body">
                        <div class="ref-messages__copy">
                            <p class="ref-messages__quote ref-messages__quote--pc"><?php foreach ($pc_lines as $line): if ($line === '') continue; ?><span><?php ref001_e($line); ?></span><?php endforeach; ?></p>
                            <p class="ref-messages__quote ref-messages__quote--sp"><?php foreach ($sp_lines as $line): if ($line === '') continue; ?><span><?php ref001_e($line); ?></span><?php endforeach; ?></p>
                            <p class="ref-messages__profile"><?php ref001_e($slide['profile'] ?? ''); ?><br><?php ref001_e($slide['school'] ?? ''); ?></p>
                        </div>
                        <?php if (!empty($slide['photo'])): ?>
                            <?php ref001_picture_from_acf_image($slide['photo'], 'ref-messages__photo ref-messages__photo--slide', $index === 0); ?>
                        <?php else: ?>
                            <?php ref001_picture((string) ($slide['photo_slot'] ?? ''), 'ref-messages__photo ref-messages__photo--slide', '', $index === 0); ?>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        <div class="ref-messages__indicator">
            <button type="button" class="ref-messages__nav ref-messages__prev" aria-label="前のメッセージ"><?php ref001_icon('arrow-left', 'ref-messages__arrow'); ?></button>
            <span data-ref-message-current>1</span><span class="ref-messages__bar" style="--ref-message-progress:<?= $total > 0 ? round(100 / $total) : 0; ?>%"></span><span><?= $total; ?></span>
            <button type="button" class="ref-messages__nav ref-messages__next" aria-label="次のメッセージ"><?php ref001_icon('arrow-right', 'ref-messages__arrow'); ?></button>
        </div>
    </div>
</section>
