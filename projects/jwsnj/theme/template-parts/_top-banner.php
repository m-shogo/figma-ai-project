<?php
// Existing editor-managed banner list; the licensed Figma photo is a separate pending asset.
$banner_rows = function_exists('get_field') ? get_field('top_banner-01') : [];
$banner_items = [];
foreach (is_array($banner_rows) ? $banner_rows : [] as $row) {
    if (!is_array($row)) {
        continue;
    }
    $raw_image_id = $row['img'] ?? 0;
    // FILTER_VALIDATE_INT alone accepts boolean true as attachment 1.
    $image_id = (is_int($raw_image_id) || is_string($raw_image_id))
        ? filter_var($raw_image_id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]])
        : false;
    $title = is_string($row['title'] ?? null) ? trim($row['title']) : '';
    $url = is_string($row['url'] ?? null) ? esc_url(trim($row['url'])) : '';
    $image = $image_id && wp_attachment_is_image($image_id)
        ? wp_get_attachment_image($image_id, 'top_banner', false, ['loading' => 'lazy', 'decoding' => 'async'])
        : '';
    if ($image === '' && $title === '') {
        continue;
    }
    // An image-only link needs an editor-provided accessible name.
    if ($title === '' && trim((string) get_post_meta($image_id, '_wp_attachment_image_alt', true)) === '') {
        $url = '';
    }
    $banner_items[] = [
        'image' => $image,
        'title' => $title,
        'url' => $url,
        'new_tab' => in_array('はい', (array) ($row['target'] ?? []), true),
    ];
}
if (!$banner_items) {
    return;
}
?>
<div id="top_banner-01" class="top_banner-01">
    <div class="global_inner">
        <ul class="list">
            <?php foreach ($banner_items as $item) : ?>
                <li<?php echo $item['image'] === '' ? ' class="_noImage"' : ''; ?>>
                    <?php if ($item['url'] !== '') : ?>
                        <a class="jwsnj_topBanner_item" href="<?php echo $item['url']; ?>"<?php echo $item['new_tab'] ? ' target="_blank" rel="noopener noreferrer"' : ''; ?>>
                    <?php else : ?>
                        <div class="jwsnj_topBanner_item">
                    <?php endif; ?>
                    <?php if ($item['image'] !== '') : ?><div class="image"><?php echo $item['image']; // WordPress-generated image markup. ?></div><?php endif; ?>
                    <?php if ($item['title'] !== '') : ?><p class="title"><?php echo esc_html($item['title']); ?></p><?php endif; ?>
                    <?php echo $item['url'] !== '' ? '</a>' : '</div>'; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
</div>
