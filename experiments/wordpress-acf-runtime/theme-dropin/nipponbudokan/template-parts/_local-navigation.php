<?php

/**
 * Full-width Local Navigation after page content (default page.php / form template only).
 * Empty when ACF `page_local_nav` is なし.
 */
if (!function_exists('nipponbudokan_get_page_local_nav_menu_id') || !nipponbudokan_get_page_local_nav_menu_id()) {
    return;
}
?>
<div class="global_inner _localNavigation">
    <?php get_sidebar(); ?>
</div>
