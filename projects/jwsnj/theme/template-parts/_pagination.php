<?php
global $wp_query;
$props = isset($args) && isset($args['props']) ? $args['props'] : '';
$max_num_pages = $wp_query->max_num_pages;
$paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
?>
<div class="module_pager-01">
    <?php
    $pagenate_args = array(
        'total'              => $max_num_pages,
        'current'            => $paged,
        'show_all'           => false,
        'end_size'           => 1,
        'mid_size'           => 0,
        'prev_next'          => true,
        'prev_text'          => '<span></span>',
        'next_text'          => '<span></span>',
        'type'               => 'plain',
        'add_args'           => false,
        'add_fragment'       => '',
        'before_page_number' => '',
        'after_page_number'  => ''
    );
    ?>
    <?php if ($max_num_pages == 1) : ?>
        <span aria-current="page" class="page-numbers current">1</span>
    <?php else : ?>
        <?php echo paginate_links($pagenate_args); ?>
    <?php endif; ?>
</div>