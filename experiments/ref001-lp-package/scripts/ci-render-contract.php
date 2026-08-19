<?php
/**
 * CI render-contract smoke test for the REF-001 lp-package.
 *
 * Proves, without a real WordPress/ACF PRO install:
 *   1. ACF absent  -> lp/acf-swap/{student-voice,swiper}-acf.php render the
 *      exact same markup as the hardcoded sections in lp-originalPage.php.
 *   2. ACF present (mocked have_rows/the_row/get_sub_field, run in a fresh
 *      PHP process so pass 1's undefined-ACF-functions state is untouched),
 *      mutated data -> the DOM actually changes (title/quote text, row count).
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

$package = $argv[1] ?? null;
if (!$package || !is_dir($package)) {
    fwrite(STDERR, "usage: ci-render-contract.php <lp-package-dir>\n");
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

function extract_section(string $html, string $class): ?string
{
    if (preg_match('/<section class="' . preg_quote($class, '/') . '".*?<\/section>/s', $html, $m)) {
        return $m[0];
    }
    return null;
}

function normalize(string $html): string
{
    return rtrim(preg_replace('/ data-figma-pc="[^"]*" data-figma-sp="[^"]*"/', '', $html));
}

// ---------------------------------------------------------------------
// Pass 1: fallback fidelity (no ACF functions defined anywhere in this
// process, so have_rows()/get_sub_field() genuinely do not exist -- the
// same situation as a real site with ACF PRO inactive).
// ---------------------------------------------------------------------

function get_stylesheet_directory_uri() { return 'https://example.test/wp-content/themes/example'; }
function trailingslashit($s) { return rtrim($s, '/') . '/'; }
function esc_url($s) { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
function language_attributes() { echo 'lang="ja"'; }
function bloginfo($key) { echo $key === 'charset' ? 'UTF-8' : ''; }
function wp_title($sep) {}
function body_class($extra = '') { echo htmlspecialchars((string) $extra, ENT_QUOTES, 'UTF-8'); }
function wp_head() { echo '<!--WP_HEAD-->'; }
function wp_footer() { echo '<!--WP_FOOTER-->'; }

$__wp_enqueue_scripts_hooks = [];
function add_action($hook, $callback) {
    global $__wp_enqueue_scripts_hooks;
    if ($hook === 'wp_enqueue_scripts') {
        $__wp_enqueue_scripts_hooks[] = $callback;
    }
}
function is_page_template($slug) { return $slug === 'lp-originalPage.php'; }
$__wp_enqueued = ['styles' => [], 'scripts' => []];
function wp_enqueue_style($handle, $src, $deps, $ver) { global $__wp_enqueued; $__wp_enqueued['styles'][$handle] = $src; }
function wp_enqueue_script($handle, $src, $deps, $ver, $footer) { global $__wp_enqueued; $__wp_enqueued['scripts'][$handle] = $src; }

ob_start();
include $package . '/lp-originalPage.php';
$page = ob_get_clean();

// The template only *registers* the wp_enqueue_scripts callback via
// add_action(); a real WordPress run fires it before wp_head()/wp_footer()
// output. Fire it here to prove it resolves to the right CSS/JS without a
// PHP fatal, same as production would.
foreach ($__wp_enqueue_scripts_hooks as $callback) {
    $callback();
}
assert_true(isset($__wp_enqueued['styles']['ref001-lp-style']) && str_ends_with($__wp_enqueued['styles']['ref001-lp-style'], '/lp/css/ref001.css'), 'wp_enqueue_scripts hook registers ref001-lp-style pointing at lp/css/ref001.css');
assert_true(isset($__wp_enqueued['scripts']['ref001-lp-script']) && str_ends_with($__wp_enqueued['scripts']['ref001-lp-script'], '/lp/js/ref001-interactions.js'), 'wp_enqueue_scripts hook registers ref001-lp-script pointing at lp/js/ref001-interactions.js');
assert_true(strpos($page, '<link') === false && strpos($page, '<script') === false, 'lp-originalPage has no raw <link>/<script> tags (CSS/JS goes through wp_head()/wp_footer() instead)');
assert_true(strpos($page, '<!DOCTYPE html>') === 0, 'lp-originalPage is a standalone document starting with <!DOCTYPE html> (no get_header())');
assert_true(strpos($page, '<!--WP_HEAD-->') !== false && strpos($page, '<!--WP_HEAD-->') < strpos($page, '<main'), 'wp_head() is called inside <head>, before the LP content');
assert_true(strpos($page, '<!--WP_FOOTER-->') !== false && strpos($page, '<!--WP_FOOTER-->') > strpos($page, '</main>'), 'wp_footer() is called after the LP content, before </body>');
assert_true(substr_count($page, '<html') === 1 && substr_count($page, '</html>') === 1, 'lp-originalPage emits exactly one <html>...</html> (no theme header/footer wrapping it a second time)');

$expectedVoice = extract_section($page, 'ref-voice');
$expectedMessages = extract_section($page, 'ref-messages');
assert_true($expectedVoice !== null, 'lp-originalPage body contains ref-voice section');
assert_true($expectedMessages !== null, 'lp-originalPage body contains ref-messages section');

ob_start();
include $package . '/lp/acf-swap/student-voice-acf.php';
$actualVoice = ob_get_clean();

ob_start();
include $package . '/lp/acf-swap/swiper-acf.php';
$actualMessages = ob_get_clean();

assert_true(normalize($expectedVoice) === normalize($actualVoice), 'student-voice-acf.php fallback byte-matches lp-originalPage direct markup');
assert_true(normalize($expectedMessages) === normalize($actualMessages), 'swiper-acf.php fallback byte-matches lp-originalPage direct markup');

// ---------------------------------------------------------------------
// Pass 2: mutated ACF repeater data, in a fresh PHP process.
// ---------------------------------------------------------------------

$mutatedScript = <<<'PHP'
<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
$package = $argv[1];
$lp_base = 'lp/';

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

ob_start();
include $package . '/lp/acf-swap/student-voice-acf.php';
echo ob_get_clean();

$GLOBALS['__acf_cursor'] = null;
$GLOBALS['__acf_index'] = -1;
ob_start();
include $package . '/lp/acf-swap/swiper-acf.php';
echo ob_get_clean();
PHP;

$tmpScript = tempnam(sys_get_temp_dir(), 'ref001-lp-ci-mutated-') . '.php';
file_put_contents($tmpScript, $mutatedScript);
$mutatedHtml = shell_exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($tmpScript) . ' ' . escapeshellarg($package) . ' 2>&1');
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
