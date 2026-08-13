<?php
$d = v3_data()['studentVoice'];
$titleHtml = htmlspecialchars($d['titlePrefix'], ENT_QUOTES, 'UTF-8')
    . '<strong>' . htmlspecialchars($d['titleStrong'], ENT_QUOTES, 'UTF-8') . '</strong>';
?>
<section class="v3-voice" data-section="student-voice" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-content">
    <?php v3_component('section-heading', ['kicker' => $d['kicker'], 'titleHtml' => $titleHtml, 'modifier' => 'v3-heading--center']); ?>
  </div>
  <?php foreach ($d['items'] as $item): ?>
    <article class="v3-voice-item<?php echo !empty($item['open']) ? ' v3-voice-item--open' : ' v3-voice-item--collapsed'; ?>">
      <div class="v3-content">
        <div class="v3-voice-item__top">
          <?php v3_picture($item['avatar'], 'v3-avatar', ''); ?>
          <div class="v3-speech">
            <h3><?php v3_e($item['title']); ?></h3>
            <p><?php v3_e($item['profile']); ?><br><?php v3_e($item['school']); ?></p>
          </div>
        </div>
        <?php if (!empty($item['open'])): ?>
          <div class="v3-voice-open">
            <?php v3_picture($item['detail'], 'v3-voice-open__photo', ''); ?>
            <div class="v3-voice-open__copy">
              <p><?php v3_e($item['body']); ?></p>
              <div class="v3-pointbox">
                <p><strong><?php v3_e($item['lessonLabel']); ?></strong><?php v3_e($item['lesson']); ?></p>
                <p><strong><?php v3_e($item['reasonLabel']); ?></strong><?php v3_e($item['reason']); ?></p>
              </div>
            </div>
          </div>
          <div class="v3-voice-open__advice">
            <strong><?php v3_e($item['adviceLabel']); ?></strong>
            <span><?php v3_e($item['advice']); ?></span>
          </div>
        <?php else: ?>
          <p class="v3-voice-more"><?php v3_e($d['moreLabel']); ?></p>
        <?php endif; ?>
      </div>
    </article>
  <?php endforeach; ?>
</section>
