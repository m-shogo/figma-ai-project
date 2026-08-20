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
		$pc_url  = (string) $acf_image['url'];
		$sp_url  = $pc_url;
		$alt     = (string) ( $acf_image['alt'] ?? '' );
		$pc_size = array( (int) ( $acf_image['width'] ?? 0 ), (int) ( $acf_image['height'] ?? 0 ) );
		$sp_size = $pc_size;
	} else {
		$pc_url  = $lp_base . 'image/photos/pc/' . $pc;
		$sp_url  = $lp_base . 'image/photos/sp/' . $sp;
		$alt     = '';
		$pc_size = lp_image_size( 'image/photos/pc/' . $pc );
		$sp_size = lp_image_size( 'image/photos/sp/' . $sp );
	}

	printf( '<picture class="%s">', htmlspecialchars( $class, ENT_QUOTES, 'UTF-8' ) );
	printf(
		'<source media="(max-width: 767px)"%s srcset="%s">',
		lp_size_attrs( $sp_size ),
		htmlspecialchars( $sp_url, ENT_QUOTES, 'UTF-8' )
	);
	printf(
		'<img%s src="%s" alt="%s" loading="lazy" decoding="async">',
		lp_size_attrs( $pc_size ),
		htmlspecialchars( $pc_url, ENT_QUOTES, 'UTF-8' ),
		htmlspecialchars( $alt, ENT_QUOTES, 'UTF-8' )
	);
	echo '</picture>';
}

/**
 * lp/ 以下の画像の実寸を返します。
 *
 * img に width / height を書いておくと、読み込みが終わる前でも
 * ブラウザが表示場所の高さを確保できるので、画面がガタつきません。
 *
 * @return array{0:int,1:int} 幅と高さ。分からないときは 0, 0
 */
function lp_image_size( string $relative_path ): array {
	static $cache = array();

	if ( isset( $cache[ $relative_path ] ) ) {
		return $cache[ $relative_path ];
	}

	$file = dirname( __DIR__ ) . '/' . ltrim( $relative_path, '/' );
	$size = is_readable( $file ) ? @getimagesize( $file ) : false;

	$cache[ $relative_path ] = $size ? array( (int) $size[0], (int) $size[1] ) : array( 0, 0 );

	return $cache[ $relative_path ];
}

/**
 * width / height 属性の文字列を作ります。実寸が分からないときは何も出しません。
 */
function lp_size_attrs( array $size ): string {
	if ( empty( $size[0] ) || empty( $size[1] ) ) {
		return '';
	}

	return sprintf( ' width="%d" height="%d"', $size[0], $size[1] );
}

/** 改行区切りの文字列を、空行を除いた配列にする */
function lp_lines( $text ): array {
	$lines = preg_split( '/\r\n|\r|\n/', (string) $text );
	return array_values( array_filter( $lines, static function ( $line ) {
		return trim( $line ) !== '';
	} ) );
}
