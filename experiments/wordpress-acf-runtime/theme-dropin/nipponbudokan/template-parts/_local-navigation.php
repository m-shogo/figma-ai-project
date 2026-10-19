<?php

/**
 * Full-width Local Navigation after the body and before the breadcrumb.
 * Fixed pages use ACF `page_local_nav`. Publication details use the menu
 * whose edit screen selects that post type. Empty when neither is set.
 */
if (!function_exists('nipponbudokan_get_rendered_local_nav_menu_id') || !nipponbudokan_get_rendered_local_nav_menu_id()) {
    return;
}
?>
<div class="global_inner _localNavigation">
    <?php get_sidebar(); ?>
</div>
