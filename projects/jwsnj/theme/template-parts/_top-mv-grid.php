<?php
// Existing TOP image repeater. Swiper progressively enhances only the complete grid; CTA is separate.
$mv_rows = function_exists('get_field') ? get_field('top_slider-01') : [];
$mv_items = [];
// ACF returns attachment IDs; do not coerce a negative ID, array or float into another image.
$valid_mv_id = static function ($value) {
    if (!is_int($value) && !is_string($value)) {
        return 0;
    }
    return filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: 0;
};
foreach (is_array($mv_rows) ? $mv_rows : [] as $mv_row) {
    if (!is_array($mv_row)) {
        continue;
    }
    $pc_id = $valid_mv_id($mv_row['img_pc'] ?? 0);
    $sp_id = $valid_mv_id($mv_row['img_sp'] ?? 0);
    $pc = $pc_id && wp_attachment_is_image($pc_id) ? wp_get_attachment_image_src($pc_id, 'large') : false;
    $sp = $sp_id && wp_attachment_is_image($sp_id) ? wp_get_attachment_image_src($sp_id, 'large') : false;
    if (!$pc && !$sp) {
        continue;
    }
    $image_id = $pc ? $pc_id : $sp_id;
    $index = count($mv_items) + 1;
    $image = wp_get_attachment_image($image_id, 'large', false, [
        'class' => 'jwsnj_topMv_image',
        'loading' => $index === 4 || $index === 5 ? 'lazy' : 'eager',
        'decoding' => 'async',
        'fetchpriority' => $index === 1 ? 'high' : 'auto',
        'sizes' => '100vw',
    ]);
    if ($image === '') {
        continue;
    }
    $sp_srcset = '';
    if ($pc && $sp && $pc_id !== $sp_id) {
        $sp_srcset = wp_get_attachment_image_srcset($sp_id, 'large') ?: $sp[0];
    }
    $mv_items[] = ['image' => $image, 'sp_srcset' => $sp_srcset];
    if (count($mv_items) === 6) {
        break;
    }
}
if (!$mv_items) {
    return;
}
$complete = count($mv_items) === 6;
// Only the complete layout has known slot widths. Partial grids auto-fit,
// so retain their conservative 100vw hint. Ignore gaps in these estimates
// to avoid selecting an undersized candidate when theme font scaling varies.
if ($complete) {
    foreach ($mv_items as $index => &$item) {
        $wide = $index === 5;
        $item['sp_sizes'] = $wide ? '100vw' : '50vw';
        $sizes = $wide ? '(min-width: 67.5rem) 50vw, 100vw' : '(min-width: 67.5rem) 25vw, 50vw';
        // Preserve WordPress attachment markup, srcset, lazy auto sizing and
        // custom plugin sizes. Older WordPress retains the original hint.
        if (class_exists('WP_HTML_Tag_Processor')) {
            $tag = new WP_HTML_Tag_Processor($item['image']);
            if ($tag->next_tag(['tag_name' => 'IMG']) && $tag->get_attribute('srcset')) {
                $original_sizes = $tag->get_attribute('sizes');
                if ($original_sizes === '100vw' || $original_sizes === 'auto, 100vw') {
                    $tag->set_attribute('sizes', ($original_sizes === 'auto, 100vw' ? 'auto, ' : '') . $sizes);
                    $item['image'] = $tag->get_updated_html();
                }
            }
        }
    }
    unset($item);
}
?>
<div class="jwsnj_topMv">
    <div class="jwsnj_topMv_viewport">
    <div class="jwsnj_topMv_track" id="jwsnj_topMv_track">
    <ul class="jwsnj_topMv_grid<?php echo $complete ? ' is-complete' : ''; ?>">
        <?php foreach ($mv_items as $item) : ?>
            <li class="jwsnj_topMv_item">
                <picture>
                    <?php if ($item['sp_srcset'] !== '') : ?>
                        <source media="(width &lt; 67.5rem)" srcset="<?php echo esc_attr($item['sp_srcset']); ?>" sizes="<?php echo esc_attr($item['sp_sizes'] ?? '100vw'); ?>">
                    <?php endif; ?>
                    <?php echo $item['image']; // WordPress-generated attachment markup. ?>
                </picture>
            </li>
        <?php endforeach; ?>
    </ul>
    </div>
    </div>
    <?php if ($complete) : ?>
        <button type="button" class="jwsnj_topMv_toggle" aria-controls="jwsnj_topMv_track" hidden>写真の動きを停止</button>
    <?php endif; ?>
</div>
