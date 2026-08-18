<?php
$voices = [
    1 => ['avatar' => 'voice-1-avatar', 'detail' => 'voice-1-detail'],
    2 => ['avatar' => 'voice-2-avatar', 'detail' => 'voice-1-detail'],
    3 => ['avatar' => 'voice-3-avatar', 'detail' => 'voice-1-detail'],
];
?>
<section class="ref-voice" data-section="student-voice"<?= ref001_figma_section_attrs('student-voice'); ?>>
  <header class="ref-voice__head"><span class="ref-kicker"># STUDENTS_VOICE</span><h2 class="ref-bracket-title">私が千葉経済大学を<strong>選んだ理由</strong></h2></header>
  <?php foreach ($voices as $index => $voice): $open = $index === 1; $detail_id = "ref-voice-detail-{$index}"; ?>
    <article class="ref-voice-item <?= $open ? 'ref-voice-item--open' : 'ref-voice-item--collapsed'; ?>" data-voice-item="<?= $index; ?>">
      <div class="ref-content">
        <div class="ref-voice-item__top">
          <?php ref001_picture($voice['avatar'], 'ref-avatar', ''); ?>
          <div class="ref-speech"><h3><?php ref001_e(ref001_get("voice_{$index}_title")); ?></h3><p><?php ref001_e(ref001_get("voice_{$index}_profile")); ?><br><?php ref001_e(ref001_get("voice_{$index}_school")); ?></p></div>
        </div>
        <?php if (!$open): ?>
          <button type="button" class="ref-voice-toggle" aria-expanded="false" aria-controls="<?php ref001_e($detail_id); ?>"><span class="ref-voice-toggle__mark" aria-hidden="true">＋</span><span>もっと見る</span></button>
        <?php endif; ?>
        <div id="<?php ref001_e($detail_id); ?>" class="ref-voice-disclosure"<?= $open ? '' : ' aria-hidden="true"'; ?>>
          <div class="ref-voice-disclosure__inner">
            <div class="ref-voice-open__detail">
              <?php ref001_picture($voice['detail'], 'ref-voice-open__photo', ''); ?>
              <div class="ref-voice-open__copy">
                <p><?php ref001_e(ref001_get("voice_{$index}_body")); ?></p>
                <div class="ref-pointbox"><p><strong>印象に残った授業</strong><?php ref001_e(ref001_get("voice_{$index}_lesson")); ?></p><p><strong>入学の決め手</strong><?php ref001_e(ref001_get("voice_{$index}_reason")); ?></p></div>
              </div>
            </div>
            <div class="ref-voice-open__advice"><strong>受験生へのひとこと</strong><span><?php ref001_e(ref001_get("voice_{$index}_advice")); ?></span></div>
          </div>
        </div>
      </div>
    </article>
  <?php endforeach; ?>
</section>
