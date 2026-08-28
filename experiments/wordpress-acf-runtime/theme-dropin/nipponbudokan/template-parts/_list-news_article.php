<?php
$categories = get_the_category();
$category_name = !empty($categories) ? $categories[0]->name : '';
$link_attrs = function_exists('get_post_link_attributes') ? get_post_link_attributes() : array();
$url = !empty($link_attrs['url']) ? $link_attrs['url'] : get_permalink();
$target_attr = !empty($link_attrs['targetAttr']) ? $link_attrs['targetAttr'] : '';

get_template_part('template-parts/_news-item', null, array(
    'context' => 'archive',
    'heading_tag' => (is_front_page() || is_page()) ? 'h3' : 'h2',
    'item' => array(
        'date' => get_the_date('Y.m.d'),
        'date_attr' => get_the_date('Y-m-d'),
        'category' => $category_name,
        'title' => get_the_title(),
        'url' => $url,
        'target_attr' => $target_attr,
    ),
));
