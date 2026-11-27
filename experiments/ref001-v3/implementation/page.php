<?php
require_once __DIR__ . '/inc/bootstrap.php';
$page = v3_data();
?>
<?php v3_section('header'); ?>
<main class="v3-page" data-ref001-page="v3">
  <?php v3_section('main-visual'); ?>
  <?php v3_section('reason'); ?>
  <?php v3_section('education'); ?>
  <?php v3_section('shared-cta', ['instance' => 1, 'figmaPc' => $page['sharedCta']['figma']['pc'][0], 'figmaSp' => $page['sharedCta']['figma']['sp'][0]]); ?>
  <?php v3_section('student-voice'); ?>
  <?php v3_section('messages'); ?>
  <?php v3_section('shared-cta', ['instance' => 2, 'figmaPc' => $page['sharedCta']['figma']['pc'][1], 'figmaSp' => $page['sharedCta']['figma']['sp'][1]]); ?>
  <?php v3_section('courses'); ?>
  <?php v3_section('links'); ?>
  <?php v3_section('cta-value'); ?>
</main>
<?php v3_section('footer'); ?>
