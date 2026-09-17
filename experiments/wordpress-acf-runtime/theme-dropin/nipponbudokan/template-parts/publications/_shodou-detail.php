<?php
/**
 * 月刊書写書道 詳細。CPT single と最新号固定ページで共有。
 * 見た目は武道 Figma 1637:11288。ACF は group_nbk_gekkan_shodou。
 */
get_template_part('template-parts/publications/_shodou-helpers');

$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$heading = nbk_shodou_issue_heading($post_id);
$title = get_the_title($post_id);
$thumbnail_id = nbk_shodou_cover_id($post_id);
$size = get_field('size', $post_id);
$price = get_field('price', $post_id);
$subscription = get_field('teiki', $post_id);
$order_url = home_url('/publications/shodo/form-shodo/');
$rensai_rows = nbk_shodou_rensai_rows($post_id);

$specs = array();
$specs[] = array('label' => '編集・発行', 'value' => '公益財団法人 日本武道館', 'html' => false);
if (nbk_acf_value_present($size)) {
    $specs[] = array('label' => '版型・ページ数', 'value' => $size, 'html' => false);
}
if (nbk_acf_value_present($price)) {
    $specs[] = array('label' => '定価', 'value' => nbk_shodou_price_label($price), 'html' => false);
}
if (nbk_acf_value_present($subscription)) {
    $specs[] = array(
        'label' => '定期購読料',
        'value' => nl2br(esc_html(wp_strip_all_tags((string) $subscription)), false),
        'html'  => true,
    );
}

$cover_alt = $thumbnail_id
    ? (get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: $title)
    : $title;

$spec_list = static function ($specs) {
    echo '<ul class="wp-block-list publication_budo-specs">';
    foreach ($specs as $spec) {
        echo '<li>';
        echo '<strong>' . esc_html($spec['label']) . '</strong>';
        echo '<span>';
        echo !empty($spec['html']) ? wp_kses_post($spec['value']) : esc_html($spec['value']);
        echo '</span>';
        echo '</li>';
    }
    echo '</ul>';
};
?>
<div class="block-editor_wrap publication_budo publication_shodou">
    <div class="publication_budo-head">
    <?php if ($heading !== '') : ?>
        <h2><?php echo esc_html($heading); ?></h2>
    <?php endif; ?>

    <?php if ($thumbnail_id) : ?>
        <div class="wp-block-media-text is-stacked-on-mobile is-vertically-aligned-top publication_budo-issue">
            <figure class="wp-block-media-text__media">
                <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => $cover_alt)); ?>
                <span class="publication_budo-sale">毎月1日発売</span>
            </figure>
            <div class="wp-block-media-text__content">
                <div class="publication_budo-lead">
                    <h4>真善美 人を育む書の総合誌</h4>
                    <p>充実した連載、幼児から一般まで　毛筆・硬筆　楷、行、草、篆、隷、仮名、漢字仮名交じりを網羅する充実した競書手本、競書特別優秀作品を写真版で紹介。</p>
                    <p><strong>文部科学省学習指導要領準拠</strong></p>
                </div>
                <?php $spec_list($specs); ?>
            </div>
        </div>
    <?php else : ?>
        <div class="publication_budo-lead">
            <h4>真善美 人を育む書の総合誌</h4>
            <p>充実した連載、幼児から一般まで　毛筆・硬筆　楷、行、草、篆、隷、仮名、漢字仮名交じりを網羅する充実した競書手本、競書特別優秀作品を写真版で紹介。</p>
            <p><strong>文部科学省学習指導要領準拠</strong></p>
        </div>
        <?php $spec_list($specs); ?>
    <?php endif; ?>

    <div class="wp-block-buttons is-content-justification-center">
        <div class="wp-block-button is-style-outline">
            <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($order_url); ?>">ご注文</a>
        </div>
    </div>
    </div>

    <?php if ($rensai_rows) : ?>
        <h3>連載</h3>
        <?php nbk_shodou_echo_pdf_links($rensai_rows); ?>
    <?php endif; ?>

    <?php if (nbk_acf_value_present(get_post_field('post_content', $post_id))) : ?>
        <div class="publication_budo-content">
            <?php echo apply_filters('the_content', get_post_field('post_content', $post_id)); ?>
        </div>
    <?php endif; ?>

    <?php get_template_part('template-parts/publications/_shodou-related', null, array('post_id' => $post_id)); ?>
</div>
