<?php
/**
 * 月刊刊行物の詳細ヘッド。
 * 武道を既定値とし、書写書道は field map / label を args で差し替える。
 * 視覚 markup / CSS owner は両 family で共有する。
 */
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$defaults = array(
    'month_field' => 'budo_month',
    'size_field' => 'budo_size',
    'pages_field' => 'budo_page',
    'price_field' => 'budo_price',
    'subscription_field' => 'budo_teiki',
    'publication_label' => '月刊「武道」',
    'order_url' => home_url('/publications/budo/order/'),
);
$config = wp_parse_args(isset($args['config']) && is_array($args['config']) ? $args['config'] : array(), $defaults);

$month = get_field($config['month_field'], $post_id);
$size = $config['size_field'] ? get_field($config['size_field'], $post_id) : null;
$pages = $config['pages_field'] ? get_field($config['pages_field'], $post_id) : null;
$price = $config['price_field'] ? get_field($config['price_field'], $post_id) : null;
$subscription = $config['subscription_field'] ? get_field($config['subscription_field'], $post_id) : null;
$thumbnail_id = get_post_thumbnail_id($post_id);
$title = get_the_title($post_id);
$heading = trim((nbk_acf_value_present($month) ? $config['publication_label'] . wp_strip_all_tags((string) $month) : '') . (nbk_acf_value_present($month) && $title !== '' ? ' ' : '') . $title);
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

    <?php if (!empty($config['order_url'])) : ?>
        <div class="block-editor_wrap publication_budo-order">
            <div class="wp-block-buttons cta">
                <div class="wp-block-button">
                    <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($config['order_url']); ?>">ご注文</a>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>
