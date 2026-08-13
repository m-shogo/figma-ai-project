<?php
$d = v3_data()['links'];
?>
<section class="v3-links" data-section="links" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-content">
    <div class="v3-links__grid">
      <?php foreach ($d['items'] as $item): ?>
        <a href="<?php v3_e(v3_link($item['key'])); ?>" class="v3-link-tile" style="--tile-bg:<?php v3_e($item['bg']); ?>;--tile-shadow:<?php v3_e($item['shadow']); ?>" data-link-status="UNRESOLVED">
          <span class="v3-link-tile__label"><?php echo nl2br(htmlspecialchars($item['label'], ENT_QUOTES, 'UTF-8'), false); ?><?php if (!empty($item['sub'])): ?><small><?php v3_e($item['sub']); ?></small><?php endif; ?></span>
          <span class="v3-link-tile__arrow"><?php v3_icon('arrow-right'); ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>
