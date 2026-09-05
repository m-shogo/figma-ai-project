<?php

/**
 * Disposable Budokan ACF Navigation disabled-state browser fixture.
 *
 * Public ACF in CI cannot execute the licensed repeater block runtime, so this
 * local-only page mirrors the production Navigation Large/Small rendered DOM.
 * A separate template QA executes the real production PHP templates directly.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan navigation QA outside a local WordPress environment.');
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan navigation fixture requires the nipponbudokan theme.');
}

$slug = 'qa-budokan-navigation-disabled';
$existing = get_posts(array(
    'post_type' => 'page',
    'post_status' => 'any',
    'name' => $slug,
    'posts_per_page' => 1,
    'orderby' => 'ID',
    'order' => 'ASC',
    'no_found_rows' => true,
));

$noimage = esc_url(get_template_directory_uri() . '/images/common/noimage.webp');
$content = <<<HTML
<p>ACF Navigation disabled-state interaction QA fixture.</p>
<div style="height:720px" aria-hidden="true"></div>
<ul class="module_navigation --large" data-qa-nav-family="large">
  <li class="navigation">
    <a href="#qa-navigation-target" data-qa-nav="large-enabled">
      <div class="image"><img src="{$noimage}" alt="Large enabled" width="335" height="219"></div>
      <div class="content"><h2 class="title">Large enabled</h2><div class="text">URLあり</div></div>
    </a>
  </li>
  <li class="navigation">
    <a aria-disabled="true" class="is-disabled" data-qa-nav="large-disabled">
      <div class="image"><img src="{$noimage}" alt="Large disabled" width="335" height="219"></div>
      <div class="content"><h2 class="title">Large disabled</h2><div class="text">URLなし</div></div>
    </a>
  </li>
</ul>
<ul class="module_navigation --small" data-qa-nav-family="small">
  <li class="navigation">
    <a href="#qa-navigation-target" data-qa-nav="small-enabled">
      <div class="image"><img src="{$noimage}" alt="Small enabled" width="120" height="120"></div>
      <div class="content"><h2 class="title">Small enabled</h2><div class="text">URLあり</div></div>
    </a>
  </li>
  <li class="navigation">
    <a aria-disabled="true" class="is-disabled" data-qa-nav="small-disabled">
      <div class="image"><img src="{$noimage}" alt="Small disabled" width="120" height="120"></div>
      <div class="content"><h2 class="title">Small disabled</h2><div class="text">URLなし</div></div>
    </a>
  </li>
</ul>
<div style="height:920px" aria-hidden="true"></div>
<h2 id="qa-navigation-target">Navigation target</h2>
<div style="height:640px" aria-hidden="true"></div>
HTML;

$payload = array(
    'post_type' => 'page',
    'post_status' => 'publish',
    'post_title' => 'Navigation Disabled QA',
    'post_name' => $slug,
    'post_content' => $content,
);

if ($existing) {
    $payload['ID'] = (int) $existing[0]->ID;
    $page_id = wp_update_post($payload, true);
} else {
    $page_id = wp_insert_post($payload, true);
}

if (is_wp_error($page_id)) {
    WP_CLI::error($page_id->get_error_message());
}

update_post_meta((int) $page_id, '_wp_page_template', 'templates/template-oneColumn.php');
update_option('budokan_navigation_disabled_qa_page_id', (int) $page_id, false);
flush_rewrite_rules(false);

WP_CLI::success(sprintf('Seeded Budokan navigation disabled QA page #%d.', (int) $page_id));
