<?php
/**
 * REF-001 standalone visual preview harness.
 *
 * Purpose: render the real learning-theme PHP/CSS without WordPress, ACF, or
 * admin-entered content so Figma comparison can happen immediately.
 *
 * Run only with PHP's development server. This file lives outside the fixture
 * theme and is not a production template.
 */

if ( PHP_SAPI !== 'cli-server' ) {
	http_response_code( 403 );
	exit( 'REF-001 visual preview is development-server only.' );
}

$experiment_root = dirname( __DIR__ );
$theme_root      = $experiment_root . '/fixture-theme';

define( 'ABSPATH', $theme_root . '/' );
define( 'REF001_VISUAL_PREVIEW', true );

function add_action() {}
function is_page_template() { return true; }
function wp_enqueue_style() {}
function wp_body_open() {}
function wp_footer() {}
function language_attributes() { echo 'lang="ja"'; }
function bloginfo( $key ) { if ( 'charset' === $key ) { echo 'UTF-8'; } }
function body_class( $classes = '' ) {
	if ( is_array( $classes ) ) {
		$classes = implode( ' ', $classes );
	}
	echo 'class="' . esc_attr( $classes ) . '"';
}
function esc_attr( $value ) { return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' ); }
function esc_html( $value ) { return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' ); }
function esc_url( $value ) { return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' ); }
function wp_kses_post( $value ) { return (string) $value; }
function absint( $value ) { return abs( (int) $value ); }
function sanitize_html_class( $value ) { return preg_replace( '/[^A-Za-z0-9_-]/', '', (string) $value ); }
function get_field() { return null; }
function wp_get_attachment_image() { return ''; }

function get_theme_file_uri( $path = '' ) {
	return '../fixture-theme/' . ltrim( (string) $path, '/' );
}

function get_header() {
	global $theme_root;
	include $theme_root . '/header.php';
}

function get_footer() {
	global $theme_root;
	include $theme_root . '/footer.php';
}

function get_template_part( $slug ) {
	global $theme_root;
	$path = $theme_root . '/' . ltrim( (string) $slug, '/' ) . '.php';
	if ( is_file( $path ) ) {
		include $path;
	}
}

function wp_head() {
	global $theme_root;
	$styles = glob( $theme_root . '/assets/css/*.css' );
	sort( $styles );
	foreach ( $styles as $path ) {
		echo '<style data-ref001-css="' . esc_attr( basename( $path ) ) . '">';
		echo file_get_contents( $path );
		echo '</style>';
	}
}

require $theme_root . '/functions.php';
include $theme_root . '/page-templates/template-ref001.php';
