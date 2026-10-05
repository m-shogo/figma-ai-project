<?php
/**
 * TOP SNS strip.
 *
 * Human 2026-10-05 set one destination per network. The same URLs are used
 * by the Footer and the hamburger panel.
 */
?>
<section id="top_sns-01" class="top_sns-01" aria-label="公式SNS">
    <div class="ts_inner">
        <div class="ts_group ts_group_youtube">
            <p class="ts_label ts_label_youtube">公式Youtube</p>
            <div class="ts_icons">
                <a class="ts_icon ts_icon_youtube" href="<?php echo esc_url(nipponbudokan_official_sns_url('youtube')); ?>" target="_blank" rel="noopener noreferrer" aria-label="YouTube"></a>
            </div>
        </div>

        <div class="ts_group ts_group_editorial">
            <p class="ts_label">月刊「武道」編集部</p>
            <div class="ts_icons">
                <a class="ts_icon ts_icon_instagram" href="<?php echo esc_url(nipponbudokan_official_sns_url('instagram')); ?>" target="_blank" rel="noopener noreferrer" aria-label="Instagram"></a>
                <a class="ts_icon ts_icon_x" href="<?php echo esc_url(nipponbudokan_official_sns_url('x')); ?>" target="_blank" rel="noopener noreferrer" aria-label="X"></a>
            </div>
        </div>

        <div class="ts_group ts_group_official">
            <p class="ts_official_label">
                <span class="ts_official_label_small">Budo-the Japanese martial Ways</span>
                <span>【Nippon Budokan Official】</span>
            </p>
            <div class="ts_icons">
                <a class="ts_icon ts_icon_youtube" href="<?php echo esc_url(nipponbudokan_official_sns_url('youtube')); ?>" target="_blank" rel="noopener noreferrer" aria-label="YouTube"></a>
                <a class="ts_icon ts_icon_instagram" href="<?php echo esc_url(nipponbudokan_official_sns_url('instagram')); ?>" target="_blank" rel="noopener noreferrer" aria-label="Instagram"></a>
            </div>
        </div>
    </div>
</section>
