<?php
/**
 * Assign publication page templates for shodo (and keep budo if pages exist).
 */
require '/var/www/html/wp-load.php';

$map = array(
    'publications/budo/back'     => 'page-publications-budo-back.php',
    'publications/budo/latest'   => 'page-publications-budo-latest.php',
    'publications/shodo/back'    => 'page-publications-shodo-back.php',
    'publications/shodo/latest'  => 'page-publications-shodo-latest.php',
);

foreach ($map as $path => $template) {
    $page = get_page_by_path($path);
    if (!$page) {
        fwrite(STDERR, "MISSING {$path}\n");
        continue;
    }
    update_post_meta((int) $page->ID, '_wp_page_template', $template);
    fwrite(STDOUT, "OK {$path} #{$page->ID} -> {$template}\n");
}

$post = get_post(1137);
if ($post) {
    fwrite(STDOUT, "POST 1137 type={$post->post_type} status={$post->post_status} title={$post->post_title}\n");
} else {
    fwrite(STDERR, "MISSING post 1137\n");
}
