<footer id="global_footer" class="global_footer" itemscope itemtype="https://schema.org/WPFooter">
    <div class="gf_links-wrap">
        <nav class="gf_menu" aria-label="フッターナビゲーション">
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
        </nav>
    </div>
    <div class="gf_information">
        <div class="global_inner">
            <p class="gf_logo">
                <a href="<?php echo esc_url(home_url('/')); ?>">
                    <?php echo esc_html(get_bloginfo('name')); ?>
                </a>
            </p>
        </div>
    </div>
    <p id="js_gf_pageTop" class="gf_pageTop">
        <a href="#"><span>ページトップへ戻る</span></a>
    </p>
    <p class="gf_copyright"><span>&copy; <?php echo esc_html(wp_date('Y')); ?> <?php echo esc_html(get_bloginfo('name')); ?></span></p>
</footer>