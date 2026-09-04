<?php
/**
 * TOP lower banner links.
 *
 * Data authority remains the existing `top_banner-01` ACF Repeater.
 * The current Figma design uses title / URL / external-link state only;
 * the legacy `img` field is intentionally kept in ACF but not rendered here.
 */

$banner_items = [];

if (function_exists('have_rows') && have_rows('top_banner-01')) {
    while (have_rows('top_banner-01')) {
        the_row();

        $title = trim((string) get_sub_field('title'));
        if ($title === '') {
            continue;
        }

        $banner_items[] = [
            'title' => $title,
            'url' => trim((string) get_sub_field('url')),
            'external' => (bool) get_sub_field('target'),
        ];
    }
}

if (!$banner_items) {
    // Visual samples for empty ACF. Production repeater rows remain the data authority.
    $banner_items = [
        ['title' => 'スポーツくじ', 'url' => '', 'external' => true],
        ['title' => '日本宝くじ協会', 'url' => '', 'external' => true],
    ];
}

$default_background_url = get_template_directory_uri() . '/images/top/bg-banner-sp.webp';
$background_url = (string) apply_filters('nipponbudokan_top_banner_background_url', $default_background_url);
$section_style = $background_url !== ''
    ? sprintf('--tb-background-image: url(%s);', esc_url($background_url))
    : '';
?>
<section id="top_banner-01" class="top_banner-01"<?php if ($section_style !== ''): ?> style="<?php echo esc_attr($section_style); ?>"<?php endif; ?>>
    <div class="tb_inner">
        <ul class="tb_list">
            <?php foreach ($banner_items as $item): ?>
                <li class="tb_item">
                    <?php if ($item['url'] !== ''): ?>
                        <a class="tb_link" href="<?php echo esc_url($item['url']); ?>"<?php if ($item['external']): ?> target="_blank" rel="noopener noreferrer"<?php endif; ?>>
                    <?php else: ?>
                        <span class="tb_link is-disabled" aria-disabled="true">
                    <?php endif; ?>
                            <span class="tb_arrow" aria-hidden="true"><span class="tb_arrow_icon"></span></span>
                            <span class="tb_title"><?php echo esc_html($item['title']); ?></span>
                            <?php if ($item['external']): ?><span class="tb_external" aria-hidden="true"></span><?php endif; ?>
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
