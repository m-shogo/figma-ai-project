<?php
/**
 * TOP lower banner links.
 *
 * Existing ACF `top_banner-01` remains the data authority.
 * Current Figma renders the existing image field again; no new field/schema is introduced.
 */

$banner_items = [];

if (function_exists('have_rows') && have_rows('top_banner-01')) {
    while (have_rows('top_banner-01')) {
        the_row();

        $image = get_sub_field('img');
        $title = trim((string) get_sub_field('title'));
        $url = trim((string) get_sub_field('url'));
        $external = (bool) get_sub_field('target');

        $image_id = 0;
        $image_url = '';
        $image_alt = '';
        $image_width = 0;
        $image_height = 0;

        if (is_numeric($image)) {
            $image_id = (int) $image;
        } elseif (is_array($image)) {
            $image_id = (int) ($image['ID'] ?? $image['id'] ?? 0);
            $image_url = (string) ($image['url'] ?? '');
            $image_alt = trim((string) ($image['alt'] ?? ''));
            $image_width = (int) ($image['width'] ?? 0);
            $image_height = (int) ($image['height'] ?? 0);
        } elseif (is_string($image)) {
            $image_url = trim($image);
        }

        if ($image_id) {
            $image_src = wp_get_attachment_image_src($image_id, 'full');
            if ($image_src) {
                $image_url = (string) $image_src[0];
                $image_width = (int) $image_src[1];
                $image_height = (int) $image_src[2];
            }
            if ($image_alt === '') {
                $image_alt = trim((string) get_post_meta($image_id, '_wp_attachment_image_alt', true));
            }
        }

        if ($image_url === '') {
            continue;
        }

        if ($image_alt === '') {
            $image_alt = $title;
        }

        $banner_items[] = [
            'image_url' => $image_url,
            'image_alt' => $image_alt,
            'image_width' => $image_width,
            'image_height' => $image_height,
            'url' => $url,
            'external' => $external,
        ];
    }
}

if (!$banner_items) {
    return;
}
?>
<section id="top_banner-01" class="top_banner-01" aria-label="関連リンク">
    <div class="tb_inner">
        <ul class="tb_list">
            <?php foreach ($banner_items as $item): ?>
                <li class="tb_item">
                    <?php if ($item['url'] !== ''): ?>
                        <a class="tb_link" href="<?php echo esc_url($item['url']); ?>"<?php if ($item['external']): ?> target="_blank" rel="noopener noreferrer"<?php endif; ?>>
                    <?php else: ?>
                        <span class="tb_link is-disabled" aria-disabled="true">
                    <?php endif; ?>
                            <img
                                class="tb_image"
                                src="<?php echo esc_url($item['image_url']); ?>"
                                alt="<?php echo esc_attr($item['image_alt']); ?>"
                                <?php if ($item['image_width'] > 0): ?>width="<?php echo esc_attr($item['image_width']); ?>"<?php endif; ?>
                                <?php if ($item['image_height'] > 0): ?>height="<?php echo esc_attr($item['image_height']); ?>"<?php endif; ?>
                                loading="lazy"
                            >
                    <?php if ($item['url'] !== ''): ?>
                        </a>
                    <?php else: ?>
                        </span>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
</section>
