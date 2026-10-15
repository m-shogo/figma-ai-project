<?php
$partner_post_id = get_queried_object_id();
$show_partners = true;
if (function_exists('get_field')) {
    $partner_select = get_field('top_partner_select', $partner_post_id);
    if ($partner_select !== null && $partner_select !== '') {
        $show_partners = $partner_select === true || $partner_select === 1 || $partner_select === '1';
    }
}

$partner_rows = function_exists('get_field') ? get_field('top_partner-01', $partner_post_id) : array();
$partner_items = array();
if (is_array($partner_rows)) {
    foreach ($partner_rows as $row) {
        if (!is_array($row)) {
            continue;
        }
        $logo_id = isset($row['logo']) ? (int) $row['logo'] : 0;
        $logo = $logo_id ? wp_get_attachment_image_src($logo_id, 'full') : null;
        $name = isset($row['name']) ? trim((string) $row['name']) : '';
        $src = !empty($logo[0]) ? $logo[0] : '';
        if ($name === '' || $src === '') {
            continue;
        }
        $partner_items[] = array(
            'name' => $name,
            'src' => $src,
            'url' => isset($row['url']) ? trim(str_replace(array("\r", "\n"), '', (string) $row['url'])) : '',
        );
    }
}

$partner_items = apply_filters('nipponbudokan_top_partner_items', $partner_items);
if (!$show_partners || $partner_items === array()) {
    return;
}
$partner_archive_url = apply_filters('nipponbudokan_top_partner_url', '');
?>
<section id="top_partner-01" class="top_partner-01" aria-labelledby="top_partner_title">
    <div class="global_inner">
        <div class="tp_layout">
            <div class="tp_intro">
                <div class="tp_heading">
                    <h2 id="top_partner_title" class="tp_title">公式パートナー</h2>
                    <p class="tp_title_en"><span class="tp_title_en_initial">O</span><span>fficial partner</span></p>
                </div>
                <p class="tp_lead">日本武道館の活動を支える<br class="tp_lead_pc">企業や団体</p>
                <?php if ($partner_archive_url): ?>
                    <a class="tp_more tp_more_pc" href="<?php echo esc_url($partner_archive_url); ?>">
                        <span class="tp_more_icon" aria-hidden="true"></span>
                        <span>公式パートナー一覧</span>
                    </a>
                <?php else: ?>
                    <span class="tp_more tp_more_pc" aria-disabled="true">
                        <span class="tp_more_icon" aria-hidden="true"></span>
                        <span>公式パートナー一覧</span>
                    </span>
                <?php endif; ?>
            </div>

            <ul class="tp_list" aria-label="公式パートナー">
                <?php foreach ($partner_items as $partner): ?>
                    <?php
                    $name = isset($partner['name']) ? trim((string) $partner['name']) : '';
                    $src = isset($partner['src']) ? (string) $partner['src'] : '';
                    $url = isset($partner['url']) ? trim(str_replace(array("\r", "\n"), '', (string) $partner['url'])) : '';
                    if ($name === '' || $src === '') {
                        continue;
                    }
                    ?>
                    <li class="tp_item">
                        <?php if ($url !== ''): ?>
                            <a href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener noreferrer">
                        <?php endif; ?>
                        <img class="tp_logo" src="<?php echo esc_url($src); ?>" alt="" width="40" height="40" loading="lazy">
                        <span class="tp_name"><?php echo esc_html($name); ?></span>
                        <?php if ($url !== ''): ?>
                            </a>
                        <?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>

            <?php if ($partner_archive_url): ?>
                <a class="tp_more tp_more_sp" href="<?php echo esc_url($partner_archive_url); ?>">
                    <span class="tp_more_icon" aria-hidden="true"></span>
                    <span>公式パートナー一覧</span>
                </a>
            <?php else: ?>
                <span class="tp_more tp_more_sp" aria-disabled="true">
                    <span class="tp_more_icon" aria-hidden="true"></span>
                    <span>公式パートナー一覧</span>
                </span>
            <?php endif; ?>
        </div>
    </div>
</section>
