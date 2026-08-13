<?php
$d = v3_data()['sharedCta'];
$instance = $section['instance'] ?? 1;
$figmaPc = $section['figmaPc'] ?? $d['figma']['pc'][0];
$figmaSp = $section['figmaSp'] ?? $d['figma']['sp'][0];
?>
<section class="v3-shared-cta" data-section="shared-cta" data-cta-instance="<?php v3_e((string) $instance); ?>" data-figma-pc="<?php v3_e($figmaPc); ?>" data-figma-sp="<?php v3_e($figmaSp); ?>">
  <img class="v3-shared-cta__wash" src="assets/cta/campus-wash.png" alt="" aria-hidden="true" width="1380" height="328">
  <div class="v3-shared-cta__veil" aria-hidden="true"></div>
  <div class="v3-shared-cta__inner">
    <h2>
      <img class="v3-shared-cta__slash" src="assets/cta/slash-left.svg" alt="" width="21" height="27" aria-hidden="true">
      <span><?php v3_e($d['title']); ?></span>
      <img class="v3-shared-cta__slash v3-shared-cta__slash--end" src="assets/cta/slash-left.svg" alt="" width="21" height="27" aria-hidden="true">
    </h2>
    <div class="v3-shared-cta__actions">
      <?php v3_component('cta-button', ['key' => 'document', 'label' => '資料請求', 'icon' => 'document', 'tone' => 'blue']); ?>
      <?php v3_component('cta-button', ['key' => 'open-campus', 'label' => 'オープンキャンパス', 'icon' => 'open-campus', 'tone' => 'purple']); ?>
    </div>
  </div>
</section>
