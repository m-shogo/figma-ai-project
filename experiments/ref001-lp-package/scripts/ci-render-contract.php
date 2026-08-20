<?php
/**
 * LP パッケージの自動チェック。
 *
 * 実際の WordPress / ACF PRO が無くても壊れを検出できるように、
 * WordPress の関数を最低限だけ用意してテンプレートを描画し、
 * 出来上がった HTML と CSS を機械的に検査します。
 *
 * 使い方:
 *   php scripts/ci-render-contract.php .
 */

error_reporting( E_ALL );
ini_set( 'display_errors', '1' );

$pkg = $argv[1] ?? null;
if ( ! $pkg || ! is_dir( $pkg ) ) {
	fwrite( STDERR, "usage: ci-render-contract.php <lp-package-dir>\n" );
	exit( 2 );
}
$pkg = rtrim( $pkg, '/' );

$failures = 0;

function check( bool $ok, string $message ): void {
	global $failures;
	if ( $ok ) {
		echo "PASS: $message\n";
		return;
	}
	echo "FAIL: $message\n";
	$failures++;
}


/* ===========================================================
   1. CSS — 相対 url() がすべて実ファイルに解決するか
   =========================================================== */

$css_path = $pkg . '/lp/css/ref001.css';
$css      = file_get_contents( $css_path );
check( $css !== false, 'lp/css/ref001.css が読める' );

preg_match_all( "/url\\(\\s*'(\\.\\.\\/[^']+)'\\s*\\)/", $css, $m );
$missing = array();
foreach ( array_unique( $m[1] ) as $rel ) {
	if ( realpath( dirname( $css_path ) . '/' . $rel ) === false ) {
		$missing[] = $rel;
	}
}
check( count( $m[1] ) > 0, 'CSS に相対 url() が存在する（検査対象がある）' );
check( empty( $missing ), 'CSS の相対 url() がすべて実ファイルに解決する' . ( $missing ? ': ' . implode( ', ', $missing ) : '' ) );


/* ===========================================================
   2. CSS — ブレークポイントが 767/768 の1本だけか
   =========================================================== */

/* 幅で切り替えている @media だけを見る。
   prefers-reduced-motion などの「幅と関係ない」クエリは対象外。

   方針: スマホとPCの2つだけ。素の指定がスマホで、PC は min-width: 768px。
   モバイルファーストなので max-width の @media は書かない。 */
preg_match_all( '/@media[^{]+/', $css, $mq );
$bad_bp = array();
foreach ( array_unique( $mq[0] ) as $q ) {
	if ( strpos( $q, 'width' ) === false ) {
		continue;
	}
	if ( ! preg_match( '/min-width:\s*768px/', $q ) ) {
		$bad_bp[] = trim( $q );
	}
}
check(
	empty( $bad_bp ),
	'幅で切り替える @media は min-width: 768px だけ（モバイルファースト / 中間ブレークポイントなし）'
		. ( $bad_bp ? ': ' . implode( ' | ', $bad_bp ) : '' )
);
check( ! preg_match( '/\b(1299|1300)px\b/', $css ), '廃止済みの 1299/1300px が残っていない' );


/* ===========================================================
   2b. CSS — clamp() の最小値が最大値を超えていないか

   clamp(最小, 推奨, 最大) は最小 > 最大 と書いてもエラーにならず、
   黙って最小値で固定されます。気づきにくいので機械で検算します。
   =========================================================== */

$to_px = static function ( string $tok ) {
	$tok = trim( $tok );
	if ( preg_match( '/^([\d.]+)rem$/', $tok, $mm ) ) { return (float) $mm[1] * 16; }
	if ( preg_match( '/^([\d.]+)px$/', $tok, $mm ) )  { return (float) $mm[1]; }
	return null;
};
preg_match_all( '/clamp\(([^()]*(?:\([^()]*\)[^()]*)*)\)/', $css, $clamps );
$bad_clamp = array();
foreach ( $clamps[0] as $i => $whole ) {
	$parts = explode( ',', $clamps[1][ $i ] );
	if ( count( $parts ) !== 3 ) { continue; }
	$lo = $to_px( $parts[0] );
	$hi = $to_px( $parts[2] );
	if ( $lo !== null && $hi !== null && $lo > $hi ) {
		$bad_clamp[] = $whole;
	}
}
check( empty( $bad_clamp ), 'clamp() の最小値が最大値を超えていない' . ( $bad_clamp ? ': ' . implode( ' | ', $bad_clamp ) : '' ) );


/* ===========================================================
   2c. CSS — position: absolute を使ってよい場所だけに限定できているか

   レイアウト（並べる・そろえる）は flex / grid で組む方針です。
   absolute を使ってよいのは「箱の外へはみ出すあしらい」だけ、と決めています。
   下のリストに無いセレクタで absolute が出てきたら、
   「grid の同じマス」「マイナスマージン」「justify-self」で
   組み直せないか検討してください。
   =========================================================== */

$absolute_allowlist = array(
	'c-bubble'            => '吹き出しの尻尾（箱の外へ出す三角）',
	'p-voice__balloon'    => '吹き出しの尻尾（箱の外へ出す三角）',
	'p-footer__pagetop'   => 'フッター右下のページトップボタン',
	'p-mv__oc'            => 'OPEN CAMPUS バッジ（写真へ重ねる）',
	'p-mv__oc-balloon'    => 'バッジの吹き出し',
	'p-mv__oc-arrow'      => 'バッジの矢印',
	'p-education__step'   => 'カードの影（青→紫のグラデーション）とカード間の矢印',
	'p-links__item'       => '丸いリンクの影の円（本体の円の外へずらして重ねる）',
	'.p-invite'           => 'INVITE の内側の飾り枠',
);

$css_without_comments = preg_replace( '#/\*.*?\*/#s', '', $css );

/* 「直前のセレクタ行 … position: absolute」を拾って、許可リストと突き合わせる */
$absolute_users = array();
$lines = explode( "\n", $css_without_comments );
$current_selector = '';
$block_stack = array();
foreach ( $lines as $line ) {
	if ( strpos( $line, '{' ) !== false ) {
		$current_selector = trim( strtok( $line, '{' ) );
		$block_stack[] = $current_selector;
	}
	if ( strpos( $line, '}' ) !== false && $block_stack ) {
		array_pop( $block_stack );
	}
	if ( preg_match( '/position\s*:\s*absolute/', $line ) ) {
		/* 「&::before」のように単体では判断できない書き方があるので、
		   外側のブロック名も含めて許可リストと突き合わせる */
		$absolute_users[] = implode( ' ', $block_stack );
	}
}

$unexpected = array();
foreach ( $absolute_users as $sel ) {
	$ok = false;
	foreach ( array_keys( $absolute_allowlist ) as $allowed ) {
		if ( strpos( $sel, $allowed ) !== false ) { $ok = true; break; }
	}
	if ( ! $ok ) { $unexpected[] = $sel; }
}

check(
	empty( $unexpected ),
	'position: absolute は「あしらい」だけに限定されている（' . count( $absolute_users ) . '箇所）'
		. ( $unexpected ? ' — 許可リスト外: ' . implode( ' / ', $unexpected ) : '' )
);
check(
	! preg_match( '/:hover[^{]*\{[^}]*position\s*:\s*absolute/', $css_without_comments ),
	'hover の中で position: absolute を使っていない'
);


/* ===========================================================
   3. テンプレートを描画する（WordPress スタブ）
   =========================================================== */

function get_stylesheet_directory_uri() { return 'https://example.test/wp-content/themes/example'; }
function trailingslashit( $s ) { return rtrim( $s, '/' ) . '/'; }
function esc_url( $s ) { return htmlspecialchars( $s, ENT_QUOTES, 'UTF-8' ); }
function language_attributes() { echo 'lang="ja"'; }
function bloginfo( $k ) { echo $k === 'charset' ? 'UTF-8' : ''; }
function body_class( $extra = '' ) { echo 'class="' . htmlspecialchars( (string) $extra, ENT_QUOTES, 'UTF-8' ) . '"'; }
function wp_head() { echo '<!--WP_HEAD-->'; }
function wp_footer() { echo '<!--WP_FOOTER-->'; }

$enqueued = array( 'style' => array(), 'script' => array() );
function wp_enqueue_style( $h, $src, $d, $v ) { global $enqueued; $enqueued['style'][ $h ] = $src; }
function wp_enqueue_script( $h, $src, $d, $v, $f ) { global $enqueued; $enqueued['script'][ $h ] = $src; }

ob_start();
include $pkg . '/lp-originalPage.php';
$page = ob_get_clean();


/* ===========================================================
   4. ページの土台 — 単独ドキュメントになっているか
   =========================================================== */

check( str_starts_with( $page, '<!DOCTYPE html>' ), '<!DOCTYPE html> から始まる単独ドキュメント（get_header() を使っていない）' );
check( substr_count( $page, '<html' ) === 1 && substr_count( $page, '</html>' ) === 1, '<html> は1組だけ（テーマのheader/footerで二重に包まれていない）' );

$head_pos   = strpos( $page, '<!--WP_HEAD-->' );
$main_pos   = strpos( $page, '<main' );
$footer_pos = strpos( $page, '<!--WP_FOOTER-->' );
$mainend    = strpos( $page, '</main>' );

check( $head_pos !== false && $head_pos < $main_pos, 'wp_head() が <head> 内・本文より前で呼ばれている' );
check( $footer_pos !== false && $footer_pos > $mainend, 'wp_footer() が本文より後・</body> 直前で呼ばれている' );


/* ===========================================================
   5. CSS / JS の読み込み方
   =========================================================== */

check(
	isset( $enqueued['style']['ref001-lp-style'] ) && str_ends_with( $enqueued['style']['ref001-lp-style'], '/lp/css/ref001.css' ),
	'CSS を wp_enqueue_style() でその場で登録している'
);
check(
	isset( $enqueued['script']['ref001-lp-script'] ) && str_ends_with( $enqueued['script']['ref001-lp-script'], '/lp/js/ref001-interactions.js' ),
	'JS を wp_enqueue_script() でその場で登録している'
);

$tpl_src = file_get_contents( $pkg . '/lp-originalPage.php' );

/* コメントには「なぜ add_action を使わないか」の説明が書いてあるので、
   コメントを取り除いた実コードだけを見て判定します。 */
$tpl_code = '';
foreach ( token_get_all( $tpl_src ) as $token ) {
	if ( is_array( $token ) && in_array( $token[0], array( T_COMMENT, T_DOC_COMMENT ), true ) ) {
		continue;
	}
	$tpl_code .= is_array( $token ) ? $token[1] : $token;
}

check(
	! preg_match( "/add_action\\s*\\(\\s*['\"]wp_enqueue_scripts['\"]/", $tpl_code ),
	"add_action('wp_enqueue_scripts', ...) を使っていない（フックが先に終わっていて発火せず CSS が当たらなくなるため）"
);
check(
	strpos( $page, '<link' ) === false && strpos( $page, '<script' ) === false,
	'<link>/<script> を本文へ直書きしていない'
);


/* ===========================================================
   6. セクションの並び
   =========================================================== */

$order = array( 'p-header', 'p-mv', 'p-reason', 'p-education', 'p-cta', 'p-voice', 'p-messages', 'p-courses', 'p-links', 'p-invite', 'p-footer' );
$last  = -1;
$order_ok = true;
foreach ( $order as $cls ) {
	$at = strpos( $page, 'class="' . $cls );
	if ( $at === false || $at < $last ) { $order_ok = false; break; }
	$last = $at;
}
check( $order_ok, 'セクションが Header→MV→…→Footer の順で並んでいる' );
check( substr_count( $page, 'class="p-cta"' ) === 2, 'CTA セクションが2回出てくる' );

/* 旧実装のクラス名が残っていないか（作り直しの取りこぼし検出） */
check( ! preg_match( '/class="[^"]*\bref-[a-z]/', $page ), '旧クラス名（ref-*）が残っていない' );


/* ===========================================================
   7. テンプレートが参照する画像がすべて存在するか
   =========================================================== */

preg_match_all( "/\\\$lp_base\\s*\\.\\s*'([^']+)'/", $tpl_src, $assets );
$missing_assets = array();
foreach ( array_unique( $assets[1] ) as $rel ) {
	if ( ! is_file( $pkg . '/lp/' . $rel ) ) {
		$missing_assets[] = $rel;
	}
}
check( empty( $missing_assets ), 'テンプレートが参照する素材がすべて lp/ に存在する' . ( $missing_assets ? ': ' . implode( ', ', $missing_assets ) : '' ) );


/* ===========================================================
   8. ACF 差し替え版 — 未設定時 / 値を入れた時
   別プロセスで動かします（ACF関数の有無を分けるため）
   =========================================================== */

$run = function ( string $mode ) use ( $pkg ) {
	$script = <<<'PHP'
<?php
error_reporting(E_ALL); ini_set('display_errors','1');
list($pkg, $mode) = [$argv[1], $argv[2]];
$lp_base = 'lp/';
function esc_url($s){ return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

if ($mode === 'acf') {
    $GLOBALS['D'] = [
        'ref001_student_voices' => [[
            'avatar' => ['url'=>'https://cdn.test/a.jpg','alt'=>'A'], 'detail_photo' => null,
            'title'=>'CI_MUT_TITLE','profile'=>'P','school'=>'S','body'=>'B',
            'lesson'=>'L','reason'=>'R','advice'=>'A']],
        'ref001_swiper_slides' => [
            ['photo'=>['url'=>'https://cdn.test/s.jpg','alt'=>''],'quote'=>"CI_MUT_L1\nCI_MUT_L2",'profile'=>'P','school'=>'S'],
            ['photo'=>null,'quote'=>'CI_MUT_B','profile'=>'P','school'=>'S'],
        ],
    ];
    $GLOBALS['C']=null; $GLOBALS['I']=-1;
    function have_rows($f){ $r=$GLOBALS['D'][$f]??[]; if($GLOBALS['C']!==$f){$GLOBALS['C']=$f;$GLOBALS['I']=-1;} return $GLOBALS['I']+1<count($r); }
    function the_row(){ $GLOBALS['I']++; }
    function get_sub_field($n){ $r=$GLOBALS['D'][$GLOBALS['C']]??[]; return $r[$GLOBALS['I']][$n]??null; }
}

ob_start(); include $pkg . '/lp/acf-swap/student-voice-acf.php'; echo ob_get_clean();
if ($mode === 'acf') { $GLOBALS['C']=null; $GLOBALS['I']=-1; }
ob_start(); include $pkg . '/lp/acf-swap/swiper-acf.php'; echo ob_get_clean();
PHP;
	$tmp = tempnam( sys_get_temp_dir(), 'lp-acf-' ) . '.php';
	file_put_contents( $tmp, $script );
	$out = shell_exec( escapeshellarg( PHP_BINARY ) . ' ' . escapeshellarg( $tmp ) . ' ' . escapeshellarg( $pkg ) . ' ' . escapeshellarg( $mode ) . ' 2>&1' );
	unlink( $tmp );
	return (string) $out;
};

$fallback = $run( 'fallback' );
$mutated  = $run( 'acf' );

$no_php_error = static function ( string $html ): bool {
	return strpos( $html, 'PHP Warning' ) === false
		&& strpos( $html, 'PHP Notice' ) === false
		&& strpos( $html, 'PHP Fatal' ) === false
		&& strpos( $html, 'Deprecated' ) === false;
};

/* 未設定時 = 直書き版と同じ内容が出る */
check( $no_php_error( $fallback ), 'ACF 未設定でも PHP の警告 / エラーが出ない' );
check( substr_count( $fallback, '<article class="p-voice__item' ) === 3, 'ACF 未設定時: 学生の声が3件出る' );
check( substr_count( $fallback, 'is-open' ) === 1, 'ACF 未設定時: 1件目だけ開いている' );
check( substr_count( $fallback, 'swiper-slide p-messages__slide' ) === 4, 'ACF 未設定時: スライドが4枚出る' );
check( str_contains( $fallback, 'まだやりたいことが決まっていなくても大丈夫だった。' ), 'ACF 未設定時: 直書き版と同じ文言が出る' );

/* 値を入れた時 = 中身が本当に変わる */
check( $no_php_error( $mutated ), 'ACF 設定時も PHP の警告 / エラーが出ない' );
check( str_contains( $mutated, 'CI_MUT_TITLE' ), 'ACF 設定時: 入力した見出しが反映される' );
check( ! str_contains( $mutated, 'まだやりたいことが決まっていなくても大丈夫だった。' ), 'ACF 設定時: 直書きの文言に戻らない' );
check( substr_count( $mutated, '<article class="p-voice__item' ) === 1, 'ACF 設定時: 件数が入力どおり（1件）になる' );
check( str_contains( $mutated, 'cdn.test/a.jpg' ), 'ACF 設定時: 入力した画像が使われる' );
check( substr_count( $mutated, 'swiper-slide p-messages__slide' ) === 2, 'ACF 設定時: スライド枚数が入力どおり（2枚）になる' );
check( str_contains( $mutated, 'CI_MUT_L1' ) && str_contains( $mutated, 'CI_MUT_L2' ), 'ACF 設定時: 改行が行ごとの帯に分かれる' );

/* 差し替え版と直書き版でセクションの作りが一致しているか */
check(
	str_contains( $fallback, '<section class="p-voice">' ) && str_contains( $page, '<section class="p-voice">' ),
	'差し替え版と直書き版で学生の声のセクション構造が同じ'
);
check(
	str_contains( $fallback, '<section class="p-messages">' ) && str_contains( $page, '<section class="p-messages">' ),
	'差し替え版と直書き版で MESSAGES のセクション構造が同じ'
);


/* ===========================================================
   結果
   =========================================================== */

echo "\n";
if ( $failures > 0 ) {
	echo "FAILED: {$failures} 件\n";
	exit( 1 );
}
echo "ALL PASS\n";
