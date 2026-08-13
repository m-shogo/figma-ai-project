<?php $request_url = ref001_link_url('document'); $open_campus_url = ref001_link_url('open-campus'); ?>
<header class="ref-header" data-section="header">
    <div class="ref-header__inner">
        <div class="ref-header-logo" aria-label="千葉経済大学 CHIBA KEIZAI">
            <img class="ref-header-logo__mark" src="<?php ref001_e(ref001_asset_url('assets/icons/footer-logo-mark.svg')); ?>" alt="">
            <div class="ref-header-logo__type">
                <span class="ref-header-logo__jp">千葉経済大学</span>
                <span class="ref-header-logo__en">CHIBA KEIZAI</span>
            </div>
        </div>
        <nav class="ref-header__actions" aria-label="関連アクション">
            <a href="<?php ref001_e($request_url); ?>" class="ref-action ref-action--blue" data-link-status="UNRESOLVED"><?php ref001_icon('document', 'ref-action__icon'); ?><span>資料請求</span></a>
            <a href="<?php ref001_e($open_campus_url); ?>" class="ref-action ref-action--purple" data-link-status="UNRESOLVED"><?php ref001_icon('open-campus', 'ref-action__icon'); ?><span>オープンキャンパス</span></a>
        </nav>
    </div>
</header>
