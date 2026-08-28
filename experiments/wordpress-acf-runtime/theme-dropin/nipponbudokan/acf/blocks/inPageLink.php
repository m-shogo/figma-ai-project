<?php
// ACFフィールドがnullの場合に備えて、空配列をデフォルト値として使用
$items = get_field('inPageLink_items') ?? [];
$count = count($items);
// カラムクラスの生成：4以上の場合は 4、それ以外は count[1-3] の文字列
$column_num = '';
if ($count > 1) {
    $column_num = $count >= 4 ? '4' : strval($count);
}
?>
<?php if (have_rows('inPageLink_items')) : ?>
    <ul class="module_inPageLink-01" data-column="<?php echo esc_attr($column_num); ?>">
        <?php while (have_rows('inPageLink_items')) : the_row(); ?>
            <?php
            $title = get_sub_field('inPageLink_title');
            $id = get_sub_field('inPageLink_id');
            ?>
            <li class="inPageLink">
                <a href="#<?php echo esc_attr($id); ?>">
                    <div class="title"><?php echo nl2br(esc_html($title)); ?></div>
                </a>
            </li>
        <?php endwhile; ?>
    </ul>
<?php endif; ?>