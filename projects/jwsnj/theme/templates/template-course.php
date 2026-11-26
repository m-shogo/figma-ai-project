<?php
/**
 * Template Name: コース紹介テンプレート
 * Template Post Type: page
 */
defined('ABSPATH') || exit;
get_header();
?>
<main id="global_contents" class="global_contents jwsnj_courseMain" itemscope itemprop="mainContentOfPage">
  <section class="jwsnj_coursePage">
    <?php get_template_part('template-parts/_breadCrumb', null, ['jwsnj_page' => true]); ?>
    <h1 class="jwsnj_coursePage_title"><?php echo esc_html(get_the_title()); ?></h1>
    <?php if (post_password_required()) : ?>
      <div class="global_inner _content jwsnj_coursePage_password">
        <div class="module_password"><?php echo get_the_password_form(); ?></div>
      </div>
    <?php else : ?>
      <div class="block-editor_wrap jwsnj_coursePage_content">
        <?php the_content(); ?>
      </div>
    <?php endif; ?>
  </section>
</main>
<?php get_footer(); ?>
