<?php
// WordPress selects front-page.php even when Reading settings show latest posts.
// Reuse the posts-index owner rather than rendering the static TOP at that URL.
if (is_home()) {
  get_template_part('index');
  return;
}
get_header();
?>
<div class="top_mainVisual">
  <?php get_template_part('template-parts/_top-catchphrase'); ?>
  <?php get_template_part('template-parts/_top-mv-grid'); ?>
  <?php get_template_part('template-parts/_top-notice'); ?>
</div>
<main id="global_contents" class="global_contents" itemscope itemprop="mainContentOfPage">
  <?php get_template_part('template-parts/_top-about-intro'); ?>
  <?php get_template_part('template-parts/_top-course-view'); // Cursor supplies approved normalized items here. ?>
  <?php get_template_part('template-parts/_top-applicants'); ?>
  <?php get_template_part('template-parts/_top-news'); ?>
  <?php get_template_part('template-parts/_top-banner'); ?>
</main>
<?php get_footer(); ?>