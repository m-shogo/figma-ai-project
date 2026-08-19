<?php
/**
 * ACF-ified Student Voice (私が千葉経済大学を選んだ理由).
 *
 * Sources rows from the `ref001_student_voices` ACF PRO repeater
 * (experiments/ref001-cku-theme-integration/overlay/acf-json/group_ref001_student_voice.json)
 * when present, falling back to REF-001's own Human-Reviewed fixture content
 * (inc/fixture-content.php) when ACF is inactive or the repeater is empty --
 * see ref001_student_voices() / ref001_repeater_or_fixture() in
 * functions/ref001-integration.php. Markup/classes are unchanged from the
 * frozen fixture: item 1 open by default, items 2+ collapsed with the same
 * disclosure toggle.
 */
$voices = ref001_student_voices();
?>
<section class="ref-voice" data-section="student-voice"<?= ref001_figma_section_attrs('student-voice'); ?>>
  <header class="ref-voice__head"><span class="ref-kicker"># STUDENTS_VOICE</span><h2 class="ref-bracket-title">私が千葉経済大学を<strong>選んだ理由</strong></h2></header>
  <?php foreach ($voices as $index => $voice): $open = $index === 0; $number = $index + 1; $detail_id = "ref-voice-detail-{$number}"; ?>
    <article class="ref-voice-item <?= $open ? 'ref-voice-item--open' : 'ref-voice-item--collapsed'; ?>" data-voice-item="<?= $number; ?>">
      <div class="ref-content">
        <div class="ref-voice-item__top">
          <?php if (!empty($voice['avatar'])): ?>
            <?php ref001_picture_from_acf_image($voice['avatar'], 'ref-avatar'); ?>
          <?php else: ?>
            <?php ref001_picture((string) ($voice['avatar_slot'] ?? ''), 'ref-avatar', ''); ?>
          <?php endif; ?>
          <div class="ref-speech"><h3><?php ref001_e($voice['title'] ?? ''); ?></h3><p><?php ref001_e($voice['profile'] ?? ''); ?><br><?php ref001_e($voice['school'] ?? ''); ?></p></div>
        </div>
        <?php if (!$open): ?>
          <button type="button" class="ref-voice-more ref-voice-toggle" aria-expanded="false" aria-controls="<?php ref001_e($detail_id); ?>"><span class="ref-voice-toggle__mark" aria-hidden="true">＋</span><span>もっと見る</span></button>
        <?php endif; ?>
        <div id="<?php ref001_e($detail_id); ?>" class="ref-voice-disclosure"<?= $open ? '' : ' aria-hidden="true"'; ?>>
          <div class="ref-voice-disclosure__inner">
            <div class="ref-voice-open__detail">
              <?php if (!empty($voice['detail_photo'])): ?>
                <?php ref001_picture_from_acf_image($voice['detail_photo'], 'ref-voice-open__photo'); ?>
              <?php else: ?>
                <?php ref001_picture((string) ($voice['detail_photo_slot'] ?? ''), 'ref-voice-open__photo', ''); ?>
              <?php endif; ?>
              <div class="ref-voice-open__copy">
                <p><?php ref001_e($voice['body'] ?? ''); ?></p>
                <div class="ref-pointbox"><p><strong>印象に残った授業</strong><?php ref001_e($voice['lesson'] ?? ''); ?></p><p><strong>入学の決め手</strong><?php ref001_e($voice['reason'] ?? ''); ?></p></div>
              </div>
            </div>
            <div class="ref-voice-open__advice"><strong>受験生へのひとこと</strong><span><?php ref001_e($voice['advice'] ?? ''); ?></span></div>
          </div>
        </div>
      </div>
    </article>
  <?php endforeach; ?>
</section>
