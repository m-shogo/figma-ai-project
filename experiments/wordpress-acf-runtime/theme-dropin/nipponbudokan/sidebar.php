<?php

/**
 * サイドバーナビゲーション
 */
?>
<?php if (has_nav_menu('sidebar-nav')) : ?>
<nav class="local_navigation" id="local_navigation">
    <?php
    wp_nav_menu(array(
        'menu_class' => 'ln_links module_menu',
        'menu_id' => 'ln_links',
        'container' => 'div',
        'container_class' => 'ln_container-01',
        'container_id' => 'ln_container-01',
        // 'container_aria_label' => '',
        'fallback_cb' => false,
        // 'before' => '',
        // 'after' => '',
        // 'link_before' => '',
        // 'link_after' => '',
        // 'echo' => true,
        // 'depth' => 0,
        'theme_location' => 'sidebar-nav',
        // 'item_spacing' => 'preserve'
        // 'items_wrap' => '<ul id="%1$s" class="%2$s">%3$s</ul
        'walker' => new Custom_Sidebar_Walker_Nav_Menu(),
    ));
    ?>
</nav>
<?php endif; ?>
