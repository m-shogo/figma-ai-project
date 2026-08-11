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
 */
function ref001_learning_enqueue_assets() {
	if ( ! is_page_template( 'page-templates/template-ref001.php' ) ) {
		return;
	}

	$version = '0.10.0';

	wp_enqueue_style(
		'ref001-learning',
		get_theme_file_uri( 'assets/css/ref001.css' ),
		array(),
		$version
	);

	$section_styles = array(
		'mv-vector'        => 'ref001-mv-vector.css',
		'mv-cta-detail'    => 'ref001-mv-cta-detail.css',
		'mv-type'          => 'ref001-mv-type.css',
		'header'           => 'ref001-header.css',
		'reason-geometry'  => 'ref001-reason-geometry.css',
		'education'        => 'ref001-education.css',
		'cta'              => 'ref001-cta.css',
		'student-voice'    => 'ref001-student-voice.css',
		'messages'         => 'ref001-messages.css',
		'courses'          => 'ref001-courses.css',
		'links'            => 'ref001-links.css',
		'cta-value'        => 'ref001-cta-value.css',
		'footer'           => 'ref001-footer.css',
	);

	foreach ( $section_styles as $handle_suffix => $file ) {
		wp_enqueue_style(
			'ref001-learning-' . $handle_suffix,
			get_theme_file_uri( 'assets/css/' . $file ),
			array( 'ref001-learning' ),
			$version
		);
	}
}
add_action( 'wp_enqueue_scripts', 'ref001_learning_enqueue_assets' );

/**
 * Read a Page-level ACF value without making the fixture fatal when ACF is
 * temporarily unavailable during structural testing.
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
