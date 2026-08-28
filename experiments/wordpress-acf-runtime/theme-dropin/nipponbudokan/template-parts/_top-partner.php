<?php
$theme_uri = get_template_directory_uri();

// Figma 正本の12件を第一通のfallbackとして保持する。
// 本番の管理方法が確定するまでは、存在しないACF fieldや外部URLを推測しない。
$partner_items = array(
    array('name' => '全日本柔道連盟', 'image' => 'partner-01.png'),
    array('name' => '全日本剣道連盟', 'image' => 'partner-02.png'),
    array('name' => '全日本弓道連盟', 'image' => 'partner-03.png'),
    array('name' => '日本相撲連盟', 'image' => 'partner-04.png'),
    array('name' => '全日本空手道連盟', 'image' => 'partner-05.png'),
    array('name' => '合気会', 'image' => 'partner-06.png'),
    array('name' => '少林寺拳法連盟', 'image' => 'partner-07.png'),
    array('name' => '全日本なぎなた', 'image' => 'partner-08.png'),
    array('name' => '全日本銃剣道連盟', 'image' => 'partner-09.png'),
    array('name' => '日本武道協議会', 'image' => 'partner-10.png'),
    array('name' => '日本古武道協会', 'image' => 'partner-11.png'),
    array('name' => '株式会社光洋商事', 'image' => 'partner-12.png'),
);

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
                    $name = isset($partner['name']) ? (string) $partner['name'] : '';
                    $image = isset($partner['image']) ? basename((string) $partner['image']) : '';
                    if ($name === '' || $image === '') {
                        continue;
                    }
                    ?>
                    <li class="tp_item">
                        <img class="tp_logo" src="<?php echo esc_url($theme_uri . '/images/top/partner/' . $image); ?>" alt="" width="40" height="40" loading="lazy">
                        <span class="tp_name"><?php echo esc_html($name); ?></span>
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
