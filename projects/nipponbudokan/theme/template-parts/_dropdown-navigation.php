<?php if (has_nav_menu('dropdown-nav')) : ?>
<div class="global_inner">
    <div class="gc_dropdown">
        <?php
        wp_nav_menu(array(
            'menu_class' => 'module_dropdown',
            'menu_id' => 'module_dropdown',
            'container' => 'div',
            'container_class' => 'mdd_container-01',
            'container_id' => 'mdd_container-01',
            // 'container_aria_label' => '',
            'fallback_cb' => false,
            // 'before' => '',
            // 'after' => '',
            // 'link_before' => '',
            // 'link_after' => '',
            // 'echo' => true,
            // 'depth' => 0,
            'theme_location' => 'dropdown-nav',
            // 'item_spacing' => 'preserve'
            // 'items_wrap' => '<ul id="%1$s" class="%2$s">%3$s</ul
            'walker' => new Custom_Dropdown_Walker_Nav_Menu(),
        ));
        ?>
    </div>
</div>
<?php endif; ?>
