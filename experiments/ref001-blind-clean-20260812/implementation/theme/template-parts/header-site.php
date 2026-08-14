<?php $request_url = ref001_link_url('document'); $open_campus_url = ref001_link_url('open-campus'); ?>
<header class="ref-header" data-section="header">
    <div class="ref-header__inner">
        <div class="ref-header-logo">
            <img class="ref-header-logo__image" src="<?php ref001_e(ref001_asset_url('assets/icons/university-logo-outlined.svg')); ?>" alt="千葉経済大学 CHIBA KEIZAI">
        </div>
        <nav class="ref-header__actions" aria-label="関連アクション">
            <a href="<?php ref001_e($request_url); ?>" class="ref-action ref-action--blue" data-link-status="UNRESOLVED"><?php ref001_icon('document', 'ref-action__icon'); ?><span>資料請求</span></a>
            <a href="<?php ref001_e($open_campus_url); ?>" class="ref-action ref-action--purple" data-link-status="UNRESOLVED"><?php ref001_icon('open-campus', 'ref-action__icon'); ?><span>オープンキャンパス</span></a>
        </nav>
    </div>
</header>
