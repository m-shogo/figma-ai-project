<?php
$d = v3_data()['mainVisual'];
?>
<section class="v3-mv" data-section="main-visual" data-figma-pc="<?php v3_e($d['figma']['pc']); ?>" data-figma-sp="<?php v3_e($d['figma']['sp']); ?>">
  <div class="v3-mv__planes" aria-hidden="true">
    <img class="v3-mv__plane v3-mv__plane--back" src="assets/mv/plane-back.svg" alt="" width="1380" height="636">
    <img class="v3-mv__plane v3-mv__plane--front" src="assets/mv/plane-front.svg" alt="" width="1380" height="636">
  </div>
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
    <span class="v3-mv__oc-kicker">
      <img class="v3-mv__oc-kicker-shape v3-mv__oc-kicker-shape--fill" src="assets/mv/oc-kicker-fill.svg" alt="" width="187" height="47">
      <img class="v3-mv__oc-kicker-shape v3-mv__oc-kicker-shape--line" src="assets/mv/oc-kicker-line.svg" alt="" width="187" height="47">
      <span class="v3-mv__oc-kicker-text"><?php v3_e($d['ocKicker']); ?></span>
    </span>
    <b class="v3-mv__oc-title"><?php echo nl2br(htmlspecialchars($d['ocTitle'], ENT_QUOTES, 'UTF-8'), false); ?></b>
    <small class="v3-mv__oc-status"><?php v3_e($d['ocStatus']); ?></small>
    <span class="v3-mv__oc-go"><?php v3_icon('arrow-right', 'v3-mv__oc-arrow'); ?></span>
  </a>
</section>
