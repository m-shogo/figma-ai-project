<?php
/**
 * Seed REF-001 learning Page content through ACF field keys.
 *
 * Usage:
 *   wp eval-file seed-ref001.php /absolute/or/relative/seed-payload.json
 *   wp eval-file seed-ref001.php /path/to/seed-payload.json create
 *
 * The optional positional "create" allows creation of a DRAFT fixture Page.
 * Without it, a missing Page is a hard failure.
 *
 * Do not introduce PHP-version-specific convenience functions here until the
 * target theme's PHP support contract has been inspected and frozen.
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	fwrite( STDERR, "This script must run through WP-CLI eval-file.\n" );
	exit( 1 );
}

if ( ! function_exists( 'update_field' ) || ! function_exists( 'get_field' ) ) {
	WP_CLI::error( 'ACF field functions are unavailable. Activate ACF and import/sync the field group first.' );
}

$payload_path = isset( $args[0] ) ? (string) $args[0] : '';
$allow_create = isset( $args[1] ) && 'create' === (string) $args[1];

if ( '' === $payload_path || ! is_file( $payload_path ) ) {
	WP_CLI::error( 'Pass an existing seed payload JSON file as the first positional argument.' );
}

$payload_raw = file_get_contents( $payload_path );
$payload     = json_decode( $payload_raw, true );
$schema_version = is_array( $payload ) ? (int) ( $payload['schema_version'] ?? 0 ) : 0;

if ( ! is_array( $payload ) || ! in_array( $schema_version, array( 1, 2 ), true ) ) {
	WP_CLI::error( 'Seed payload must be a supported schema_version=1 or schema_version=2 JSON object.' );
}

$page = $payload['page'] ?? null;
if ( ! is_array( $page ) || 'page' !== ( $page['post_type'] ?? '' ) ) {
	WP_CLI::error( 'Seed payload must target post_type=page.' );
}

$slug     = sanitize_title( (string) ( $page['slug'] ?? '' ) );
$title    = sanitize_text_field( (string) ( $page['title'] ?? '' ) );
$status   = sanitize_key( (string) ( $page['status'] ?? 'draft' ) );
$template = (string) ( $page['template'] ?? '' );

if ( '' === $slug || '' === $title || '' === $template ) {
	WP_CLI::error( 'Seed payload page requires title, slug, and template.' );
}

$existing = get_page_by_path( $slug, OBJECT, 'page' );
if ( $existing instanceof WP_Post ) {
	$post_id = (int) $existing->ID;
	WP_CLI::log( sprintf( 'Using existing fixture Page #%d (%s).', $post_id, $slug ) );
} else {
	if ( ! $allow_create ) {
		WP_CLI::error( sprintf( 'Fixture Page "%s" does not exist. Re-run with positional argument "create" to create a draft fixture Page.', $slug ) );
	}

	$post_id = wp_insert_post(
		array(
			'post_type'   => 'page',
			'post_title'  => $title,
			'post_name'   => $slug,
			'post_status' => in_array( $status, array( 'draft', 'private', 'publish' ), true ) ? $status : 'draft',
		),
		true
	);

	if ( is_wp_error( $post_id ) ) {
		WP_CLI::error( $post_id->get_error_message() );
	}

	$post_id = (int) $post_id;
	WP_CLI::log( sprintf( 'Created fixture Page #%d (%s).', $post_id, $slug ) );
}

update_post_meta( $post_id, '_wp_page_template', $template );

$fields  = $payload['fields'] ?? array();
$updated = 0;
$skipped = 0;
$failed  = 0;

if ( ! is_array( $fields ) ) {
	WP_CLI::error( 'Seed payload fields must be an array.' );
}

foreach ( $fields as $row ) {
	if ( ! is_array( $row ) ) {
		++$failed;
		WP_CLI::warning( 'Skipping malformed field row.' );
		continue;
	}

	$field_key    = (string) ( $row['field_key'] ?? '' );
	$field_name   = (string) ( $row['field_name'] ?? '' );
	$field_type   = (string) ( $row['field_type'] ?? '' );
	$field_value  = $row['value'] ?? null;
	$field_status = (string) ( $row['status'] ?? '' );

	if ( 0 !== strpos( $field_key, 'field_' ) ) {
		++$failed;
		WP_CLI::warning( sprintf( 'Skipping %s: stable field key is missing.', $field_name ?: '<unnamed>' ) );
		continue;
	}

	if ( 'READY' !== $field_status || null === $field_value ) {
		++$skipped;
		WP_CLI::log( sprintf( 'SKIP %s (%s): unresolved fixture value.', $field_name, $field_key ) );
		continue;
	}

	if ( 'image' === $field_type ) {
		$field_value = absint( $field_value );
		if ( ! $field_value ) {
			++$failed;
			WP_CLI::warning( sprintf( 'Skipping %s: image attachment ID must be a positive integer.', $field_name ) );
			continue;
		}
	}

	// Use the field KEY for new values so ACF creates the correct reference meta.
	update_field( $field_key, $field_value, $post_id );
	$stored = get_field( $field_key, $post_id, false );

	if ( is_scalar( $field_value ) && is_scalar( $stored ) && (string) $stored === (string) $field_value ) {
		++$updated;
		WP_CLI::log( sprintf( 'OK   %s (%s)', $field_name, $field_key ) );
	} else {
		++$failed;
		WP_CLI::warning( sprintf( 'Verification failed for %s (%s).', $field_name, $field_key ) );
	}
}

if ( $failed > 0 ) {
	WP_CLI::error(
		sprintf(
			'Seed completed with failures: updated=%d skipped=%d failed=%d page_id=%d',
			$updated,
			$skipped,
			$failed,
			$post_id
		)
	);
}

WP_CLI::success(
	sprintf(
		'Seed complete: updated=%d skipped=%d failed=0 page_id=%d template=%s schema=%d',
		$updated,
		$skipped,
		$post_id,
		$template,
		$schema_version
	)
);
