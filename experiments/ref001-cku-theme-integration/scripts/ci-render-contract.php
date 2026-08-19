<?php
/**
 * CI render-contract smoke test for the REF-001 x cku overlay.
 *
 * Renders overlay/page-ref001.php twice against a minimal WordPress-function
 * stub harness (no real WordPress/ACF PRO required, since neither is
 * available in CI without a licensed secret):
 *
 *   1. ACF absent            -> must render the exact Human-Reviewed fixture
 *                                content, no PHP warnings/errors.
 *   2. ACF present, mutated  -> must render the mutated repeater content,
 *                                proving the ACF wiring actually changes the
 *                                DOM rather than only "not crashing".
 *
 * This is a code-level contract proof, not a substitute for a real ACF PRO
 * FULL E2E run (experiments/wordpress-acf-pro-standalone-lp `make qa`,
 * which needs the human operator's ACF_PRO_LICENSE_KEY secret).
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

$overlay = $argv[1] ?? null;
if (!$overlay || !is_dir($overlay)) {
    fwrite(STDERR, "usage: ci-render-contract.php <overlay-dir>\n");
    exit(2);
}

function assert_true(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

// ---------------------------------------------------------------------
// Pass 1: fixture fallback (no ACF functions defined at all)
// ---------------------------------------------------------------------

function ref001_ci_render_fixture(string $overlay): string
{
    ob_start();
    (function () use ($overlay) {
        $GLOBALS['__overlay'] = $overlay;
        require $overlay . '/functions/ref001-integration.php';
        require $overlay . '/page-ref001.php';
    })();
    return ob_get_clean();
}

function get_header() { echo "<!--HEADER-->\n"; }
function get_footer() { echo "<!--FOOTER-->\n"; }
function get_stylesheet_directory_uri() { return 'https://example.test/wp-content/themes/cku'; }
function get_stylesheet_directory() { return $GLOBALS['__overlay']; }
function is_page_template($t) { return true; }
function wp_enqueue_style(...$a) {}
function wp_enqueue_script(...$a) {}
function add_action(...$a) {}

$fixtureHtml = ref001_ci_render_fixture($overlay);

assert_true(strpos($fixtureHtml, '私が千葉経済大学を') !== false, 'fixture pass renders Student Voice heading');
assert_true(substr_count($fixtureHtml, 'ref-voice-item--collapsed') === 2, 'fixture pass: 2 collapsed voice items (item 1 open)');
assert_true(substr_count($fixtureHtml, 'ref-voice-item--open') === 1, 'fixture pass: exactly 1 open voice item');
assert_true(substr_count($fixtureHtml, 'swiper-slide ref-messages__slide') === 4, 'fixture pass: 4 swiper slides');
assert_true(strpos($fixtureHtml, 'ref-message-progress:25%') !== false, 'fixture pass: 1/4 progress matches fixture');

// ---------------------------------------------------------------------
// Pass 2: mutated ACF repeater data, in a fresh PHP process so the
// have_rows/the_row/get_sub_field stubs from pass 1 don't collide.
// ---------------------------------------------------------------------

$mutatedScript = <<<'PHP'
<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
$overlay = $argv[1];

$GLOBALS['__acf_data'] = [
    'ref001_student_voices' => [
        ['avatar' => ['url' => 'https://cdn.test/mut-avatar-1.jpg', 'alt' => 'x'], 'detail_photo' => null,
         'title' => 'CI_MUTATED_TITLE', 'profile' => 'p', 'school' => 's', 'body' => 'b',
         'lesson' => 'l', 'reason' => 'r', 'advice' => 'a'],
    ],
    'ref001_swiper_slides' => [
        ['photo' => ['url' => 'https://cdn.test/mut-slide-1.jpg', 'alt' => ''], 'quote_pc' => "CI_MUTATED_PC_LINE",
         'quote_sp' => "CI_MUTATED_SP_LINE", 'profile' => 'p', 'school' => 's'],
    ],
];
$GLOBALS['__acf_cursor'] = null;
$GLOBALS['__acf_index'] = -1;

function get_header() { echo "<!--HEADER-->\n"; }
function get_footer() { echo "<!--FOOTER-->\n"; }
function get_stylesheet_directory_uri() { return 'https://example.test/wp-content/themes/cku'; }
function get_stylesheet_directory() { return $GLOBALS['overlay']; }
function is_page_template($t) { return true; }
function wp_enqueue_style(...$a) {}
function wp_enqueue_script(...$a) {}
function add_action(...$a) {}
function have_rows($field) {
    $rows = $GLOBALS['__acf_data'][$field] ?? [];
    if ($GLOBALS['__acf_cursor'] !== $field) { $GLOBALS['__acf_cursor'] = $field; $GLOBALS['__acf_index'] = -1; }
    return $GLOBALS['__acf_index'] + 1 < count($rows);
}
function the_row() { $GLOBALS['__acf_index']++; }
function get_sub_field($name) {
    $rows = $GLOBALS['__acf_data'][$GLOBALS['__acf_cursor']] ?? [];
    $row = $rows[$GLOBALS['__acf_index']] ?? [];
    return $row[$name] ?? null;
}

require $overlay . '/functions/ref001-integration.php';
require $overlay . '/page-ref001.php';
PHP;

$tmpScript = tempnam(sys_get_temp_dir(), 'ref001-ci-mutated-') . '.php';
file_put_contents($tmpScript, $mutatedScript);
$mutatedHtml = shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($tmpScript) . ' ' . escapeshellarg($overlay) . ' 2>&1');
unlink($tmpScript);

assert_true(strpos($mutatedHtml, 'CI_MUTATED_TITLE') !== false, 'ACF pass: mutated Student Voice title renders');
assert_true(strpos($mutatedHtml, 'mut-avatar-1.jpg') !== false, 'ACF pass: mutated Student Voice image renders');
assert_true(substr_count($mutatedHtml, 'data-voice-item="') === 1, 'ACF pass: repeater with 1 row renders exactly 1 voice item');
assert_true(strpos($mutatedHtml, 'CI_MUTATED_PC_LINE') !== false, 'ACF pass: mutated swiper PC quote renders');
assert_true(strpos($mutatedHtml, 'mut-slide-1.jpg') !== false, 'ACF pass: mutated swiper image renders');
assert_true(substr_count($mutatedHtml, 'data-message-slide="') === 1, 'ACF pass: repeater with 1 row renders exactly 1 swiper slide');
assert_true(strpos($mutatedHtml, 'PHP Fatal error') === false, 'ACF pass: no PHP fatal errors');
assert_true(strpos($mutatedHtml, 'PHP Warning') === false, 'ACF pass: no PHP warnings');

echo "ALL PASS\n";
