<?php
$d = v3_data()['header'];
?>
<header class="v3-header" data-section="header" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-header__inner">
    <div class="v3-brand" aria-label="<?php v3_e(v3_data()['brand']['name']); ?>">
      <div class="v3-brand__mark" aria-hidden="true"><span><?php v3_e(v3_data()['brand']['mark']); ?></span></div>
      <div class="v3-brand__text"><?php v3_e(v3_data()['brand']['name']); ?><span class="v3-brand__sub"><?php v3_e(v3_data()['brand']['nameEn']); ?></span></div>
    </div>
    <nav class="v3-header__actions" aria-label="関連アクション">
      <?php foreach ($d['actions'] as $action): ?>
        <?php v3_component('cta-button', $action); ?>
      <?php endforeach; ?>
    </nav>
  </div>
</header>
