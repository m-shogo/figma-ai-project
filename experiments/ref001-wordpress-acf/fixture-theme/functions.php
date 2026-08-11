<?php
/**
 * REF-001 learning fixture helpers.
 *
 * This file intentionally avoids production-theme assumptions. The real target
 * theme's enqueue, ACF, image, and escaping conventions take precedence later.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueue the REF-001 fixture stylesheets only for the learning Page template.
 *
 * Visual-first rule: the fixture must remain inspectable before editors enter
 * ACF values. Figma-derived fixture values/media are therefore allowed as
 * learning-only fallbacks; real ACF values later replace them without changing
 * section markup.
 */
function ref001_learning_enqueue_assets() {
	if ( ! is_page_template( 'page-templates/template-ref001.php' ) ) {
		return;
	}

	wp_enqueue_style(
		'ref001-learning',
		get_theme_file_uri( 'assets/css/ref001.css' ),
		array(),
		'0.4.0'
	);

	wp_enqueue_style(
		'ref001-learning-shell',
		get_theme_file_uri( 'assets/css/ref001-shell.css' ),
		array( 'ref001-learning' ),
		'0.4.0'
	);

	wp_enqueue_style(
		'ref001-learning-education',
		get_theme_file_uri( 'assets/css/ref001-education.css' ),
		array( 'ref001-learning' ),
		'0.4.0'
	);

	wp_enqueue_style(
		'ref001-learning-courses',
		get_theme_file_uri( 'assets/css/ref001-courses.css' ),
		array( 'ref001-learning' ),
		'0.4.0'
	);

	wp_enqueue_style(
		'ref001-learning-bottom',
		get_theme_file_uri( 'assets/css/ref001-bottom.css' ),
		array( 'ref001-learning' ),
		'0.4.0'
	);

	wp_enqueue_style(
		'ref001-learning-visual-fixtures',
		get_theme_file_uri( 'assets/css/ref001-visual-fixtures.css' ),
		array( 'ref001-learning' ),
		'0.4.0'
	);
}
add_action( 'wp_enqueue_scripts', 'ref001_learning_enqueue_assets' );

/**
 * Read a Page-level ACF value without making the fixture fatal when ACF is
 * temporarily unavailable during structural or visual testing.
 *
 * The fallback is intentional: Figma-derived fixture copy is the visual source
 * before admin entry; an actual ACF value replaces it without changing markup.
 *
 * @param string $name    ACF field name.
 * @param mixed  $default Value returned when ACF or the field is unavailable.
 * @return mixed
 */
function ref001_get_field( $name, $default = '' ) {
	if ( ! function_exists( 'get_field' ) ) {
		return $default;
	}

	$value = get_field( $name );

	return null === $value || false === $value || '' === $value ? $default : $value;
}

/**
 * Render an attachment-ID image through the WordPress image stack.
 *
 * ACF image fields in this fixture return attachment IDs. Do not replace this
 * with raw Figma MCP asset URLs; those URLs expire and bypass WordPress srcset.
 *
 * @param mixed  $attachment_id Attachment ID from ACF.
 * @param string $size          WordPress registered image size.
 * @param array  $attributes    Additional image attributes.
 * @return string
 */
function ref001_get_attachment_image( $attachment_id, $size = 'full', $attributes = array() ) {
	$attachment_id = absint( $attachment_id );
	if ( ! $attachment_id ) {
		return '';
	}

	$defaults = array(
		'loading'  => 'eager',
		'decoding' => 'async',
	);

	return wp_get_attachment_image(
		$attachment_id,
		$size,
		false,
		array_merge( $defaults, $attributes )
	);
}
