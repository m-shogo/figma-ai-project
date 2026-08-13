<?php
$d = v3_data()['header'];
?>
<header class="v3-header" data-section="header" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-header__inner">
    <?php v3_component('brand'); ?>
    <nav class="v3-header__actions" aria-label="関連アクション">
      <?php foreach ($d['actions'] as $action): ?>
        <?php v3_component('cta-button', $action); ?>
      <?php endforeach; ?>
    </nav>
  </div>
</header>
