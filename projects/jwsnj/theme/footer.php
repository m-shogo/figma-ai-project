</div><!-- /global_wrapper -->
<?php get_template_part('template-parts/_footer'); ?>
<?php wp_footer(); ?>
<?php // Classic themes print the WordPress import map in wp_footer; keep Vite after it. ?>
<?php if (function_exists('wp_get_environment_type') && wp_get_environment_type() === 'local') : ?>
  <script type="module" src="http://localhost:5173/@vite/client"></script>
<?php endif; ?>
<?php
$bodyTag_before = get_field('bodyTag_before', 'option');
if ($bodyTag_before) {
  echo $bodyTag_before;
}
?>
</body>

</html>