<?php
$items = get_field('slider_items') ?? [];
if (!is_array($items) || $items === []) {
    $raw = is_array($block['data'] ?? null) ? $block['data'] : [];
    $count = isset($raw['slider_items']) ? (int) $raw['slider_items'] : 0;
    $items = [];
    for ($i = 0; $i < $count; $i++) {
        $items[] = array(
            'image' => $raw["slider_items_{$i}_image"] ?? '',
            'caption' => $raw["slider_items_{$i}_caption"] ?? '',
        );
    }
}
if ($items === []) {
    return;
}
$fallback = get_template_directory_uri() . '/images/common/noimage.webp';
?>
<div class="module_slider-01">
    <div class="swiper slider-stage">
        <div class="swiper-wrapper">
            <?php foreach ($items as $item) : ?>
                <?php
                $image_id = $item['image'] ?? '';
                $caption = $item['caption'] ?? '';
                $image_url = '';
                $image_alt = '';
                if ($image_id) {
                    $image_url = wp_get_attachment_image_url($image_id, 'full') ?: '';
                    $image_alt = (string) get_post_meta($image_id, '_wp_attachment_image_alt', true);
                }
                if ($image_url === '' && $caption === '') {
                    continue;
                }
                if ($image_url === '') {
                    $image_url = $fallback;
                }
                if ($image_alt === '' && $caption !== '') {
                    $image_alt = wp_strip_all_tags($caption);
                }
                ?>
                <figure class="swiper-slide">
                    <div class="image">
                        <img src="<?php echo esc_url($image_url !== '' ? $image_url : $fallback); ?>" alt="<?php echo esc_attr($image_alt); ?>" width="645" height="430">
                    </div>
                    <?php if ($caption !== '') : ?>
                        <figcaption><?php echo nl2br(esc_html($caption)); ?></figcaption>
                    <?php endif; ?>
                </figure>
            <?php endforeach; ?>
        </div>
    </div>
    <div class="slider-nav" aria-hidden="true">
        <button type="button" class="swiper-button-prev" aria-label="前のスライド"></button>
        <button type="button" class="swiper-button-next" aria-label="次のスライド"></button>
    </div>
</div>
