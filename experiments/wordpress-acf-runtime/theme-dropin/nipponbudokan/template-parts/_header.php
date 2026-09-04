<header id="global_header" class="global_header" itemscope itemtype="https://schema.org/WPHeader">
    <div class="gh_inner">
        <?php
        $theme_uri = get_template_directory_uri();
        $logo_tag = is_front_page() ? 'h1' : 'p';
        ?>
        <<?php echo $logo_tag; ?> class="gh_logo">
            <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="<?php echo esc_attr(get_bloginfo('name')); ?>">
                <img class="gh_logo_mark" src="<?php echo esc_url($theme_uri . '/images/common/logo-mark.svg'); ?>" alt="" width="41" height="40" decoding="async">
                <picture class="gh_logo_name">
                    <source media="(min-width: 768px)" srcset="<?php echo esc_url($theme_uri . '/images/common/logo-wordmark.svg'); ?>" width="152" height="36">
                    <img src="<?php echo esc_url($theme_uri . '/images/common/logo-wordmark-sp-inverse.svg'); ?>" alt="" width="106" height="25" decoding="async">
                </picture>
            </a>
        </<?php echo $logo_tag; ?>>

        <div class="gn_mega">
            <?php
            wp_nav_menu(array(
                'menu_class' => 'menu gn_links-01',
                'menu_id' => 'gn_links-mega',
                'container' => 'div',
                'container_class' => 'gn_container-01',
                'container_id' => 'gn_container-mega',
                'fallback_cb' => 'nipponbudokan_global_nav_fallback',
                'theme_location' => 'mega-nav',
                'walker' => new Custom_Global_Walker_Nav_Menu(),
            ));
            ?>
        </div>
        <nav id="global_navigation" class="global_navigation" itemscope itemtype="https://schema.org/SiteNavigationElement">
            <div class="gn_menu">
                <?php
                wp_nav_menu(array(
                    'menu_class' => 'menu gn_links-01',
                    'menu_id' => 'gn_links-01',
                    'container' => 'div',
                    'container_class' => 'gn_container-01',
                    'container_id' => 'gn_container-01',
                    'fallback_cb' => 'nipponbudokan_hamburger_nav_fallback',
                    'theme_location' => 'global-nav',
                    'walker' => new Custom_Global_Walker_Nav_Menu(),
                ));
                ?>
            </div>
            <div class="gn_subMenu">
                <?php
                wp_nav_menu(array(
                    'menu_class' => 'menu gn_links-02',
                    'menu_id' => 'gn_links-02',
                    'container' => 'div',
                    'container_class' => 'gn_container-02',
                    'container_id' => 'gn_container-02',
                    'fallback_cb' => false,
                    'theme_location' => 'sub-nav',
                    'walker' => new Custom_Header_Sub_Walker_Nav_Menu(),
                ));
                ?>
            </div>
            <ul class="gn_sns" aria-label="公式SNS">
                <li class="gn_sns_item">
                    <span class="gn_sns_link gn_sns_youtube" aria-disabled="true" aria-label="YouTube"><span>YouTube</span></span>
                </li>
                <li class="gn_sns_item">
                    <span class="gn_sns_link gn_sns_instagram" aria-disabled="true" aria-label="Instagram"><span>Instagram</span></span>
                </li>
                <li class="gn_sns_item">
                    <span class="gn_sns_link gn_sns_x" aria-disabled="true" aria-label="X"><span>X</span></span>
                </li>
            </ul>
            <a class="gn_lang" href="<?php echo esc_url(home_url('/en/')); ?>"><span>EN</span></a>
            <div class="gn_search">
                <div class="gns_form module_search-01">
                    <form class="ms_from" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
                        <input class="ms_input" type="search" value="" name="s" id="s" placeholder="キーワード">
                        <button class="ms_button" type="submit"><span>検索</span></button>
                    </form>
                </div>
                <button type="button" class="gn_close" id="gn_close"><span>閉じる</span></button>
            </div>
        </nav>

        <div class="gh_buttons">
            <a class="gh_lang" href="<?php echo esc_url(home_url('/en/')); ?>"><span>EN</span></a>
            <button type="button" class="gh_search" id="gh_search" aria-label="検索">
                <span class="icon" aria-hidden="true"></span>
            </button>
            <button type="button" class="gh_menu" id="gh_menu" aria-label="メニュー" aria-controls="global_navigation" aria-expanded="false">
                <span class="icon" aria-hidden="true"></span>
                <span class="text">menu</span>
            </button>
        </div>
    </div>
</header>
<div class="overlay" id="overlay"></div>
