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

$experiment_root        = dirname( __DIR__ );
$theme_root             = $experiment_root . '/fixture-theme';
$ref001_preview_styles  = array();

define( 'ABSPATH', $theme_root . '/' );
define( 'REF001_VISUAL_PREVIEW', true );

function add_action() {}
function is_page_template() { return true; }
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

/**
 * Capture the real fixture theme's enqueue order instead of loading CSS by
 * filename. Visual QA must reproduce WordPress cascade order exactly; repair
 * layers are otherwise liable to be overwritten by the baseline stylesheet.
 */
function wp_enqueue_style( $handle, $src, $deps = array(), $version = false, $media = 'all' ) {
	global $ref001_preview_styles;
	$ref001_preview_styles[ $handle ] = array(
		'src'     => $src,
		'deps'    => $deps,
		'version' => $version,
		'media'   => $media,
	);
}

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
	global $ref001_preview_styles;
	foreach ( $ref001_preview_styles as $handle => $style ) {
		$href = $style['src'];
		if ( false !== $style['version'] && '' !== (string) $style['version'] ) {
			$href .= '?ver=' . rawurlencode( (string) $style['version'] );
		}
		echo '<link rel="stylesheet" data-ref001-style="' . esc_attr( $handle ) . '" href="' . esc_url( $href ) . '" media="' . esc_attr( $style['media'] ) . '">';
	}
}

require $theme_root . '/functions.php';

// WordPress would invoke this through wp_enqueue_scripts before wp_head().
ref001_learning_enqueue_assets();

include $theme_root . '/page-templates/template-ref001.php';
