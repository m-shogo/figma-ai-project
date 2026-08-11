<?php
/**
 * Neutral shell for the REF-001 learning fixture.
 *
 * The real Figma Header is deliberately NOT reproduced here. Its ownership is
 * global/shared and must be reconciled against the eventual target theme.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'ref001-learning-fixture' ); ?>>
<?php wp_body_open(); ?>
