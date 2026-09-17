<?php

/**
 * Disposable Budokan tab interaction runtime fixture.
 *
 * QA-only fixture for the Theme's existing `.module_tab-wrapper` markup and
 * `common.js` tab behavior. It does not create production ACF authority.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan tab QA outside a local WordPress environment.');
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan tab fixture requires the nipponbudokan theme.');
}

$slug = 'qa-budokan-tab-interaction';
$existing = get_posts(array(
    'post_type' => 'page',
    'post_status' => 'any',
    'name' => $slug,
    'posts_per_page' => 1,
    'orderby' => 'ID',
    'order' => 'ASC',
    'no_found_rows' => true,
));

$content = <<<'HTML'
<div class="qa-tab-fixture">
  <p>Tab interaction runtime QA fixture.</p>
  <div class="module_tab-wrapper" data-qa-tab="primary">
    <div class="tab-buttons" role="tablist"></div>
    <div class="tab-contents">
      <div class="tab-panel" data-title="概要">
        <p>概要パネル。操作時にタブ操作部やページ位置が動かないことを確認します。</p>
      </div>
      <div class="tab-panel" data-title="詳細">
        <p>詳細パネル。表示内容の高さが変わっても、操作対象そのものが不自然に移動しないことを確認します。</p>
        <p>追加の本文です。</p>
        <p>追加の本文です。</p>
      </div>
      <div class="tab-panel" data-title="案内">
        <p>案内パネル。キーボード操作でも同じ状態遷移を確認します。</p>
      </div>
    </div>
  </div>
</div>
HTML;

$payload = array(
    'post_type' => 'page',
    'post_status' => 'publish',
    'post_title' => 'Tab Interaction QA',
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

update_post_meta((int) $page_id, '_wp_page_template', 'default');
update_option('budokan_tab_qa_page_id', (int) $page_id, false);
flush_rewrite_rules(false);

WP_CLI::success(sprintf('Seeded Budokan tab interaction QA page #%d.', (int) $page_id));
