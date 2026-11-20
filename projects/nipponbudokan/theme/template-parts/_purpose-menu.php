<?php
$groups = function_exists('nipponbudokan_purpose_menu_groups') ? nipponbudokan_purpose_menu_groups() : array();
$exclude_paths = isset($args['exclude_paths']) && is_array($args['exclude_paths']) ? $args['exclude_paths'] : array();
$theme_uri = get_template_directory_uri();
foreach ($groups as $group) :
    $icon = isset($group['icon']) ? (string) $group['icon'] : '';
    $label = isset($group['label']) ? (string) $group['label'] : '';
    $links = isset($group['links']) && is_array($group['links']) ? $group['links'] : array();
    ?>
    <div class="tm_guide_group">
        <p class="tm_guide_title"><?php if ($icon !== '') : ?><img src="<?php echo esc_url($theme_uri . '/images/top/' . $icon); ?>" alt="" width="36" height="36" loading="lazy"><?php endif; ?><span><?php echo esc_html($label); ?></span></p>
        <ul class="tm_guide_list">
            <?php foreach ($links as $link) :
                $path = isset($link['path']) ? (string) $link['path'] : '';
                if (in_array($path, $exclude_paths, true)) {
                    continue;
                }
                ?>
                <li><?php echo function_exists('nipponbudokan_purpose_menu_link_html') ? nipponbudokan_purpose_menu_link_html($link) : ''; ?></li>
            <?php endforeach; ?>
        </ul>
    </div>
<?php endforeach; ?>
