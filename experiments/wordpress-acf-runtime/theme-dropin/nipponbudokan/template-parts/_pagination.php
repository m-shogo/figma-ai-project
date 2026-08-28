<?php
global $wp_query;
$props = isset($args) && isset($args['props']) ? $args['props'] : '';
$variant = isset($args) && isset($args['variant']) ? sanitize_key($args['variant']) : '';
$max_num_pages = $wp_query->max_num_pages;
$paged = (get_query_var('paged')) ? get_query_var('paged') : 1;

$pagenate_args = array(
    'total'              => $max_num_pages,
    'current'            => $paged,
    'show_all'           => false,
    'end_size'           => 1,
    'mid_size'           => 0,
    'prev_next'          => true,
    'prev_text'          => '<span></span>',
    'next_text'          => '<span></span>',
    'type'               => $variant === 'news' ? 'array' : 'plain',
    'add_args'           => false,
    'add_fragment'       => '',
    'before_page_number' => '',
    'after_page_number'  => '',
);
?>
<?php if ($variant === 'news'): ?>
    <?php
    $number_links = array();
    $prev_link = '';
    $next_link = '';

    if ($max_num_pages == 1) {
        $number_links[] = '<span aria-current="page" class="page-numbers current">1</span>';
    } else {
        $links = paginate_links($pagenate_args);
        if (is_array($links)) {
            foreach ($links as $link) {
                if (strpos($link, 'prev page-numbers') !== false) {
                    $prev_link = $link;
                } elseif (strpos($link, 'next page-numbers') !== false) {
                    $next_link = $link;
                } else {
                    $number_links[] = $link;
                }
            }
        }
    }
    ?>
    <div class="module_pager-01 news_pager">
        <div class="news_pager_prev"><?php echo $prev_link; ?></div>
        <div class="news_pager_numbers"><?php echo implode('', $number_links); ?></div>
        <div class="news_pager_next"><?php echo $next_link; ?></div>
    </div>
<?php else: ?>
    <div class="module_pager-01">
        <?php if ($max_num_pages == 1) : ?>
            <span aria-current="page" class="page-numbers current">1</span>
        <?php else : ?>
            <?php echo paginate_links($pagenate_args); ?>
        <?php endif; ?>
    </div>
<?php endif; ?>
