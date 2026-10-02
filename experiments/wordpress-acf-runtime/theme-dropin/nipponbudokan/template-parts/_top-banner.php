<?php
$theme_uri = get_template_directory_uri();
$banners = array(
    array(
        'src' => $theme_uri . '/images/top/bnr-takarakuji.webp',
        'alt' => '一般財団法人 日本宝くじ協会',
        'url' => 'https://jla-takarakuji.or.jp/',
        'width' => 253,
        'height' => 80,
    ),
    array(
        'src' => $theme_uri . '/images/top/bnr-sports.webp',
        'alt' => 'スポーツくじ',
        'url' => 'https://www.toto-dream.com/',
        'width' => 204,
        'height' => 80,
    ),
);
?>
<section id="top_banner-01" class="top_banner-01" aria-label="関連リンク">
    <div class="tb_inner">
        <ul class="tb_list">
            <?php foreach ($banners as $item): ?>
                <li class="tb_item">
                    <a class="tb_link" href="<?php echo esc_url($item['url']); ?>" target="_blank" rel="noopener noreferrer">
                        <img class="tb_image" src="<?php echo esc_url($item['src']); ?>" alt="<?php echo esc_attr($item['alt']); ?>" width="<?php echo esc_attr($item['width']); ?>" height="<?php echo esc_attr($item['height']); ?>" loading="lazy">
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
</section>
