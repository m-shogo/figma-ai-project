<?php
$taxonomy = $args['taxonomy'] ?? '';
if (get_post_type() === 'post'): //通常投稿
?>
    <?php
    if ($taxonomy === '_cat' || empty($taxonomy)) {
        $category = get_the_category();
        $name = 'cat_name';
    } else {
        $category = get_the_tags();
        $name = 'name';
    }
    ?>
    <?php if ($category && !is_wp_error($category)): ?>
        <p class="category <?php echo esc_attr($taxonomy); ?>">
            <?php foreach ($category as $cat) : ?>
                <?php
                $parent = $cat->category_parent;
                if ($parent) {
                    $parent_term = get_term($parent);
                    if (!is_wp_error($parent_term)) {
                        $parent_slug = $parent_term->slug;
                        $parent_slug = ' _' . $parent_slug;
                    }
                }
                ?>
                <?php
                $label_color = function_exists('nipponbudokan_get_category_color')
                    ? nipponbudokan_get_category_color($cat)
                    : '';
                $label_style = $label_color !== ''
                    ? ' style="--news-label-color:' . esc_attr($label_color) . ';"'
                    : '';
                ?>
                <span class="label <?php echo esc_attr($cat->slug); ?><?php echo $parent ? $parent_slug : ''; ?>"<?php echo $label_style; ?>><?php echo esc_html($cat->$name); ?></span>
            <?php endforeach; ?>
        </p>
    <?php endif; ?>
<?php else: //その他カスタム投稿 
?>
    <?php
    if (empty($taxonomy)) {
        $taxonomy = '_cat';
    }
    $postType = esc_html(get_post_type_object(get_post_type())->name);
    $postType_cat = $postType . $taxonomy;
    $terms = get_the_terms($post->ID, $postType_cat);
    ?>
    <?php if ($terms && !is_wp_error($terms)): ?>
        <p class="category <?php echo esc_attr($taxonomy); ?>">
            <?php foreach ($terms as $term) : ?>
                <?php $parent = $term->parent;
                if ($parent) {
                    $parent_term = get_term($parent);
                    if (!is_wp_error($parent_term)) {
                        $parent_slug = $parent_term->slug;
                        $parent_slug = ' _' . $parent_slug;
                    }
                }
                ?>
                <span class="label <?php echo esc_attr($term->slug); ?><?php echo $parent ? $parent_slug : ''; ?>"><?php echo esc_html($term->name); ?></span>
            <?php endforeach; ?>
        </p>
    <?php endif; ?>
<?php endif; ?>