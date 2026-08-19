<?php
/**
 * ACF 差し替え版の共通ヘルパー。
 *
 * student-voice-acf.php / swiper-acf.php から読み込まれます。
 * lp-originalPage.php（直書き版）はこのファイルを使いません。
 *
 * $lp_base（= テーマURL + /lp/）は呼び出し元で定義済みの想定ですが、
 * 念のためここでも用意しておきます。
 */

if ( ! isset( $lp_base ) || $lp_base === '' ) {
	$lp_base = function_exists( 'get_stylesheet_directory_uri' )
		? rtrim( get_stylesheet_directory_uri(), '/' ) . '/lp/'
		: 'lp/';
}

/** エスケープして出力する短縮版 */
function lp_e( $value ) {
	echo htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' );
}

/**
 * ACF の繰り返しフィールドを配列で返す。
 *
 * ACF が無効・未設定・0件のときは $fallback をそのまま返すので、
 * 直書き版と同じ内容が表示され、PHP の警告も出ません。
 */
function lp_rows( string $field, array $sub_fields, array $fallback ): array {
	if ( function_exists( 'have_rows' ) && function_exists( 'the_row' ) && function_exists( 'get_sub_field' ) ) {
		if ( have_rows( $field ) ) {
			$rows = array();
			while ( have_rows( $field ) ) {
				the_row();
				$row = array();
				foreach ( $sub_fields as $name ) {
					$row[ $name ] = get_sub_field( $name );
				}
				$rows[] = $row;
			}
			if ( ! empty( $rows ) ) {
				return $rows;
			}
		}
	}

	return $fallback;
}

/**
 * 写真を <picture> で出力する。
 *
 * $acf_image … ACF の画像フィールドの値（あればこちらを優先）
 * $pc / $sp  … 差し替えが無いときに使う lp/image/photos/ 以下のファイル名
 */
function lp_picture( string $lp_base, $acf_image, string $pc, string $sp, string $class = '' ): void {
	if ( ! empty( $acf_image['url'] ) ) {
		$pc_url = (string) $acf_image['url'];
		$sp_url = $pc_url;
		$alt    = (string) ( $acf_image['alt'] ?? '' );
	} else {
		$pc_url = $lp_base . 'image/photos/pc/' . $pc;
		$sp_url = $lp_base . 'image/photos/sp/' . $sp;
		$alt    = '';
	}

	printf( '<picture class="%s">', htmlspecialchars( $class, ENT_QUOTES, 'UTF-8' ) );
	printf(
		'<source media="(max-width: 767px)" srcset="%s">',
		htmlspecialchars( $sp_url, ENT_QUOTES, 'UTF-8' )
	);
	printf(
		'<img src="%s" alt="%s" loading="lazy" decoding="async">',
		htmlspecialchars( $pc_url, ENT_QUOTES, 'UTF-8' ),
		htmlspecialchars( $alt, ENT_QUOTES, 'UTF-8' )
	);
	echo '</picture>';
}

/** 改行区切りの文字列を、空行を除いた配列にする */
function lp_lines( $text ): array {
	$lines = preg_split( '/\r\n|\r|\n/', (string) $text );
	return array_values( array_filter( $lines, static function ( $line ) {
		return trim( $line ) !== '';
	} ) );
}
