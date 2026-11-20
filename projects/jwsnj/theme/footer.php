</div><!-- /global_wrapper -->
<?php get_template_part('template-parts/_footer'); ?>
<?php wp_footer(); ?>
<?php
$bodyTag_before = get_field('bodyTag_before', 'option');
if ($bodyTag_before) {
    echo $bodyTag_before;
}
?>
</body>

</html>