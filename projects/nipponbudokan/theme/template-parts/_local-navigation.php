<?php

/**
 * Full-width Local Navigation after page content (default page.php / form template only).
 * Empty when ACF `page_local_nav` has no menu.
 */
$menu_ids = function_exists('nipponbudokan_get_page_local_nav_menu_ids')
    ? nipponbudokan_get_page_local_nav_menu_ids()
    : array();
if (!$menu_ids) {
    return;
}
?>
<div class="global_inner _localNavigation">
    <?php get_sidebar(); ?>
</div>
