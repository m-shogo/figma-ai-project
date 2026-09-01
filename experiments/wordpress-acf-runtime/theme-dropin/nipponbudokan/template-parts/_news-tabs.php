<?php
$context = isset($args['context']) ? sanitize_key($args['context']) : 'archive';
$link_tabs = array_key_exists('link_tabs', $args ?? array()) ? (bool) $args['link_tabs'] : ($context === 'archive');
$taxonomy = isset($args['taxonomy']) ? sanitize_key($args['taxonomy']) : 'category';
$post_type = isset($args['post_type']) ? sanitize_key($args['post_type']) : 'post';
$aria_label = isset($args['aria_label']) ? (string) $args['aria_label'] : ($taxonomy === 'event_cat' ? 'イベントカテゴリー' : 'お知らせカテゴリー');

$tabs = array();

if ($taxonomy === 'event_cat') {
    $all_url = get_post_type_archive_link($post_type) ?: '';
    $current_term_id = is_tax($taxonomy) ? (int) get_queried_object_id() : 0;
    $current_top_term_id = $current_term_id;

    if ($current_term_id) {
        $current_term = get_term($current_term_id, $taxonomy);
        if ($current_term && !is_wp_error($current_term)) {
            while (!empty($current_term->parent)) {
                $parent_term = get_term((int) $current_term->parent, $taxonomy);
                if (!$parent_term || is_wp_error($parent_term)) {
                    break;
                }
                $current_term = $parent_term;
            }
            $current_top_term_id = (int) $current_term->term_id;
        }
    }

    $tabs[] = array(
        'label' => 'すべて',
        'url' => $all_url,
        'active' => $current_term_id === 0,
    );

    $terms = get_terms(array(
        'taxonomy' => $taxonomy,
        'parent' => 0,
        'hide_empty' => false,
    ));

    if (!empty($terms) && !is_wp_error($terms)) {
        foreach ($terms as $term) {
            $tabs[] = array(
                'label' => $term->name,
                'url' => get_term_link($term),
                'active' => $current_top_term_id === (int) $term->term_id,
            );
        }
    }
} else {
    $default_labels = array('武道', '書道', '刊行物', '研修', '事務局');
    $labels = isset($args['labels']) && is_array($args['labels'])
        ? $args['labels']
        : apply_filters('nipponbudokan_news_category_labels', $default_labels);

    $posts_page_id = (int) get_option('page_for_posts');
    $all_url = $posts_page_id ? get_permalink($posts_page_id) : home_url('/');
    $current_category_id = is_category() ? (int) get_queried_object_id() : 0;
    $current_top_category_id = $current_category_id;

    if ($current_category_id) {
        $current_term = get_term($current_category_id, 'category');
        if ($current_term && !is_wp_error($current_term)) {
            while (!empty($current_term->parent)) {
                $parent_term = get_term((int) $current_term->parent, 'category');
                if (!$parent_term || is_wp_error($parent_term)) {
                    break;
                }
                $current_term = $parent_term;
            }
            $current_top_category_id = (int) $current_term->term_id;
        }
    }

    $tabs[] = array(
        'label' => 'すべて',
        'url' => $all_url,
        'active' => $current_category_id === 0,
    );

    foreach ($labels as $label) {
        $label = (string) $label;
        if ($label === '' || $label === 'すべて') {
            continue;
        }

        $term = get_term_by('name', $label, 'category');
        if (!$term || is_wp_error($term)) {
            $term = null;
        }

        $tabs[] = array(
            'label' => $label,
            'url' => $term ? get_category_link($term->term_id) : '',
            'active' => $term ? $current_top_category_id === (int) $term->term_id : false,
        );
    }
}

$nav_classes = array('news_tabs', 'news_tabs_' . $context);
if ($context === 'top') {
    $nav_classes[] = 'top_news_tabs';
}
?>
<nav class="<?php echo esc_attr(implode(' ', $nav_classes)); ?>" aria-label="<?php echo esc_attr($aria_label); ?>">
    <ul class="news_tabs_list">
        <?php foreach ($tabs as $tab): ?>
            <li class="news_tabs_item<?php echo $tab['active'] ? ' is-active' : ''; ?>">
                <?php if ($link_tabs && $tab['url'] !== '' && !is_wp_error($tab['url'])): ?>
                    <a class="news_tabs_link" href="<?php echo esc_url($tab['url']); ?>">
                        <span><?php echo esc_html($tab['label']); ?></span>
                    </a>
                <?php else: ?>
                    <span class="news_tabs_link">
                        <span><?php echo esc_html($tab['label']); ?></span>
                    </span>
                <?php endif; ?>
            </li>
        <?php endforeach; ?>
    </ul>
</nav>
