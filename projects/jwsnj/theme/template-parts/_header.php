<header id="global_header" class="global_header" itemscope itemtype="https://schema.org/WPHeader">
    <div class="gh_inner">
        <?php if (is_front_page()) : ?>
            <h1 class="gh_logo">
                <a href="<?php echo esc_url(home_url('/')); ?>">
                    <img src="<?php echo esc_url(get_template_directory_uri() . '/images/common/logo.svg'); ?>" alt="<?php echo esc_attr(get_bloginfo('name')); ?>" width="140" height="36" loading="eager" decoding="async">
                </a>
            </h1>
        <?php else: ?>
            <p class="gh_logo">
                <a href="<?php echo esc_url(home_url('/')); ?>">
                    <img src="<?php echo esc_url(get_template_directory_uri() . '/images/common/logo.svg'); ?>" alt="<?php echo esc_attr(get_bloginfo('name')); ?>" width="140" height="36" loading="eager" decoding="async">
                </a>
            </p>
        <?php endif; ?>
        <button type="button" class="gh_menu" id="gh_menu" aria-controls="global_navigation" aria-expanded="false" aria-label="メニューを開く">
            <span class="icon"></span>
            <span class="text">menu</span>
        </button>
        <nav id="global_navigation" class="global_navigation" aria-label="グローバルナビゲーション" itemscope itemtype="https://schema.org/SiteNavigationElement">
            <div class="gn_menu">
                <?php
                wp_nav_menu(array(
                    'menu_class' => 'menu gn_links-01',
                    'menu_id' => 'gn_links-01',
                    'container' => 'div',
                    'container_class' => 'gn_container-01',
                    'container_id' => 'gn_container-01',
                    'fallback_cb' => false,
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
            <div class="gn_search">
                <div class="gns_form module_search-01">
                    <form class="ms_from" role="search" method="get" action="<?php echo esc_url(home_url('/')); ?>">
                        <input class="ms_input" type="search" value="<?php echo esc_attr(get_search_query()); ?>" name="s" id="s" placeholder="キーワード" aria-label="サイト内検索">
                        <button class="ms_button" type="submit"><span>検索</span></button>
                    </form>
                </div>
                <button type="button" class="gn_close" id="gn_close"><span>閉じる</span></button>
            </div>
        </nav>
    </div>
</header>
<div class="overlay" id="overlay"></div>