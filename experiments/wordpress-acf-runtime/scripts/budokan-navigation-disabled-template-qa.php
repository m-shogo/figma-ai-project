<?php

/**
 * Execute the production ACF Navigation Large/Small templates with minimal
 * stubs so the URL-absent and URL-present branches are verified directly.
 * This is intentionally independent of ACF Pro runtime availability in CI.
 */

$theme_dir = dirname(__DIR__) . '/theme-dropin/nipponbudokan';
$GLOBALS['qa_have_rows_calls'] = array();
$GLOBALS['qa_sub_fields'] = array();

function have_rows($name)
{
    if (!isset($GLOBALS['qa_have_rows_calls'][$name])) {
        $GLOBALS['qa_have_rows_calls'][$name] = 0;
    }
    $GLOBALS['qa_have_rows_calls'][$name]++;
    return $GLOBALS['qa_have_rows_calls'][$name] <= 2;
}

function the_row()
{
}

function get_sub_field($name)
{
    return array_key_exists($name, $GLOBALS['qa_sub_fields']) ? $GLOBALS['qa_sub_fields'][$name] : null;
}

function wp_get_attachment_image_url($image, $size)
{
    return false;
}

function esc_url($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function esc_attr($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function esc_html($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function get_template_directory_uri()
{
    return 'https://example.invalid/theme';
}

function render_navigation_template($template, $fields)
{
    $GLOBALS['qa_have_rows_calls'] = array();
    $GLOBALS['qa_sub_fields'] = $fields;
    ob_start();
    include $template;
    return ob_get_clean();
}

function fail($message)
{
    fwrite(STDERR, "FAIL {$message}\n");
    exit(1);
}

$templates = array(
    'large' => $theme_dir . '/acf/blocks/navigationLarge.php',
    'small' => $theme_dir . '/acf/blocks/navigationSmall.php',
);

foreach ($templates as $label => $template) {
    if (!is_file($template)) {
        fail("{$label}: production template missing: {$template}");
    }

    $disabled = render_navigation_template($template, array(
        'image' => null,
        'title' => 'URLなしカード',
        'text' => 'Human editor may intentionally leave URL blank.',
        'url' => '',
        'target' => array('はい'),
    ));

    if (strpos($disabled, 'class="is-disabled"') === false) {
        fail("{$label}: disabled card class missing");
    }
    if (strpos($disabled, 'aria-disabled="true"') === false) {
        fail("{$label}: disabled card must expose aria-disabled=true");
    }
    if (preg_match('/<a\b[^>]*\bhref\s*=/', $disabled)) {
        fail("{$label}: disabled card still renders href");
    }
    if (preg_match('/<a\b[^>]*\btarget\s*=/', $disabled)) {
        fail("{$label}: disabled card still renders target without a URL");
    }

    $enabled = render_navigation_template($template, array(
        'image' => null,
        'title' => 'URLありカード',
        'text' => 'Existing editable navigation ownership remains active.',
        'url' => 'https://example.invalid/destination/',
        'target' => array('はい'),
    ));

    if (strpos($enabled, 'href="https://example.invalid/destination/"') === false) {
        fail("{$label}: enabled card lost its URL");
    }
    if (strpos($enabled, 'target="_blank"') === false) {
        fail("{$label}: enabled external card lost target=_blank");
    }
    if (strpos($enabled, 'aria-disabled="true"') !== false) {
        fail("{$label}: enabled card was marked disabled");
    }
}

echo "PASS production ACF Navigation Large/Small fail closed when optional URL is empty and preserve enabled URL/target ownership.\n";
