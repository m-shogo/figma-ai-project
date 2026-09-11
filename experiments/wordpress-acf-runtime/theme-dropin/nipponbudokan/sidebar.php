<?php

/**
 * ローカルナビ
 * 固定ページ ACF `page_local_nav` が指すメニューだけ出す。位置割り当ては見ない。
 */
$menu_id = function_exists('nipponbudokan_get_page_local_nav_menu_id')
    ? nipponbudokan_get_page_local_nav_menu_id()
    : 0;
if ($menu_id < 1) {
    return;
}
$menu = wp_get_nav_menu_object($menu_id);
if (!$menu || !nipponbudokan_is_local_nav_menu($menu)) {
    return;
}
?>
<nav class="local_navigation" id="local_navigation">
    <?php
    wp_nav_menu(array(
        'menu' => (int) $menu_id,
        'menu_class' => 'ln_links module_menu',
        'menu_id' => 'ln_links',
        'container' => 'div',
        'container_class' => 'ln_container-01',
        'container_id' => 'ln_container-01',
        'fallback_cb' => false,
        'theme_location' => '',
        'walker' => new Custom_Sidebar_Walker_Nav_Menu(),
        'local_nav_show_all' => true,
    ));
    ?>
</nav>
