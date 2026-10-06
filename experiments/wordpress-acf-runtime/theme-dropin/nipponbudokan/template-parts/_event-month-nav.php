<?php
$year = nipponbudokan_event_selected_year();
$month = nipponbudokan_event_selected_month();
$requested_year = nipponbudokan_event_requested_year();
$requested_month = nipponbudokan_event_requested_month();
$term = is_tax('event_cat') ? get_queried_object() : null;

$prev_year_url = nipponbudokan_event_archive_url($year - 1, $month, $term);
$next_year_url = nipponbudokan_event_archive_url($year + 1, $month, $term);

$adjacent_months = array();
for ($offset = -1; $offset <= 1; $offset++) {
    $absolute_month = ($year * 12) + ($month - 1) + $offset;
    $item_year = intdiv($absolute_month, 12);
    $item_month = ($absolute_month % 12) + 1;

    $adjacent_months[] = array(
        'year' => $item_year,
        'month' => $item_month,
        'url' => nipponbudokan_event_archive_url($item_year, $item_month, $term),
        'current' => $requested_month > 0 && $item_year === ($requested_year > 0 ? $requested_year : $year) && $item_month === $requested_month,
    );
}
?>
<nav class="ea_monthNav" aria-label="開催月">
    <div class="ea_years">
        <a class="ea_year ea_year-prev" href="<?php echo esc_url($prev_year_url); ?>"><?php echo esc_html(($year - 1) . '年'); ?></a>
        <a class="ea_year ea_year-next" href="<?php echo esc_url($next_year_url); ?>"><?php echo esc_html(($year + 1) . '年'); ?></a>
    </div>

    <ol class="ea_months ea_months-sp">
        <?php foreach ($adjacent_months as $item) : ?>
            <li>
                <a class="ea_month<?php echo $item['current'] ? ' is-current' : ''; ?>" href="<?php echo esc_url($item['url']); ?>">
                    <?php echo esc_html($item['month'] . '月'); ?>
                </a>
            </li>
        <?php endforeach; ?>
    </ol>

    <ol class="ea_months ea_months-pc">
        <?php for ($m = 1; $m <= 12; $m++) : ?>
            <li>
                <a class="ea_month<?php echo ($requested_month === $m && ($requested_year === 0 || $requested_year === $year)) ? ' is-current' : ''; ?>" href="<?php echo esc_url(nipponbudokan_event_archive_url($year, $m, $term)); ?>">
                    <?php echo esc_html($m . '月'); ?>
                </a>
            </li>
        <?php endfor; ?>
    </ol>
</nav>
