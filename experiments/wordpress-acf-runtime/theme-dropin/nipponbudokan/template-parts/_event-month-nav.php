<?php
$year = nipponbudokan_event_selected_year();
$month = nipponbudokan_event_selected_month();
$queried_month = (int) get_query_var('event_m');
$mark_month = $queried_month >= 1 && $queried_month <= 12;
$term = is_tax('event_cat') ? get_queried_object() : null;
$prev_year_url = nipponbudokan_event_archive_url($year - 1, $month, $term);
$next_year_url = nipponbudokan_event_archive_url($year + 1, $month, $term);
?>
<div class="ea_monthNav">
    <div class="ea_years">
        <a class="ea_year ea_year-prev" href="<?php echo esc_url($prev_year_url); ?>"><?php echo esc_html(($year - 1) . '年'); ?></a>
        <a class="ea_year ea_year-next" href="<?php echo esc_url($next_year_url); ?>"><?php echo esc_html(($year + 1) . '年'); ?></a>
    </div>
    <ol class="ea_months">
        <?php for ($m = 1; $m <= 12; $m++) : ?>
            <li>
                <a class="ea_month<?php echo ($mark_month && $m === $queried_month) ? ' is-current' : ''; ?>" href="<?php echo esc_url(nipponbudokan_event_archive_url($year, $m, $term)); ?>"><?php echo esc_html($m . '月'); ?></a>
            </li>
        <?php endfor; ?>
    </ol>
</div>
