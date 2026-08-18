<footer class="ref-footer" data-section="footer"<?= ref001_figma_section_attrs('footer'); ?>>
    <div class="ref-footer__inner">
        <div class="ref-footer__profile">
            <div class="ref-footer-logo">
                <img class="ref-footer-logo__image" src="<?php ref001_e(ref001_asset_url('assets/icons/university-logo-outlined.svg')); ?>" width="240" height="61" alt="千葉経済大学 CHIBA KEIZAI">
            </div>
            <div class="ref-footer__address">
                <span class="ref-footer__address--pc">〒263-0021　千葉市稲毛区轟町3-59-5<br>Tel.043-253-9111（大代表）/043-253-5524（入試広報センター）</span>
                <span class="ref-footer__address--sp">〒263-0021<br>千葉市稲毛区轟町3-59-5<br>Tel.043-253-9111（大代表）<br>/043-253-5524（入試広報センター）</span>
            </div>
        </div>
        <div>
            <div class="ref-footer__related">
                <a href="<?php ref001_e(ref001_link_url('university-official')); ?>">千葉経済大学公式サイト</a>
                <a href="<?php ref001_e(ref001_link_url('junior-college-official')); ?>">千葉経済短期大学公式サイト</a>
            </div>
            <nav class="ref-footer__sns" aria-label="公式SNS">
                <img class="ref-footer__sns-art" src="<?php ref001_e(ref001_asset_url('assets/icons/footer-sns-outline.svg')); ?>" alt="" aria-hidden="true">
                <a class="ref-footer__sns-link" href="<?php ref001_e(ref001_link_url('facebook')); ?>" aria-label="Facebook" data-link-status="UNRESOLVED"><?php ref001_icon('facebook', 'ref-footer__sns-icon'); ?></a>
                <a class="ref-footer__sns-link" href="<?php ref001_e(ref001_link_url('youtube')); ?>" aria-label="YouTube" data-link-status="UNRESOLVED"><?php ref001_icon('youtube', 'ref-footer__sns-icon'); ?></a>
                <a class="ref-footer__sns-link" href="<?php ref001_e(ref001_link_url('instagram')); ?>" aria-label="Instagram" data-link-status="UNRESOLVED"><?php ref001_icon('instagram', 'ref-footer__sns-icon'); ?></a>
                <a class="ref-footer__sns-link" href="<?php ref001_e(ref001_link_url('line')); ?>" aria-label="LINE" data-link-status="UNRESOLVED"><?php ref001_icon('line', 'ref-footer__sns-icon'); ?></a>
            </nav>
        </div>
        <div class="ref-footer__copyright">Copyright CHIBA KEIZAI UNIVERSITY, All Rights Reserved</div>
        <button type="button" class="ref-footer__pagetop" aria-label="ページ上部へ">
            <img src="<?php ref001_e(ref001_asset_url('assets/icons/footer-page-top.svg')); ?>" alt="">
        </button>
    </div>
</footer>
