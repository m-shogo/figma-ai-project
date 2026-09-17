<?php
/**
 * 月刊「武道」詳細。CPT single と最新号固定ページで共有。
 *
 * Parts 流用: h2 / h4 / p / ul.wp-block-list / CTA ボタン / 本文見出し・リスト
 * Parts に無い: 表紙下ラベル、おすすめカード、関連5冊の並び
 *
 * Figma 1637:11288。キャッチ等の固定文は現行 Theme content-budobook.php と同じ PHP 直書き。
 */
get_template_part('template-parts/publications/_budo-helpers');

$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$heading = nbk_budo_issue_heading($post_id);
$title = get_the_title($post_id);
$thumbnail_id = get_post_thumbnail_id($post_id);
$size = get_field('budo_size', $post_id);
$pages = get_field('budo_page', $post_id);
$price = get_field('budo_price', $post_id);
$subscription = get_field('budo_teiki', $post_id);
$order_url = home_url('/publications/budo/order/');

$specs = array();
$specs[] = array('label' => '編集・発行', 'value' => '公益財団法人 日本武道館', 'html' => false, 'fixed' => true);
if (nbk_acf_value_present($size)) {
    $specs[] = array('label' => '版型', 'value' => $size, 'html' => false);
}
if (nbk_acf_value_present($pages)) {
    $specs[] = array('label' => 'ページ数', 'value' => $pages, 'html' => false);
}
if (nbk_acf_value_present($price)) {
    $specs[] = array('label' => '定価', 'value' => $price, 'html' => false);
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
?>
<div class="block-editor_wrap publication_budo">
    <div class="publication_budo-head">
    <?php if ($heading !== '') : ?>
        <h2><?php echo esc_html($heading); ?></h2>
    <?php endif; ?>

    <?php
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

    <?php if ($thumbnail_id) : ?>
        <div class="wp-block-media-text is-stacked-on-mobile is-vertically-aligned-top publication_budo-issue">
            <figure class="wp-block-media-text__media">
                <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => $cover_alt)); ?>
                <span class="publication_budo-sale">毎月28日発売</span>
            </figure>
            <div class="wp-block-media-text__content">
                <div class="publication_budo-lead">
                    <h4>心技体 人を育てる総合誌</h4>
                    <p>武道各種目の特集、武道界の最新ニュースなど、武道を中核にすえ、教育、教養、健康をテーマとした連載多数。</p>
                </div>
                <?php $spec_list($specs); ?>
            </div>
        </div>
    <?php else : ?>
        <div class="publication_budo-lead">
            <h4>心技体 人を育てる総合誌</h4>
            <p>武道各種目の特集、武道界の最新ニュースなど、武道を中核にすえ、教育、教養、健康をテーマとした連載多数。</p>
        </div>
        <?php $spec_list($specs); ?>
    <?php endif; ?>

    <div class="wp-block-buttons is-content-justification-center">
        <div class="wp-block-button is-style-outline">
            <a class="wp-block-button__link wp-element-button" href="<?php echo esc_url($order_url); ?>">ご注文</a>
        </div>
    </div>
    </div>

    <?php get_template_part('template-parts/publications/_budo-body', null, array('post_id' => $post_id)); ?>

    <?php if (nbk_acf_value_present(get_post_field('post_content', $post_id))) : ?>
        <div class="publication_budo-content">
            <?php echo apply_filters('the_content', get_post_field('post_content', $post_id)); ?>
        </div>
    <?php endif; ?>

    <?php get_template_part('template-parts/publications/_budo-related', null, array('post_id' => $post_id)); ?>
</div>
