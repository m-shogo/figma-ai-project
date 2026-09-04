<?php
/**
 * Plugin Name: Local hot reload
 * Description: Local-only Theme file watcher. Reloads the browser when CSS/PHP/JS/images change.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	return;
}
if ( function_exists( 'wp_installing' ) && wp_installing() ) {
	return;
}

$figma_ai_env = function_exists( 'wp_get_environment_type' ) ? wp_get_environment_type() : 'production';
if ( $figma_ai_env !== 'local' ) {
	return;
}

/**
 * Newest mtime among Theme files that affect front-end visual.
 */
function figma_ai_local_hot_reload_stamp() {
	static $cached = null;
	if ( $cached !== null ) {
		return $cached;
	}

	$root = get_stylesheet_directory();
	$max  = 0;
	$dirs = array( 'css', 'js', 'inc', 'template-parts', 'templates', 'acf/blocks', 'images' );

	foreach ( $dirs as $rel ) {
		$path = $root . '/' . $rel;
		if ( ! is_dir( $path ) ) {
			continue;
		}
		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $path, FilesystemIterator::SKIP_DOTS )
		);
		foreach ( $iterator as $file ) {
			if ( ! $file->isFile() ) {
				continue;
			}
			$pathname = str_replace( '\\', '/', $file->getPathname() );
			if ( strpos( $pathname, '/webfonts/' ) !== false ) {
				continue;
			}
			$mtime = $file->getMTime();
			if ( $mtime > $max ) {
				$max = $mtime;
			}
		}
	}

	foreach ( glob( $root . '/*.php' ) ?: array() as $file ) {
		$mtime = filemtime( $file );
		if ( $mtime > $max ) {
			$max = $mtime;
		}
	}

	$cached = $max;
	return $cached;
}

add_filter( 'autoptimize_filter_noptimize', '__return_true' );

add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'figma-ai-local/v1',
			'/stamp',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true',
				'callback'            => static function () {
					return new WP_REST_Response(
						array(
							'stamp' => figma_ai_local_hot_reload_stamp(),
						),
						200,
						array(
							'Cache-Control' => 'no-store',
						)
					);
				},
			)
		);
	}
);

add_filter(
	'style_loader_src',
	static function ( $src, $handle ) {
		if ( $handle !== 'common-style' ) {
			return $src;
		}
		return add_query_arg( 'hr', (string) figma_ai_local_hot_reload_stamp(), $src );
	},
	20,
	2
);

add_action(
	'wp_footer',
	'figma_ai_local_hot_reload_script',
	99
);
add_action(
	'admin_footer',
	'figma_ai_local_hot_reload_script',
	99
);

function figma_ai_local_hot_reload_script() {
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return;
	}
	$url = esc_url_raw( rest_url( 'figma-ai-local/v1/stamp' ) );
	echo "<script>\n";
	echo "(function(){\n";
	echo 'var url=' . wp_json_encode( $url ) . ";\n";
	echo <<<'JS'
var last=0;
function tick(){
  if(document.hidden){return;}
  fetch(url,{cache:'no-store',credentials:'same-origin'}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.stamp){return;}
    if(last&&j.stamp!==last){location.reload();}
    last=j.stamp;
  }).catch(function(){});
}
setInterval(tick,800);
tick();
JS;
	echo "\n})();\n</script>\n";
}
