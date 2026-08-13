<?php
$d = v3_data()['messages'];
$titleHtml = htmlspecialchars($d['titlePrefix'], ENT_QUOTES, 'UTF-8')
    . '<strong>' . htmlspecialchars($d['titleStrong'], ENT_QUOTES, 'UTF-8') . '</strong>';
?>
<section class="v3-messages" data-section="messages" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-content v3-messages__layout">
    <?php v3_component('section-heading', ['kicker' => $d['kicker'], 'titleHtml' => $titleHtml]); ?>
    <div class="v3-messages__body">
      <div class="v3-messages__copy">
        <p class="v3-messages__quote">
          <?php foreach ($d['quoteLines'] as $line): ?>
            <span><?php v3_e($line); ?></span>
          <?php endforeach; ?>
        </p>
        <p class="v3-messages__profile"><?php v3_e($d['profile']); ?><br><?php v3_e($d['school']); ?></p>
        <div class="v3-messages__indicator" aria-hidden="true">
          <?php v3_icon('arrow-left', 'v3-messages__arrow'); ?>
          <span><?php v3_e($d['index']); ?></span>
          <span class="v3-messages__bar"></span>
          <span><?php v3_e($d['total']); ?></span>
          <?php v3_icon('arrow-right', 'v3-messages__arrow'); ?>
        </div>
      </div>
      <?php v3_picture($d['photo'], 'v3-messages__photo', ''); ?>
    </div>
  </div>
</section>
