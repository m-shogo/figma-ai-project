<?php
$show_map = !empty(($args ?? array())['map']);
?>
<footer id="global_footer" class="global_footer<?php echo $show_map ? ' _hasMap' : ''; ?>" itemscope itemtype="https://schema.org/WPFooter">
    <?php $theme_uri = get_template_directory_uri(); ?>
    <div class="gf_body">
        <div class="gf_information">
            <p class="gf_logo">
                <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="<?php echo esc_attr(get_bloginfo('name')); ?>">
                    <img class="gf_logo_mark" src="<?php echo esc_url($theme_uri . '/images/common/logo-mark.svg'); ?>" alt="" width="52" height="50" decoding="async" loading="lazy">
                <picture class="gf_logo_name">
                    <source media="(min-width: 768px)" srcset="<?php echo esc_url($theme_uri . '/images/common/logo-wordmark-dark.svg'); ?>" width="192" height="45">
                    <img src="<?php echo esc_url($theme_uri . '/images/common/logo-wordmark-dark.svg'); ?>" alt="" width="148" height="35" decoding="async" loading="lazy">
                    </picture>
                </a>
            </p>
            <address>
                <p class="gf_address">〒102-8321 東京都千代田区北の丸公園2番3号</p>
                <p class="gf_access">
                    <a href="<?php echo esc_url(home_url('/access/')); ?>">
                        <img class="gf_access_icon" src="<?php echo esc_url($theme_uri . '/images/common/icon-access.svg'); ?>" alt="" width="18" height="16" decoding="async" loading="lazy">
                        <span>アクセスについて</span>
                    </a>
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
                    'fallback_cb' => 'nipponbudokan_footer_nav_fallback',
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
                    'fallback_cb' => 'nipponbudokan_footer_sub_nav_fallback',
                    'theme_location' => 'sub-nav',
                    'walker' => new Custom_Footer_Sub_Walker_Nav_Menu(),
                ));
                ?>
            </div>
        </div>
        <?php if ($show_map): ?>
        <p class="gf_map">
            <img src="<?php echo esc_url($theme_uri . '/images/common/footer-map.png'); ?>" alt="日本武道館周辺の地図" width="670" height="356" decoding="async" loading="lazy">
        </p>
        <?php endif; ?>
    </div>
    <div class="gf_bottom">
        <p class="gf_copyright"><span>&copy;2016 NIPPON BUDOKAN,All rights reserved</span></p>
        <p id="js_gf_pageTop" class="gf_pageTop">
            <a href="#"><span>Page Top</span></a>
        </p>
    </div>
    <?php if (!is_front_page()): ?>
        <nav class="gf_sticky" aria-label="ショートカット">
            <a class="gf_sticky_contact" href="<?php echo esc_url(home_url('/contact/')); ?>"><span>お問い合わせ</span></a>
            <a class="gf_sticky_access" href="<?php echo esc_url(home_url('/access/')); ?>"><span>アクセス</span></a>
        </nav>
    <?php endif; ?>
</footer>
