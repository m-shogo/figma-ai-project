<?php
/**
 * 号詳細の ACF 本文。空欄は出さない。
 *
 * Figma の「今月のおすすめ」は ACF `budo_pickup`（注目記事）、
 * 「今月のピックアップ」は ACF `monthpickup`（カード）。ラベル名と画面見出しが逆なので Figma に合わせる。
 */
$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$pickup = get_field('budo_pickup', $post_id);
$recommends = get_field('monthpickup', $post_id);

$text_sections = array(
    'budo_speacial'     => '今月の特集・企画',
    'budo_new'          => '新連載',
    'budo_rensai'       => '好評連載中',
    'budo_contribution' => '特別寄稿',
    'budo_zuihitsu'     => '随筆',
    'budo_calender'     => '武道カレンダー',
    'budo_dantai'       => '少年少女武道優良団体',
    'budo_tainin'       => '退任のご挨拶',
    'budo_news'         => '今月のニュース',
    'budo_report'       => '特別レポート',
    'budo_mokuji'       => '月刊「武道」総目次',
);
?>
<?php if (nbk_acf_value_present($pickup)) : ?>
    <h3>今月のおすすめ</h3>
    <?php foreach ($pickup as $row) : ?>
        <?php
        $row_title = isset($row['budo_pickup_ttl']) ? $row['budo_pickup_ttl'] : '';
        $row_text = isset($row['budo_pickup_txt']) ? $row['budo_pickup_txt'] : '';
        $row_img = nbk_budo_field_image_url(isset($row['budo_pickup_img']) ? $row['budo_pickup_img'] : '');
        if (!nbk_acf_value_present($row_title) && !nbk_acf_value_present($row_text) && $row_img === '') {
            continue;
        }
        ?>
        <?php if (nbk_acf_value_present($row_title)) : ?>
            <h4><?php echo esc_html(wp_strip_all_tags((string) $row_title)); ?></h4>
        <?php endif; ?>
        <?php if (nbk_acf_value_present($row_text)) : ?>
            <p><?php echo wp_kses_post($row_text); ?></p>
        <?php endif; ?>
        <?php if ($row_img !== '') : ?>
            <figure class="wp-block-image publication_budo-featureImage">
                <img src="<?php echo esc_url($row_img); ?>" alt="<?php echo esc_attr(nbk_acf_value_present($row_title) ? wp_strip_all_tags((string) $row_title) : ''); ?>">
            </figure>
        <?php endif; ?>
    <?php endforeach; ?>
<?php endif; ?>

<?php if (nbk_acf_value_present($recommends)) : ?>
    <h3>今月のピックアップ</h3>
    <div class="publication_budo-pickups">
        <?php foreach ($recommends as $row) : ?>
            <?php
            $card_title = isset($row['pickuptitle']) ? $row['pickuptitle'] : '';
            $card_desc = isset($row['pickupdesc']) ? $row['pickupdesc'] : '';
            $card_img = nbk_budo_field_image_url(isset($row['pickupImg']) ? $row['pickupImg'] : '');
            if (!nbk_acf_value_present($card_title) && !nbk_acf_value_present($card_desc) && $card_img === '') {
                continue;
            }
            ?>
            <article class="publication_budo-pickup">
                <?php if ($card_img !== '') : ?>
                    <figure class="publication_budo-pickupMedia">
                        <img src="<?php echo esc_url($card_img); ?>" alt="<?php echo esc_attr(nbk_acf_value_present($card_title) ? wp_strip_all_tags((string) $card_title) : ''); ?>">
                    </figure>
                <?php endif; ?>
                <div class="publication_budo-pickupBody">
                    <?php if (nbk_acf_value_present($card_title)) : ?>
                        <p class="publication_budo-pickupTitle"><?php echo wp_kses_post($card_title); ?></p>
                    <?php endif; ?>
                    <?php if (nbk_acf_value_present($card_desc)) : ?>
                        <p class="publication_budo-pickupDesc"><?php echo wp_kses_post($card_desc); ?></p>
                    <?php endif; ?>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
<?php endif; ?>

<?php foreach ($text_sections as $field => $label) : ?>
    <?php $value = get_field($field, $post_id); ?>
    <?php if (!nbk_acf_value_present($value)) : ?>
        <?php continue; ?>
    <?php endif; ?>
    <h3><?php echo esc_html($label); ?></h3>
    <div class="publication_budo-sectionBody">
        <?php nbk_budo_echo_rich_field($value); ?>
    </div>
<?php endforeach; ?>
