<?php
$d = v3_data()['mainVisual'];
?>
<section class="v3-mv" data-section="main-visual" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-mv__people" aria-hidden="true">
    <?php v3_picture('main-visual-left', 'v3-mv__person v3-mv__person--left', '', true); ?>
    <?php v3_picture('main-visual-right', 'v3-mv__person v3-mv__person--right', '', true); ?>
  </div>
  <div class="v3-mv__copy">
    <h1 class="v3-mv__hero">
      <span class="v3-mv__quotes" aria-hidden="true"><?php v3_e($d['quoteOpen']); ?></span>
      <span class="v3-mv__word"><?php v3_e($d['heroWord']); ?></span>
      <span class="v3-mv__quotes" aria-hidden="true"><?php v3_e($d['quoteClose']); ?></span>
      <span class="v3-mv__mid"><?php v3_e($d['middle']); ?></span>
      <span class="v3-mv__end"><?php v3_e($d['end']); ?></span>
    </h1>
    <p class="v3-mv__desc"><?php echo implode('<br>', array_map(static fn ($line) => htmlspecialchars($line, ENT_QUOTES, 'UTF-8'), $d['descriptionLines'])); ?></p>
  </div>
  <a class="v3-mv__oc" href="<?php v3_e(v3_link('open-campus')); ?>" data-link-status="UNRESOLVED" aria-label="オープンキャンパス">
    <span class="v3-mv__oc-kicker"><?php v3_e($d['ocKicker']); ?></span>
    <b class="v3-mv__oc-title"><?php echo nl2br(htmlspecialchars($d['ocTitle'], ENT_QUOTES, 'UTF-8'), false); ?></b>
    <small class="v3-mv__oc-status"><?php v3_e($d['ocStatus']); ?></small>
    <?php v3_icon('arrow-right', 'v3-mv__oc-arrow'); ?>
  </a>
</section>
