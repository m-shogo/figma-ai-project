<?php
// Shared news archive/detail title and existing ACF option. Never use the CODIA sample image.
$posts_page_id = (int) ($args['posts_page_id'] ?? 0);
$heading = $posts_page_id ? get_the_title($posts_page_id) : '';
$heading = trim((string) $heading) !== '' ? $heading : 'お知らせ';
$image_id = function_exists('get_field') ? (int) get_field('page_img-post', 'option') : 0;
$image = $image_id ? wp_get_attachment_image($image_id, 'full', false, [
  'class' => 'jwsnj_newsArchive_heroPhoto',
  'loading' => 'eager',
  'decoding' => 'async',
  'sizes' => '(min-width: 768px) 67vw, 100vw',
]) : '';
?>
<header class="jwsnj_newsArchive_hero<?php if ($image) : ?> has-image<?php endif; ?>">
  <div class="jwsnj_newsArchive_heroTitle">
    <?php if (!empty($args['news_single'])) : ?>
      <p class="jwsnj_newsArchive_sectionTitle"><?php echo esc_html($heading); ?></p>
    <?php else : ?>
      <h1><?php echo esc_html($heading); ?></h1>
    <?php endif; ?>
    <p class="jwsnj_newsArchive_heroEnglish" lang="en">News<?php if ($image) : ?><img class="jwsnj_newsArchive_heroBubble" src="<?php echo esc_url(get_theme_file_uri('images/common/img_hero-bubble.svg')); ?>" width="16" height="14" alt=""><?php endif; ?></p>
    <?php if ($image) : ?>
      <div class="jwsnj_newsArchive_heroArt" aria-hidden="true">
        <img class="jwsnj_newsArchive_heroFigure" src="<?php echo esc_url(get_theme_file_uri('images/common/img_hero-figure.svg')); ?>" width="20.0485" height="74.6642" alt="">
        <img class="jwsnj_newsArchive_heroFigureB" src="<?php echo esc_url(get_theme_file_uri('images/common/img_hero-figure-02.svg')); ?>" width="21.6551" height="84" alt="">
      </div>
    <?php endif; ?>
  </div>
  <?php if ($image) : ?>
    <div class="jwsnj_newsArchive_heroImage">
      <?php echo $image; ?>
    </div>
  <?php endif; ?>
</header>
