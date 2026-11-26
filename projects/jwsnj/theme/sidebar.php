<?php

/**
 * サイドバーナビゲーション
 */
$sidebar_menu = wp_nav_menu(array(
    'echo' => false,
    'menu' => 'sidebar-nav',
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
if (!$sidebar_menu || !preg_match('/<li\b/i', $sidebar_menu)) {
  return;
}
?>
<nav class="local_navigation" id="local_navigation" aria-label="ローカルナビゲーション">
  <?php echo $sidebar_menu; ?>
</nav>