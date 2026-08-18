<?php
declare(strict_types=1);
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class('standalone-lp-fixture-fallback'); ?>>
<?php wp_body_open(); ?>
<main>
    <h1><?php esc_html_e('Standalone LP Fixture', 'standalone-lp-sample'); ?></h1>
    <p><?php esc_html_e('Assign the Standalone LP Fixture page template to run the ACF PRO fixture.', 'standalone-lp-sample'); ?></p>
</main>
<?php wp_footer(); ?>
</body>
</html>
