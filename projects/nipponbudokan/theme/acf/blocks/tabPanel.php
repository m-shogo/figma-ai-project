<?php
$panel_title = get_field('panel_title') ?: '';
$panel_id = 'tab-' . uniqid(); // 万一JSでID未設定の場合の保険
?>

<?php if (is_admin()) : ?>
    <div style="background:#1e1e1e;color:#fff;padding:6px 12px 5px;font-size:13px;font-weight:bold;border-radius:4px 4px 0 0;display:inline-block;">
        <?php echo $panel_title ? 'タブ：<span style="color:#000;padding:2px 4px;background:#fff;">' . esc_html($panel_title) . '</span>（サイドバーから編集してください）' : '※ タブラベル未設定（サイドバーから入力してください）'; ?>
    </div>
<?php endif; ?>

<div class="tab-panel" data-title="<?php echo esc_attr($panel_title); ?>" id="<?php echo esc_attr($panel_id); ?>" <?php if (is_admin()): ?>style="border: 2px solid #000;padding: 20px;margin-bottom:20px;" <?php endif; ?>>
    <InnerBlocks />
</div>