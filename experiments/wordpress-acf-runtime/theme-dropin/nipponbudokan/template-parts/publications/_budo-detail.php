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

$budo_defaults = array(
    'month_field' => 'budo_month',
    'size_field' => 'budo_size',
    'pages_field' => 'budo_page',
    'price_field' => 'budo_price',
    'subscription_field' => 'budo_teiki',
    'publication_label' => '月刊「武道」',
    'sale_label' => '毎月28日発売',
    'lead_title' => '心技体 人を育てる総合誌',
    'lead_body' => '武道各種目の特集、武道界の最新ニュースなど、武道を中核にすえ、教育、教養、健康をテーマとした連載多数。',
    'lead_note' => '',
    'publisher' => '公益財団法人 日本武道館',
    'order_url' => home_url('/publications/budo/books/form-order/'),
    'digital_url' => '',
    'digital_label' => '',
    'back_url' => '',
    'back_label' => 'バックナンバー一覧',
    'size_label' => '版型',
    'month_format' => 'year',
    'spec_order' => 'budo',
);
$shodou_defaults = array(
    'month_field' => 'shodou_month',
    'size_field' => 'size',
    'pages_field' => '',
    'price_field' => 'price',
    'subscription_field' => 'teiki',
    'publication_label' => '月刊「書写書道」',
    'sale_label' => '毎月1日発売',
    'lead_title' => '真善美 人を育む書の総合誌',
    'lead_body' => '充実した連載、幼児から一般まで　毛筆・硬筆　楷、行、草、篆、隷、仮名、漢字仮名交じりを網羅する充実した競書手本、競書特別 優秀作品を写真版で紹介。',
    'lead_note' => '文部科学省学習指導要領準拠',
    'publisher' => '公益財団法人 日本武道館',
    'order_url' => '',
    'digital_url' => home_url('/publications/shodo/digital/'),
    'digital_label' => '月刊「書写書道」電子版・<br>会員Webサイトのご案内',
    'back_url' => home_url('/publications/shodo/back/'),
    'back_label' => 'バックナンバー一覧',
    'size_label' => 'ページ数',
    'month_format' => 'month',
    'spec_order' => 'shodou',
);
$defaults = get_post_type($post_id) === 'shodou-book' ? $shodou_defaults : $budo_defaults;
$config = wp_parse_args(isset($args['config']) && is_array($args['config']) ? $args['config'] : array(), $defaults);

$month = get_field($config['month_field'], $post_id);
$size = $config['size_field'] ? get_field($config['size_field'], $post_id) : null;
$pages = $config['pages_field'] ? get_field($config['pages_field'], $post_id) : null;
$price = $config['price_field'] ? get_field($config['price_field'], $post_id) : null;
$subscription = $config['subscription_field'] ? get_field($config['subscription_field'], $post_id) : null;
$thumbnail_id = get_post_thumbnail_id($post_id);
$title = get_the_title($post_id);
$month_text = nbk_acf_value_present($month) ? wp_strip_all_tags((string) $month) : '';
if ($month_text !== '' && preg_match('/^\d{1,2}$/', $month_text)) {
    if (($config['month_format'] ?? 'year') === 'month') {
        $month_text = (int) $month_text . '月号';
    } else {
        $issue_year = (int) get_post_time('Y', false, $post_id);
        $month_text = ($issue_year > 1970 ? $issue_year . '年' : '') . (int) $month_text . '月号';
    }
}
$heading = $month_text !== '' ? $config['publication_label'] . $month_text : $title;

$specs = array();
if (($config['spec_order'] ?? 'budo') === 'shodou') {
    if (nbk_acf_value_present($size)) {
        $specs[] = array('label' => $config['size_label'], 'value' => $size);
    }
    if (nbk_acf_value_present($config['publisher'])) {
        $specs[] = array('label' => '編集・発行', 'value' => $config['publisher']);
    }
    if (nbk_acf_value_present($price)) {
        $specs[] = array('label' => '定価', 'value' => $price);
    }
} else {
    if (nbk_acf_value_present($config['publisher'])) {
        $specs[] = array('label' => '編集・発行', 'value' => $config['publisher']);
    }
    if (nbk_acf_value_present($size)) {
        $specs[] = array('label' => $config['size_label'], 'value' => $size);
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
}
?>
<div class="block-editor_wrap publication_budo-head">
    <?php if ($heading !== '') : ?>
        <h2 class="wp-block-heading publication_budo-title"><?php echo esc_html($heading); ?></h2>
    <?php endif; ?>

    <div class="publication_budo-summary<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
        <?php if ($thumbnail_id || nbk_acf_value_present($config['sale_label'])) : ?>
            <div class="publication_budo-coverCol">
                <?php if ($thumbnail_id) : ?>
                    <figure class="publication_budo-cover">
                        <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: $title)); ?>
                    </figure>
                <?php endif; ?>
                <?php if (nbk_acf_value_present($config['sale_label'])) : ?>
                    <p class="publication_budo-sale"><?php echo esc_html($config['sale_label']); ?></p>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <?php if (nbk_acf_value_present($config['lead_title']) || nbk_acf_value_present($config['lead_body']) || nbk_acf_value_present($config['lead_note']) || !empty($specs)) : ?>
            <div class="publication_budo-summaryMain">
                <?php if (nbk_acf_value_present($config['lead_title']) || nbk_acf_value_present($config['lead_body'])) : ?>
                    <div class="publication_budo-lead">
                        <?php if (nbk_acf_value_present($config['lead_title'])) : ?>
                            <h4 class="wp-block-heading"><?php echo esc_html($config['lead_title']); ?></h4>
                        <?php endif; ?>
                        <?php if (nbk_acf_value_present($config['lead_body'])) : ?>
                            <p class="wp-block-paragraph"><?php echo esc_html($config['lead_body']); ?></p>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                <?php if (nbk_acf_value_present($config['lead_note']) || !empty($specs)) : ?>
                    <div class="publication_budo-meta">
                        <?php if (nbk_acf_value_present($config['lead_note'])) : ?>
                            <p class="publication_budo-leadNote"><?php echo esc_html($config['lead_note']); ?></p>
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
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

    <?php
    $order_buttons = array();
    if (nbk_acf_value_present($config['order_url'])) {
        $order_buttons[] = array('url' => $config['order_url'], 'label' => 'ご注文', 'cta' => true);
    }
    if (nbk_acf_value_present($config['digital_url'])) {
        $order_buttons[] = array(
            'url' => $config['digital_url'],
            'label' => $config['digital_label'],
            'html' => true,
        );
    }
    if (nbk_acf_value_present($config['back_url'])) {
        $order_buttons[] = array(
            'url' => $config['back_url'],
            'label' => $config['back_label'],
        );
    }
    $order_is_cta = false;
    foreach ($order_buttons as $order_button) {
        if (!empty($order_button['cta'])) {
            $order_is_cta = true;
        }
    }
    ?>
    <?php if ($order_buttons) : ?>
        <div class="block-editor_wrap publication_budo-order<?php echo ($config['spec_order'] ?? '') === 'shodou' ? ' publication_shodou-actions' : ''; ?>">
            <div class="wp-block-buttons<?php echo $order_is_cta ? ' cta' : ''; ?>">
                <?php foreach ($order_buttons as $order_button) : ?>
                    <div class="wp-block-button">
                        <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($order_button['url']); ?>"><?php echo !empty($order_button['html']) ? wp_kses($order_button['label'], array('br' => array())) : esc_html($order_button['label']); ?></a>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endif; ?>
</div>
