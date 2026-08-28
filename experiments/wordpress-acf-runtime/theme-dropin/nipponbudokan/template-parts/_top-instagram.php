<?php
$theme_uri = get_template_directory_uri();

$items = array(
    array('src' => $theme_uri . '/images/top/instagram-01.png', 'alt' => ''),
    array('src' => $theme_uri . '/images/top/instagram-02.png', 'alt' => ''),
    array('src' => $theme_uri . '/images/top/instagram-03.png', 'alt' => ''),
    array('src' => $theme_uri . '/images/top/instagram-04.png', 'alt' => ''),
    array('src' => $theme_uri . '/images/top/instagram-05.png', 'alt' => ''),
);

/**
 * TOP Instagram editorial feed.
 *
 * No production Instagram API / ACF contract is authoritative yet. Consumers may
 * replace the visual fallback items without changing this template's structure.
 */
$items = apply_filters('nipponbudokan_top_instagram_items', $items);
?>
<section id="top_instagram-01" class="top_instagram-01" aria-labelledby="ti_title">
    <div class="ti_inner">
        <div class="ti_head">
            <div class="ti_titleGroup">
                <h2 id="ti_title" class="ti_title">月刊「武道」編集部</h2>
                <p class="ti_label"><span class="ti_marker" aria-hidden="true"></span><span class="ti_labelText"><span class="ti_labelInitial">I</span>nstagram</span></p>
            </div>
            <p class="ti_lead">日本武道館が主催する武道・書道に関する事業や大会などの情報を発信します</p>
        </div>
        <ul class="ti_thumbnails" aria-label="Instagram投稿イメージ">
            <?php foreach ($items as $item): ?>
                <?php
                $src = isset($item['src']) ? $item['src'] : '';
                $alt = isset($item['alt']) ? $item['alt'] : '';
                $url = isset($item['url']) ? $item['url'] : '';
                if (!$src) {
                    continue;
                }
                ?>
                <li class="ti_thumbnail">
                    <?php if ($url): ?><a class="ti_link" href="<?php echo esc_url($url); ?>"><?php endif; ?>
                        <img src="<?php echo esc_url($src); ?>" alt="<?php echo esc_attr($alt); ?>" width="231" height="289" loading="lazy">
                    <?php if ($url): ?></a><?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
</section>
