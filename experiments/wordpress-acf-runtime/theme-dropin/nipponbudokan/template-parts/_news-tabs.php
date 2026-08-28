<?php
$context = isset($args['context']) ? sanitize_key($args['context']) : 'archive';
$link_tabs = array_key_exists('link_tabs', $args ?? array()) ? (bool) $args['link_tabs'] : ($context === 'archive');
$labels = isset($args['labels']) && is_array($args['labels']) ? $args['labels'] : array();

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

$tabs = array();
$tabs[] = array(
    'label' => 'すべて',
    'url' => $all_url,
    'active' => $current_category_id === 0,
);

if (!empty($labels)) {
    foreach ($labels as $label) {
        if ($label === 'すべて') {
            continue;
        }
        $tabs[] = array(
            'label' => (string) $label,
            'url' => '',
            'active' => false,
        );
    }
} else {
    $categories = get_categories(array(
        'orderby' => 'id',
        'order' => 'ASC',
        'hide_empty' => false,
        'parent' => 0,
    ));

    foreach ($categories as $category) {
        $tabs[] = array(
            'label' => $category->name,
            'url' => get_category_link($category->term_id),
            'active' => $current_top_category_id === (int) $category->term_id,
        );
    }
}

$nav_classes = array('news_tabs', 'news_tabs_' . $context);
if ($context === 'top') {
    $nav_classes[] = 'top_news_tabs';
}
?>
<nav class="<?php echo esc_attr(implode(' ', $nav_classes)); ?>" aria-label="お知らせカテゴリー">
    <ul class="news_tabs_list">
        <?php foreach ($tabs as $tab): ?>
            <li class="news_tabs_item<?php echo $tab['active'] ? ' is-active' : ''; ?>">
                <?php if ($link_tabs && $tab['url'] !== ''): ?>
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
