<?php
$d = v3_data()['education'];
?>
<section class="v3-education" data-section="education" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-content">
    <div class="v3-education__head">
      <?php v3_component('section-heading', ['kicker' => $d['kicker'], 'titleHtml' => htmlspecialchars($d['title'], ENT_QUOTES, 'UTF-8')]); ?>
      <div class="v3-education__intro">
        <h3><?php v3_e($d['introTitle']); ?></h3>
        <p><?php v3_e($d['intro']); ?></p>
      </div>
    </div>
    <div class="v3-education__steps">
      <?php foreach ($d['steps'] as $step): ?>
        <article class="v3-edu-card">
          <div class="v3-edu-card__badge"><?php v3_e($step['no']); ?> <small>/ <?php v3_e($step['phase']); ?></small></div>
          <h3><?php v3_e($step['title']); ?></h3>
          <?php v3_picture($step['image'], 'v3-edu-card__media', ''); ?>
          <ul>
            <?php foreach ($step['items'] as $item): ?>
              <li><?php v3_icon('check', 'v3-edu-card__check'); ?><span><?php v3_e($item); ?></span></li>
            <?php endforeach; ?>
          </ul>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>
