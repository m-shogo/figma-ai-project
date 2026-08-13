<?php
$d = v3_data()['ctaValue'];
?>
<section class="v3-cta-value" data-section="cta-value" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-cta-value__border" aria-hidden="true"></div>
  <?php v3_picture($d['leftPerson'], 'v3-portrait v3-portrait--left', ''); ?>
  <?php v3_picture($d['rightPerson'], 'v3-portrait v3-portrait--right', ''); ?>
  <div class="v3-cta-value__inner">
    <h2><?php v3_e($d['title']); ?></h2>
    <div class="v3-cta-value__actions">
      <?php v3_component('cta-button', ['key' => 'document', 'label' => '資料請求', 'icon' => 'document', 'tone' => 'blue']); ?>
      <?php v3_component('cta-button', ['key' => 'open-campus', 'label' => 'オープンキャンパス', 'icon' => 'open-campus', 'tone' => 'purple']); ?>
    </div>
  </div>
</section>
