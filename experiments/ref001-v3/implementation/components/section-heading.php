<?php
$kicker = $kicker ?? '';
$titleHtml = $titleHtml ?? '';
$modifier = $modifier ?? '';
?>
<header class="v3-heading<?php echo $modifier !== '' ? ' ' . htmlspecialchars($modifier, ENT_QUOTES, 'UTF-8') : ''; ?>">
  <?php if ($kicker !== ''): ?><span class="v3-kicker"><?php v3_e($kicker); ?></span><?php endif; ?>
  <h2 class="v3-heading__title"><?php echo $titleHtml; ?></h2>
</header>
