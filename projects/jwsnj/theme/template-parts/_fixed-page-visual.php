<?php
// Fixed-page CMS owner: existing page title and page_img attachment only.
// English subtitle has no approved CMS field; do not derive it from the slug.
$image_id = function_exists('get_field') ? (int) get_field('page_img', get_the_ID()) : 0;
$image = $image_id ? wp_get_attachment_image($image_id, 'full', false, [
  'class' => 'jwsnj_newsArchive_heroPhoto',
  'loading' => 'eager',
  'decoding' => 'async',
  'sizes' => '(min-width: 768px) 67vw, 100vw',
]) : '';
?>
<header class="jwsnj_newsArchive_hero jwsnj_fixedPage_hero<?php if ($image) : ?> has-image<?php endif; ?>">
  <div class="jwsnj_newsArchive_heroTitle">
    <h1><?php echo esc_html(get_the_title()); ?></h1>
    <?php if ($image) : ?>
      <div class="jwsnj_newsArchive_heroArt" aria-hidden="true">
        <img class="jwsnj_newsArchive_heroFigure" src="<?php echo esc_url(get_theme_file_uri('images/common/img_hero-figure.svg')); ?>" width="20.0485" height="74.6642" alt="">
        <img class="jwsnj_newsArchive_heroFigureB" src="<?php echo esc_url(get_theme_file_uri('images/common/img_hero-figure-02.svg')); ?>" width="21.6551" height="84" alt="">
      </div>
    <?php endif; ?>
  </div>
  <?php if ($image) : ?>
    <div class="jwsnj_newsArchive_heroImage"><?php echo $image; ?></div>
  <?php endif; ?>
</header>
