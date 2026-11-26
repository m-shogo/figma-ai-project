<?php
// The initial still uses the existing TOP image repeater. Motion and CTA are separate.
$mv_rows = function_exists('get_field') ? get_field('top_slider-01') : [];
$mv_items = [];
foreach (is_array($mv_rows) ? $mv_rows : [] as $mv_row) {
    if (!is_array($mv_row)) {
        continue;
    }
    $pc_id = absint($mv_row['img_pc'] ?? 0);
    $sp_id = absint($mv_row['img_sp'] ?? 0);
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
?>
<div class="jwsnj_topMv">
    <ul class="jwsnj_topMv_grid<?php echo $complete ? ' is-complete' : ''; ?>">
        <?php foreach ($mv_items as $item) : ?>
            <li class="jwsnj_topMv_item">
                <picture>
                    <?php if ($item['sp_srcset'] !== '') : ?>
                        <source media="(width &lt; 67.5rem)" srcset="<?php echo esc_attr($item['sp_srcset']); ?>" sizes="100vw">
                    <?php endif; ?>
                    <?php echo $item['image']; // WordPress-generated attachment markup. ?>
                </picture>
            </li>
        <?php endforeach; ?>
    </ul>
</div>
