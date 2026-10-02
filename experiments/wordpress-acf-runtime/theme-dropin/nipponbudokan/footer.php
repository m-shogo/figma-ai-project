</div><!-- /global_wrapper -->
<?php
$footer_args = is_array($args ?? null) ? $args : array();
get_template_part('template-parts/_footer', null, array(
    'map' => !empty($footer_args['map']),
));
?>
<?php get_template_part('template-parts/_purpose-banner'); ?>
<?php wp_footer(); ?>
<?php
$bodyTag_before = get_field('bodyTag_before', 'option');
if ($bodyTag_before) {
    echo $bodyTag_before;
}
?>
</body>

</html>