<?php
/**
 * Plugin Name: メニューのみ インポート/エクスポート
 * Description: 外観 → メニューだけを JSON で書き出し・読み込みします。WordPress 公式のメニュー API / Importer と同じ手順です。
 * Version: 1.2.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const MENU_ONLY_IO_CAP            = 'edit_theme_options';
const MENU_ONLY_IO_FORMAT         = 'menu-only-import-export';
const MENU_ONLY_IO_BACKUP_OPTION  = 'menu_only_io_last_backup';
const MENU_ONLY_IO_NOTICE_TRANSIENT = 'menu_only_io_notices';

add_action( 'admin_menu', 'menu_only_io_admin_menu' );
add_action( 'admin_post_menu_only_io_export', 'menu_only_io_handle_export' );
add_action( 'admin_post_menu_only_io_import', 'menu_only_io_handle_import' );
add_action( 'admin_post_menu_only_io_restore', 'menu_only_io_handle_restore' );
add_action( 'admin_notices', 'menu_only_io_admin_notices' );

function menu_only_io_admin_menu() {
	add_management_page(
		'メニューの書き出し / 読み込み',
		'メニューの書き出し',
		MENU_ONLY_IO_CAP,
		'menu-only-import-export',
		'menu_only_io_render_page'
	);
}

function menu_only_io_render_page() {
	if ( ! current_user_can( MENU_ONLY_IO_CAP ) ) {
		wp_die( esc_html( '権限がありません。' ) );
	}

	$has_backup = (bool) get_option( MENU_ONLY_IO_BACKUP_OPTION );
	?>
	<div class="wrap">
		<h1>メニューの書き出し / 読み込み</h1>
		<p>外観 → メニューの項目と、テーマ位置への割り当てだけを JSON にします。投稿・固定ページ本体は含みません。</p>
		<p>読み込みは <a href="https://developer.wordpress.org/reference/functions/wp_update_nav_menu_item/">wp_update_nav_menu_item()</a> と、公式 WordPress Importer と同じ規則です。別サイトの投稿 ID は使いません。既定では、リンク先が無ければその項目は入れません。</p>
		<p>名前と階層だけ残したいときは、読み込み時に「リンク先が無くても残す」を選んでください。無い固定ページへは紐づけず、<strong>カスタムリンク</strong>にします。あとから 外観 → メニュー で正しいページへ付け直せます。</p>

		<h2>書き出す</h2>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<?php wp_nonce_field( 'menu_only_io_export' ); ?>
			<input type="hidden" name="action" value="menu_only_io_export">
			<?php submit_button( 'メニューを JSON で書き出す', 'primary', 'submit', false ); ?>
		</form>

		<hr>

		<h2>読み込む</h2>
		<p>読み込み前に、今のメニューを自動で控えます。同じ名前のメニューは、<strong>新しいメニューが全部作れてから</strong>差し替えます。途中で失敗したメニューは元のまま残ります。</p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" enctype="multipart/form-data">
			<?php wp_nonce_field( 'menu_only_io_import' ); ?>
			<input type="hidden" name="action" value="menu_only_io_import">
			<p>
				<label for="menu-only-io-file">JSON ファイル</label><br>
				<input id="menu-only-io-file" type="file" name="menu_only_io_file" accept="application/json,.json" required>
			</p>
			<p>
				<label>
					<input type="checkbox" name="menu_only_io_locations" value="1" checked>
					このテーマにあるメニュー位置だけ割り当てる
				</label>
			</p>
			<p>
				<label>
					<input type="checkbox" name="menu_only_io_keep_unresolved" value="1">
					リンク先が無くても、名前と階層は残す（ページ未作成の項目はカスタムリンクになります）
				</label>
			</p>
			<?php submit_button( 'JSON を読み込む', 'secondary', 'submit', false ); ?>
		</form>

		<?php if ( $has_backup ) : ?>
			<hr>
			<h2>直前の控えに戻す</h2>
			<p>最後に読み込む直前のメニューへ戻します。</p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'menu_only_io_restore' ); ?>
				<input type="hidden" name="action" value="menu_only_io_restore">
				<?php submit_button( '控えに戻す', 'delete', 'submit', false ); ?>
			</form>
		<?php endif; ?>
	</div>
	<?php
}

function menu_only_io_handle_export() {
	menu_only_io_require_cap();
	check_admin_referer( 'menu_only_io_export' );

	$json     = wp_json_encode( menu_only_io_export_payload(), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
	$filename = 'wp-menus-' . gmdate( 'Ymd-His' ) . '.json';

	nocache_headers();
	header( 'Content-Type: application/json; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
	header( 'Content-Length: ' . strlen( $json ) );
	echo $json;
	exit;
}

function menu_only_io_handle_import() {
	menu_only_io_require_cap();
	check_admin_referer( 'menu_only_io_import' );

	if ( empty( $_FILES['menu_only_io_file']['tmp_name'] ) ) {
		menu_only_io_redirect_notice( 'ファイルを選んでください。', 'error' );
	}

	$raw  = file_get_contents( $_FILES['menu_only_io_file']['tmp_name'] );
	$data = json_decode( is_string( $raw ) ? $raw : '', true );
	$error = menu_only_io_validate_payload( $data );
	if ( $error ) {
		menu_only_io_redirect_notice( $error, 'error' );
	}

	update_option( MENU_ONLY_IO_BACKUP_OPTION, menu_only_io_export_payload(), false );

	$with_locations   = ! empty( $_POST['menu_only_io_locations'] );
	$keep_unresolved  = ! empty( $_POST['menu_only_io_keep_unresolved'] );
	$result           = menu_only_io_import_payload( $data, $with_locations, false, $keep_unresolved );

	$type = $result['errors'] || $result['warnings'] ? 'warning' : 'success';
	menu_only_io_redirect_notice( menu_only_io_result_message( $result ), $type );
}

function menu_only_io_handle_restore() {
	menu_only_io_require_cap();
	check_admin_referer( 'menu_only_io_restore' );

	$backup = get_option( MENU_ONLY_IO_BACKUP_OPTION );
	$error  = menu_only_io_validate_payload( $backup );
	if ( $error ) {
		menu_only_io_redirect_notice( '戻せる控えがありません。', 'error' );
	}

	$result = menu_only_io_import_payload( $backup, true, true, false );
	$type   = $result['errors'] || $result['warnings'] ? 'warning' : 'success';
	menu_only_io_redirect_notice( '控えを読み込みました。 ' . menu_only_io_result_message( $result ), $type );
}

function menu_only_io_admin_notices() {
	if ( ! current_user_can( MENU_ONLY_IO_CAP ) ) {
		return;
	}
	$notice = get_transient( MENU_ONLY_IO_NOTICE_TRANSIENT . '_' . get_current_user_id() );
	if ( ! is_array( $notice ) || empty( $notice['message'] ) ) {
		return;
	}
	delete_transient( MENU_ONLY_IO_NOTICE_TRANSIENT . '_' . get_current_user_id() );
	$class = ( isset( $notice['type'] ) && 'success' === $notice['type'] ) ? 'notice-success' : ( 'error' === ( $notice['type'] ?? '' ) ? 'notice-error' : 'notice-warning' );
	echo '<div class="notice ' . esc_attr( $class ) . ' is-dismissible"><p>' . esc_html( $notice['message'] ) . '</p></div>';
}

function menu_only_io_require_cap() {
	if ( ! current_user_can( MENU_ONLY_IO_CAP ) ) {
		wp_die( esc_html( '権限がありません。' ) );
	}
}

function menu_only_io_redirect_notice( $message, $type ) {
	set_transient(
		MENU_ONLY_IO_NOTICE_TRANSIENT . '_' . get_current_user_id(),
		array(
			'message' => $message,
			'type'    => $type,
		),
		60
	);
	wp_safe_redirect( admin_url( 'tools.php?page=menu-only-import-export' ) );
	exit;
}

function menu_only_io_result_message( array $result ) {
	$parts = array(
		sprintf( 'メニュー %d 件を読み込みました。', (int) $result['menus'] ),
	);
	if ( ! empty( $result['skipped'] ) ) {
		$parts[] = 'スキップした項目: ' . implode( ' / ', $result['skipped'] );
	}
	if ( ! empty( $result['warnings'] ) ) {
		$parts[] = '注意: ' . implode( ' / ', $result['warnings'] );
	}
	if ( ! empty( $result['errors'] ) ) {
		$parts[] = '失敗: ' . implode( ' / ', $result['errors'] );
	}
	return implode( ' ', $parts );
}

function menu_only_io_validate_payload( $data ) {
	if ( ! is_array( $data ) ) {
		return 'メニュー JSON として読めません。';
	}
	if ( ( $data['format'] ?? '' ) !== MENU_ONLY_IO_FORMAT ) {
		return 'このプラグイン用の JSON ではありません。書き出したファイルを使ってください。';
	}
	if ( empty( $data['menus'] ) || ! is_array( $data['menus'] ) ) {
		return 'メニューが入っていません。';
	}
	return '';
}

function menu_only_io_export_payload() {
	$menus = wp_get_nav_menus();
	$out   = array(
		'format'      => MENU_ONLY_IO_FORMAT,
		'version'     => 1,
		'exported_at' => gmdate( 'c' ),
		'site_url'    => home_url( '/' ),
		'locations'   => array(),
		'menus'       => array(),
	);

	$by_id     = array();
	$locations = get_nav_menu_locations();
	foreach ( $menus as $menu ) {
		$by_id[ (int) $menu->term_id ] = $menu->slug;
	}
	foreach ( $locations as $location => $menu_id ) {
		$menu_id = (int) $menu_id;
		if ( $menu_id && isset( $by_id[ $menu_id ] ) ) {
			$out['locations'][ $location ] = $by_id[ $menu_id ];
		}
	}

	foreach ( $menus as $menu ) {
		$items = wp_get_nav_menu_items( $menu->term_id, array( 'post_status' => 'publish,draft' ) );
		if ( ! is_array( $items ) ) {
			$items = array();
		}

		$exported = array();
		foreach ( $items as $item ) {
			if ( 'draft' === $item->post_status ) {
				continue;
			}
			$exported[] = menu_only_io_export_item( $item );
		}

		$out['menus'][] = array(
			'name'  => $menu->name,
			'slug'  => $menu->slug,
			'items' => $exported,
		);
	}

	return $out;
}

function menu_only_io_export_item( $item ) {
	$row = array(
		'id'          => (int) $item->ID,
		'parent_id'   => (int) $item->menu_item_parent,
		'position'    => (int) $item->menu_order,
		'title'       => $item->title,
		'type'        => $item->type,
		'object'      => $item->object,
		'object_id'   => (int) $item->object_id,
		'object_slug' => '',
		'object_path' => '',
		'url'         => $item->url,
		'target'      => $item->target,
		'attr_title'  => $item->attr_title,
		'description' => $item->description,
		'classes'     => array_values( array_filter( (array) $item->classes ) ),
		'xfn'         => $item->xfn,
		'status'      => 'publish',
	);

	if ( 'post_type' === $item->type && $item->object_id ) {
		$post = get_post( (int) $item->object_id );
		if ( $post instanceof WP_Post ) {
			$row['object_slug'] = $post->post_name;
			$row['object_path'] = get_page_uri( $post );
		}
	} elseif ( 'taxonomy' === $item->type && $item->object_id ) {
		$term = get_term( (int) $item->object_id );
		if ( $term && ! is_wp_error( $term ) ) {
			$row['object_slug'] = $term->slug;
			$row['object']      = $term->taxonomy;
		}
	} elseif ( 'post_type_archive' === $item->type ) {
		$row['object'] = $item->object;
	}

	return $row;
}

function menu_only_io_import_payload( array $data, $with_locations, $is_restore, $keep_unresolved = false ) {
	$warnings = array();
	$errors   = array();
	$skipped  = array();
	$count    = 0;
	$slug_ids = array();
	$same_site = untrailingslashit( (string) ( $data['site_url'] ?? '' ) ) === untrailingslashit( home_url( '/' ) );

	foreach ( $data['menus'] as $menu_data ) {
		if ( ! is_array( $menu_data ) ) {
			continue;
		}
		$name = isset( $menu_data['name'] ) ? sanitize_text_field( $menu_data['name'] ) : '';
		$slug = isset( $menu_data['slug'] ) ? sanitize_title( $menu_data['slug'] ) : '';
		if ( $name === '' ) {
			continue;
		}

		$result = menu_only_io_replace_menu( $name, $slug, isset( $menu_data['items'] ) ? $menu_data['items'] : array(), $same_site, $data['site_url'] ?? '', $skipped, $warnings, $keep_unresolved );
		if ( is_wp_error( $result ) ) {
			$errors[] = $name . ': ' . $result->get_error_message();
			continue;
		}

		$menu_obj = wp_get_nav_menu_object( $result );
		if ( $menu_obj ) {
			$slug_ids[ $menu_obj->slug ] = (int) $result;
			if ( $slug ) {
				$slug_ids[ $slug ] = (int) $result;
			}
		}
		++$count;
	}

	if ( $with_locations && ! empty( $data['locations'] ) && is_array( $data['locations'] ) ) {
		$registered = get_registered_nav_menus();
		$locations  = get_nav_menu_locations();
		if ( ! is_array( $locations ) ) {
			$locations = array();
		}
		foreach ( $data['locations'] as $location => $menu_slug ) {
			$location  = sanitize_key( $location );
			$menu_slug = sanitize_title( $menu_slug );
			if ( ! isset( $registered[ $location ] ) ) {
				$warnings[] = $location . ' はこのテーマに無い位置なので割り当てませんでした';
				continue;
			}
			if ( isset( $slug_ids[ $menu_slug ] ) ) {
				$locations[ $location ] = $slug_ids[ $menu_slug ];
			}
		}
		set_theme_mod( 'nav_menu_locations', $locations );
	}

	unset( $is_restore );

	return array(
		'menus'    => $count,
		'warnings' => $warnings,
		'errors'   => $errors,
		'skipped'  => $skipped,
	);
}

function menu_only_io_replace_menu( $name, $slug, array $items, $same_site, $source_site_url, array &$skipped, array &$warnings, $keep_unresolved ) {
	$old = $slug ? wp_get_nav_menu_object( $slug ) : false;
	if ( ! $old ) {
		$old = wp_get_nav_menu_object( $name );
	}

	$temp_name = $name . ' [import ' . wp_generate_password( 6, false ) . ']';
	$new_id    = wp_create_nav_menu( wp_slash( $temp_name ) );
	if ( is_wp_error( $new_id ) ) {
		return $new_id;
	}

	$id_map = array( 0 => 0 );
	$created = array();

	foreach ( $items as $item ) {
		if ( ! is_array( $item ) ) {
			continue;
		}
		if ( isset( $item['status'] ) && 'draft' === $item['status'] ) {
			continue;
		}

		$built = menu_only_io_build_item_args( $item, $same_site, $source_site_url, $skipped, $warnings, $keep_unresolved );
		if ( null === $built ) {
			continue;
		}

		$parent_old = isset( $item['parent_id'] ) ? (int) $item['parent_id'] : 0;
		$built['menu-item-parent-id'] = 0;

		$item_id = wp_update_nav_menu_item( (int) $new_id, 0, $built );
		if ( ! $item_id || is_wp_error( $item_id ) ) {
			wp_delete_nav_menu( $new_id );
			$message = is_wp_error( $item_id ) ? $item_id->get_error_message() : '項目を作れませんでした';
			return new WP_Error( 'menu_item_failed', $message );
		}

		$old_id = isset( $item['id'] ) ? (int) $item['id'] : (int) $item_id;
		$id_map[ $old_id ] = (int) $item_id;
		$created[] = array(
			'new_id'     => (int) $item_id,
			'parent_old' => $parent_old,
			'args'       => $built,
		);
	}

	foreach ( $created as $row ) {
		$parent_new = isset( $id_map[ $row['parent_old'] ] ) ? $id_map[ $row['parent_old'] ] : 0;
		if ( ! $parent_new || $parent_new === $row['new_id'] ) {
			continue;
		}
		$row['args']['menu-item-parent-id'] = $parent_new;
		$updated = wp_update_nav_menu_item( (int) $new_id, $row['new_id'], $row['args'] );
		if ( is_wp_error( $updated ) ) {
			wp_delete_nav_menu( $new_id );
			return $updated;
		}
	}

	if ( $old ) {
		$deleted = wp_delete_nav_menu( (int) $old->term_id );
		if ( is_wp_error( $deleted ) ) {
			wp_delete_nav_menu( $new_id );
			return $deleted;
		}
	}

	$renamed = wp_update_nav_menu_object(
		(int) $new_id,
		array(
			'description' => '',
			'menu-name'   => wp_slash( $name ),
		)
	);
	if ( is_wp_error( $renamed ) ) {
		return $new_id;
	}

	return (int) $new_id;
}

function menu_only_io_build_item_args( array $item, $same_site, $source_site_url, array &$skipped, array &$warnings, $keep_unresolved ) {
	$type   = isset( $item['type'] ) ? sanitize_key( $item['type'] ) : 'custom';
	$object = isset( $item['object'] ) ? sanitize_key( $item['object'] ) : '';
	$title  = isset( $item['title'] ) ? wp_strip_all_tags( $item['title'] ) : '';
	$url    = isset( $item['url'] ) ? $item['url'] : '';
	$label  = $title !== '' ? $title : '(無題)';

	$object_id = 0;
	if ( 'post_type' === $type ) {
		$object_id = menu_only_io_resolve_post( $object, $item, $same_site );
		if ( ! $object_id ) {
			$placeholder = menu_only_io_unresolved_placeholder( $label, $url, $source_site_url, '（投稿がこのサイトに無いので公式 Importer と同じくスキップ）', $keep_unresolved, $skipped, $warnings, isset( $item['object_path'] ) ? (string) $item['object_path'] : '' );
			if ( null === $placeholder ) {
				return null;
			}
			$type      = $placeholder['type'];
			$object    = $placeholder['object'];
			$object_id = 0;
			$url       = $placeholder['url'];
		} else {
			$url = '';
		}
	} elseif ( 'taxonomy' === $type ) {
		$object_id = menu_only_io_resolve_term( $object, $item );
		if ( ! $object_id ) {
			$placeholder = menu_only_io_unresolved_placeholder( $label, $url, $source_site_url, '（タクソノミーがこのサイトに無いのでスキップ）', $keep_unresolved, $skipped, $warnings );
			if ( null === $placeholder ) {
				return null;
			}
			$type      = $placeholder['type'];
			$object    = $placeholder['object'];
			$object_id = 0;
			$url       = $placeholder['url'];
		} else {
			$url = '';
		}
	} elseif ( 'post_type_archive' === $type ) {
		if ( ! $object || ! get_post_type_object( $object ) ) {
			$placeholder = menu_only_io_unresolved_placeholder( $label, $url, $source_site_url, '（投稿タイプがこのサイトに無いのでスキップ）', $keep_unresolved, $skipped, $warnings );
			if ( null === $placeholder ) {
				return null;
			}
			$type      = $placeholder['type'];
			$object    = $placeholder['object'];
			$object_id = 0;
			$url       = $placeholder['url'];
		}
	} else {
		$type   = 'custom';
		$object = 'custom';
		$url    = menu_only_io_rewrite_url( $url, $source_site_url );
		if ( $url === '' ) {
			$placeholder = menu_only_io_unresolved_placeholder( $label, '', $source_site_url, '（URL が空のカスタムリンクなのでスキップ）', $keep_unresolved, $skipped, $warnings );
			if ( null === $placeholder ) {
				return null;
			}
			$url = $placeholder['url'];
		}
	}

	$classes = isset( $item['classes'] ) ? (array) $item['classes'] : array();

	return array(
		'menu-item-object-id'   => $object_id,
		'menu-item-object'      => $object,
		'menu-item-position'    => isset( $item['position'] ) ? (int) $item['position'] : 0,
		'menu-item-type'        => $type,
		'menu-item-title'       => wp_slash( $title ),
		'menu-item-url'         => $url,
		'menu-item-description' => wp_slash( isset( $item['description'] ) ? (string) $item['description'] : '' ),
		'menu-item-attr-title'  => wp_slash( isset( $item['attr_title'] ) ? (string) $item['attr_title'] : '' ),
		'menu-item-target'      => isset( $item['target'] ) ? sanitize_key( $item['target'] ) : '',
		'menu-item-classes'     => implode( ' ', array_map( 'sanitize_html_class', $classes ) ),
		'menu-item-xfn'         => isset( $item['xfn'] ) ? $item['xfn'] : '',
		'menu-item-status'      => 'publish',
	);
}

function menu_only_io_unresolved_placeholder( $label, $url, $source_site_url, $skip_suffix, $keep_unresolved, array &$skipped, array &$warnings, $object_path = '' ) {
	if ( ! $keep_unresolved ) {
		$skipped[] = $label . $skip_suffix;
		return null;
	}

	$rewritten = menu_only_io_rewrite_url( $url, $source_site_url );
	if ( $rewritten === '' && $object_path !== '' ) {
		$rewritten = home_url( '/' . trim( $object_path, '/' ) . '/' );
	}
	if ( $rewritten === '' ) {
		$rewritten = home_url( '/#menu-placeholder' );
	}

	$warnings[] = $label . '（リンク先が無いのでカスタムリンクとして残しました）';

	return array(
		'type'   => 'custom',
		'object' => 'custom',
		'url'    => $rewritten,
	);
}

function menu_only_io_rewrite_url( $url, $source_site_url ) {
	$url = trim( (string) $url );
	if ( $url === '' ) {
		return '';
	}
	$source = untrailingslashit( (string) $source_site_url );
	$dest   = untrailingslashit( home_url() );
	if ( $source !== '' && $dest !== '' && str_starts_with( $url, $source ) ) {
		$url = $dest . substr( $url, strlen( $source ) );
	}
	return esc_url_raw( $url );
}

function menu_only_io_resolve_post( $post_type, array $item, $same_site ) {
	$post_type = $post_type ? $post_type : 'page';
	$path      = isset( $item['object_path'] ) ? trim( (string) $item['object_path'], '/' ) : '';
	$slug      = isset( $item['object_slug'] ) ? (string) $item['object_slug'] : '';

	if ( $path !== '' ) {
		$found = get_page_by_path( $path, OBJECT, $post_type );
		if ( $found instanceof WP_Post ) {
			return (int) $found->ID;
		}
	}

	if ( $slug !== '' ) {
		$found = get_posts(
			array(
				'name'           => $slug,
				'post_type'      => $post_type,
				'post_status'    => array( 'publish', 'private' ),
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);
		if ( $found ) {
			return (int) $found[0];
		}
	}

	if ( $same_site && ! empty( $item['object_id'] ) ) {
		$post = get_post( (int) $item['object_id'] );
		if ( $post instanceof WP_Post && $post->post_type === $post_type ) {
			return (int) $post->ID;
		}
	}

	return 0;
}

function menu_only_io_resolve_term( $taxonomy, array $item ) {
	$taxonomy = $taxonomy ? $taxonomy : '';
	$slug     = isset( $item['object_slug'] ) ? (string) $item['object_slug'] : '';
	if ( $taxonomy && $slug !== '' ) {
		$term = get_term_by( 'slug', $slug, $taxonomy );
		if ( $term && ! is_wp_error( $term ) ) {
			return (int) $term->term_id;
		}
	}
	return 0;
}
