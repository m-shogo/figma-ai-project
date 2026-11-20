<footer id="global_footer" class="global_footer" itemscope itemtype="https://schema.org/WPFooter">
    <div class="gf_links-wrap">
        <div class="gf_menu">
            <?php
            wp_nav_menu(array(
                'menu' => 'footer-nav',
                'menu_class' => 'menu gf_links-01',
                'menu_id' => 'gf_links-01',
                'container' => 'div',
                'container_class' => 'gf_container-01',
                'container_id' => 'gf_container-01',
                // 'container_aria_label' => '',
                'fallback_cb' => false,
                // 'before' => '',
                // 'after' => '',
                // 'link_before' => '',
                // 'link_after' => '',
                // 'echo' => true,
                // 'depth' => 0,
                'theme_location' => 'footer-nav',
                // 'item_spacing' => 'preserve'
                // 'items_wrap' => '<ul id="%1$s" class="%2$s">%3$s</ul
                'walker' => new Custom_Footer_Walker_Nav_Menu(),
            ));
            ?>
        </div>
        <div class="gf_subMenu">
            <?php
            wp_nav_menu(array(
                'menu' => 'footer-nav',
                'menu_class' => 'menu gf_links-02',
                'menu_id' => 'gf_links-02',
                'container' => 'div',
                'container_class' => 'gf_container-02',
                'container_id' => 'gf_container-02',
                // 'container_aria_label' => '',
                'fallback_cb' => false,
                // 'before' => '',
                // 'after' => '',
                // 'link_before' => '',
                // 'link_after' => '',
                // 'echo' => true,
                // 'depth' => 0,
                'theme_location' => 'sub-nav',
                // 'items_wrap' => '<ul id="%1$s" class="%2$s">%3$s</ul>',
                // 'item_spacing' => 'preserve'
                'walker' => new Custom_Footer_Sub_Walker_Nav_Menu(),
            ));
            ?>
        </div>
    </div>
    <div class="gf_information">
        <div class="global_inner">
            <p class="gf_logo">
                <a href="<?php echo esc_url(home_url('/')); ?>">
                    <img src="<?php echo get_template_directory_uri(); ?>/images/common/logo.svg" alt="<?php bloginfo('name'); ?>" width="140" height="36" loading="lazy">
                </a>
            </p>
            <address>
                <p class="gf_address">〒000-0000<br>東京都テスト区テスト町1-1-1</p>
                <p class="gf_tel">TEL:<a href="tel:00-0000-0000">00-0000-0000</a></p>
            </address>
        </div>
    </div>
    <p id="js_gf_pageTop" class="gf_pageTop">
        <a href="#"><span>ページトップへ戻る</span></a>
    </p>
    <p class="gf_copyright"><span>&copy; 2025 Codia Corporation.</span></p>
</footer>