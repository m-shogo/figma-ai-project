<?php
$key = $key ?? 'document';
$label = $label ?? '';
$icon = $icon ?? 'document';
$tone = $tone ?? 'blue';
?>
<a href="<?php v3_e(v3_link($key)); ?>" class="v3-btn v3-btn--<?php v3_e($tone); ?>" data-link-status="UNRESOLVED">
  <?php v3_icon($icon, 'v3-btn__icon'); ?>
  <span><?php v3_e($label); ?></span>
</a>
