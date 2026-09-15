<?php
/**
 * 月刊「武道」詳細のテンプレート頭。
 * CPT single と最新号固定ページで共有する。
 */
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$month = get_field('budo_month', $post_id);
$size = get_field('budo_size', $post_id);
$pages = get_field('budo_page', $post_id);
$price = get_field('budo_price', $post_id);
$subscription = get_field('budo_teiki', $post_id);
$thumbnail_id = get_post_thumbnail_id($post_id);
$title = get_the_title($post_id);
$heading = trim((nbk_acf_value_present($month) ? '月刊「武道」' . wp_strip_all_tags((string) $month) : '') . (nbk_acf_value_present($month) && $title !== '' ? ' ' : '') . $title);
if ($heading === '') {
    $heading = $title;
}

$specs = array();
if (nbk_acf_value_present($size)) {
    $specs[] = array('label' => '版型', 'value' => $size);
}
if (nbk_acf_value_present($pages)) {
    $specs[] = array('label' => 'ページ数', 'value' => $pages);
}
if (nbk_acf_value_present($price)) {
    $specs[] = array('label' => '定価', 'value' => $price);
}
if (nbk_acf_value_present($subscription)) {
    $specs[] = array('label' => '定期購読料', 'value' => $subscription, 'html' => true);
}
?>
<div class="publication_budo-head">
    <?php if ($heading !== '') : ?>
        <h1 class="publication_budo-title module_title-01"><span><?php echo esc_html($heading); ?></span></h1>
    <?php endif; ?>

    <div class="publication_budo-summary<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
        <?php if ($thumbnail_id) : ?>
            <figure class="publication_budo-cover">
                <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: $title)); ?>
            </figure>
        <?php endif; ?>

        <?php if (!empty($specs)) : ?>
            <dl class="publication_budo-specs">
                <?php foreach ($specs as $spec) : ?>
                    <div class="publication_budo-spec">
                        <dt><?php echo esc_html($spec['label']); ?></dt>
                        <dd><?php echo !empty($spec['html']) ? wp_kses_post($spec['value']) : esc_html($spec['value']); ?></dd>
                    </div>
                <?php endforeach; ?>
            </dl>
        <?php endif; ?>
    </div>

    <div class="block-editor_wrap publication_budo-order">
        <div class="wp-block-buttons cta">
            <div class="wp-block-button">
                <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url(home_url('/publications/budo/order/')); ?>">ご注文</a>
            </div>
        </div>
    </div>
</div>
