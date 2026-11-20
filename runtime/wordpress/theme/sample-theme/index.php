<?php
declare(strict_types=1);
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class('sample-theme-fixture-fallback'); ?>>
<?php wp_body_open(); ?>
<main>
    <h1><?php esc_html_e('Sample Theme Fixture', 'sample-theme'); ?></h1>
    <p><?php esc_html_e('Assign the Sample Theme Fixture page template to run the ACF PRO fixture.', 'sample-theme'); ?></p>
</main>
<?php wp_footer(); ?>
</body>
</html>
