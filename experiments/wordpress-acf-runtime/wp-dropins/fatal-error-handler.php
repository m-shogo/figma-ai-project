<?php
/**
 * Local runtime fatal handler.
 * A broken plugin must not keep the whole site down.
 *
 * @return object
 */
require_once __DIR__ . '/local-runtime-recover.php';

if ( ! class_exists( 'WP_Fatal_Error_Handler' ) ) {
	return null;
}

final class Figma_AI_WP_Local_Fatal_Error_Handler extends WP_Fatal_Error_Handler {
	public function handle() {
		if ( defined( 'WP_SANDBOX_SCRAPING' ) && WP_SANDBOX_SCRAPING ) {
			return;
		}

		try {
			$error = $this->detect_error();
			if ( ! $error ) {
				return;
			}

			if ( function_exists( 'figma_ai_wp_try_recover_fatal' ) && figma_ai_wp_try_recover_fatal( $error ) ) {
				if ( ! headers_sent() ) {
					header( 'Cache-Control: no-store, no-cache, must-revalidate' );
					header( 'Location: ' . figma_ai_wp_reload_current_url(), true, 302 );
					exit;
				}
			}
		} catch ( Throwable $e ) {
			// Fall through to core handler.
		}

		parent::handle();
	}
}

return new Figma_AI_WP_Local_Fatal_Error_Handler();
