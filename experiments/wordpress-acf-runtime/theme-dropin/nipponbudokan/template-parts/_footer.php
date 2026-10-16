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
            <ul class="gf_sns" aria-label="公式SNS">
                <li class="gf_sns_group gf_sns_group_youtube">
                    <p class="gf_sns_label">公式Youtube</p>
                    <span class="gf_sns_icons">
                        <a class="gf_sns_link gf_sns_youtube" href="<?php echo esc_url(nipponbudokan_official_sns_url('youtube')); ?>" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><span>YouTube</span></a>
                    </span>
                </li>
                <li class="gf_sns_group gf_sns_group_editorial">
                    <p class="gf_sns_label">月刊「武道」編集部</p>
                    <span class="gf_sns_icons">
                        <a class="gf_sns_link gf_sns_instagram" href="<?php echo esc_url(nipponbudokan_official_sns_url('instagram')); ?>" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span>Instagram</span></a>
                        <a class="gf_sns_link gf_sns_x" href="<?php echo esc_url(nipponbudokan_official_sns_url('x')); ?>" target="_blank" rel="noopener noreferrer" aria-label="X"><span>X</span></a>
                    </span>
                </li>
            </ul>
        </div>
        <div class="gf_links-wrap">
            <div class="gf_menu">
                <?php
                wp_nav_menu(array(
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
        </div>
        <?php if ($show_map): ?>
        <p class="gf_map">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.338394407679!2d139.74869766164556!3d35.693289472468955!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188c6b802bf413%3A0x215b5c71c9657188!2z5pel5pys5q2m6YGT6aSo!5e0!3m2!1sja!2sjp!4v1792123463773!5m2!1sja!2sjp" width="670" height="356" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </p>
        <?php endif; ?>
    </div>
    <div class="gf_bottom">
        <p class="gf_copyright"><span>&copy;2016 NIPPON BUDOKAN,All rights reserved</span></p>
        <p id="js_gf_pageTop" class="gf_pageTop">
            <a href="#"><span>Page Top</span></a>
        </p>
    </div>
</footer>