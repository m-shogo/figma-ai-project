<?php
$theme_uri = get_template_directory_uri();

$partner_rows = function_exists('get_field') ? get_field('top_partner-01', get_queried_object_id()) : array();
$partner_items = array();
if (is_array($partner_rows)) {
    foreach ($partner_rows as $row) {
        if (!is_array($row)) {
            continue;
        }
        $logo_id = isset($row['logo']) ? (int) $row['logo'] : 0;
        $logo = $logo_id ? wp_get_attachment_image_src($logo_id, 'full') : null;
        $partner_items[] = array(
            'name' => isset($row['name']) ? (string) $row['name'] : '',
            'src' => !empty($logo[0]) ? $logo[0] : '',
            'url' => isset($row['url']) ? trim(str_replace(array("\r", "\n"), '', (string) $row['url'])) : '',
        );
    }
}
if ($partner_items === array()) {
    $partner_items = array(
        array('name' => '全日本柔道連盟', 'src' => $theme_uri . '/images/top/partner/partner-01.webp', 'url' => ''),
        array('name' => '全日本剣道連盟', 'src' => $theme_uri . '/images/top/partner/partner-02.webp', 'url' => ''),
        array('name' => '全日本弓道連盟', 'src' => $theme_uri . '/images/top/partner/partner-03.webp', 'url' => ''),
        array('name' => '日本相撲連盟', 'src' => $theme_uri . '/images/top/partner/partner-04.webp', 'url' => ''),
        array('name' => '全日本空手道連盟', 'src' => $theme_uri . '/images/top/partner/partner-05.webp', 'url' => ''),
        array('name' => '合気会', 'src' => $theme_uri . '/images/top/partner/partner-06.webp', 'url' => ''),
        array('name' => '少林寺拳法連盟', 'src' => $theme_uri . '/images/top/partner/partner-07.webp', 'url' => ''),
        array('name' => '全日本なぎなた', 'src' => $theme_uri . '/images/top/partner/partner-08.webp', 'url' => ''),
        array('name' => '全日本銃剣道連盟', 'src' => $theme_uri . '/images/top/partner/partner-09.webp', 'url' => ''),
        array('name' => '日本武道協議会', 'src' => $theme_uri . '/images/top/partner/partner-10.webp', 'url' => ''),
        array('name' => '日本古武道協会', 'src' => $theme_uri . '/images/top/partner/partner-11.webp', 'url' => ''),
        array('name' => '株式会社光洋商事', 'src' => $theme_uri . '/images/top/partner/partner-12.webp', 'url' => ''),
    );
}

$partner_items = apply_filters('nipponbudokan_top_partner_items', $partner_items);
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
