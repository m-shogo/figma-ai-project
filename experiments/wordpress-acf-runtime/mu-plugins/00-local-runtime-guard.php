<?php
/**
 * Plugin Name: Local runtime guard
 * Description: Restore ACF PRO autoload before plugins load, and surface auto-deactivated plugins.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$recover = dirname( __DIR__ ) . '/local-runtime-recover.php';
if ( is_readable( $recover ) ) {
	require_once $recover;
}

if ( function_exists( 'figma_ai_wp_ensure_acf_pro_autoload' ) ) {
	figma_ai_wp_ensure_acf_pro_autoload();
}

add_action(
	'admin_notices',
	static function () {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		$items = get_option( 'figma_ai_wp_auto_deactivated_plugins', array() );
		if ( ! is_array( $items ) || $items === array() ) {
			return;
		}

		delete_option( 'figma_ai_wp_auto_deactivated_plugins' );

		echo '<div class="notice notice-warning"><p>';
		echo esc_html( '壊れたプラグインを自動で無効化してサイトを復旧しました: ' . implode( ', ', $items ) );
		echo '</p></div>';
	}
);
