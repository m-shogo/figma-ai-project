<?php
$theme_uri = get_template_directory_uri();
$is_top = is_front_page();
?>
<div class="purposeBannerRoot" data-purpose-banner<?php echo $is_top ? ' data-purpose-top' : ''; ?>>
<button type="button" class="purposeBanner_overlay" aria-label="閉じる" tabindex="-1"></button>
<nav class="purposeBanner<?php echo $is_top ? '' : ' is-shown'; ?>" aria-label="目的から探す">
    <button type="button" class="tm_guide_head purposeBanner_toggle" aria-expanded="false" aria-controls="purposeBanner_body">
        <span class="purposeBanner_label">
            <span class="tm_guide_head_icon" aria-hidden="true"></span>
            <span class="tm_guide_head_text">目的から探す</span>
        </span>
        <span class="purposeBanner_chevron" aria-hidden="true"></span>
    </button>
    <div class="purposeBanner_sheet" id="purposeBanner_body">
    <div class="purposeBanner_clip">
    <div class="tm_guide_body">
        <div class="tm_guide_group">
            <p class="tm_guide_title"><img src="<?php echo esc_url($theme_uri . '/images/top/ico-budo.svg'); ?>" alt="" width="36" height="36" loading="lazy"><span>武道</span></p>
            <ul class="tm_guide_list">
                <li><a class="tm_guide_link" aria-disabled="true">武道を知りたい</a></li>
                <li><a class="tm_guide_link" aria-disabled="true">大会・行事に参加したい</a></li>
                <li><a class="tm_guide_link" aria-disabled="true">指導について知りたい</a></li>
            </ul>
        </div>
        <div class="tm_guide_group">
            <p class="tm_guide_title"><img src="<?php echo esc_url($theme_uri . '/images/top/ico-calligraphy.svg'); ?>" alt="" width="36" height="36" loading="lazy"><span>書道</span></p>
            <ul class="tm_guide_list">
                <li><a class="tm_guide_link" aria-disabled="true">書道を学びたい</a></li>
                <li><a class="tm_guide_link" aria-disabled="true">展覧会に参加したい</a></li>
            </ul>
        </div>
        <div class="tm_guide_group">
            <p class="tm_guide_title"><img src="<?php echo esc_url($theme_uri . '/images/top/ico-budokan.svg'); ?>" alt="" width="36" height="36" loading="lazy"><span>日本武道館</span></p>
            <ul class="tm_guide_list">
                <li><a class="tm_guide_link" aria-disabled="true">武道館について知りたい</a></li>
                <li><a class="tm_guide_link" aria-disabled="true">研修施設を利用したい</a></li>
                <li><a class="tm_guide_link" aria-disabled="true">コンサートに行きたい</a></li>
            </ul>
        </div>
    </div>
    </div>
    </div>
</nav>
</div>
