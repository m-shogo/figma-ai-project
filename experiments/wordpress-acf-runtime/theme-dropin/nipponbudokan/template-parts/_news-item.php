<?php
$item = isset($args['item']) && is_array($args['item']) ? $args['item'] : array();
$context = isset($args['context']) ? sanitize_key($args['context']) : 'archive';
$heading_tag = isset($args['heading_tag']) ? strtolower((string) $args['heading_tag']) : ($context === 'top' ? 'h3' : 'h2');
if (!in_array($heading_tag, array('h2', 'h3', 'p'), true)) {
    $heading_tag = $context === 'top' ? 'h3' : 'h2';
}

$date_display = isset($item['date']) ? (string) $item['date'] : '';
$date_attr = isset($item['date_attr']) ? (string) $item['date_attr'] : '';
$category_name = isset($item['category']) ? (string) $item['category'] : '';
$title = isset($item['title']) ? (string) $item['title'] : '';
$url = isset($item['url']) ? (string) $item['url'] : '';
$target_attr = isset($item['target_attr']) ? (string) $item['target_attr'] : '';
$tone_class = isset($item['tone_class']) ? sanitize_html_class($item['tone_class']) : '';

$is_link = $url !== '';
$tag_name = $is_link ? 'a' : 'span';
$article_classes = array('news_item', 'news_item_' . $context);
$link_classes = array('news_item_link');
$meta_classes = array('news_item_meta');
$label_classes = array('news_item_label');
$title_classes = array('news_item_title');

if ($context === 'top') {
    $article_classes[] = 'top_news_article';
    $link_classes[] = 'top_news_article_link';
    $meta_classes[] = 'top_news_meta';
    $label_classes[] = 'top_news_label';
    $title_classes[] = 'top_news_title';
} else {
    $article_classes[] = 'mnl-01_article';
    $link_classes[] = $is_link ? 'link' : 'no-link';
}

if ($tone_class !== '') {
    $label_classes[] = $tone_class;
}
?>
<article class="<?php echo esc_attr(implode(' ', $article_classes)); ?>">
    <<?php echo $tag_name; ?> class="<?php echo esc_attr(implode(' ', $link_classes)); ?>"<?php if ($is_link): ?> href="<?php echo esc_url($url); ?>" <?php echo $target_attr; ?><?php endif; ?>>
        <div class="<?php echo esc_attr(implode(' ', $meta_classes)); ?>">
            <?php if ($date_display !== ''): ?>
                <time class="news_item_date"<?php if ($date_attr !== ''): ?> datetime="<?php echo esc_attr($date_attr); ?>"<?php endif; ?>><?php echo esc_html($date_display); ?></time>
            <?php endif; ?>
            <?php if ($category_name !== ''): ?>
                <span class="<?php echo esc_attr(implode(' ', $label_classes)); ?>"><?php echo esc_html($category_name); ?></span>
            <?php endif; ?>
        </div>
        <<?php echo $heading_tag; ?> class="<?php echo esc_attr(implode(' ', $title_classes)); ?>"><?php echo esc_html($title); ?></<?php echo $heading_tag; ?>>
    </<?php echo $tag_name; ?>>
</article>
