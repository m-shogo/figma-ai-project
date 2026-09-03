<?php
/**
 * Local WordPress runtime recovery helpers.
 * Used by the fatal-error-handler drop-in and the mu-plugin guard.
 */

function figma_ai_wp_ensure_acf_pro_autoload(): bool {
	$plugin_dir = WP_PLUGIN_DIR . '/advanced-custom-fields-pro';
	$autoload   = $plugin_dir . '/vendor/autoload.php';
	$src        = $plugin_dir . '/src';

	if ( ! is_dir( $plugin_dir ) || ! is_dir( $src ) ) {
		return false;
	}
	if ( is_file( $autoload ) ) {
		return true;
	}

	$vendor = $plugin_dir . '/vendor';
	if ( ! is_dir( $vendor ) ) {
		$created = function_exists( 'wp_mkdir_p' ) ? wp_mkdir_p( $vendor ) : mkdir( $vendor, 0755, true );
		if ( ! $created && ! is_dir( $vendor ) ) {
			return false;
		}
	}

	$php = <<<'PHP'
<?php
spl_autoload_register(static function ($class) {
    $prefix = 'ACF\\';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $file = dirname(__DIR__) . '/src/' . str_replace('\\', '/', substr($class, $len)) . '.php';
    if (is_file($file)) {
        require $file;
    }
});
PHP;

	return false !== file_put_contents( $autoload, $php );
}

function figma_ai_wp_deactivate_plugin_for_error( array $error ): string {
	if ( empty( $error['file'] ) || ! function_exists( 'get_option' ) || ! defined( 'WP_PLUGIN_DIR' ) ) {
		return '';
	}

	$error_file = wp_normalize_path( $error['file'] );
	$plugin_root = trailingslashit( wp_normalize_path( WP_PLUGIN_DIR ) );
	if ( ! str_starts_with( $error_file, $plugin_root ) ) {
		return '';
	}

	$active = get_option( 'active_plugins', array() );
	if ( ! is_array( $active ) || $active === array() ) {
		return '';
	}

	$kept         = array();
	$deactivated  = '';
	foreach ( $active as $plugin ) {
		$plugin_file = wp_normalize_path( WP_PLUGIN_DIR . '/' . $plugin );
		$plugin_dir  = trailingslashit( dirname( $plugin_file ) );
		$matches     = ( $error_file === $plugin_file ) || str_starts_with( $error_file, $plugin_dir );
		if ( $matches ) {
			$deactivated = $plugin;
			continue;
		}
		$kept[] = $plugin;
	}

	if ( $deactivated === '' ) {
		return '';
	}

	update_option( 'active_plugins', $kept );

	$notice = get_option( 'figma_ai_wp_auto_deactivated_plugins', array() );
	if ( ! is_array( $notice ) ) {
		$notice = array();
	}
	$notice[] = $deactivated;
	update_option( 'figma_ai_wp_auto_deactivated_plugins', array_values( array_unique( $notice ) ) );

	return $deactivated;
}

function figma_ai_wp_try_recover_fatal( array $error ): bool {
	$file = isset( $error['file'] ) ? wp_normalize_path( $error['file'] ) : '';
	$is_acf_pro = $file !== '' && str_contains( $file, '/plugins/advanced-custom-fields-pro/' );

	if ( $is_acf_pro && figma_ai_wp_ensure_acf_pro_autoload() ) {
		return true;
	}

	return figma_ai_wp_deactivate_plugin_for_error( $error ) !== '';
}

function figma_ai_wp_reload_current_url(): string {
	$uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '/';
	$uri = strtok( $uri, '#' );
	if ( ! is_string( $uri ) || $uri === '' ) {
		return '/';
	}
	return $uri;
}
