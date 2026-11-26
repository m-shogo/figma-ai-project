<?php
// The existing legacy fallback applies only when no image is configured.
// A deleted or invalid attachment must not produce an array-offset warning or url().
$resolve_image_url = static function ($image_id) {
  if (!$image_id) {
    return get_template_directory_uri() . '/images/common/noimage_visual-01.webp';
  }
  $thumb = wp_get_attachment_image_src($image_id, 'head_img');
  return is_array($thumb) && !empty($thumb[0]) ? $thumb[0] : '';
};
?>
<div class="global_mainVisual">
  <div class="global_inner gm_inner">
    <?php if (get_current_post_type() && !is_page() && !is_404() && !is_search() || is_post_type_archive() || is_tax()): //投稿 
    ?>
      <?php
      $postType_name = get_current_post_type();
      $field_name = 'page_img-' . $postType_name; //ビジュアル設定（投稿タイプ）名前に合わせる
      $img = get_field($field_name, 'option');
      $img_url = $resolve_image_url($img);
      ?>
      <div class="gm_background"<?php if ($img_url !== '') : ?> style="background-image: url(<?php echo esc_url($img_url); ?>)"<?php endif; ?>></div>
      <?php if (!is_single()): ?>
        <h1 class="gm_title"><span><?php echo (get_archive_title()) ? get_archive_title() : get_the_title(get_option('page_for_posts')); ?></span></h1>
      <?php else: ?>
        <p class="gm_title"><span><?php echo (get_archive_title()) ? get_archive_title() : get_the_title(get_option('page_for_posts')); ?></span></p>
      <?php endif; ?>
    <?php elseif (is_404()): //404 
    ?>
      <?php
      $img = get_field('page_img-other', 'option');
      $img_url = $resolve_image_url($img);
      ?>
      <div class="gm_background"<?php if ($img_url !== '') : ?> style="background-image: url(<?php echo esc_url($img_url); ?>)"<?php endif; ?>></div>
      <h1 class="gm_title"><span>お探しのページは<br>見つかりませんでした</span></h1>
    <?php elseif (is_search()): //検索結果 
    ?>
      <?php
      $img = get_field('page_img-other', 'option');
      $img_url = $resolve_image_url($img);
      ?>
      <div class="gm_background"<?php if ($img_url !== '') : ?> style="background-image: url(<?php echo esc_url($img_url); ?>)"<?php endif; ?>></div>
      <h1 class="gm_title"><span><?php if (empty(get_search_query())) : ?>検索キーワードが未入力です<?php else: ?><?php the_search_query(); ?>の検索結果<?php endif; ?></span></h1>
    <?php else: ?>
      <?php
      $img = get_field('page_img', get_the_ID());
      $img_url = $resolve_image_url($img);
      ?>
      <div class="gm_background"<?php if ($img_url !== '') : ?> style="background-image: url(<?php echo esc_url($img_url); ?>)"<?php endif; ?>></div>
      <h1 class="gm_title"><span><?php the_title(); ?></span></h1>
    <?php endif; ?>
  </div>
</div>
<?php get_template_part('template-parts/_breadCrumb'); ?>