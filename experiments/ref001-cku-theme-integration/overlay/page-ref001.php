<?php
/**
 * Template Name: REF-001 千葉経済大学 Fidelity Page
 *
 * New classic page template (cku's own page-form.php / page-library.php
 * `Template Name:` convention). Header/Footer stay cku-owned (get_header() /
 * get_footer(), unchanged). The page body renders REF-001's Human-Reviewed
 * section set; only Student Voice and Swiper/Messages are ACF-editable
 * (see functions/ref001-integration.php + acf-json/group_ref001_*.json).
 */
get_header();
?>
<main class="ref-page" data-ref001-page<?= ref001_figma_frame_attrs(); ?>>
  <?php
  ref001_section('main-visual');
  ref001_section('reason');
  ref001_section('education');
  ref001_section('shared-cta');
  ref001_section('student-voice');
  ref001_section('messages');
  ref001_section('shared-cta');
  ref001_section('courses');
  ref001_section('links');
  ref001_section('cta-value');
  ?>
</main>
<?php
get_footer();
