<?php
$is_top = is_front_page();
?>
<div class="purposeBannerRoot" data-print-hide data-purpose-banner<?php echo $is_top ? ' data-purpose-top' : ''; ?>>
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
        <?php get_template_part('template-parts/_purpose-menu'); ?>
    </div>
    </div>
    </div>
</nav>
</div>
