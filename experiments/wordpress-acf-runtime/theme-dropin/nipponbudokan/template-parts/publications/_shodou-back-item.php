<?php
/**
 * 月刊「書写書道」バックナンバー1件。
 *
 * 表紙はリンクなし。出すのは連載PDFだけ。ご注文と詳細ボタンは出さない。
 */
get_template_part('template-parts/publications/_budo-helpers');

$post_id = isset($args['post_id']) ? (int) $args['post_id'] : get_the_ID();
if (!$post_id) {
    return;
}

$month = get_field('shodou_month', $post_id);
$thumbnail_id = get_post_thumbnail_id($post_id);
$title = get_the_title($post_id);
$heading = nbk_publication_month_heading($post_id, $month, '月刊「書写書道」');
$rensai_list = get_field('rensailist', $post_id);
$valid_rensai = array();

if (is_array($rensai_list)) {
    foreach ($rensai_list as $row) {
        if (!is_array($row)) {
            continue;
        }
        $name = isset($row['rensainame']) ? (string) $row['rensainame'] : '';
        $label = trim((string) preg_replace('/\s+/u', ' ', html_entity_decode(wp_strip_all_tags($name), ENT_QUOTES, 'UTF-8')));
        $pdf = isset($row['rensaipdf']) ? $row['rensaipdf'] : '';
        $pdf_url = '';
        if (is_array($pdf)) {
            $pdf_url = isset($pdf['url']) ? (string) $pdf['url'] : '';
            if ($pdf_url === '' && !empty($pdf['ID'])) {
                $pdf_url = (string) wp_get_attachment_url((int) $pdf['ID']);
            }
        } elseif (is_numeric($pdf)) {
            $pdf_url = (string) wp_get_attachment_url((int) $pdf);
        } elseif (is_string($pdf)) {
            $pdf_url = $pdf;
        }
        if ($label === '' && $pdf_url === '') {
            continue;
        }
        $valid_rensai[] = array(
            'pdf' => $pdf_url,
            'name' => $label !== '' ? $label : 'PDF',
        );
    }
}
?>
<article class="publication_budo-backItem<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
    <?php if ($heading !== '') : ?>
        <header class="publication_budo-backHeader">
            <h2 class="publication_budo-backTitle"><?php echo esc_html($heading); ?></h2>
        </header>
    <?php endif; ?>

    <div class="publication_budo-backBody<?php echo !$thumbnail_id ? ' _noImage' : ''; ?>">
        <?php if ($thumbnail_id) : ?>
            <figure class="publication_budo-backCover">
                <?php echo wp_get_attachment_image($thumbnail_id, 'full', false, array('alt' => get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: $title)); ?>
            </figure>
        <?php endif; ?>

        <div class="publication_budo-backCopy publication_shodou-backCopy">
            <?php if (!empty($valid_rensai)) : ?>
                <ul class="publication_shodou-rensaiList">
                    <?php foreach ($valid_rensai as $row) : ?>
                        <li>
                            <?php if ($row['pdf'] !== '') : ?>
                                <a href="<?php echo esc_url($row['pdf']); ?>"><?php echo esc_html($row['name']); ?></a>
                            <?php else : ?>
                                <span><?php echo esc_html($row['name']); ?></span>
                            <?php endif; ?>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
            <p class="publication_shodou-backNote">その他競書手本・連載他満載</p>
        </div>
    </div>
</article>
