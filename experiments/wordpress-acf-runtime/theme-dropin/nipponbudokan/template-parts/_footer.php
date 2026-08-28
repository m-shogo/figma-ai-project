<footer id="global_footer" class="global_footer" itemscope itemtype="https://schema.org/WPFooter">
    <div class="gf_body">
        <div class="gf_information">
            <p class="gf_logo">
                <a href="<?php echo esc_url(home_url('/')); ?>">
                    <img src="<?php echo get_template_directory_uri(); ?>/images/common/logo.svg" alt="<?php bloginfo('name'); ?>" width="260" height="50" loading="lazy">
                </a>
            </p>
            <address>
                <p class="gf_address">〒102-8321 東京都千代田区北の丸公園2番3号</p>
                <p class="gf_access">
                    <a href="<?php echo esc_url(home_url('/access/')); ?>"><span>アクセスについて</span></a>
                </p>
            </address>
            <ul class="gf_sns">
                <li class="gf_sns_item">
                    <a class="gf_sns_link gf_sns_youtube" href="#" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><span>YouTube</span></a>
                </li>
                <li class="gf_sns_item">
                    <a class="gf_sns_link gf_sns_instagram" href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span>Instagram</span></a>
                </li>
                <li class="gf_sns_item">
                    <a class="gf_sns_link gf_sns_x" href="#" target="_blank" rel="noopener noreferrer" aria-label="X"><span>X</span></a>
                </li>
            </ul>
        </div>
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
                    'fallback_cb' => false,
                    'theme_location' => 'footer-nav',
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
                    'fallback_cb' => false,
                    'theme_location' => 'sub-nav',
                    'walker' => new Custom_Footer_Sub_Walker_Nav_Menu(),
                ));
                ?>
            </div>
        </div>
    </div>
    <div class="gf_bottom">
        <p class="gf_copyright"><span>&copy;2016 NIPPON BUDOKAN,All rights reserved</span></p>
        <p id="js_gf_pageTop" class="gf_pageTop">
            <a href="#"><span>Page Top</span></a>
        </p>
    </div>
</footer>
