<?php
// Import media only in the explicitly opted-in disposable WP fixture.
if (
  wp_get_environment_type() !== 'local' ||
  !str_contains(home_url(), '127.0.0.1:') ||
  getenv('JWSNJ_PARTS_QA_DISPOSABLE') !== '1'
) {
  throw new RuntimeException('disposable gallery fixture only');
}

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

$registry = WP_Block_Type_Registry::get_instance();
foreach (['core/heading', 'core/gallery', 'core/image', 'core/media-text', 'core/paragraph'] as $name) {
  if (!$registry->is_registered($name)) {
    throw new RuntimeException('missing registered block: ' . $name);
  }
}
$id = (int) get_option('jwsnj_parts_gallery_qa_page_id', 0);
if ($id && (get_post_type($id) !== 'page' || get_post_meta($id, '_jwsnj_parts_gallery_qa', true) !== '1')) {
  throw new RuntimeException('refusing to overwrite a non-fixture page');
}
$media = [];
$names = ['preschool', 'elementary', 'junior'];
foreach ($names as $name) {
  // Existing project media used solely as editor-owned geometry test input.
  // These are not claimed to be the Figma gallery photographs.
  $filename = 'img_course-' . $name . '.webp';
  $option = 'jwsnj_gallery_qa_media_' . $name;
  $attachment = (int) get_option($option, 0);
  if ($attachment && (!wp_attachment_is_image($attachment) || get_post_meta($attachment, '_jwsnj_gallery_qa_media', true) !== '1')) {
    throw new RuntimeException('refusing to reuse non-fixture media');
  }
  if (!$attachment) {
    $source = get_theme_file_path('images/top/' . $filename);
    $tmp = wp_tempnam($filename);
    if (!$tmp || !is_readable($source) || !copy($source, $tmp)) {
      throw new RuntimeException('existing media fixture unavailable');
    }
    $attachment = media_handle_sideload(['name' => $filename, 'tmp_name' => $tmp], 0, 'Gallery QA ' . $name);
    if (is_wp_error($attachment)) {
      @unlink($tmp);
      throw new RuntimeException($attachment->get_error_message());
    }
    update_post_meta($attachment, '_jwsnj_gallery_qa_media', '1');
    update_option($option, $attachment, false);
  }
  $url = wp_get_attachment_image_url($attachment, 'large');
  if (!$url) {
    throw new RuntimeException('attachment image unavailable');
  }
  $media[] = ['id' => $attachment, 'url' => $url];
}
$image = static function ($item, $caption, $lightbox) {
  $attrs = ['id' => $item['id'], 'sizeSlug' => 'large', 'linkDestination' => 'none'];
  if ($lightbox) {
    $attrs['lightbox'] = ['enabled' => true];
  } else {
    $attrs['lightbox'] = ['enabled' => false];
  }
  return '<!-- wp:image ' . wp_json_encode($attrs) . ' -->' . "\n"
    . '<figure class="wp-block-image size-large"><img src="' . esc_url($item['url']) . '" alt="QA画像" class="wp-image-' . (int) $item['id'] . '"/><figcaption class="wp-element-caption">' . esc_html($caption) . '</figcaption></figure>' . "\n"
    . '<!-- /wp:image -->';
};
$gallery = static function ($columns, $items, $lightbox) use ($image) {
  $attrs = ['columns' => $columns, 'linkTo' => 'none'];
  $children = [];
  foreach ($items as $index => $item) {
    $caption = $index === 0 ? '画像との間隔20px。中央揃え。' : '長い画像キャプション LongEditableCaptionWithoutSpaces1234567890LongEditableCaptionWithoutSpaces1234567890';
    $children[] = $image($item, $caption, $lightbox);
  }
  return '<!-- wp:gallery ' . wp_json_encode($attrs) . ' -->' . "\n"
    . '<figure class="wp-block-gallery has-nested-images columns-' . $columns . ' is-cropped">'
    . implode("\n\n", $children) . '</figure>' . "\n" . '<!-- /wp:gallery -->';
};
$first = $media[0];
$mediaTextAttrs = ['mediaId' => $first['id'], 'mediaType' => 'image', 'mediaSizeSlug' => 'large', 'isStackedOnMobile' => true, 'verticalAlignment' => 'top'];
$mediaText = '<!-- wp:media-text ' . wp_json_encode($mediaTextAttrs) . ' -->' . "\n"
  . '<div class="wp-block-media-text is-stacked-on-mobile is-vertically-aligned-top"><figure class="wp-block-media-text__media"><img src="' . esc_url($first['url']) . '" alt="QA画像" class="wp-image-' . (int) $first['id'] . ' size-large"/></figure><div class="wp-block-media-text__content">'
  . '<!-- wp:paragraph --><p>テキストと画像の検証用文章です。LongEditableTextWithoutSpaces1234567890LongEditableTextWithoutSpaces1234567890</p><!-- /wp:paragraph -->'
  . '</div></div>' . "\n<!-- /wp:media-text -->";
$content = '<!-- wp:heading --><h2 class="wp-block-heading">画像ギャラリー</h2><!-- /wp:heading -->' . "\n\n"
  . $gallery(2, array_slice($media, 0, 2), true) . "\n\n" . $gallery(3, $media, false) . "\n\n"
  . '<!-- wp:heading --><h2 class="wp-block-heading">テキスト＋画像</h2><!-- /wp:heading -->' . "\n\n" . $mediaText . "\n";
$data = ['post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'JWSNJ Gallery QA', 'post_content' => wp_slash($content)];
if ($id) {
  $data['ID'] = $id;
  $id = wp_update_post($data, true);
} else {
  $id = wp_insert_post($data, true);
}
if (is_wp_error($id) || !$id) {
  throw new RuntimeException('gallery fixture save failed');
}
update_post_meta($id, '_jwsnj_parts_gallery_qa', '1');
update_option('jwsnj_parts_gallery_qa_page_id', $id, false);
if (get_post_field('post_content', $id, 'raw') !== $content) {
  throw new RuntimeException('gallery fixture content changed on save');
}
echo wp_json_encode(['partsGallerySeed' => 'PASS', 'page' => $id, 'attachments' => array_column($media, 'id')]) . PHP_EOL;
