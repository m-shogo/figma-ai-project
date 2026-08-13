<?php
$brand = v3_data()['brand'];
?>
<div class="v3-brand" aria-label="<?php v3_e($brand['name']); ?>">
  <span class="v3-brand__logo" aria-hidden="true">
    <img class="v3-brand__piece v3-brand__piece--mark" src="assets/brand/logo-mark.svg" alt="" width="43" height="47">
    <img class="v3-brand__piece v3-brand__piece--ck" src="assets/brand/logo-ck.svg" alt="" width="28" height="14">
    <img class="v3-brand__piece v3-brand__piece--name" src="assets/brand/logo-name.svg" alt="" width="133" height="19">
    <img class="v3-brand__piece v3-brand__piece--en" src="assets/brand/logo-name-en.svg" alt="" width="58" height="6">
  </span>
</div>
