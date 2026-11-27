<?php
// Shared Large Navigation presentation. Data acquisition stays in the caller.
$item = is_array($args['item'] ?? null) ? $args['item'] : [];
$title = trim((string) ($item['title'] ?? ''));
$text = trim((string) ($item['text'] ?? ''));
$image = wp_kses_post((string) ($item['image_html'] ?? ''));
$alt = trim((string) ($item['image_alt'] ?? ''));
$url = esc_url(trim((string) ($item['url'] ?? '')));
$has_text = $title !== '' || $text !== '';
if ($image === '' && !$has_text) {
  return;
}
$has_link = $url !== '' && ($has_text || ($image !== '' && $alt !== ''));
$heading = ($args['heading'] ?? '') === 'h3' ? 'h3' : 'h2';
?>
<a class="module_navigationCard"<?php if ($has_link) : ?> href="<?php echo $url; ?>"<?php if (!empty($item['new_tab'])) : ?> target="_blank" rel="noopener noreferrer"<?php endif; ?><?php endif; ?>>
  <?php if ($image !== '') : ?>
    <div class="module_navigationCard_photo">
      <div class="module_navigationCard_crop"><?php echo $image; ?></div>
      <span class="module_navigationCard_arrow" aria-hidden="true"></span>
    </div>
  <?php endif; ?>
  <?php if ($has_text) : ?>
    <div class="module_navigationCard_content">
      <?php if ($title !== '') : ?>
        <<?php echo $heading; ?> class="module_navigationCard_title"><?php echo esc_html($title); ?></<?php echo $heading; ?>>
      <?php endif; ?>
      <?php if ($text !== '') : ?>
        <div class="module_navigationCard_text"><?php echo esc_html($text); ?></div>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</a>
