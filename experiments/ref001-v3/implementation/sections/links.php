<?php
$d = v3_data()['links'];
?>
<section class="v3-links" data-section="links" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-content">
    <div class="v3-links__grid">
      <?php foreach ($d['items'] as $item): ?>
        <a href="<?php v3_e(v3_link($item['key'])); ?>" class="v3-link-tile v3-link-tile--<?php v3_e($item['key']); ?>" style="--tile-bg:<?php v3_e($item['bg']); ?>;--tile-shadow:<?php v3_e($item['shadow']); ?>" data-link-status="UNRESOLVED">
          <span class="v3-link-tile__label">
            <?php
            $lines = preg_split("/\r\n|\n/", (string) $item['label']);
            if (count($lines) > 1):
                ?>
              <small class="v3-link-tile__lead"><?php v3_e($lines[0]); ?></small>
              <?php v3_e($lines[1]); ?>
            <?php else: ?>
              <?php v3_e($item['label']); ?>
            <?php endif; ?>
            <?php if (!empty($item['sub'])): ?>
              <span class="v3-link-tile__handle">
                <?php v3_icon('instagram', 'v3-link-tile__ig'); ?>
                <small><?php v3_e($item['sub']); ?></small>
              </span>
            <?php endif; ?>
          </span>
          <span class="v3-link-tile__arrow"><?php v3_icon('arrow-right'); ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>
