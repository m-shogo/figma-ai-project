<?php
$d = v3_data()['reason'];
$titleHtml = '<span class="v3-heading__bracket">(</span>'
    . htmlspecialchars($d['titlePrefix'], ENT_QUOTES, 'UTF-8')
    . '<strong>' . htmlspecialchars($d['titleStrong'], ENT_QUOTES, 'UTF-8') . '</strong>'
    . '<span class="v3-heading__bracket">)</span>';
?>
<section class="v3-reason" data-section="reason" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-content">
    <?php v3_component('section-heading', ['kicker' => $d['kicker'], 'titleHtml' => $titleHtml, 'modifier' => 'v3-heading--center']); ?>
    <p class="v3-reason__intro"><?php v3_e($d['intro']); ?></p>
    <div class="v3-reason__cards">
      <?php foreach ($d['cards'] as $card): ?>
        <article class="v3-reason-card">
          <?php v3_picture($card['image'], 'v3-reason-card__media', ''); ?>
          <div class="v3-reason-card__body">
            <h3 class="v3-reason-card__title"><?php v3_e($card['title']); ?></h3>
            <p class="v3-reason-card__text"><?php v3_e($card['text']); ?></p>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>
