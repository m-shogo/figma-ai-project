<?php

/**
 * Disposable Budokan dropdown disclosure runtime fixture.
 *
 * This fixture is QA-only. It exercises the Theme's existing
 * `.module_dropdown` CSS and `common.js` disclosure logic in a real local
 * WordPress page without creating production menu authority. Module/local-nav
 * disclosure is intentionally exercised by the actual WordPress menu Walker
 * in seed-budokan-local-nav-qa.php instead of handcrafted markup.
 */

if (!defined('WP_CLI') || !WP_CLI) {
    fwrite(STDERR, "This script must be executed with wp eval-file.\n");
    exit(2);
}

if (function_exists('wp_get_environment_type') && wp_get_environment_type() !== 'local') {
    WP_CLI::error('Refusing to seed Budokan disclosure QA outside a local WordPress environment.');
}

$theme = wp_get_theme();
if ($theme->get_stylesheet() !== 'nipponbudokan') {
    WP_CLI::error('Budokan disclosure fixture requires the nipponbudokan theme.');
}

$slug = 'qa-budokan-disclosure-interaction';
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
<div class="qa-disclosure-fixture">
  <p>Dropdown disclosure interaction runtime QA fixture.</p>

  <div class="module_dropdown" data-qa-disclosure="dropdown">
    <div class="mdd_item-02 _hasChild" data-open="false">
      <div class="mdd_title-02">
        <a class="mdd_link-02 module_textLink" href="#qa-dropdown-content"><span>ドロップダウン QA</span></a>
        <button class="mdd_button-02" type="button"><span>開閉</span></button>
      </div>
      <div class="mdd_wrapper-02">
        <div class="mdd_inner-02">
          <ul class="mdd_list-02" id="qa-dropdown-content">
            <li class="mdd_item-03 _noChild"><div class="mdd_title-03"><a class="mdd_link-03 module_textLink" href="/">子項目 A</a></div></li>
            <li class="mdd_item-03 _noChild"><div class="mdd_title-03"><a class="mdd_link-03 module_textLink" href="/">子項目 B</a></div></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
HTML;

$payload = array(
    'post_type' => 'page',
    'post_status' => 'publish',
    'post_title' => 'Disclosure Interaction QA',
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

// The Theme's root index.php does not render page content. Keep this QA page
// on the existing one-column page template so the fixture exercises the real
// Theme wrapper + enqueued CSS/JS rather than inventing a bespoke QA template.
update_post_meta((int) $page_id, '_wp_page_template', 'default');
update_option('budokan_disclosure_qa_page_id', (int) $page_id, false);
flush_rewrite_rules(false);

WP_CLI::success(sprintf('Seeded Budokan dropdown disclosure interaction QA page #%d.', (int) $page_id));
