<?php

/**
 * ローカルナビ
 * 固定ページ ACF `page_local_nav` が指すメニューを、選んだ順に出す。位置割り当ては見ない。
 */
$menu_ids = function_exists('nipponbudokan_get_page_local_nav_menu_ids')
    ? nipponbudokan_get_page_local_nav_menu_ids()
    : array();
$menus = array();
foreach ($menu_ids as $menu_id) {
    $menu = wp_get_nav_menu_object($menu_id);
    if (!$menu || !nipponbudokan_is_local_nav_menu($menu)) {
        continue;
    }
    $menus[] = (int) $menu->term_id;
}
if (!$menus) {
    return;
}
?>
<nav class="local_navigation" id="local_navigation">
    <?php foreach ($menus as $index => $menu_id) : ?>
        <?php $suffix = $index === 0 ? '' : '-' . ($index + 1); ?>
        <?php
        wp_nav_menu(array(
            'menu' => $menu_id,
            'menu_class' => 'ln_links module_menu',
            'menu_id' => 'ln_links' . $suffix,
            'container' => 'div',
            'container_class' => 'ln_container-01',
            'container_id' => 'ln_container-01' . $suffix,
            'fallback_cb' => false,
            'theme_location' => '',
            'walker' => new Custom_Sidebar_Walker_Nav_Menu(),
            'local_nav_show_all' => true,
        ));
        ?>
    <?php endforeach; ?>
</nav>
