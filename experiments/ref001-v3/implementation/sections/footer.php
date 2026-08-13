<?php
$d = v3_data()['footer'];
?>
<footer class="v3-footer" data-section="footer" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-footer__inner">
    <div class="v3-footer__profile">
      <?php v3_component('brand'); ?>
      <p class="v3-footer__address"><?php echo nl2br(htmlspecialchars($d['address'], ENT_QUOTES, 'UTF-8'), false); ?></p>
    </div>
    <div class="v3-footer__aside">
      <div class="v3-footer__related">
        <?php foreach ($d['related'] as $label): ?>
          <span><?php v3_e($label); ?></span>
        <?php endforeach; ?>
      </div>
      <nav class="v3-footer__sns" aria-label="公式SNS">
        <?php foreach ($d['sns'] as $item): ?>
          <a class="v3-footer__sns-link" href="<?php v3_e(v3_link($item['key'])); ?>" aria-label="<?php v3_e($item['label']); ?>" data-link-status="UNRESOLVED">
            <?php v3_icon($item['key'], 'v3-footer__sns-icon'); ?>
          </a>
        <?php endforeach; ?>
      </nav>
    </div>
  </div>
  <div class="v3-footer__copyright"><?php v3_e($d['copyright']); ?></div>
  <a class="v3-footer__pagetop" href="#top" aria-label="ページ先頭へ">⌃</a>
</footer>
