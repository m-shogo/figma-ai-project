<?php
// inPageLink_items[] → inPageLink_title, inPageLink_id. Do not invent slugs.
$items = get_field('inPageLink_items') ?? [];
if (!is_array($items) || $items === []) {
    $raw = is_array($block['data'] ?? null) ? $block['data'] : [];
    $count = isset($raw['inPageLink_items']) ? (int) $raw['inPageLink_items'] : 0;
    $items = [];
    for ($i = 0; $i < $count; $i++) {
        $items[] = array(
            'inPageLink_title' => $raw["inPageLink_items_{$i}_inPageLink_title"] ?? '',
            'inPageLink_id' => $raw["inPageLink_items_{$i}_inPageLink_id"] ?? '',
        );
    }
}
$count = count($items);
$column_num = '';
if ($count > 1) {
    $column_num = $count >= 4 ? '4' : strval($count);
}
?>
<?php if ($items) : ?>
    <ul class="module_inPageLink-01" data-column="<?php echo esc_attr($column_num); ?>">
        <?php foreach ($items as $item) : ?>
            <?php
            $title = $item['inPageLink_title'] ?? '';
            $id = $item['inPageLink_id'] ?? '';
            if ($title === '' && $id === '') {
                continue;
            }
            ?>
            <li class="inPageLink">
                <a href="#<?php echo esc_attr($id); ?>">
                    <div class="title"><?php echo nl2br(esc_html($title)); ?></div>
                </a>
            </li>
        <?php endforeach; ?>
    </ul>
<?php endif; ?>
