<?php
/**
 * Version each local stylesheet listed by the import-only CSS entrypoint.
 * Keep the entrypoint usable directly in standalone previews and preserve order.
 */
function jwsnj_css_import_files($entry_path) {
  if (!is_readable($entry_path)) return null;
  $source = file_get_contents($entry_path);
  if ($source === false) return null;
  $source = preg_replace('~/\*.*?\*/~s', '', $source);
  $source = preg_replace('/^\s*@charset\s+"utf-8"\s*;/i', '', $source);
  $pattern = '~@import\s+([\x27\x22])\./([a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_-]+)*\.css)\1\s*;~';
  preg_match_all($pattern, $source, $matches);
  if (!$matches[2] || trim(preg_replace($pattern, '', $source)) !== '') return null;

  $files = [];
  foreach ($matches[2] as $relative) {
    $path = dirname($entry_path) . '/' . $relative;
    if (!is_file($path) || !is_readable($path)) return null;
    $version = filemtime($path);
    if ($version === false) return null;
    $files[] = [$relative, (string) $version];
  }
  return $files;
}

function jwsnj_enqueue_css_entry($handle, $entry, $dependencies = []) {
  $path = get_theme_file_path($entry);
  $uri = get_theme_file_uri($entry);
  $files = jwsnj_css_import_files($path);
  // Unsupported CSS syntax or incomplete deployment: preserve the old entrypoint.
  if ($files === null) {
    wp_enqueue_style($handle, $uri, $dependencies, is_file($path) ? filemtime($path) : null, 'all');
    return;
  }
  foreach ($files as [$relative, $version]) {
    $child = $handle . '-' . str_replace(['/', '.css'], ['-', ''], $relative);
    wp_register_style($child, dirname($uri) . '/' . $relative, $dependencies, $version, 'all');
    $dependencies = [$child];
  }
  // WordPress alias: preserve the public dependency handle without loading the imports twice.
  wp_enqueue_style($handle, false, $dependencies, null, 'all');
}
