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
foreach (['core/heading', 'core/gallery', 'core/image', 'core/media-text', 'core/paragraph', 'core/list', 'core/list-item'] as $name) {
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
// Actual native annotation blocks, not DOM-injected style samples.
// Verify adjoining media without adding extra gallery/image blocks.
$annotation = static function ($label) {
  return '<!-- wp:list {"className":"annotation-list"} -->' . "\n"
    . '<ul class="wp-block-list annotation-list"><!-- wp:list-item -->'
    . '<li>' . esc_html($label) . '</li><!-- /wp:list-item -->'
    . '<!-- wp:list-item --><li>長い注釈の折り返しを確認します。LongEditableNoteWithoutSpaces1234567890LongEditableNoteWithoutSpaces1234567890</li><!-- /wp:list-item --></ul>' . "\n"
    . '<!-- /wp:list -->';
};
$content = '<!-- wp:heading --><h2 class="wp-block-heading">画像ギャラリー</h2><!-- /wp:heading -->' . "\n\n"
  . $gallery(2, array_slice($media, 0, 2), true) . "\n\n"
  . $annotation('画像ギャラリー間の注釈QA') . "\n\n" . $gallery(3, $media, false) . "\n\n"
  . '<!-- wp:heading --><h2 class="wp-block-heading">テキスト＋画像</h2><!-- /wp:heading -->' . "\n\n"
  . $mediaText . "\n\n" . $annotation('メディアとテキスト直後の注釈QA') . "\n\n"
  . '<!-- wp:paragraph --><p>注釈直後の本文QA</p><!-- /wp:paragraph -->' . "\n";

// Real shared navigation view, using only disposable gallery attachments.
// This is a presentation fixture, not an ACF block or a production data source.
$navigation = [
  ['title' => '幼児部', 'text' => 'テキストが入ります。テキストが入ります。テキストが入ります。', 'image_index' => 0, 'url' => '#qa-navigation-end'],
  ['title' => '長文のタイトル LongEditableLabelWithoutSpaces1234567890LongEditableLabelWithoutSpaces1234567890', 'text' => '長文の説明 LongEditableTextWithoutSpaces1234567890LongEditableTextWithoutSpaces1234567890', 'image_index' => 1],
  ['title' => '中等部', 'text' => 'テキストが入ります。テキストが入ります。', 'image_index' => 2, 'url' => '#qa-navigation-end', 'new_tab' => true],
  ['title' => '画像なし'],
];
ob_start();
?>
<ul id="qa-large-navigation" class="module_navigation --large">
  <?php foreach ($navigation as $item) : ?>
    <?php
    if (isset($item['image_index'])) {
      $item['image_html'] = wp_get_attachment_image($media[$item['image_index']]['id'], 'full', false, ['alt' => '']);
    }
    ?>
    <li class="navigation">
      <?php get_template_part('template-parts/_navigation-large-card', null, ['heading' => 'h2', 'item' => $item]); ?>
    </li>
  <?php endforeach; ?>
</ul>
<p id="qa-navigation-end"><a id="qa-navigation-next" href="#qa-navigation-end">次の操作</a></p>
<?php
$nav_html = ob_get_clean();
if (substr_count($nav_html, 'class="module_navigationCard"') !== 4) {
  throw new RuntimeException('shared card output missing');
}
$content .= "\n\n<!-- wp:heading --><h2 class=\"wp-block-heading\">ナビゲーション</h2><!-- /wp:heading -->\n\n"
  . "<!-- wp:html -->\n" . $nav_html . "\n<!-- /wp:html -->\n";

// QA-only Figma-proportion sample, separate from long-text stress cases.
// Stored preschool media is representative, not hash-verified to this node.
ob_start();
?>
<ul id="qa-large-navigation-reference" class="module_navigation --large" style="max-width: 960px; margin-inline: auto;">
  <?php foreach (['幼児部', '初等部', '中等部'] as $title) : ?>
    <li class="navigation">
      <?php get_template_part('template-parts/_navigation-large-card', null, ['heading' => 'h2', 'item' => [
        'title' => $title,
        'text' => 'テキストが入ります。テキストが入ります。テキストが入ります。',
        'image_html' => wp_get_attachment_image($first['id'], 'full', false, ['alt' => '']),
        'url' => '#qa-navigation-end',
      ]]); ?>
    </li>
  <?php endforeach; ?>
</ul>
<?php
$content .= "\n\n<!-- wp:html -->\n" . ob_get_clean() . "\n<!-- /wp:html -->\n";


// Native Group/Columns opt-in styles; disposable fixture only.
$content .= "\n\n" . <<<'HTML'
<!-- wp:group {"className":"is-style-jwsnj-bordered-box","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-jwsnj-bordered-box"><!-- wp:paragraph -->
<p>枠線付きテキストボックスの長文確認。LongEditableBoxWithoutSpaces1234567890LongEditableBoxWithoutSpaces1234567890</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:columns {"className":"is-style-jwsnj-background-boxes"} -->
<div class="wp-block-columns is-style-jwsnj-background-boxes"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"className":"is-style-jwsnj-background-box","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-jwsnj-background-box"><!-- wp:heading {"level":4} -->
<h4 class="wp-block-heading">背景付きテキストボックス</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>短い本文を編集できます。</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"className":"is-style-jwsnj-background-box","layout":{"type":"default"}} -->
<div class="wp-block-group is-style-jwsnj-background-box"><!-- wp:heading {"level":4} -->
<h4 class="wp-block-heading">背景付きテキストボックス</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>長い本文を含む編集可能なテキストボックスです。LongEditableBoxWithoutSpaces1234567890LongEditableBoxWithoutSpaces1234567890 長さの異なる本文でカラムの高さを確認します。</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->
HTML;
$content .= "\n";

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
