<?php
// Native WP query and URL generation; keep numeric windows around the current page.
global $wp_query;
$total = (int) $wp_query->max_num_pages;
$current = min(max(1, (int) get_query_var('paged')), max(1, $total));
if ($total < 1) {
    return;
}
$start = max(1, min($current - 2, $total - 4));
$end = min($total, $start + 4);
$mobile_start = max(1, min($current - 1, $total - 2));
$mobile_end = min($total, $mobile_start + 2);
?>
<nav class="jwsnj_newsArchive_pager" aria-label="ページナビゲーション">
    <?php if ($current > 1) : ?>
        <a class="prev" href="<?php echo esc_url(get_pagenum_link($current - 1)); ?>">前へ</a>
    <?php else : ?>
        <span class="prev" aria-disabled="true">前へ</span>
    <?php endif; ?>
    <div class="jwsnj_newsArchive_pageNumbers">
        <?php for ($page = $start; $page <= $end; $page++) : ?>
            <?php $extra = $page < $mobile_start || $page > $mobile_end ? ' is-desktop-only' : ''; ?>
            <?php if ($page === $current) : ?>
                <span class="page-numbers current<?php echo esc_attr($extra); ?>" aria-current="page"><?php echo esc_html($page); ?></span>
            <?php else : ?>
                <a class="page-numbers<?php echo esc_attr($extra); ?>" href="<?php echo esc_url(get_pagenum_link($page)); ?>" aria-label="<?php echo esc_attr($page . 'ページ'); ?>"><?php echo esc_html($page); ?></a>
            <?php endif; ?>
        <?php endfor; ?>
    </div>
    <?php if ($current < $total) : ?>
        <a class="next" href="<?php echo esc_url(get_pagenum_link($current + 1)); ?>">次へ</a>
    <?php else : ?>
        <span class="next" aria-disabled="true">次へ</span>
    <?php endif; ?>
</nav>
